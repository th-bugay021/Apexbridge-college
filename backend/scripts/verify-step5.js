import { randomBytes, randomUUID } from 'node:crypto';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';
import { createAccessToken } from '../src/utils/tokens.js';

const baseUrl = (process.env.STEP5_BASE_URL || `http://localhost:${process.env.PORT || env.PORT}`).replace(/\/+$/, '');
const timeoutMs = 15000;
const fixtureTag = randomUUID().replaceAll('-', '').slice(0, 12);
const fixture = {
  subjectId: null,
  classIds: [],
  teacherUserIds: [],
  studentUserId: null,
};
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
    signal: AbortSignal.timeout(timeoutMs),
  });
  let data = null;
  if (response.status !== 204) {
    try { data = await response.json(); } catch { data = null; }
  }
  return { status: response.status, code: data?.error?.code, message: data?.error?.message, data };
}

async function login(email, password) {
  const result = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  if (result.status !== 200 || !result.data?.accessToken || !result.data?.user?.id) {
    throw new Error('Credentials could not authenticate');
  }
  return result.data;
}

async function createTeacher(status, suffix) {
  const user = await prisma.user.create({
    data: {
      email: `step5-${suffix}-${fixtureTag}@example.invalid`,
      passwordHash: randomBytes(32).toString('hex'),
      fullName: `Step 5 ${suffix} ${fixtureTag}`,
      role: 'TEACHER',
      status,
      teacher: { create: { employeeNumber: `S5-${suffix}-${fixtureTag}` } },
    },
    include: { teacher: true },
  });
  fixture.teacherUserIds.push(user.id);
  return user.teacher;
}

async function createStudent(classId) {
  const user = await prisma.user.create({
    data: {
      email: `step5-student-${fixtureTag}@example.invalid`,
      passwordHash: randomBytes(32).toString('hex'),
      fullName: `Step 5 Student ${fixtureTag}`,
      role: 'STUDENT',
      student: { create: { admissionNumber: `S5-${fixtureTag}`, classId } },
    },
  });
  fixture.studentUserId = user.id;
  return createAccessToken(user);
}

async function createApiFixture(token, method, path, body) {
  const result = await request(path, { token, method, body });
  if (result.status < 200 || result.status >= 300) throw new Error('Fixture request failed');
  return result.data;
}

async function runCase(name, check) {
  try { report(name, Boolean(await check())); } catch { report(name, false); }
}

async function cleanup() {
  try {
    if (fixture.classIds.length) {
      await prisma.classSubject.deleteMany({ where: { classId: { in: fixture.classIds } } });
      await prisma.student.deleteMany({ where: { userId: fixture.studentUserId ?? '__no_step5_student__' } });
      await prisma.class.deleteMany({ where: { id: { in: fixture.classIds } } });
    }
    if (fixture.subjectId) await prisma.subject.deleteMany({ where: { id: fixture.subjectId } });
    if (fixture.teacherUserIds.length) await prisma.user.deleteMany({ where: { id: { in: fixture.teacherUserIds } } });
    if (fixture.studentUserId) await prisma.user.deleteMany({ where: { id: fixture.studentUserId } });

    const [subjects, classes, teachers, students, assignments] = await Promise.all([
      fixture.subjectId ? prisma.subject.count({ where: { id: fixture.subjectId } }) : 0,
      fixture.classIds.length ? prisma.class.count({ where: { id: { in: fixture.classIds } } }) : 0,
      fixture.teacherUserIds.length ? prisma.user.count({ where: { id: { in: fixture.teacherUserIds } } }) : 0,
      fixture.studentUserId ? prisma.user.count({ where: { id: fixture.studentUserId } }) : 0,
      fixture.classIds.length ? prisma.classSubject.count({ where: { classId: { in: fixture.classIds } } }) : 0,
    ]);
    report('Temporary fixtures cleaned up and none remain', !(subjects || classes || teachers || students || assignments));
  } catch {
    report('Temporary fixtures cleaned up and none remain', false);
  }
}

async function main() {
  try {
    const adminEmail = process.env.STEP5_ADMIN_EMAIL;
    const adminPassword = process.env.STEP5_ADMIN_PASSWORD;
    const teacherEmail = process.env.STEP5_TEACHER_EMAIL;
    const teacherPassword = process.env.STEP5_TEACHER_PASSWORD;
    if (!adminEmail || !adminPassword || !teacherEmail || !teacherPassword) {
      throw new Error('Missing required test credentials');
    }

    const [admin, teacherSession] = await Promise.all([
      login(adminEmail, adminPassword),
      login(teacherEmail, teacherPassword),
    ]);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(admin.user.role) || teacherSession.user.role !== 'TEACHER') {
      throw new Error('Test credentials have unexpected roles');
    }

    const subject = await createApiFixture(admin.accessToken, 'POST', '/api/subjects', {
      name: `Step 5 ${fixtureTag}`,
      code: `S5${fixtureTag}`,
    });
    fixture.subjectId = subject.subject.id;
    const classA = await createApiFixture(admin.accessToken, 'POST', '/api/classes', {
      name: `Step 5 A ${fixtureTag}`,
      level: `S5A-${fixtureTag}`,
    });
    fixture.classIds.push(classA.class.id);
    const classB = await createApiFixture(admin.accessToken, 'POST', '/api/classes', {
      name: `Step 5 B ${fixtureTag}`,
      level: `S5B-${fixtureTag}`,
    });
    fixture.classIds.push(classB.class.id);

    const activeTeacher = await createTeacher('ACTIVE', 'active');
    const deactivatedTeacher = await createTeacher('SUSPENDED', 'deactivated');
    const studentToken = await createStudent(classB.class.id);
    report('Temporary fixtures created', true);

    await runCase('Teacher and student role refusals', async () => {
      const [subjectPost, subjectPatch, subjectDelete, classPost, classPatch, classDelete, studentSubject] = await Promise.all([
        request('/api/subjects', { token: teacherSession.accessToken, method: 'POST', body: { name: 'Forbidden', code: `F${fixtureTag}` } }),
        request(`/api/subjects/${fixture.subjectId}`, { token: teacherSession.accessToken, method: 'PATCH', body: { name: 'Forbidden' } }),
        request(`/api/subjects/${fixture.subjectId}`, { token: teacherSession.accessToken, method: 'DELETE' }),
        request('/api/classes', { token: teacherSession.accessToken, method: 'POST', body: { name: 'Forbidden', level: 'Forbidden' } }),
        request(`/api/classes/${classA.class.id}`, { token: teacherSession.accessToken, method: 'PATCH', body: { name: 'Forbidden' } }),
        request(`/api/classes/${classB.class.id}`, { token: teacherSession.accessToken, method: 'DELETE' }),
        request('/api/subjects', { token: studentToken }),
      ]);
      return [subjectPost, subjectPatch, subjectDelete, classPost, classPatch, classDelete].every((r) => r.status === 403) && studentSubject.status === 403;
    });

    await runCase('Student sees only their own class via GET /api/classes/me', async () => {
      const result = await request('/api/classes/me', { token: studentToken });
      return result.status === 200 && result.data?.classes?.length === 1 && result.data.classes[0].id === classB.class.id;
    });
    await runCase('GET /api/classes/me route is not swallowed by /:id', async () => {
      const result = await request('/api/classes/me', { token: teacherSession.accessToken });
      return result.status === 200 && Array.isArray(result.data?.classes);
    });
    await runCase('Teacher cannot open an unassigned class', async () => (
      (await request(`/api/classes/${classB.class.id}`, { token: teacherSession.accessToken })).status === 404
    ));
    await runCase('Duplicate assignment returns 409 ASSIGNMENT_EXISTS', async () => {
      const payload = { subjectId: fixture.subjectId, teacherId: activeTeacher.id };
      const first = await request(`/api/classes/${classA.class.id}/subjects`, { token: admin.accessToken, method: 'POST', body: payload });
      const duplicate = await request(`/api/classes/${classA.class.id}/subjects`, { token: admin.accessToken, method: 'POST', body: payload });
      return first.status === 201 && duplicate.status === 409 && duplicate.code === 'ASSIGNMENT_EXISTS';
    });
    await runCase('Deactivated teacher assignment is rejected', async () => {
      const result = await request(`/api/classes/${classB.class.id}/subjects`, {
        token: admin.accessToken,
        method: 'POST',
        body: { subjectId: fixture.subjectId, teacherId: deactivatedTeacher.id },
      });
      return result.status === 409 && result.code === 'TEACHER_INACTIVE';
    });
    await runCase('Deleting an assigned subject is blocked with a clear error', async () => {
      const result = await request(`/api/subjects/${fixture.subjectId}`, { token: admin.accessToken, method: 'DELETE' });
      return result.status === 409 && result.code === 'SUBJECT_IN_USE' && Boolean(result.message);
    });
    await runCase('Deleting an assigned class is blocked with a clear error', async () => {
      const result = await request(`/api/classes/${classA.class.id}`, { token: admin.accessToken, method: 'DELETE' });
      return result.status === 409 && result.code === 'CLASS_IN_USE' && Boolean(result.message);
    });
    await runCase('Duplicate subject code returns 409, not 500', async () => {
      const result = await request('/api/subjects', {
        token: admin.accessToken,
        method: 'POST',
        body: { name: `Step 5 duplicate ${fixtureTag}`, code: `S5${fixtureTag}` },
      });
      return result.status === 409 && result.status < 500;
    });
    await runCase('Duplicate class name and level returns 409, not 500', async () => {
      const result = await request('/api/classes', {
        token: admin.accessToken,
        method: 'POST',
        body: { name: `Step 5 A ${fixtureTag}`, level: `S5A-${fixtureTag}` },
      });
      return result.status === 409 && result.status < 500;
    });
    await runCase('Unassign succeeds, then assigned subject and class can be deleted', async () => {
      const unassign = await request(`/api/classes/${classA.class.id}/subjects/${fixture.subjectId}`, {
        token: admin.accessToken,
        method: 'DELETE',
      });
      if (unassign.status !== 200 || unassign.data?.assignment?.removed !== true) return false;
      const [deleteSubject, deleteClass] = await Promise.all([
        request(`/api/subjects/${fixture.subjectId}`, { token: admin.accessToken, method: 'DELETE' }),
        request(`/api/classes/${classA.class.id}`, { token: admin.accessToken, method: 'DELETE' }),
      ]);
      return deleteSubject.status === 204 && deleteClass.status === 204;
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
