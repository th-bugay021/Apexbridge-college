import { prisma } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';

const entryInclude = {
  classSubject: {
    include: {
      class: { select: { id: true, name: true, level: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  },
  teacher: {
    select: {
      id: true,
      employeeNumber: true,
      user: { select: { fullName: true, email: true, status: true } },
    },
  },
};

const forbidden = (message = 'You do not have permission to view this timetable') => new HttpError(403, 'FORBIDDEN', message);
const entryNotFound = () => new HttpError(404, 'TIMETABLE_ENTRY_NOT_FOUND', 'Timetable entry not found');

function formatEntry(entry) {
  const teacher = entry.teacher;
  return {
    id: entry.id,
    classId: entry.classId,
    subjectId: entry.subjectId,
    teacherId: entry.teacherId,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    room: entry.room,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    class: entry.classSubject.class,
    subject: entry.classSubject.subject,
    teacher: {
      id: teacher.id,
      employeeNumber: teacher.employeeNumber,
      fullName: teacher.user.fullName,
      email: teacher.user.email,
      status: teacher.user.status,
    },
  };
}

async function serializable(work) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(work, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error.code !== 'P2034') throw error;
      if (attempt === 2) {
        throw new HttpError(409, 'SCHEDULE_CONCURRENT_CONFLICT', 'The timetable changed concurrently. Retry the request.');
      }
    }
  }
  throw new HttpError(409, 'SCHEDULE_CONCURRENT_CONFLICT', 'The timetable changed concurrently. Retry the request.');
}

async function findAssignment(tx, classId, subjectId) {
  const assignment = await tx.classSubject.findUnique({
    where: { classId_subjectId: { classId, subjectId } },
    include: { teacher: { include: { user: { select: { fullName: true, email: true, status: true } } } } },
  });
  if (!assignment) {
    throw new HttpError(409, 'CLASS_SUBJECT_NOT_ASSIGNED', 'The selected subject is not assigned to this class.');
  }
  if (assignment.teacher.user.status !== 'ACTIVE') {
    throw new HttpError(409, 'TEACHER_INACTIVE', 'The assigned teacher is deactivated and cannot be scheduled.');
  }
  return assignment;
}

async function checkOverlaps(tx, { classId, teacherId, dayOfWeek, startTime, endTime }, excludeId) {
  const exclude = excludeId ? { id: { not: excludeId } } : {};
  const classConflict = await tx.timetableEntry.findFirst({
    where: {
      ...exclude,
      classId,
      dayOfWeek,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });
  if (classConflict) {
    throw new HttpError(409, 'CLASS_OVERLAP', 'This class already has a timetable entry with an overlapping time on this day.');
  }

  const teacherConflict = await tx.timetableEntry.findFirst({
    where: {
      ...exclude,
      teacherId,
      dayOfWeek,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });
  if (teacherConflict) {
    throw new HttpError(409, 'TEACHER_OVERLAP', 'This teacher already has a timetable entry with an overlapping time on this day.');
  }
}

export async function createEntry(input) {
  if (input.endTime <= input.startTime) {
    throw new HttpError(400, 'INVALID_TIME_RANGE', 'endTime must be later than startTime.');
  }
  return serializable(async (tx) => {
    const assignment = await findAssignment(tx, input.classId, input.subjectId);
    const data = {
      classId: input.classId,
      subjectId: input.subjectId,
      teacherId: assignment.teacherId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      room: input.room ?? null,
    };
    await checkOverlaps(tx, data);
    const entry = await tx.timetableEntry.create({ data, include: entryInclude });
    return formatEntry(entry);
  });
}

export async function updateEntry(id, changes) {
  return serializable(async (tx) => {
    const current = await tx.timetableEntry.findUnique({ where: { id }, include: entryInclude });
    if (!current) throw entryNotFound();
    const classId = changes.classId ?? current.classId;
    const subjectId = changes.subjectId ?? current.subjectId;
    const assignment = await findAssignment(tx, classId, subjectId);
    const data = {
      classId,
      subjectId,
      teacherId: assignment.teacherId,
      dayOfWeek: changes.dayOfWeek ?? current.dayOfWeek,
      startTime: changes.startTime ?? current.startTime,
      endTime: changes.endTime ?? current.endTime,
      room: Object.hasOwn(changes, 'room') ? changes.room : current.room,
    };
    if (data.endTime <= data.startTime) {
      throw new HttpError(400, 'INVALID_TIME_RANGE', 'endTime must be later than startTime.');
    }
    await checkOverlaps(tx, data, id);
    const entry = await tx.timetableEntry.update({ where: { id }, data, include: entryInclude });
    return formatEntry(entry);
  });
}

export async function deleteEntry(id) {
  try {
    await prisma.timetableEntry.delete({ where: { id } });
  } catch (error) {
    if (error.code === 'P2025') throw entryNotFound();
    throw error;
  }
}

async function readClassTimetable(classId) {
  const classItem = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true, level: true },
  });
  if (!classItem) throw new HttpError(404, 'CLASS_NOT_FOUND', 'Class not found.');
  const rows = await prisma.timetableEntry.findMany({
    where: { classId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: entryInclude,
  });
  return { class: classItem, entries: rows.map(formatEntry) };
}

export async function getClassTimetable(classId, actor) {
  const classItem = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true, level: true },
  });
  if (!classItem) throw new HttpError(404, 'CLASS_NOT_FOUND', 'Class not found.');

  if (actor.role === 'TEACHER') {
    const assignment = await prisma.classSubject.findFirst({
      where: { classId, teacher: { userId: actor.id } },
      select: { classId: true },
    });
    if (!assignment) throw forbidden('You are not assigned to this class.');
  } else if (actor.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: actor.id },
      select: { classId: true },
    });
    if (!student?.classId || student.classId !== classId) {
      throw forbidden('Students may view only their own class timetable.');
    }
  } else if (!['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) {
    throw forbidden();
  }

  const rows = await prisma.timetableEntry.findMany({
    where: { classId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: entryInclude,
  });
  return { class: classItem, entries: rows.map(formatEntry) };
}

export async function getMyTimetable(actor) {
  if (actor.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: actor.id }, select: { id: true } });
    if (!teacher) throw new HttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found.');
    const rows = await prisma.timetableEntry.findMany({
      where: { teacherId: teacher.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: entryInclude,
    });
    return { entries: rows.map(formatEntry) };
  }

  if (actor.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: actor.id },
      select: { classId: true },
    });
    if (!student) throw new HttpError(404, 'STUDENT_NOT_FOUND', 'Student profile not found.');
    if (!student.classId) return { class: null, entries: [] };
    return readClassTimetable(student.classId);
  }

  throw forbidden('Only teachers and students can view a personal timetable.');
}
