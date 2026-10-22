import { prisma } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';

const attendanceStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
const classNotFound = () => new HttpError(404, 'CLASS_NOT_FOUND', 'Class not found');
const studentNotFound = () => new HttpError(404, 'STUDENT_NOT_FOUND', 'Student not found');
const attendanceSelect = {
  id: true,
  classId: true,
  studentId: true,
  date: true,
  status: true,
  markedById: true,
  createdAt: true,
  updatedAt: true,
  student: { select: { id: true, admissionNumber: true, user: { select: { fullName: true, status: true } } } },
  markedBy: { select: { id: true, fullName: true } },
};

const toDate = (value) => new Date(`${value}T00:00:00.000Z`);
const dateString = (value) => value.toISOString().slice(0, 10);
const lagosToday = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

function makeDateFilter(from, to) {
  if (!from && !to) return {};
  return { date: { ...(from ? { gte: toDate(from) } : {}), ...(to ? { lte: toDate(to) } : {}) } };
}

function formatAttendance(row) {
  return {
    id: row.id,
    classId: row.classId,
    studentId: row.studentId,
    date: dateString(row.date),
    status: row.status,
    markedById: row.markedById,
    markedBy: row.markedBy,
    student: {
      id: row.student.id,
      fullName: row.student.user.fullName,
      admissionNumber: row.student.admissionNumber,
      status: row.student.user.status,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function requireClass(classId) {
  const item = await prisma.class.findUnique({ where: { id: classId }, select: { id: true, name: true, level: true } });
  if (!item) throw classNotFound();
  return item;
}

async function requireTeacherAssignment(classId, actor) {
  if (actor.role !== 'TEACHER') return;
  const assignment = await prisma.classSubject.findFirst({
    where: { classId, teacher: { userId: actor.id } },
    select: { classId: true },
  });
  if (!assignment) throw new HttpError(403, 'CLASS_ACCESS_DENIED', 'You are not assigned to this class');
}

async function requireClassAccess(classId, actor) {
  await requireClass(classId);
  await requireTeacherAssignment(classId, actor);
}

export async function markAttendance({ classId, date, records }, actor) {
  await requireClassAccess(classId, actor);
  if (date > lagosToday()) {
    throw new HttpError(400, 'FUTURE_ATTENDANCE_DATE', 'Attendance cannot be marked for a future date');
  }

  const studentIds = records.map((record) => record.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, classId: true, user: { select: { status: true } } },
  });
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const wrongClassStudent = studentIds.find((studentId) => studentsById.get(studentId)?.classId !== classId);
  if (wrongClassStudent) {
    throw new HttpError(400, 'STUDENT_NOT_IN_CLASS', 'Every student must belong to the selected class');
  }
  const inactiveStudent = studentIds.find((studentId) => studentsById.get(studentId)?.user.status !== 'ACTIVE');
  if (inactiveStudent) {
    throw new HttpError(409, 'STUDENT_INACTIVE', 'Only active students can be marked for attendance');
  }

  const attendanceDate = toDate(date);
  const saved = await prisma.$transaction((tx) => Promise.all(records.map(({ studentId, status }) => tx.attendance.upsert({
    where: { studentId_date: { studentId, date: attendanceDate } },
    create: { studentId, classId, date: attendanceDate, status, markedById: actor.id },
    update: { classId, status, markedById: actor.id },
    select: attendanceSelect,
  }))));
  return { classId, date, attendance: saved.map(formatAttendance) };
}

export async function getDailyAttendance({ classId, date }, actor) {
  await requireClassAccess(classId, actor);
  const rows = await prisma.attendance.findMany({
    where: { classId, date: toDate(date) },
    orderBy: { student: { user: { fullName: 'asc' } } },
    select: attendanceSelect,
  });
  return { classId, date, attendance: rows.map(formatAttendance) };
}

async function buildClassCounts({ classId, from, to }, actor) {
  const classItem = await requireClass(classId);
  await requireTeacherAssignment(classId, actor);
  const [students, rows] = await Promise.all([
    prisma.student.findMany({
      where: { classId },
      orderBy: { user: { fullName: 'asc' } },
      select: { id: true, admissionNumber: true, user: { select: { fullName: true, status: true } } },
    }),
    prisma.attendance.findMany({
      where: { classId, ...makeDateFilter(from, to) },
      select: { studentId: true, status: true },
    }),
  ]);
  const countsByStudent = new Map(students.map((student) => [student.id, Object.fromEntries(attendanceStatuses.map((status) => [status, 0]))]));
  for (const row of rows) {
    const counts = countsByStudent.get(row.studentId);
    if (counts) counts[row.status] += 1;
  }
  const studentRows = students.map((student) => {
    const counts = countsByStudent.get(student.id);
    return {
      studentId: student.id,
      fullName: student.user.fullName,
      admissionNumber: student.admissionNumber,
      status: student.user.status,
      counts,
      totalMarkedDays: Object.values(counts).reduce((total, count) => total + count, 0),
    };
  });
  return { classItem, studentRows };
}

export async function getAttendanceSummary(query, actor) {
  const { classItem, studentRows } = await buildClassCounts(query, actor);
  return {
    classId: classItem.id,
    className: classItem.name,
    from: query.from,
    to: query.to,
    students: studentRows,
  };
}

export async function getAttendanceReport(query, actor) {
  const { classItem, studentRows } = await buildClassCounts(query, actor);
  const totalCounts = Object.fromEntries(attendanceStatuses.map((status) => [status, 0]));
  for (const student of studentRows) {
    for (const status of attendanceStatuses) totalCounts[status] += student.counts[status];
  }
  const totalMarkedDays = Object.values(totalCounts).reduce((total, count) => total + count, 0);
  const students = studentRows.map((student) => ({
    ...student,
    attendancePercentage: student.totalMarkedDays === 0
      ? 0
      : Math.round(((student.counts.PRESENT + student.counts.LATE) / student.totalMarkedDays) * 1000) / 10,
  }));
  return {
    classId: classItem.id,
    className: classItem.name,
    from: query.from,
    to: query.to,
    totals: {
      counts: totalCounts,
      totalMarkedDays,
      attendancePercentage: totalMarkedDays === 0
        ? 0
        : Math.round(((totalCounts.PRESENT + totalCounts.LATE) / totalMarkedDays) * 1000) / 10,
    },
    students,
  };
}

export async function getStudentAttendance(studentId, query, actor) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, userId: true, classId: true, admissionNumber: true, user: { select: { fullName: true, status: true } } },
  });
  if (!student) throw studentNotFound();
  let classIds;
  if (actor.role === 'STUDENT') {
    if (student.userId !== actor.id) throw new HttpError(403, 'OWN_HISTORY_ONLY', 'Students may view only their own attendance history');
  } else if (actor.role === 'TEACHER') {
    const assignments = await prisma.classSubject.findMany({
      where: { teacher: { userId: actor.id } },
      select: { classId: true },
    });
    classIds = [...new Set(assignments.map(({ classId }) => classId))];
    if (!student.classId || !classIds.includes(student.classId)) throw studentNotFound();
  }

  const rows = await prisma.attendance.findMany({
    where: {
      studentId,
      ...(classIds ? { classId: { in: classIds } } : {}),
      ...makeDateFilter(query.from, query.to),
    },
    orderBy: { date: 'desc' },
    select: { ...attendanceSelect, class: { select: { id: true, name: true, level: true } } },
  });
  return {
    student: { id: student.id, fullName: student.user.fullName, admissionNumber: student.admissionNumber },
    history: rows.map((row) => ({ ...formatAttendance(row), class: row.class })),
  };
}
