import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';

const TARGET_PER_CLASS = 15;
const DEMO_EMAIL_SUFFIX = '@demo.example.invalid';
const PASSWORD = 'Demo-password-12';
const confirmed = process.argv.includes('--confirm');
const firstNames = [
  ['Adaeze', 'F'], ['Aisha', 'F'], ['Amaka', 'F'], ['Amara', 'F'], ['Anita', 'F'], ['Amina', 'F'], ['Bisi', 'F'], ['Bolanle', 'F'], ['Chiamaka', 'F'], ['Chidinma', 'F'],
  ['Chioma', 'F'], ['Chisom', 'F'], ['Damilola', 'F'], ['Efe', 'F'], ['Ejiro', 'F'], ['Eniola', 'F'], ['Esther', 'F'], ['Fatima', 'F'], ['Funke', 'F'], ['Hadiza', 'F'],
  ['Halima', 'F'], ['Ifeoma', 'F'], ['Ijeoma', 'F'], ['Imani', 'F'], ['Kanyinsola', 'F'], ['Kemi', 'F'], ['Kudirat', 'F'], ['Lola', 'F'], ['Morenike', 'F'], ['Ngozi', 'F'],
  ['Nneka', 'F'], ['Nneoma', 'F'], ['Nkiru', 'F'], ['Obiageli', 'F'], ['Ogechi', 'F'], ['Olamide', 'F'], ['Oluchi', 'F'], ['Omolara', 'F'], ['Onyinye', 'F'], ['Oreoluwa', 'F'],
  ['Ronke', 'F'], ['Sade', 'F'], ['Simisola', 'F'], ['Titilayo', 'F'], ['Toyin', 'F'], ['Uchechi', 'F'], ['Ufuoma', 'F'], ['Yetunde', 'F'], ['Zainab', 'F'], ['Zara', 'F'],
  ['Abiola', 'M'], ['Abubakar', 'M'], ['Ade', 'M'], ['Adekunle', 'M'], ['Adewale', 'M'], ['Akin', 'M'], ['Akinwale', 'M'], ['Ayo', 'M'], ['Babatunde', 'M'], ['Bashir', 'M'],
  ['Chibuzo', 'M'], ['Chidi', 'M'], ['Chike', 'M'], ['Chinedu', 'M'], ['Chukwudi', 'M'], ['Dapo', 'M'], ['David', 'M'], ['Emeka', 'M'], ['Emmanuel', 'M'], ['Eze', 'M'],
  ['Femi', 'M'], ['Ibrahim', 'M'], ['Ikenna', 'M'], ['Ishola', 'M'], ['Jide', 'M'], ['Kabiru', 'M'], ['Kelechi', 'M'], ['Kunle', 'M'], ['Musa', 'M'], ['Nnamdi', 'M'],
  ['Obinna', 'M'], ['Ojo', 'M'], ['Ola', 'M'], ['Oluwaseun', 'M'], ['Oluwatobi', 'M'], ['Oluwole', 'M'], ['Onyekachi', 'M'], ['Peter', 'M'], ['Sani', 'M'], ['Seyi', 'M'],
  ['Taiwo', 'M'], ['Tunde', 'M'], ['Uche', 'M'], ['Ugochukwu', 'M'], ['Yusuf', 'M'], ['Zubair', 'M'], ['Chukwuemeka', 'M'], ['Oghenetega', 'M'], ['Ekwueme', 'M'], ['Ifeanyi', 'M'],
];
const lastNames = [
  'Adebayo', 'Adekunle', 'Adeyemi', 'Agbaje', 'Agu', 'Ajayi', 'Akinyemi', 'Akindele', 'Akintola', 'Anyanwu', 'Balogun', 'Bello', 'Chukwu', 'Danjuma', 'Daramola',
  'Egbuna', 'Eke', 'Eze', 'Ezeani', 'Fashola', 'Garba', 'Ibe', 'Ibrahim', 'Idowu', 'Ifeanyi', 'Iheanacho', 'Ike', 'Ikenna', 'Jibril', 'Kalu',
  'Lawal', 'Madaki', 'Mohammed', 'Nnamani', 'Nwachukwu', 'Nwosu', 'Obi', 'Obiakor', 'Obioma', 'Odunsi', 'Ojo', 'Okafor', 'Okeke', 'Okonkwo', 'Okoro',
  'Okoye', 'Oladipo', 'Olaniyan', 'Olatunji', 'Olawale', 'Olowu', 'Onuoha', 'Orji', 'Osagie', 'Osei', 'Salami', 'Suleiman', 'Taiwo', 'Udo', 'Umeh',
  'Uzochukwu', 'Yakubu', 'Yusuf', 'Nwankwo', 'Ekwueme', 'Abubakar', 'Ogunleye', 'Onyeka', 'Ogunbiyi', 'Afolayan', 'Ogunyemi', 'Osuji', 'Ogunlana', 'Ezeh',
];
const departments = ['General', 'Science', 'Arts', 'Business'];

function slug(value) {
  return String(value || 'class').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'class';
}

function databaseHost() {
  try { return new URL(env.DATABASE_URL).hostname || 'localhost'; } catch { return 'unknown'; }
}

function classLabel(classItem) {
  return [classItem.name, classItem.level].filter(Boolean).join(' - ');
}

function levelAgeRange(classItem) {
  const hint = `${classItem.name} ${classItem.level || ''}`.toLowerCase();
  if (/nursery|kindergarten|pre[- ]?school|early years/.test(hint)) return [3, 5];
  if (/primary|grade\s*[1-6]|year\s*[1-6]|\b[1-6]\b/.test(hint)) return [6, 11];
  if (/jss|junior|secondary|senior|grade\s*(7|8|9|10|11|12)|year\s*(7|8|9|10|11|12)|\b(7|8|9|10|11|12)\b/.test(hint)) return [12, 18];
  return [6, 18];
}

function studentData(classItem, ordinal, globalIndex, passwordHash, now) {
  const [firstName, nameGender] = firstNames[globalIndex % firstNames.length];
  const lastName = lastNames[Math.floor(globalIndex / firstNames.length) % lastNames.length];
  const serial = String(globalIndex + 1).padStart(4, '0');
  const classSlug = `${slug(classItem.name)}-${slug(classItem.level || 'level')}-${classItem.id.slice(-6).toLowerCase()}`;
  const [minAge, maxAge] = levelAgeRange(classItem);
  const age = minAge + ((ordinal - 1) % (maxAge - minAge + 1));
  const birthDate = new Date(Date.UTC(now.getUTCFullYear() - age, (ordinal * 2) % 12, 10 + (ordinal % 18)));
  const admissionDate = new Date(now.getTime() - ((ordinal * 47 + globalIndex * 13) % (365 * 3)) * 24 * 60 * 60 * 1000);
  const classHint = `${classItem.name} ${classItem.level || ''}`.toLowerCase();
  const lowerLevel = /nursery|kindergarten|pre[- ]?school|early years|primary|grade\s*[1-6]|year\s*[1-6]|\b[1-6]\b/.test(classHint);
  const emailFirst = firstName.toLowerCase();
  const emailLast = lastName.toLowerCase();
  return {
    admissionNumber: `DEMO-${classSlug}-${String(ordinal).padStart(3, '0')}`,
    firstName,
    lastName,
    gender: nameGender === 'F' ? 'FEMALE' : 'MALE',
    department: lowerLevel ? 'General' : departments[globalIndex % departments.length],
    admissionDate,
    dateOfBirth: birthDate,
    status: ordinal % 10 === 0 ? 'INACTIVE' : 'ACTIVE',
    address: `${10 + ordinal} Demo Avenue, Lagos`,
    class: { connect: { id: classItem.id } },
    user: { create: {
      email: `${emailFirst}.${emailLast}.${serial}${DEMO_EMAIL_SUFFIX}`,
      passwordHash,
      fullName: `${firstName} ${lastName}`,
      role: 'STUDENT',
      status: 'ACTIVE',
    } },
  };
}

async function main() {
  try {
    const classes = await prisma.class.findMany({ orderBy: [{ name: 'asc' }, { level: 'asc' }], select: { id: true, name: true, level: true } });
    if (!classes.length) {
      console.log('No classes found. No demo students can be created.');
      return;
    }

    const rows = [];
    for (const [classIndex, classItem] of classes.entries()) {
      const existing = await prisma.student.findMany({
        where: { classId: classItem.id, admissionNumber: { startsWith: 'DEMO-' }, user: { is: { email: { endsWith: DEMO_EMAIL_SUFFIX } } } },
        select: { admissionNumber: true },
      });
      const existingAdmissions = new Set(existing.map(({ admissionNumber }) => admissionNumber));
      const classSlug = `${slug(classItem.name)}-${slug(classItem.level || 'level')}-${classItem.id.slice(-6).toLowerCase()}`;
      const missing = [];
      for (let ordinal = 1; ordinal <= TARGET_PER_CLASS && existing.length + missing.length < TARGET_PER_CLASS; ordinal += 1) {
        if (existingAdmissions.has(`DEMO-${classSlug}-${String(ordinal).padStart(3, '0')}`)) continue;
        missing.push(ordinal);
      }
      rows.push({ classItem, classIndex, existing: existing.length, missing });
    }

    console.log(`Database host: ${databaseHost()}`);
    console.table(rows.map(({ classItem, existing, missing }) => ({ class: classLabel(classItem), existing, wouldCreate: missing.length })));
    const totalMissing = rows.reduce((total, row) => total + row.missing.length, 0);
    console.log(`Total existing demo students: ${rows.reduce((total, row) => total + row.existing, 0)}; total to create: ${totalMissing}.`);
    if (!confirmed) {
      console.log('Dry run only. Pass --confirm to create missing demo students.');
      return;
    }
    if (!totalMissing) {
      console.log('All classes already have at least 15 demo students.');
      return;
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    const now = new Date();
    let createdTotal = 0;
    for (const row of rows) {
      if (!row.missing.length) continue;
      const data = row.missing.map((ordinal) => studentData(row.classItem, ordinal, row.classIndex * TARGET_PER_CLASS + ordinal - 1, passwordHash, now));
      await prisma.$transaction(async (tx) => {
        for (const student of data) await tx.student.create({ data: student });
      }, { timeout: 120000, maxWait: 20000 });
      createdTotal += data.length;
      console.log(`Created ${data.length} demo students in ${classLabel(row.classItem)}.`);
    }
    console.log(`Created ${createdTotal} demo students.`);
    console.log(`Shared demo password: ${PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
