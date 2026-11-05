import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';

const DEMO_EMAIL_SUFFIX = '@demo.example.invalid';
const confirmed = process.argv.includes('--confirm');
const seniorDepartments = ['Science', 'Arts', 'Business'];

function databaseHost() {
  try { return new URL(env.DATABASE_URL).hostname || 'localhost'; } catch { return 'unknown'; }
}

function plannedDepartment(yearNumber, ordinal, currentDepartment) {
  if (yearNumber >= 4 && yearNumber <= 9) return 'General';
  if (yearNumber >= 10 && yearNumber <= 12) return seniorDepartments[(ordinal - 1) % seniorDepartments.length];
  return currentDepartment;
}

function dateOfBirth(yearNumber, ordinal, currentYear) {
  const age = yearNumber + 5;
  const month = (ordinal - 1) % 12;
  const day = ((ordinal - 1) % 28) + 1;
  return new Date(Date.UTC(currentYear - age, month, day));
}

function buildPlan(students) {
  const classes = new Map();
  const skippedClasses = new Map();
  for (const student of students) {
    const className = student.class?.name || 'No class assigned';
    const match = className.match(/year\s*(\d+)/i);
    if (!match) {
      skippedClasses.set(className, (skippedClasses.get(className) || 0) + 1);
      continue;
    }
    const yearNumber = Number(match[1]);
    const key = student.class?.id || className;
    if (!classes.has(key)) classes.set(key, { name: className, yearNumber, students: [] });
    classes.get(key).students.push(student);
  }

  const currentYear = new Date().getUTCFullYear();
  const classPlans = [...classes.values()].map((classPlan) => {
    classPlan.students.sort((left, right) => left.admissionNumber.localeCompare(right.admissionNumber));
    const updates = classPlan.students.map((student, index) => {
      const ordinal = index + 1;
      const department = plannedDepartment(classPlan.yearNumber, ordinal, student.department);
      return {
        id: student.id,
        dateOfBirth: dateOfBirth(classPlan.yearNumber, ordinal, currentYear),
        ...(department !== student.department ? { department } : {}),
        plannedDepartment: department || 'Unassigned',
      };
    });
    const departmentSplit = {};
    for (const update of updates) departmentSplit[update.plannedDepartment] = (departmentSplit[update.plannedDepartment] || 0) + 1;
    return { ...classPlan, updates, departmentSplit };
  }).sort((left, right) => left.name.localeCompare(right.name));
  return { classPlans, skippedClasses };
}

async function main() {
  try {
    const students = await prisma.student.findMany({
      where: {
        admissionNumber: { startsWith: 'DEMO-' },
        user: { is: { email: { endsWith: DEMO_EMAIL_SUFFIX } } },
      },
      select: {
        id: true,
        admissionNumber: true,
        department: true,
        class: { select: { id: true, name: true } },
      },
      orderBy: { admissionNumber: 'asc' },
    });
    const { classPlans, skippedClasses } = buildPlan(students);
    const plannedCount = classPlans.reduce((total, classPlan) => total + classPlan.students.length, 0);

    console.log(`Database host: ${databaseHost()}`);
    console.table(classPlans.map((classPlan) => ({
      class: classPlan.name,
      students: classPlan.students.length,
      age: classPlan.yearNumber + 5,
      departmentSplit: Object.entries(classPlan.departmentSplit).map(([name, count]) => `${name}: ${count}`).join(', '),
    })));
    if (skippedClasses.size) {
      console.log('Skipped classes that do not match /year\\s*(\\d+)/i:');
      console.table([...skippedClasses].map(([className, count]) => ({ class: className, students: count })));
    }

    if (!confirmed) {
      console.log(`Dry run only. ${plannedCount} demo students would be updated; ${students.length - plannedCount} would be skipped. Pass --confirm to write changes.`);
      return;
    }

    let updatedTotal = 0;
    for (const classPlan of classPlans) {
      await prisma.$transaction(async (tx) => {
        for (const update of classPlan.updates) {
          const { id, plannedDepartment: _plannedDepartment, ...data } = update;
          await tx.student.update({ where: { id }, data });
        }
      }, { timeout: 120000, maxWait: 20000 });
      updatedTotal += classPlan.updates.length;
    }
    console.log(`Updated ${updatedTotal} demo students. Skipped ${students.length - updatedTotal} students in classes without a Year number.`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
