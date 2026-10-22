import { prisma } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';

const teacherInclude = { user: { select: { id: true, fullName: true, email: true, phone: true, role: true, status: true, createdAt: true, updatedAt: true } } };
const asTeacherProfile = ({ user, ...teacher }) => ({ ...teacher, userId: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status, userCreatedAt: user.createdAt, userUpdatedAt: user.updatedAt });
const missingTeacher = () => new HttpError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');

export async function listTeachers({ page, limit, search }) {
  const where = { user: { role: 'TEACHER', ...(search ? { OR: [
    { fullName: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ] } : {}) } };
  const [rows, total] = await prisma.$transaction([
    prisma.teacher.findMany({ where, include: teacherInclude, orderBy: { user: { fullName: 'asc' } }, skip: (page - 1) * limit, take: limit }),
    prisma.teacher.count({ where }),
  ]);
  return { teachers: rows.map(asTeacherProfile), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

const dateOnlyToUtc = (value) => new Date(`${value}T00:00:00.000Z`);

function lagosToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function resolveOverviewRange({ from, to }) {
  if (from && to) return { from: dateOnlyToUtc(from), to: dateOnlyToUtc(to) };
  const end = lagosToday();
  const endDate = dateOnlyToUtc(end);
  endDate.setUTCDate(endDate.getUTCDate() - 29);
  return { from: endDate, to: dateOnlyToUtc(end) };
}

const timeMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const sumScheduledMinutes = (entries) => entries.reduce((sum, entry) => sum + timeMinutes(entry.endTime) - timeMinutes(entry.startTime), 0);

async function getOverviewAttendance(userIds, range) {
  const marks = await prisma.attendance.findMany({
    where: { markedById: { in: userIds }, date: { gte: range.from, lte: range.to } },
    select: { markedById: true, classId: true, date: true },
  });
  const byUser = new Map(userIds.map((id) => [id, { recordsEntered: 0, datesByClass: new Map() }]));
  for (const mark of marks) {
    const metrics = byUser.get(mark.markedById);
    if (!metrics) continue;
    metrics.recordsEntered += 1;
    if (!metrics.datesByClass.has(mark.classId)) metrics.datesByClass.set(mark.classId, new Set());
    metrics.datesByClass.get(mark.classId).add(mark.date.toISOString().slice(0, 10));
  }
  return byUser;
}

export async function listTeacherOverviews({ page, limit, search, from, to }) {
  const where = {
    user: {
      role: 'TEACHER',
      status: 'ACTIVE',
      ...(search ? { OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ] } : {}),
    },
  };
  const [teachers, total] = await prisma.$transaction([
    prisma.teacher.findMany({
      where,
      select: { id: true, employeeNumber: true, userId: true, user: { select: { fullName: true } } },
      orderBy: { user: { fullName: 'asc' } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.teacher.count({ where }),
  ]);
  const teacherIds = teachers.map(({ id }) => id);
  const userIds = teachers.map(({ userId }) => userId);
  if (!teachers.length) return { teachers: [], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };

  const range = resolveOverviewRange({ from, to });
  const [assignments, schedule, attendanceByUser] = await Promise.all([
    prisma.classSubject.findMany({ where: { teacherId: { in: teacherIds } }, select: { teacherId: true, classId: true, subjectId: true } }),
    prisma.timetableEntry.findMany({ where: { teacherId: { in: teacherIds } }, select: { teacherId: true, startTime: true, endTime: true } }),
    getOverviewAttendance(userIds, range),
  ]);
  const assignmentsByTeacher = new Map(teacherIds.map((id) => [id, { classes: new Set(), subjects: new Set() }]));
  for (const row of assignments) {
    const item = assignmentsByTeacher.get(row.teacherId);
    item.classes.add(row.classId);
    item.subjects.add(row.subjectId);
  }
  const scheduleByTeacher = new Map(teacherIds.map((id) => [id, []]));
  for (const entry of schedule) scheduleByTeacher.get(entry.teacherId).push(entry);
  return {
    teachers: teachers.map((teacher) => {
      const assigned = assignmentsByTeacher.get(teacher.id);
      const attendance = attendanceByUser.get(teacher.userId);
      return {
        teacherId: teacher.id,
        fullName: teacher.user.fullName,
        employeeNumber: teacher.employeeNumber,
        classCount: assigned.classes.size,
        subjectCount: assigned.subjects.size,
        weeklyScheduledMinutes: sumScheduledMinutes(scheduleByTeacher.get(teacher.id)),
        attendanceDaysMarked: [...attendance.datesByClass.values()].reduce((count, dates) => count + dates.size, 0),
        attendanceRecordsEntered: attendance.recordsEntered,
      };
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTeacherOverview(id, query, actor) {
  const teacher = await prisma.teacher.findFirst({
    where: { id, user: { role: 'TEACHER' } },
    select: { id: true, userId: true, employeeNumber: true, user: { select: { fullName: true } } },
  });
  if (!teacher) throw missingTeacher();
  if (actor.role === 'TEACHER' && teacher.userId !== actor.id) {
    throw new HttpError(403, 'OWN_TEACHER_OVERVIEW_ONLY', 'Teachers may view only their own overview');
  }

  const range = resolveOverviewRange(query);
  const [assignments, weeklySchedule, attendanceRows] = await Promise.all([
    prisma.classSubject.findMany({
      where: { teacherId: teacher.id },
      select: {
        classId: true,
        subjectId: true,
        class: { select: { id: true, name: true, level: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' } }],
    }),
    prisma.timetableEntry.findMany({
      where: { teacherId: teacher.id },
      select: {
        id: true, classId: true, subjectId: true, teacherId: true, dayOfWeek: true,
        startTime: true, endTime: true, room: true,
        classSubject: { select: { class: { select: { id: true, name: true, level: true } }, subject: { select: { id: true, name: true, code: true } } } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.attendance.findMany({
      where: { markedById: teacher.userId, date: { gte: range.from, lte: range.to } },
      select: { classId: true, date: true, class: { select: { name: true } } },
    }),
  ]);

  const classesById = new Map();
  for (const assignment of assignments) {
    if (!classesById.has(assignment.classId)) {
      classesById.set(assignment.classId, { classId: assignment.class.id, name: assignment.class.name, level: assignment.class.level, subjects: [] });
    }
    classesById.get(assignment.classId).subjects.push({
      subjectId: assignment.subject.id, name: assignment.subject.name, code: assignment.subject.code,
    });
  }
  const datesByClass = new Map();
  for (const row of attendanceRows) {
    if (!datesByClass.has(row.classId)) datesByClass.set(row.classId, { name: row.class.name, dates: new Set() });
    datesByClass.get(row.classId).dates.add(row.date.toISOString().slice(0, 10));
  }
  return {
    teacher: { teacherId: teacher.id, fullName: teacher.user.fullName, employeeNumber: teacher.employeeNumber },
    classes: [...classesById.values()],
    weeklySchedule: weeklySchedule.map(({ classSubject, ...entry }) => ({
      ...entry,
      class: classSubject.class,
      subject: classSubject.subject,
    })),
    weeklyScheduledMinutes: sumScheduledMinutes(weeklySchedule),
    attendance: {
      daysMarked: [...datesByClass.values()].reduce((sum, item) => sum + item.dates.size, 0),
      recordsEntered: attendanceRows.length,
      byClass: [...datesByClass.entries()].map(([classId, item]) => ({ classId, name: item.name, daysMarked: item.dates.size })),
    },
  };
}

export async function getTeacher(id) {
  const teacher = await prisma.teacher.findFirst({ where: { id, user: { role: 'TEACHER' } }, include: teacherInclude });
  if (!teacher) throw missingTeacher();
  return asTeacherProfile(teacher);
}

export async function getOwnTeacher(userId) {
  const teacher = await prisma.teacher.findFirst({ where: { userId, user: { role: 'TEACHER' } }, include: teacherInclude });
  if (!teacher) throw missingTeacher();
  return asTeacherProfile(teacher);
}

async function updateProfile(where, changes) {
  const teacher = await prisma.teacher.findFirst({ where, select: { id: true, userId: true, user: { select: { role: true } } } });
  if (!teacher || teacher.user.role !== 'TEACHER') throw missingTeacher();
  const userData = Object.fromEntries(['fullName', 'email', 'phone'].filter((field) => field in changes).map((field) => [field, changes[field]]));
  const teacherData = Object.fromEntries(['employeeNumber', 'address'].filter((field) => field in changes).map((field) => [field, changes[field]]));
  await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length) await tx.user.update({ where: { id: teacher.userId }, data: userData });
    if (Object.keys(teacherData).length) await tx.teacher.update({ where: { id: teacher.id }, data: teacherData });
  });
  return getTeacher(teacher.id);
}

export const updateTeacher = (id, changes) => updateProfile({ id }, changes);
export const updateOwnTeacher = (userId, changes) => updateProfile({ userId }, changes);

export async function setTeacherStatus(id, status) {
  const teacher = await prisma.teacher.findFirst({ where: { id, user: { role: 'TEACHER' } }, select: { id: true, userId: true } });
  if (!teacher) throw missingTeacher();
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: teacher.userId }, data: status === 'SUSPENDED' ? { status, tokenVersion: { increment: 1 } } : { status } });
    if (status === 'SUSPENDED') await tx.refreshToken.updateMany({ where: { userId: teacher.userId, revokedAt: null }, data: { revokedAt: new Date() } });
  });
  return getTeacher(teacher.id);
}
