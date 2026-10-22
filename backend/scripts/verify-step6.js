import { randomBytes, randomUUID } from 'node:crypto';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';
import { createAccessToken } from '../src/utils/tokens.js';

const baseUrl = (process.env.STEP6_BASE_URL || `http://localhost:${process.env.PORT || env.PORT}`).replace(/\/+$/, '');
const runId = randomUUID().replaceAll('-', '').slice(0, 12);
const fixtures = { classIds: [], userIds: [], studentIds: [] };
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
  if (response.status !== 204) {
    try { data = await response.json(); } catch { data = null; }
  }
  return { status: response.status, code: data?.error?.code, data };
}

async function login(email, password) {
  const result = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  if (result.status !== 200 || !result.data?.accessToken || !result.data?.user?.id) throw new Error('Login failed');
  return result.data;
}

async function createFixtureClass(suffix) {
  const row = await prisma.class.create({
    data: { name: `Step 6 ${suffix} ${runId}`, level: `S6-${suffix}-${runId}` },
    select: { id: true },
  });
  fixtures.classIds.push(row.id);
  return row.id;
}

async function createFixtureStudent(classId, suffix, status = 'ACTIVE') {
  const user = await prisma.user.create({
    data: {
      email: `step6-${suffix}-${runId}@example.invalid`,
      passwordHash: randomBytes(32).toString('hex'),
      fullName: `Step 6 ${suffix} ${runId}`,
      role: 'STUDENT',
      status,
      student: { create: { admissionNumber: `S6-${suffix}-${runId}`, classId } },
    },
    include: { student: { select: { id: true } } },
  });
  fixtures.userIds.push(user.id);
  fixtures.studentIds.push(user.student.id);
  return { id: user.student.id, token: createAccessToken(user) };
}

async function runCase(name, check) {
  try { report(name, Boolean(await check())); } catch { report(name, false); }
}

async function cleanup() {
  try {
    if (fixtures.classIds.length) {
      await prisma.attendance.deleteMany({ where: { classId: { in: fixtures.classIds } } });
      await prisma.classSubject.deleteMany({ where: { classId: { in: fixtures.classIds } } });
    }
    if (fixtures.studentIds.length) await prisma.student.deleteMany({ where: { id: { in: fixtures.studentIds } } });
    if (fixtures.classIds.length) await prisma.class.deleteMany({ where: { id: { in: fixtures.classIds } } });
    if (fixtures.userIds.length) await prisma.user.deleteMany({ where: { id: { in: fixtures.userIds } } });

    const [attendanceCount, classCount, studentCount, userCount] = await Promise.all([
      fixtures.classIds.length ? prisma.attendance.count({ where: { classId: { in: fixtures.classIds } } }) : 0,
      fixtures.classIds.length ? prisma.class.count({ where: { id: { in: fixtures.classIds } } }) : 0,
      fixtures.studentIds.length ? prisma.student.count({ where: { id: { in: fixtures.studentIds } } }) : 0,
      fixtures.userIds.length ? prisma.user.count({ where: { id: { in: fixtures.userIds } } }) : 0,
    ]);
    report('Fixtures cleaned up; none remain', !(attendanceCount || classCount || studentCount || userCount));
  } catch {
    report('Fixtures cleaned up; none remain', false);
  }
}

function tomorrowInLagos() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  const today = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`);
  today.setUTCDate(today.getUTCDate() + 1);
  return today.toISOString().slice(0, 10);
}

async function main() {
  try {
    const adminEmail = process.env.STEP6_ADMIN_EMAIL;
    const adminPassword = process.env.STEP6_ADMIN_PASSWORD;
    const teacherEmail = process.env.STEP6_TEACHER_EMAIL;
    const teacherPassword = process.env.STEP6_TEACHER_PASSWORD;
    if (!adminEmail || !adminPassword || !teacherEmail || !teacherPassword) throw new Error('Missing credentials');

    const [admin, teacher] = await Promise.all([
      login(adminEmail, adminPassword),
      login(teacherEmail, teacherPassword),
    ]);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(admin.user.role) || teacher.user.role !== 'TEACHER') throw new Error('Unexpected roles');

    const classA = await createFixtureClass('A');
    const classB = await createFixtureClass('B');
    const studentA = await createFixtureStudent(classA, 'active-a');
    const studentB = await createFixtureStudent(classB, 'active-b');
    const inactiveStudent = await createFixtureStudent(classA, 'inactive', 'SUSPENDED');
    report('Fixtures created', true);

    const todayParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const today = `${todayParts.find((part) => part.type === 'year').value}-${todayParts.find((part) => part.type === 'month').value}-${todayParts.find((part) => part.type === 'day').value}`;
    const validMark = { classId: classA, date: today, records: [{ studentId: studentA.id, status: 'PRESENT' }] };

    await runCase('Role refusals for student attendance operations', async () => {
      const [mark, daily, reportResult, otherHistory] = await Promise.all([
        request('/api/attendance', { token: studentA.token, method: 'POST', body: validMark }),
        request(`/api/attendance?classId=${classA}&date=${today}`, { token: studentA.token }),
        request(`/api/attendance/report?classId=${classA}&from=${today}&to=${today}`, { token: studentA.token }),
        request(`/api/attendance/students/${studentB.id}`, { token: studentA.token }),
      ]);
      return mark.status === 403 && daily.status === 403 && reportResult.status === 403 && otherHistory.status === 403;
    });

    await runCase('Unassigned teacher is refused for class attendance', async () => {
      const result = await request('/api/attendance', { token: teacher.accessToken, method: 'POST', body: validMark });
      return result.status === 403 && result.code === 'CLASS_ACCESS_DENIED';
    });

    await runCase('Re-marking the same class and date updates the existing mark', async () => {
      const first = await request('/api/attendance', { token: admin.accessToken, method: 'POST', body: validMark });
      const second = await request('/api/attendance', {
        token: admin.accessToken,
        method: 'POST',
        body: { ...validMark, records: [{ studentId: studentA.id, status: 'ABSENT' }] },
      });
      const daily = await request(`/api/attendance?classId=${classA}&date=${today}`, { token: admin.accessToken });
      const rows = daily.data?.attendance ?? [];
      return first.status === 200 && second.status === 200 && rows.length === 1 && rows[0].status === 'ABSENT';
    });

    await runCase('Future attendance date is rejected', async () => {
      const result = await request('/api/attendance', {
        token: admin.accessToken,
        method: 'POST',
        body: { ...validMark, date: tomorrowInLagos() },
      });
      return result.status === 400 && result.code === 'FUTURE_ATTENDANCE_DATE';
    });

    await runCase('Student from another class is rejected', async () => {
      const result = await request('/api/attendance', {
        token: admin.accessToken,
        method: 'POST',
        body: { ...validMark, records: [{ studentId: studentB.id, status: 'PRESENT' }] },
      });
      return result.status === 400 && result.code === 'STUDENT_NOT_IN_CLASS';
    });

    await runCase('Deactivated student is rejected with a clear error', async () => {
      const result = await request('/api/attendance', {
        token: admin.accessToken,
        method: 'POST',
        body: { ...validMark, records: [{ studentId: inactiveStudent.id, status: 'PRESENT' }] },
      });
      return result.status === 409 && result.code === 'STUDENT_INACTIVE';
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
