import { randomBytes, randomUUID } from 'node:crypto';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';
import { createAccessToken } from '../src/utils/tokens.js';

const baseUrl = (process.env.STEP8_BASE_URL || `http://localhost:${process.env.PORT || env.PORT}`).replace(/\/+$/, '');
const runId = randomUUID().replaceAll('-', '').slice(0, 12);
const fixtures = { userIds: [], classIds: [], subjectIds: [], attendanceIds: [], timetableIds: [] };
let failures = 0;

function report(name, passed) {
  if (!passed) failures += 1;
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}`);
}

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  let data = null;
  try { if (response.status !== 204) data = await response.json(); } catch { /* Keep data null for non-JSON responses. */ }
  return { status: response.status, code: data?.error?.code, data };
}

async function login(email, password) {
  const result = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  if (result.status !== 200 || !result.data?.accessToken || !result.data?.user?.id) throw new Error('Authentication failed');
  return result.data;
}

async function createFixtureTeacher() {
  const user = await prisma.user.create({
    data: {
      email: `step8-teacher-${runId}@example.invalid`,
      passwordHash: randomBytes(32).toString('hex'),
      fullName: `Step 8 Teacher ${runId}`,
      role: 'TEACHER',
      status: 'ACTIVE',
      teacher: { create: { employeeNumber: `S8-${runId}` } },
    },
    include: { teacher: { select: { id: true } } },
  });
  fixtures.userIds.push(user.id);
  return { id: user.teacher.id, userId: user.id, token: createAccessToken(user) };
}

async function cleanup() {
  try {
    if (fixtures.attendanceIds.length) await prisma.attendance.deleteMany({ where: { id: { in: fixtures.attendanceIds } } });
    if (fixtures.timetableIds.length) await prisma.timetableEntry.deleteMany({ where: { id: { in: fixtures.timetableIds } } });
    if (fixtures.classIds.length) await prisma.classSubject.deleteMany({ where: { classId: { in: fixtures.classIds } } });
    if (fixtures.classIds.length) await prisma.class.deleteMany({ where: { id: { in: fixtures.classIds } } });
    if (fixtures.subjectIds.length) await prisma.subject.deleteMany({ where: { id: { in: fixtures.subjectIds } } });
    if (fixtures.userIds.length) await prisma.user.deleteMany({ where: { id: { in: fixtures.userIds } } });

    const [users, classes, subjects, attendance, timetable] = await Promise.all([
      fixtures.userIds.length ? prisma.user.count({ where: { id: { in: fixtures.userIds } } }) : 0,
      fixtures.classIds.length ? prisma.class.count({ where: { id: { in: fixtures.classIds } } }) : 0,
      fixtures.subjectIds.length ? prisma.subject.count({ where: { id: { in: fixtures.subjectIds } } }) : 0,
      fixtures.attendanceIds.length ? prisma.attendance.count({ where: { id: { in: fixtures.attendanceIds } } }) : 0,
      fixtures.timetableIds.length ? prisma.timetableEntry.count({ where: { id: { in: fixtures.timetableIds } } }) : 0,
    ]);
    report('Temporary fixtures cleaned up; none remain', !(users || classes || subjects || attendance || timetable));
  } catch {
    report('Temporary fixtures cleaned up; none remain', false);
  }
}

async function runCase(name, check) {
  try { report(name, Boolean(await check())); } catch { report(name, false); }
}

async function main() {
  try {
    const adminEmail = process.env.STEP8_ADMIN_EMAIL;
    const adminPassword = process.env.STEP8_ADMIN_PASSWORD;
    const teacherEmail = process.env.STEP8_TEACHER_EMAIL;
    const teacherPassword = process.env.STEP8_TEACHER_PASSWORD;
    if (!adminEmail || !adminPassword || !teacherEmail || !teacherPassword) throw new Error('Missing credentials');
    const [admin, teacherSession] = await Promise.all([
      login(adminEmail, adminPassword),
      login(teacherEmail, teacherPassword),
    ]);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(admin.user.role) || teacherSession.user.role !== 'TEACHER') throw new Error('Unexpected account roles');

    const teacherFixture = await createFixtureTeacher();
    const classItem = await prisma.class.create({
      data: { name: `Step 8 Class ${runId}`, level: `S8-${runId}` }, select: { id: true },
    });
    fixtures.classIds.push(classItem.id);
    const subject = await prisma.subject.create({
      data: { name: `Step 8 Subject ${runId}`, code: `S8${runId}` }, select: { id: true },
    });
    fixtures.subjectIds.push(subject.id);
    await prisma.classSubject.create({ data: { classId: classItem.id, subjectId: subject.id, teacherId: teacherFixture.id } });
    const schedule = await prisma.timetableEntry.create({
      data: { classId: classItem.id, subjectId: subject.id, teacherId: teacherFixture.id, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:15' },
      select: { id: true },
    });
    fixtures.timetableIds.push(schedule.id);

    const studentUser = await prisma.user.create({
      data: {
        email: `step8-student-${runId}@example.invalid`, passwordHash: randomBytes(32).toString('hex'),
        fullName: `Step 8 Student ${runId}`, role: 'STUDENT', status: 'ACTIVE',
        student: { create: { admissionNumber: `S8-${runId}`, classId: classItem.id } },
      },
      include: { student: { select: { id: true } } },
    });
    fixtures.userIds.push(studentUser.id);

    const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = (type) => todayParts.find((item) => item.type === type)?.value;
    const today = `${part('year')}-${part('month')}-${part('day')}`;
    const mark = await prisma.attendance.create({
      data: { classId: classItem.id, studentId: studentUser.student.id, date: new Date(`${today}T00:00:00.000Z`), status: 'PRESENT', markedById: teacherFixture.userId },
      select: { id: true },
    });
    fixtures.attendanceIds.push(mark.id);

    report('Temporary fixtures created', true);
    await runCase('Teacher and student role refusals on list overview', async () => {
      const studentToken = createAccessToken(studentUser);
      const [teacherResult, studentResult] = await Promise.all([
        request('/api/teachers/overview', { token: teacherSession.accessToken }),
        request('/api/teachers/overview', { token: studentToken }),
      ]);
      return teacherResult.status === 403 && studentResult.status === 403;
    });
    await runCase('Student role refused on a teacher overview', async () => {
      const result = await request(`/api/teachers/${teacherFixture.id}/overview`, { token: createAccessToken(studentUser) });
      return result.status === 403;
    });
    await runCase('Teacher cannot read another teacher overview', async () => {
      const result = await request(`/api/teachers/${teacherFixture.id}/overview`, { token: teacherSession.accessToken });
      return result.status === 403;
    });
    await runCase('Teacher can read their own overview', async () => {
      const result = await request(`/api/teachers/${teacherFixture.id}/overview`, { token: teacherFixture.token });
      const overview = result.data;
      return result.status === 200
        && overview?.teacher?.teacherId === teacherFixture.id
        && overview.weeklyScheduledMinutes === 75
        && overview.attendance.daysMarked === 1
        && overview.attendance.recordsEntered === 1
        && overview.attendance.byClass.some((item) => item.classId === classItem.id && item.daysMarked === 1);
    });
    await runCase('Overview date range validation', async () => {
      const [badDate, reversed, tooLong, partial] = await Promise.all([
        request(`/api/teachers/${teacherFixture.id}/overview?from=2026-02-30&to=2026-03-01`, { token: admin.accessToken }),
        request(`/api/teachers/${teacherFixture.id}/overview?from=2026-03-02&to=2026-03-01`, { token: admin.accessToken }),
        request(`/api/teachers/${teacherFixture.id}/overview?from=2025-01-01&to=2026-01-02`, { token: admin.accessToken }),
        request(`/api/teachers/${teacherFixture.id}/overview?from=2026-03-01`, { token: admin.accessToken }),
      ]);
      return [badDate, reversed, tooLong, partial].every((result) => result.status === 400);
    });
    await runCase('Admin overview list search and pagination', async () => {
      const result = await request(`/api/teachers/overview?search=${encodeURIComponent(runId)}&page=1&limit=1`, { token: admin.accessToken });
      return result.status === 200
        && result.data?.teachers?.length === 1
        && result.data.teachers[0].teacherId === teacherFixture.id
        && result.data.teachers[0].attendanceRecordsEntered === 1
        && result.data.pagination?.total === 1;
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
