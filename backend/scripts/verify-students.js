import { randomBytes, randomUUID } from 'node:crypto';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';
import { createAccessToken } from '../src/utils/tokens.js';

const baseUrl = (process.env.STUDENTS_BASE_URL || `http://localhost:${process.env.PORT || env.PORT}`).replace(/\/+$/, '');
const tag = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
const fixtures = { userIds: [], classIds: [], subjectIds: [], resultIds: [], attendanceIds: [] };
let failures = 0;

function report(name, passed) {
  if (!passed) failures += 1;
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}`);
}

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  let data = null;
  try { if (response.status !== 204) data = await response.json(); } catch { /* Non-JSON error responses are handled as null. */ }
  return { status: response.status, code: data?.error?.code, data };
}

async function cleanup() {
  try {
    if (fixtures.attendanceIds.length) await prisma.attendance.deleteMany({ where: { id: { in: fixtures.attendanceIds } } });
    if (fixtures.resultIds.length) await prisma.result.deleteMany({ where: { id: { in: fixtures.resultIds } } });
    if (fixtures.userIds.length) await prisma.user.deleteMany({ where: { id: { in: fixtures.userIds } } });
    if (fixtures.classIds.length) await prisma.class.deleteMany({ where: { id: { in: fixtures.classIds } } });
    if (fixtures.subjectIds.length) await prisma.subject.deleteMany({ where: { id: { in: fixtures.subjectIds } } });
    const [users, classes, subjects, results, attendance] = await Promise.all([
      fixtures.userIds.length ? prisma.user.count({ where: { id: { in: fixtures.userIds } } }) : 0,
      fixtures.classIds.length ? prisma.class.count({ where: { id: { in: fixtures.classIds } } }) : 0,
      fixtures.subjectIds.length ? prisma.subject.count({ where: { id: { in: fixtures.subjectIds } } }) : 0,
      fixtures.resultIds.length ? prisma.result.count({ where: { id: { in: fixtures.resultIds } } }) : 0,
      fixtures.attendanceIds.length ? prisma.attendance.count({ where: { id: { in: fixtures.attendanceIds } } }) : 0,
    ]);
    report('Temporary fixtures cleaned up', !(users || classes || subjects || results || attendance));
  } catch { report('Temporary fixtures cleaned up', false); }
}

async function main() {
  try {
    const admin = await prisma.user.create({
      data: { email: `students-admin-${tag}@example.invalid`, passwordHash: randomBytes(32).toString('hex'), fullName: `Verify Admin ${tag}`, role: 'ADMIN' },
    });
    fixtures.userIds.push(admin.id);
    const token = createAccessToken(admin);
    const classItem = await prisma.class.create({ data: { name: `Verify Students ${tag}`, level: tag }, select: { id: true } });
    fixtures.classIds.push(classItem.id);
    const otherClass = await prisma.class.create({ data: { name: `Verify Students Other ${tag}`, level: tag }, select: { id: true } });
    fixtures.classIds.push(otherClass.id);

    const createBody = {
      firstName: 'Verify', lastName: 'Student', email: `student-${tag}@example.invalid`, password: 'Student-password-12',
      admissionNumber: `VERIFY-${tag}`, gender: 'OTHER', department: 'Verification', admissionDate: '2026-01-02',
      dateOfBirth: '2010-03-04', address: 'Verify Street', classId: classItem.id,
    };
    const studentsUrl = `${baseUrl}/api/students`;
    let created;
    try {
      created = await request('/api/students', { token, method: 'POST', body: createBody });
    } catch (error) {
      console.error(`POST ${studentsUrl} failed:`, error);
      throw error;
    }
    if (created.status !== 201 || !created.data?.student?.id) {
      console.error('First student creation request failed:', {
        status: created.status,
        responseBody: created.data,
        url: studentsUrl,
      });
      throw new Error('First POST /api/students did not return a student id');
    }
    const studentId = created.data?.student?.id;
    const studentUserId = created.data?.student?.userId ?? created.data?.student?.user?.id;
    if (studentUserId) fixtures.userIds.push(studentUserId);
    report('Create student and linked user with generated profile', created.status === 201 && created.data?.student?.user?.fullName === 'Verify Student');

    const secondCreated = await request('/api/students', { token, method: 'POST', body: {
      ...createBody, firstName: 'Bulk', lastName: 'Student', email: `bulk-${tag}@example.invalid`, admissionNumber: `BULK-${tag}`,
    } });
    const secondStudentId = secondCreated.data?.student?.id;
    const secondUserId = secondCreated.data?.student?.userId ?? secondCreated.data?.student?.user?.id;
    if (secondUserId) fixtures.userIds.push(secondUserId);

    const attendanceCreated = await request('/api/students', { token, method: 'POST', body: {
      ...createBody,
      firstName: 'Attendance',
      lastName: 'Student',
      email: `attendance-${tag}@example.invalid`,
      admissionNumber: `ATTENDANCE-${tag}`,
    } });
    const attendanceStudentId = attendanceCreated.data?.student?.id;
    const attendanceUserId = attendanceCreated.data?.student?.userId ?? attendanceCreated.data?.student?.user?.id;
    if (attendanceUserId) fixtures.userIds.push(attendanceUserId);
    if (attendanceCreated.status !== 201 || !attendanceStudentId || !attendanceUserId) {
      throw new Error(`Attendance fixture student creation failed (${attendanceCreated.status})`);
    }
    const attendance = await prisma.attendance.create({
      data: {
        studentId: attendanceStudentId,
        classId: classItem.id,
        date: new Date('2026-11-04T00:00:00.000Z'),
        status: 'PRESENT',
        markedById: admin.id,
      },
      select: { id: true },
    });
    fixtures.attendanceIds.push(attendance.id);
    const attendanceSingleDelete = await request(`/api/students/${attendanceStudentId}`, { token, method: 'DELETE' });
    const attendanceBulkDelete = await request('/api/students/bulk-delete', {
      token,
      method: 'POST',
      body: { ids: [attendanceStudentId, secondStudentId] },
    });
    const [attendanceStudentsLeft, attendanceUsersLeft, attendanceRecordsLeft] = await Promise.all([
      prisma.student.count({ where: { id: { in: [attendanceStudentId, secondStudentId] } } }),
      prisma.user.count({ where: { id: { in: [attendanceUserId, secondUserId] } } }),
      prisma.attendance.count({ where: { id: attendance.id } }),
    ]);
    report(
      'Attendance blocks single and atomic bulk delete',
      attendanceSingleDelete.status === 409
        && attendanceBulkDelete.status === 409
        && attendanceStudentsLeft === 2
        && attendanceUsersLeft === 2
        && attendanceRecordsLeft === 1,
    );

    const list = await request(`/api/students?search=${encodeURIComponent(`VERIFY-${tag}`)}&classId=${classItem.id}&status=ACTIVE&gender=OTHER&department=Verification`, { token });
    report('List search and filters', list.status === 200 && list.data?.students?.some((item) => item.id === studentId));
    const detail = await request(`/api/students/${studentId}`, { token });
    report('Get student includes class', detail.status === 200 && detail.data?.student?.class?.id === classItem.id);
    const update = await request(`/api/students/${studentId}`, { token, method: 'PATCH', body: { firstName: 'Updated', classId: otherClass.id } });
    report('Update keeps linked full name synchronized', update.status === 200 && update.data?.student?.user?.fullName === 'Updated Student' && update.data.student.class?.id === otherClass.id);

    const duplicateEmail = await request('/api/students', { token, method: 'POST', body: { ...createBody, admissionNumber: `VERIFY2-${tag}` } });
    report('Duplicate email maps to clear conflict', duplicateEmail.status === 409 && duplicateEmail.code === 'EMAIL_EXISTS');
    const invalidClass = await request('/api/students', { token, method: 'POST', body: { ...createBody, email: `other-${tag}@example.invalid`, admissionNumber: `VERIFY3-${tag}`, classId: 'missing-class' } });
    report('Missing class returns bad request', invalidClass.status === 400 && invalidClass.code === 'CLASS_NOT_FOUND');

    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
    const subject = await prisma.subject.create({ data: { name: `Verify Subject ${tag}`, code: `V${tag}`.slice(0, 30) }, select: { id: true } });
    fixtures.subjectIds.push(subject.id);
    const result = await prisma.result.create({ data: { studentId, subjectId: subject.id, term: 'VERIFY', session: tag, score: 50 }, select: { id: true } });
    fixtures.resultIds.push(result.id);
    const blockedDelete = await request(`/api/students/${studentId}`, { token, method: 'DELETE' });
    const bulkBlocked = await request('/api/students/bulk-delete', { token, method: 'POST', body: { ids: [studentId, secondStudentId] } });
    const stillExists = await prisma.student.count({ where: { id: { in: [studentId, secondStudentId] } } });
    report('Linked result blocks single delete and bulk delete stays atomic', blockedDelete.status === 409 && bulkBlocked.status === 409 && stillExists === 2);
    await prisma.result.delete({ where: { id: result.id } });
    fixtures.resultIds = [];
    const deleted = await request('/api/students/bulk-delete', { token, method: 'POST', body: { ids: [studentId, secondStudentId] } });
    report('Bulk delete removes student users', deleted.status === 200 && deleted.data?.deleted === 2 && !await prisma.user.findUnique({ where: { id: student.userId } }) && !await prisma.user.findUnique({ where: { id: secondUserId } }));
  } catch (error) {
    report(`Setup and endpoint verification (${error.message})`, false);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
  if (failures) process.exitCode = 1;
}

await main();
