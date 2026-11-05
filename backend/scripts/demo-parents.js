import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';

const EMAIL_SUFFIX = '@demo.example.invalid';
const PASSWORD = 'Demo-password-12';
const confirmed = process.argv.includes('--confirm');
const surnames = [
  'Adebayo', 'Adekunle', 'Adeyemi', 'Agbaje', 'Agu', 'Ajayi', 'Akinyemi', 'Akindele', 'Akintola', 'Anyanwu', 'Balogun', 'Bello', 'Chukwu', 'Danjuma', 'Daramola', 'Egbuna', 'Eke', 'Eze', 'Ezeani', 'Fashola',
  'Garba', 'Ibe', 'Ibrahim', 'Idowu', 'Iheanacho', 'Ike', 'Ikenna', 'Jibril', 'Kalu', 'Lawal', 'Madaki', 'Mohammed', 'Nnamani', 'Nwachukwu', 'Nwosu', 'Obi', 'Obiakor', 'Obioma', 'Odunsi', 'Ojo',
  'Okafor', 'Okeke', 'Okonkwo', 'Okoro', 'Okoye', 'Oladipo', 'Olaniyan', 'Olatunji', 'Olawale', 'Olowu', 'Onuoha', 'Orji', 'Osagie', 'Osei', 'Salami', 'Suleiman', 'Taiwo', 'Udo', 'Umeh', 'Uzochukwu',
  'Yakubu', 'Yusuf', 'Nwankwo', 'Ekwueme', 'Abubakar', 'Ogunleye', 'Onyeka', 'Ogunbiyi', 'Afolayan', 'Ogunyemi', 'Osuji', 'Ogunlana', 'Ezeh', 'Akinola', 'Akinyode', 'Akinpelu', 'Alabi', 'Aluko', 'Amadi', 'Anene',
  'Arowolo', 'Atanda', 'Awolowo', 'Babajide', 'Bamgbose', 'Bankole', 'Dada', 'Durojaiye', 'Ekanem', 'Ekong', 'Ekwere', 'Enwezor', 'Ezenwa', 'Fadeyi', 'Falade', 'Folarin', 'Gbadebo', 'Igbinedion', 'Iwu', 'Jegede',
  'Jimoh', 'Kadiri', 'Kazeem', 'Macauley', 'Makanjuola', 'Ndukwe', 'Nwafor', 'Nwankpa', 'Ogunbade', 'Ogunjimi', 'Ogunmodede', 'Okoli', 'Okunola', 'Olanrewaju', 'Olawoyin', 'Olowe', 'Omodara', 'Onabajo', 'Onwudiwe', 'Oyekan',
  'Popoola', 'Soyinka', 'Sowande', 'Ugboma', 'Ukaegbu', 'Ukwuani', 'Akinwale', 'Arowojolu', 'Babatola', 'Bamidele', 'Egbeyemi', 'Igbokwe', 'Nnamdi', 'Nnaji', 'Obasi', 'Odutola', 'Ogunmola', 'Ogunyinka', 'Olawumi', 'Oni',
  'Onyekachi', 'Opara', 'Owolabi', 'Sanni', 'Sodipo', 'Tijani', 'Udeh', 'Ugochukwu', 'Umeh-Dike', 'Adejumo', 'Adeola', 'Akinbiyi', 'Akinosun', 'Alao', 'Anjorin', 'Babalola', 'Egbomah', 'Ezeigbo', 'Iroko', 'Ogunseye',
];
const femaleNames = ['Aisha', 'Amaka', 'Amara', 'Bisi', 'Bolanle', 'Chiamaka', 'Chioma', 'Damilola', 'Ejiro', 'Eniola', 'Fatima', 'Funke', 'Hadiza', 'Ifeoma', 'Kemi', 'Ngozi', 'Nneka', 'Olamide', 'Oluchi', 'Zainab'];
const maleNames = ['Abubakar', 'Adekunle', 'Adewale', 'Akin', 'Babatunde', 'Chibuzo', 'Chinedu', 'Chukwudi', 'Dapo', 'Emeka', 'Femi', 'Ibrahim', 'Ikenna', 'Kunle', 'Musa', 'Nnamdi', 'Obinna', 'Oluwaseun', 'Seyi', 'Yusuf'];
const occupations = [
  'Civil Engineer', 'Nurse', 'Banker', 'Trader', 'Teacher', 'Accountant', 'Pharmacist', 'Lawyer', 'Driver', 'Farmer',
  'Doctor', 'Architect', 'Software Developer', 'Electrician', 'Tailor', 'Caterer', 'Public Servant', 'Entrepreneur', 'Quantity Surveyor', 'Dentist',
  'Journalist', 'Police Officer', 'Lecturer', 'Mechanic', 'Real Estate Agent', 'Consultant', 'Marketing Manager', 'Fisher', 'Social Worker', 'Graphic Designer',
];
const streets = ['Adeniyi Jones Avenue', 'Admiralty Way', 'Herbert Macaulay Way', 'Bode Thomas Street', 'Allen Avenue', 'Awolowo Road', 'Opebi Road', 'Saka Tinubu Street', 'Ogudu Road', 'Oshodi Road', 'Igbosere Road', 'Kudirat Abiola Way', 'Mobolaji Bank Anthony Way', 'Akin Adesola Street', 'Bourdillon Road', 'Muri Okunola Street', 'Ikorodu Road', 'Akoka Road', 'Ajao Road', 'Freedom Way'];
const areas = ['Ikeja', 'Lekki', 'Yaba', 'Surulere', 'Victoria Island', 'Ajah', 'Maryland', 'Magodo', 'Gbagada', 'Ikoyi'];

function databaseHost() {
  try { return new URL(env.DATABASE_URL).hostname || 'localhost'; } catch { return 'unknown'; }
}

function ascii(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function classLabel(classItem) {
  return classItem ? [classItem.name, classItem.level].filter(Boolean).join(' - ') : 'No class';
}

function ageAt(date, now) {
  if (!date) return null;
  const birth = new Date(date);
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDifference = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDifference < 0 || (monthDifference === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

function canBeSiblings(group) {
  const classIds = group.map(({ classId }) => classId);
  if (classIds.some((classId) => !classId) || new Set(classIds).size !== group.length) return false;
  const ages = group.map(({ age }) => age);
  if (ages.some((age) => age == null)) return false;
  const sortedAges = [...ages].sort((left, right) => right - left);
  return sortedAges.slice(1).every((age, index) => sortedAges[index] - age >= 2 && sortedAges[index] - age <= 6)
    && sortedAges[0] - sortedAges.at(-1) <= 8;
}

function findSiblingGroup(students, size) {
  if (size === 1) return students.length ? [students[0]] : null;
  for (let firstIndex = 0; firstIndex < students.length; firstIndex += 1) {
    const first = students[firstIndex];
    for (let secondIndex = firstIndex + 1; secondIndex < students.length; secondIndex += 1) {
      const second = students[secondIndex];
      if (size === 2 && canBeSiblings([first, second])) return [first, second];
      if (size !== 3 || first.classId === second.classId || !canBeSiblings([first, second])) continue;
      for (let thirdIndex = secondIndex + 1; thirdIndex < students.length; thirdIndex += 1) {
        const third = students[thirdIndex];
        if (canBeSiblings([first, second, third])) return [first, second, third];
      }
    }
  }
  return null;
}

function plannedFamilySizes(studentCount) {
  if (!studentCount) return [];
  const familyCount = Math.max(1, Math.round(studentCount / 1.65));
  const counts = { 1: Math.round(familyCount * 0.5), 2: Math.round(familyCount * 0.35), 3: 0 };
  counts[3] = familyCount - counts[1] - counts[2];
  const childTotal = () => counts[1] + counts[2] * 2 + counts[3] * 3;
  while (childTotal() < studentCount) {
    if (counts[1]) { counts[1] -= 1; counts[2] += 1; }
    else if (counts[2]) { counts[2] -= 1; counts[3] += 1; }
    else counts[1] += 1;
  }
  while (childTotal() > studentCount) {
    if (counts[3]) { counts[3] -= 1; counts[2] += 1; }
    else if (counts[2]) { counts[2] -= 1; counts[1] += 1; }
    else counts[1] -= 1;
  }
  return [3, 2, 1].flatMap((size) => Array.from({ length: counts[size] }, () => size));
}

function groupFamilies(students) {
  const now = new Date();
  const remaining = students.map((student) => ({ ...student, age: ageAt(student.dateOfBirth, now) }))
    .sort((left, right) => (right.age ?? -1) - (left.age ?? -1) || (left.class?.name || '').localeCompare(right.class?.name || '') || left.admissionNumber.localeCompare(right.admissionNumber));
  const families = [];
  for (const targetSize of plannedFamilySizes(remaining.length)) {
    if (!remaining.length) break;
    let group = findSiblingGroup(remaining, targetSize);
    if (!group && targetSize === 3) group = findSiblingGroup(remaining, 2);
    if (!group) group = [remaining[0]];
    const selected = new Set(group.map(({ id }) => id));
    families.push(group);
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (selected.has(remaining[index].id)) remaining.splice(index, 1);
    }
  }
  while (remaining.length) families.push([remaining.shift()]);
  return families;
}

function relationshipPlan(familyIndex) {
  if (familyIndex % 5 < 3) return [{ relationship: 'Mother', firstName: femaleNames[(familyIndex * 3) % femaleNames.length] }, { relationship: 'Father', firstName: maleNames[(familyIndex * 7) % maleNames.length] }];
  const relationship = ['Mother', 'Father', 'Guardian'][Math.floor(familyIndex / 5) % 3];
  const female = relationship === 'Mother' || (relationship === 'Guardian' && familyIndex % 2 === 0);
  const names = female ? femaleNames : maleNames;
  return [{ relationship, firstName: names[(familyIndex * 5) % names.length] }];
}

function makeEmail(firstName, surname, serial) {
  return `${ascii(firstName)}.${ascii(surname)}.${serial}${EMAIL_SUFFIX}`;
}

function serialFromEmail(email) {
  return email.match(/\.(\d+)@demo\.example\.invalid$/i)?.[1] || '';
}

function familyAddress(index) {
  return `${12 + ((index * 17) % 880)} ${streets[index % streets.length]}, ${areas[Math.floor(index / streets.length) % areas.length]}, Lagos`;
}

function phoneFromSerial(serial) {
  const number = Math.max(1, Number(serial) || 1) - 1;
  const prefix = String(800 + Math.floor(number / 10_000_000)).padStart(3, '0');
  const middle = String(Math.floor(number / 10_000) % 1000).padStart(3, '0');
  const last = String(number % 10_000).padStart(4, '0');
  return `+234 ${prefix} ${middle} ${last}`;
}

function preparePlan(students, existingUsers, existingDemoParents) {
    const reservedEmails = new Set(existingUsers.map(({ email }) => email.toLowerCase()));
  const reservedSurnames = new Set(existingDemoParents.map(({ fullName }) => fullName.trim().split(/\s+/).at(-1).toLowerCase()));
  let surnameCursor = 0;
  let nextSerial = Math.max(0, ...existingUsers.map(({ email }) => Number(serialFromEmail(email)) || 0)) + 1;
  const families = groupFamilies(students);
  const plan = [];

  for (const [familyIndex, children] of families.entries()) {
    let surname;
    while (surnameCursor < surnames.length) {
      const candidate = surnames[surnameCursor++];
      if (reservedSurnames.has(candidate.toLowerCase())) continue;
      const replacementEmails = children.map((child) => {
        const serial = serialFromEmail(child.user.email);
        if (!serial) throw new Error(`Demo student ${child.admissionNumber} has no numeric email serial.`);
        return makeEmail(child.firstName || child.user.fullName.split(/\s+/)[0], candidate, serial);
      });
      const uniqueEmails = new Set(replacementEmails.map((email) => email.toLowerCase()));
      if (uniqueEmails.size !== replacementEmails.length || replacementEmails.some((email, index) => reservedEmails.has(email.toLowerCase()) && email.toLowerCase() !== children[index].user.email.toLowerCase())) continue;
      surname = candidate;
      replacementEmails.forEach((email) => reservedEmails.add(email.toLowerCase()));
      break;
    }
    if (!surname) throw new Error(`No unique demo surname remains for family ${familyIndex + 1}.`);
    reservedSurnames.add(surname.toLowerCase());

    const address = familyAddress(familyIndex);
    const childNames = new Set(children.map((c) => (c.firstName || c.user.fullName.split(/\s+/)[0]).toLowerCase()));
    const parents = relationshipPlan(familyIndex).map((plannedParent, parentIndex) => {
      const pool = femaleNames.includes(plannedParent.firstName) ? femaleNames : maleNames;
      const startIndex = pool.indexOf(plannedParent.firstName);
      let step = 0;
      let firstName = plannedParent.firstName;
      while (childNames.has(firstName.toLowerCase()) && step < pool.length) {
        step += 1;
        firstName = pool[(startIndex + step) % pool.length];
      }
      const parent = { ...plannedParent, firstName };
      let email;
      let serial;
      do {
        serial = String(nextSerial++).padStart(5, '0');
        email = makeEmail(parent.firstName, surname, serial);
      } while (reservedEmails.has(email.toLowerCase()));
      reservedEmails.add(email.toLowerCase());
      return {
        ...parent,
        email,
        phone: phoneFromSerial(serial),
        occupation: occupations[(familyIndex * 3 + parentIndex * 11) % occupations.length],
        address,
      };
    });
    const studentUpdates = children.map((child) => {
      const serial = serialFromEmail(child.user.email);
      return {
        id: child.id,
        userId: child.user.id,
        firstName: child.firstName || child.user.fullName.split(/\s+/)[0],
        email: makeEmail(child.firstName || child.user.fullName.split(/\s+/)[0], surname, serial),
      };
    });
    for (const child of children) reservedEmails.delete(child.user.email.toLowerCase());
    studentUpdates.forEach(({ email }) => reservedEmails.add(email.toLowerCase()));
    plan.push({ surname, children, studentUpdates, parents, address });
  }
  return plan;
}

function parentCount(plan) { return plan.reduce((total, family) => total + family.parents.length, 0); }

function reportPlan(plan, unlinkedCount, includeTotals) {
  const breakdown = { 1: 0, 2: 0, 3: 0 };
  for (const family of plan) breakdown[family.children.length] += 1;
  console.log(`Database host: ${databaseHost()}`);
  console.log(`Unlinked demo students: ${unlinkedCount}`);
  if (includeTotals) console.log(`Families: ${plan.length}; parents: ${parentCount(plan)}; links: ${unlinkedCount}.`);
  console.log(`Families by children: 1 child: ${breakdown[1]}, 2 children: ${breakdown[2]}, 3 children: ${breakdown[3]}.`);
  console.log('Sample families:');
  console.table(plan.slice(0, 5).map((family) => ({
    surname: family.surname,
    parents: family.parents.map(({ firstName, relationship }) => `${firstName} ${family.surname} (${relationship})`).join('; '),
    children: family.children.map((child) => `${child.firstName || child.user.fullName.split(/\s+/)[0]} ${family.surname} — ${classLabel(child.class)}`).join('; '),
  })));
}

async function main() {
  try {
    const students = await prisma.student.findMany({
      where: {
        admissionNumber: { startsWith: 'DEMO-' },
        user: { is: { email: { endsWith: EMAIL_SUFFIX } } },
        parents: { none: {} },
      },
      select: {
        id: true,
        userId: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        classId: true,
        class: { select: { id: true, name: true, level: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { admissionNumber: 'asc' },
    });
    const existingUsers = await prisma.user.findMany({ where: { email: { endsWith: EMAIL_SUFFIX } }, select: { email: true } });
    const existingDemoParents = await prisma.user.findMany({ where: { role: 'PARENT', email: { endsWith: EMAIL_SUFFIX } }, select: { fullName: true } });
    const plan = preparePlan(students, existingUsers, existingDemoParents);
    reportPlan(plan, students.length, !confirmed);
    if (!confirmed) {
      console.log('Dry run only. Pass --confirm to create demo parents and update/link the demo students.');
      return;
    }
    if (!plan.length) {
      console.log('No unlinked demo students need parent records.');
      return;
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    for (const family of plan) {
      await prisma.$transaction(async (tx) => {
        for (const [index, child] of family.children.entries()) {
          const update = family.studentUpdates[index];
          await tx.student.update({ where: { id: child.id }, data: { lastName: family.surname, address: family.address } });
          await tx.user.update({ where: { id: update.userId }, data: { fullName: `${update.firstName} ${family.surname}`, email: update.email } });
        }
        for (const parent of family.parents) {
          await tx.parent.create({
            data: {
              relationship: parent.relationship,
              occupation: parent.occupation,
              address: parent.address,
              user: { create: {
                fullName: `${parent.firstName} ${family.surname}`,
                email: parent.email,
                phone: parent.phone,
                passwordHash,
                role: 'PARENT',
                status: 'ACTIVE',
              } },
              children: { create: family.children.map((child) => ({ student: { connect: { id: child.id } } })) },
            },
          });
        }
      }, { timeout: 120000, maxWait: 20000 });
    }
    console.log(`Created ${plan.length} families, ${parentCount(plan)} parents and ${students.length} parent-student links.`);
    console.log(`Shared demo password: ${PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
