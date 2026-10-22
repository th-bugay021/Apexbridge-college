import { randomBytes, randomUUID } from 'node:crypto';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';
import { createAccessToken } from '../src/utils/tokens.js';

const baseUrl = (process.env.STEP7_BASE_URL || 'http://localhost:' + (process.env.PORT || env.PORT)).replace(/\/+$/, '');
const tag = randomUUID().replaceAll('-', '').slice(0, 12);
const fixtures = {
  classIds: [],
  subjectIds: [],
  teacherUserIds: [],
  studentUserId: null,
};
let failures = 0;

function report(name, passed) {
  if (!passed) failures += 1;
  console.log((passed ? 'PASS' : 'FAIL') + ' - ' + name);
}

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  let data = null;
  if (response.status !== 204) {
    try { data = await response.json(); } catch { data = null; }
  }
  return { status: response.status, code: data?.error?.code, message: data?.error?.message, data };
}

async function login(email, password) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (result.status !== 200 || !result.data?.accessToken || !result.data?.user?.id) {
    throw new Error('Authentication failed');
  }
  return result.data;
}

async function createClass(suffix) {
  const item = await prisma.class.create({
    data: { name: 'Step 7 ' + suffix + ' ' + tag, level: 'S7-' + suffix + '-' + tag },
    select: { id: true },
  });
  fixtures.classIds.push(item.id);
  return item.id;
}

async function createSubject(suffix) {
  const item = await prisma.subject.create({
    data: { name: 'Step 7 ' + suffix + ' ' + tag, code: ('S7' + suffix + tag).slice(0, 30) },
    select: { id: true },
  });
  fixtures.subjectIds.push(item.id);
  return item.id;
}

async function createTeacher(suffix, status = 'ACTIVE') {
  const user = await prisma.user.create({
    data: {
      email: 'step7-' + suffix + '-' + tag + '@example.invalid',
      passwordHash: randomBytes(32).toString('hex'),
      fullName: 'Step 7 ' + suffix + ' ' + tag,
      role: 'TEACHER',
      status,
      teacher: { create: { employeeNumber: ('S7' + suffix + tag).slice(0, 30) } },
    },
    include: { teacher: { select: { id: true } } },
  });
  fixtures.teacherUserIds.push(user.id);
  return user.teacher;
}

async function createStudent(classId) {
  const user = await prisma.user.create({
    data: {
      email: 'step7-student-' + tag + '@example.invalid',
      passwordHash: randomBytes(32).toString('hex'),
      fullName: 'Step 7 Student ' + tag,
      role: 'STUDENT',
      student: { create: { admissionNumber: 'S7-' + tag, classId } },
    },
    include: { student: { select: { id: true } } },
  });
  fixtures.studentUserId = user.id;
  return { id: user.student.id, token: createAccessToken(user) };
}

async function assign(classId, subjectId, teacherId) {
  await prisma.classSubject.create({ data: { classId, subjectId, teacherId } });
}

async function runCase(name, check) {
  try { report(name, Boolean(await check())); }
  catch { report(name, false); }
}

async function cleanup() {
  try {
    if (fixtures.classIds.length) {
      await prisma.timetableEntry.deleteMany({ where: { classId: { in: fixtures.classIds } } });
      await prisma.classSubject.deleteMany({ where: { classId: { in: fixtures.classIds } } });
      await prisma.student.deleteMany({ where: { userId: fixtures.studentUserId ?? '__no_step7_student__' } });
      await prisma.class.deleteMany({ where: { id: { in: fixtures.classIds } } });
    }
    if (fixtures.subjectIds.length) await prisma.subject.deleteMany({ where: { id: { in: fixtures.subjectIds } } });
    if (fixtures.teacherUserIds.length) await prisma.user.deleteMany({ where: { id: { in: fixtures.teacherUserIds } } });
    if (fixtures.studentUserId) await prisma.user.deleteMany({ where: { id: fixtures.studentUserId } });

    const [entries, assignments, classes, subjects, teacherUsers, studentUsers] = await Promise.all([
      fixtures.classIds.length ? prisma.timetableEntry.count({ where: { classId: { in: fixtures.classIds } } }) : 0,
      fixtures.classIds.length ? prisma.classSubject.count({ where: { classId: { in: fixtures.classIds } } }) : 0,
      fixtures.classIds.length ? prisma.class.count({ where: { id: { in: fixtures.classIds } } }) : 0,
      fixtures.subjectIds.length ? prisma.subject.count({ where: { id: { in: fixtures.subjectIds } } }) : 0,
      fixtures.teacherUserIds.length ? prisma.user.count({ where: { id: { in: fixtures.teacherUserIds } } }) : 0,
      fixtures.studentUserId ? prisma.user.count({ where: { id: fixtures.studentUserId } }) : 0,
    ]);
    report('Temporary fixtures cleaned up; none remain', !(entries || assignments || classes || subjects || teacherUsers || studentUsers));
  } catch {
    report('Temporary fixtures cleaned up; none remain', false);
  }
}

async function main() {
  try {
    const adminEmail = process.env.STEP7_ADMIN_EMAIL;
    const adminPassword = process.env.STEP7_ADMIN_PASSWORD;
    const teacherEmail = process.env.STEP7_TEACHER_EMAIL;
    const teacherPassword = process.env.STEP7_TEACHER_PASSWORD;
    if (!adminEmail || !adminPassword || !teacherEmail || !teacherPassword) {
      throw new Error('Missing credentials');
    }
    const [admin, teacherSession] = await Promise.all([
      login(adminEmail, adminPassword),
      login(teacherEmail, teacherPassword),
    ]);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(admin.user.role) || teacherSession.user.role !== 'TEACHER') {
      throw new Error('Unexpected account roles');
    }

    const [classA, classB, classC] = await Promise.all([
      createClass('A'), createClass('B'), createClass('C'),
    ]);
    const [subjectA, subjectB, subjectC, subjectD] = await Promise.all([
      createSubject('A'), createSubject('B'), createSubject('C'), createSubject('D'),
    ]);
    const [teacherA, teacherB, inactiveTeacher] = await Promise.all([
      createTeacher('active-a'),
      createTeacher('active-b'),
      createTeacher('inactive', 'SUSPENDED'),
    ]);
    await Promise.all([
      assign(classA, subjectA, teacherA.id),
      assign(classA, subjectB, teacherB.id),
      assign(classB, subjectC, teacherA.id),
      assign(classC, subjectD, inactiveTeacher.id),
    ]);
    const student = await createStudent(classB);

    const monday = {
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '10:00',
      room: 'Room 7',
    };
    const first = await request('/api/timetable', {
      token: admin.accessToken,
      method: 'POST',
      body: { classId: classA, subjectId: subjectA, ...monday },
    });
    if (first.status !== 201 || !first.data?.entry?.id) throw new Error('Fixture timetable could not be created');
    const entryId = first.data.entry.id;

    const studentEntry = await request('/api/timetable', {
      token: admin.accessToken,
      method: 'POST',
      body: {
        classId: classB, subjectId: subjectC, dayOfWeek: 'MONDAY',
        startTime: '12:00', endTime: '13:00',
      },
    });
    if (studentEntry.status !== 201 || !studentEntry.data?.entry?.id) throw new Error('Student class timetable fixture could not be created');

    report('Temporary fixtures created', true);

    await runCase('Role refusals for teacher and student timetable writes', async () => {
      const [post, patch, remove, studentPost] = await Promise.all([
        request('/api/timetable', {
          token: teacherSession.accessToken,
          method: 'POST',
          body: { classId: classA, subjectId: subjectA, ...monday },
        }),
        request('/api/timetable/' + entryId, {
          token: teacherSession.accessToken, method: 'PATCH', body: { room: 'Forbidden' },
        }),
        request('/api/timetable/' + entryId, { token: teacherSession.accessToken, method: 'DELETE' }),
        request('/api/timetable', {
          token: student.token,
          method: 'POST',
          body: { classId: classB, subjectId: subjectC, ...monday },
        }),
      ]);
      return [post, patch, remove, studentPost].every((result) => result.status === 403);
    });

    await runCase('GET /api/timetable/me resolves as the teacher timetable route', async () => {
      const result = await request('/api/timetable/me', { token: teacherSession.accessToken });
      return result.status === 200 && Array.isArray(result.data?.entries);
    });

    await runCase('Teacher cannot view a class with no assigned subject', async () => {
      const result = await request('/api/timetable/classes/' + classA, { token: teacherSession.accessToken });
      return result.status === 403;
    });

    await runCase('Overlapping class entry is rejected with CLASS_OVERLAP', async () => {
      const result = await request('/api/timetable', {
        token: admin.accessToken,
        method: 'POST',
        body: { classId: classA, subjectId: subjectB, dayOfWeek: 'MONDAY', startTime: '09:30', endTime: '10:30' },
      });
      return result.status === 409 && result.code === 'CLASS_OVERLAP' && /class/i.test(result.message || '');
    });

    await runCase('Overlapping teacher entry is rejected with TEACHER_OVERLAP', async () => {
      const result = await request('/api/timetable', {
        token: admin.accessToken,
        method: 'POST',
        body: { classId: classB, subjectId: subjectC, dayOfWeek: 'MONDAY', startTime: '09:30', endTime: '10:30' },
      });
      return result.status === 409 && result.code === 'TEACHER_OVERLAP' && /teacher/i.test(result.message || '');
    });

    await runCase('Adjacent half-open entries are allowed', async () => {
      const result = await request('/api/timetable', {
        token: admin.accessToken,
        method: 'POST',
        body: { classId: classA, subjectId: subjectB, dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '11:00' },
      });
      return result.status === 201;
    });

    await runCase('Unassigned subject is rejected', async () => {
      const result = await request('/api/timetable', {
        token: admin.accessToken,
        method: 'POST',
        body: { classId: classA, subjectId: subjectC, ...monday },
      });
      return result.status === 409 && result.code === 'CLASS_SUBJECT_NOT_ASSIGNED';
    });

    await runCase('PATCH rejects a class-subject assignment that does not exist', async () => {
      const result = await request('/api/timetable/' + entryId, {
        token: admin.accessToken,
        method: 'PATCH',
        body: { classId: classA, subjectId: subjectC },
      });
      return result.status === 409 && result.code === 'CLASS_SUBJECT_NOT_ASSIGNED';
    });

    await runCase('End before start is rejected', async () => {
      const result = await request('/api/timetable', {
        token: admin.accessToken,
        method: 'POST',
        body: { classId: classA, subjectId: subjectB, dayOfWeek: 'TUESDAY', startTime: '11:00', endTime: '10:00' },
      });
      return result.status === 400 && result.code === 'INVALID_TIME_RANGE';
    });

    await runCase('Inactive assigned teacher is rejected', async () => {
      const result = await request('/api/timetable', {
        token: admin.accessToken,
        method: 'POST',
        body: { classId: classC, subjectId: subjectD, dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '10:00' },
      });
      return result.status === 409 && result.code === 'TEACHER_INACTIVE';
    });

    await runCase('Student sees only their own class timetable', async () => {
      const [mine, otherClass] = await Promise.all([
        request('/api/timetable/me', { token: student.token }),
        request('/api/timetable/classes/' + classA, { token: student.token }),
      ]);
      return mine.status === 200
        && mine.data?.class?.id === classB
        && Array.isArray(mine.data?.entries)
        && mine.data.entries.every((entry) => entry.classId === classB)
        && otherClass.status === 403;
    });

    await runCase('Overlapping update is rejected and excludes its own entry', async () => {
      const result = await request('/api/timetable/' + studentEntry.data.entry.id, {
        token: admin.accessToken,
        method: 'PATCH',
        body: { classId: classA, subjectId: subjectA, dayOfWeek: 'MONDAY', startTime: '09:15', endTime: '09:45' },
      });
      return result.status === 409 && result.code === 'CLASS_OVERLAP';
    });

    await runCase('Unassign is blocked while timetable entries exist', async () => {
      const result = await request('/api/classes/' + classA + '/subjects/' + subjectA, {
        token: admin.accessToken, method: 'DELETE',
      });
      return result.status === 409 && result.code === 'TIMETABLE_ENTRIES_EXIST' && Boolean(result.message);
    });
  } catch {
    report('Setup and authentication', false);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  if (failures) process.exitCode = 1;
}

await main();
