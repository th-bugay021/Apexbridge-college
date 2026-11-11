import { randomBytes, randomUUID } from 'node:crypto';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';
import { createAccessToken } from '../src/utils/tokens.js';

const baseUrl = (process.env.PARENTS_BASE_URL || `http://localhost:${process.env.PORT || env.PORT}`).replace(/\/+$/, '');
const tag = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
const fixtures = { userIds: [], studentIds: [], parentIds: [], classIds: [], subjectIds: [], attendanceIds: [], timetableIds: [] };
let failures = 0;

function report(name, passed, result) {
  if (!passed) failures += 1;
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}`);
  if (!passed) console.error('Failure details:', JSON.stringify({
    httpStatus: result?.status ?? 'N/A',
    responseBody: result?.data ?? null,
    url: result?.url ?? 'N/A',
  }));
}

async function request(path, { token, method = 'GET' } = {}) {
  const url = `${baseUrl}${path}`;
  try {
    const response = await fetch(url, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(15000),
    });
    let data = null;
    try { if (response.status !== 204) data = await response.json(); } catch { /* Preserve non-JSON errors as null. */ }
    return { status: response.status, data, url };
  } catch (error) {
    return { status: null, data: { message: error.message }, url };
  }
}

function dateKey(daysAgo = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  const date = new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function createUser(role, suffix, fullName = `${role} ${tag}`) {
  const user = await prisma.user.create({ data: {
    email: `${suffix}-${tag.toLowerCase()}@example.invalid`,
    passwordHash: randomBytes(32).toString('hex'),
    fullName,
    role,
  } });
  fixtures.userIds.push(user.id);
  return user;
}

async function createStudent(suffix, classId) {
  const user = await createUser('STUDENT', `student-${suffix}`, `Verify Student ${suffix} ${tag}`);
  const student = await prisma.student.create({ data: {
    userId: user.id,
    admissionNumber: `PME-${suffix}-${tag}`,
    firstName: `First${suffix}`,
    lastName: `Last${tag}`,
    classId,
  }, select: { id: true } });
  fixtures.studentIds.push(student.id);
  return student.id;
}

async function cleanup() {
  const cleanupSteps = [
    () => fixtures.studentIds.length && prisma.attendance.deleteMany({ where: { studentId: { in: fixtures.studentIds } } }),
    () => fixtures.attendanceIds.length && prisma.attendance.deleteMany({ where: { id: { in: fixtures.attendanceIds } } }),
    () => fixtures.timetableIds.length && prisma.timetableEntry.deleteMany({ where: { id: { in: fixtures.timetableIds } } }),
    () => fixtures.userIds.length && prisma.user.deleteMany({ where: { id: { in: fixtures.userIds } } }),
    () => fixtures.classIds.length && prisma.class.deleteMany({ where: { id: { in: fixtures.classIds } } }),
    () => fixtures.subjectIds.length && prisma.subject.deleteMany({ where: { id: { in: fixtures.subjectIds } } }),
  ];
  let cleanupError = null;
  for (const step of cleanupSteps) {
    try { await step(); } catch (error) { cleanupError ??= error; }
  }
  let remaining = null;
  try {
    const [users, students, parents, classes, subjects, attendance, timetable] = await Promise.all([
      fixtures.userIds.length ? prisma.user.count({ where: { id: { in: fixtures.userIds } } }) : 0,
      fixtures.studentIds.length ? prisma.student.count({ where: { id: { in: fixtures.studentIds } } }) : 0,
      fixtures.parentIds.length ? prisma.parent.count({ where: { id: { in: fixtures.parentIds } } }) : 0,
      fixtures.classIds.length ? prisma.class.count({ where: { id: { in: fixtures.classIds } } }) : 0,
      fixtures.subjectIds.length ? prisma.subject.count({ where: { id: { in: fixtures.subjectIds } } }) : 0,
      fixtures.studentIds.length ? prisma.attendance.count({ where: { studentId: { in: fixtures.studentIds } } }) : 0,
      fixtures.timetableIds.length ? prisma.timetableEntry.count({ where: { id: { in: fixtures.timetableIds } } }) : 0,
    ]);
    remaining = { users, students, parents, classes, subjects, attendance, timetable };
  } catch (error) { cleanupError ??= error; }
  report('Temporary fixtures cleaned up', !cleanupError && Object.values(remaining ?? {}).every((count) => count === 0), {
    status: 'N/A', data: cleanupError ? { message: cleanupError.message } : remaining, url: 'N/A',
  });
}

async function main() {
  try {
    const admin = await createUser('ADMIN', 'parents-me-admin');
    const classA = await prisma.class.create({ data: { name: `Parent Me A ${tag}`, level: `PMA-${tag}` }, select: { id: true } });
    fixtures.classIds.push(classA.id);
    const classB = await prisma.class.create({ data: { name: `Parent Me B ${tag}`, level: `PMB-${tag}` }, select: { id: true } });
    fixtures.classIds.push(classB.id);
    const subject = await prisma.subject.create({ data: { name: `Parent Me Subject ${tag}`, code: `PM${tag}` }, select: { id: true } });
    fixtures.subjectIds.push(subject.id);
    const teacher = await createUser('TEACHER', 'parents-me-teacher', `Verify Teacher ${tag}`);
    const teacherProfile = await prisma.teacher.create({ data: { userId: teacher.id }, select: { id: true } });
    const studentA1 = await createStudent('A1', classA.id);
    const studentA2 = await createStudent('A2', classA.id);
    const studentB = await createStudent('B1', classB.id);

    const parentAUser = await createUser('PARENT', 'parents-me-a', `Verify Parent A ${tag}`);
    const parentA = await prisma.parent.create({ data: { userId: parentAUser.id }, select: { id: true } });
    fixtures.parentIds.push(parentA.id);
    const parentBUser = await createUser('PARENT', 'parents-me-b', `Verify Parent B ${tag}`);
    const parentB = await prisma.parent.create({ data: { userId: parentBUser.id }, select: { id: true } });
    fixtures.parentIds.push(parentB.id);
    await prisma.parentStudent.createMany({ data: [
      { parentId: parentA.id, studentId: studentA1 },
      { parentId: parentA.id, studentId: studentA2 },
      { parentId: parentB.id, studentId: studentB },
    ] });
    const orphanParentUser = await createUser('PARENT', 'parents-me-no-profile', `Verify Parent Orphan ${tag}`);

    await prisma.classSubject.create({ data: { classId: classA.id, subjectId: subject.id, teacherId: teacherProfile.id } });
    const todayWeekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos', weekday: 'long' })
      .format(new Date()).toUpperCase();
    const timetable = await prisma.timetableEntry.create({ data: {
      classId: classA.id, subjectId: subject.id, teacherId: teacherProfile.id,
      dayOfWeek: todayWeekday, startTime: '08:00', endTime: '09:00', room: `Room ${tag}`,
    }, select: { id: true } });
    fixtures.timetableIds.push(timetable.id);

    const attendanceRows = [
      { studentId: studentA1, classId: classA.id, date: new Date(`${dateKey(0)}T00:00:00.000Z`), status: 'PRESENT' },
      { studentId: studentA1, classId: classA.id, date: new Date(`${dateKey(1)}T00:00:00.000Z`), status: 'LATE' },
      { studentId: studentA1, classId: classA.id, date: new Date(`${dateKey(2)}T00:00:00.000Z`), status: 'ABSENT' },
      { studentId: studentA2, classId: classA.id, date: new Date(`${dateKey(0)}T00:00:00.000Z`), status: 'EXCUSED' },
      { studentId: studentB, classId: classB.id, date: new Date(`${dateKey(0)}T00:00:00.000Z`), status: 'PRESENT' },
    ].map((row) => ({ ...row, markedById: admin.id }));
    const savedAttendance = await prisma.attendance.createMany({ data: attendanceRows });
    void savedAttendance;
    fixtures.attendanceIds = (await prisma.attendance.findMany({
      where: { studentId: { in: [studentA1, studentA2, studentB] } }, select: { id: true },
    })).map(({ id }) => id);

    const parentAToken = createAccessToken(parentAUser);
    const parentBToken = createAccessToken(parentBUser);
    const studentToken = createAccessToken(await prisma.user.findUnique({ where: { id: (await prisma.student.findUnique({ where: { id: studentA1 }, select: { userId: true } })).userId } }));
    const teacherToken = createAccessToken(teacher);
    const orphanToken = createAccessToken(orphanParentUser);

    const parentAResponse = await request('/api/parents/me', { token: parentAToken });
    const aChildren = parentAResponse.data?.children ?? [];
    const aOne = aChildren.find(({ id }) => id === studentA1);
    const aTwo = aChildren.find(({ id }) => id === studentA2);
    report('Parent A sees exactly their two linked children', parentAResponse.status === 200 && aChildren.length === 2 && Boolean(aOne && aTwo) && !aChildren.some(({ id }) => id === studentB), parentAResponse);
    report('Attendance counts and rate are correct', aOne?.attendance?.present === 1 && aOne.attendance.late === 1 && aOne.attendance.absent === 1 && aOne.attendance.excused === 0 && aOne.attendance.total === 3 && aOne.attendance.ratePercent === 67 && aOne.attendance.recent.length === 3 && aTwo?.attendance?.excused === 1 && aTwo.attendance.ratePercent === 0, parentAResponse);
    report('Today timetable is returned only for the matching class', aOne?.todayTimetable?.length === 1 && aOne.todayTimetable[0].subject === `Parent Me Subject ${tag}` && aOne.todayTimetable[0].teacherName === `Verify Teacher ${tag}` && aOne.todayTimetable[0].room === `Room ${tag}` && aTwo?.todayTimetable?.length === 1, parentAResponse);
    report('Response contains only the requested child and attendance fields', parentAResponse.status === 200 && Object.keys(aOne ?? {}).sort().join(',') === 'admissionNumber,attendance,class,firstName,fullName,id,lastName,status,todayTimetable' && Object.keys(aOne?.todayTimetable?.[0] ?? {}).sort().join(',') === 'endTime,room,startTime,subject,teacherName', parentAResponse);

    const parentBResponse = await request('/api/parents/me', { token: parentBToken });
    report('Parent B sees only their linked child', parentBResponse.status === 200 && parentBResponse.data?.children?.length === 1 && parentBResponse.data.children[0].id === studentB && parentBResponse.data.children[0].todayTimetable.length === 0, parentBResponse);
    const studentDenied = await request('/api/parents/me', { token: studentToken });
    report('Student token is forbidden', studentDenied.status === 403, studentDenied);
    const teacherDenied = await request('/api/parents/me', { token: teacherToken });
    report('Teacher token is forbidden', teacherDenied.status === 403, teacherDenied);
    const unauthenticated = await request('/api/parents/me');
    report('Missing token is unauthorized', unauthenticated.status === 401, unauthenticated);
    const missingProfile = await request('/api/parents/me', { token: orphanToken });
    report('Parent user without profile receives 404', missingProfile.status === 404 && missingProfile.data?.error?.code === 'PARENT_NOT_FOUND', missingProfile);
  } catch (error) {
    report('Fixture setup and parent endpoint verification', false, { status: 'N/A', data: { message: error.message }, url: `${baseUrl}/api/parents/me` });
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
  if (failures) process.exitCode = 1;
}

await main();
