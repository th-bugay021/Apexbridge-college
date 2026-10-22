import { prisma } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';

const classNotFound = () => new HttpError(404, 'CLASS_NOT_FOUND', 'Class not found');
const subjectNotFound = () => new HttpError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
const duplicateClass = () => new HttpError(409, 'CLASS_CONFLICT', 'A class with this name and level already exists');
const classInclude = {
  students: {
    orderBy: { user: { fullName: 'asc' } },
    select: { id: true, admissionNumber: true, user: { select: { fullName: true, status: true } } },
  },
  subjects: {
    orderBy: { subject: { name: 'asc' } },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, userId: true, employeeNumber: true, user: { select: { fullName: true, email: true, status: true } } } },
    },
  },
};

function formatClassDetails(record, rosterFilter) {
  const students = record.students
    .filter((student) => !rosterFilter || student.id === rosterFilter)
    .map((student) => ({
      id: student.id,
      fullName: student.user.fullName,
      admissionNumber: student.admissionNumber,
      status: student.user.status,
    }));
  const subjects = record.subjects.map((assignment) => ({
    classId: assignment.classId,
    subjectId: assignment.subjectId,
    teacherId: assignment.teacherId,
    assignedAt: assignment.createdAt,
    subject: assignment.subject,
    teacher: {
      id: assignment.teacher.id,
      employeeNumber: assignment.teacher.employeeNumber,
      fullName: assignment.teacher.user.fullName,
      email: assignment.teacher.user.email,
      status: assignment.teacher.user.status,
    },
  }));
  const teachers = [...new Map(subjects.map(({ teacher }) => [teacher.id, teacher])).values()];
  return {
    id: record.id,
    name: record.name,
    level: record.level,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    students,
    teachers,
    subjects,
  };
}

function mapClassConflict(error) {
  if (error.code === 'P2002') throw duplicateClass();
  throw error;
}

export async function listClasses({ page, limit, search }, actor) {
  const where = {
    ...(actor.role === 'TEACHER' ? { subjects: { some: { teacher: { userId: actor.id } } } } : {}),
    ...(search ? { OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { level: { contains: search, mode: 'insensitive' } },
    ] } : {}),
  };
  const [classes, total] = await prisma.$transaction([
    prisma.class.findMany({
      where,
      orderBy: [{ name: 'asc' }, { level: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { students: true, subjects: true } } },
    }),
    prisma.class.count({ where }),
  ]);
  return {
    classes: classes.map(({ _count, ...item }) => ({ ...item, studentCount: _count.students, subjectCount: _count.subjects })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getClass(id, actor) {
  const item = await prisma.class.findUnique({ where: { id }, include: classInclude });
  if (!item) throw classNotFound();
  if (actor.role === 'TEACHER' && !item.subjects.some((assignment) => assignment.teacher.userId === actor.id)) {
    throw classNotFound();
  }
  return formatClassDetails(item);
}

export async function getOwnClasses(actor) {
  if (actor.role === 'TEACHER') {
    const classes = await prisma.class.findMany({
      where: { subjects: { some: { teacher: { userId: actor.id } } } },
      orderBy: [{ name: 'asc' }, { level: 'asc' }],
      include: classInclude,
    });
    return { classes: classes.map((item) => formatClassDetails(item)) };
  }
  if (actor.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: actor.id }, select: { id: true, classId: true } });
    if (!student?.classId) return { classes: [] };
    const item = await prisma.class.findUnique({ where: { id: student.classId }, include: classInclude });
    return { classes: item ? [formatClassDetails(item, student.id)] : [] };
  }
  throw new HttpError(403, 'FORBIDDEN', 'You do not have permission to view an own class list');
}

export async function createClass(input) {
  try {
    return await prisma.class.create({ data: input });
  } catch (error) {
    mapClassConflict(error);
  }
}

export async function updateClass(id, changes) {
  if (!(await prisma.class.findUnique({ where: { id }, select: { id: true } }))) throw classNotFound();
  try {
    return await prisma.class.update({ where: { id }, data: changes });
  } catch (error) {
    mapClassConflict(error);
  }
}

export async function deleteClass(id) {
  const item = await prisma.class.findUnique({
    where: { id },
    select: { id: true, _count: { select: { students: true, subjects: true, attendance: true } } },
  });
  if (!item) throw classNotFound();
  if (item._count.students || item._count.subjects || item._count.attendance) {
    throw new HttpError(409, 'CLASS_IN_USE', 'Class has students, subject assignments, or attendance records and cannot be deleted');
  }
  await prisma.class.delete({ where: { id } });
}

export async function assignSubject(classId, { subjectId, teacherId }) {
  const [classItem, subject, teacher] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId }, select: { id: true } }),
    prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true } }),
    prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true, employeeNumber: true, user: { select: { fullName: true, email: true, role: true, status: true } } } }),
  ]);
  if (!classItem) throw classNotFound();
  if (!subject) throw subjectNotFound();
  if (!teacher || teacher.user.role !== 'TEACHER') throw new HttpError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
  if (teacher.user.status !== 'ACTIVE') throw new HttpError(409, 'TEACHER_INACTIVE', 'Only active teachers can be assigned to a class subject');

  try {
    const assignment = await prisma.classSubject.create({
      data: { classId, subjectId, teacherId },
      include: { subject: { select: { id: true, name: true, code: true } } },
    });
    return {
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      teacherId: assignment.teacherId,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      subject: assignment.subject,
      teacher: {
        id: teacher.id,
        employeeNumber: teacher.employeeNumber,
        fullName: teacher.user.fullName,
        email: teacher.user.email,
        status: teacher.user.status,
      },
    };
  } catch (error) {
    if (error.code === 'P2002') throw new HttpError(409, 'ASSIGNMENT_EXISTS', 'This subject is already assigned to the class');
    throw error;
  }
}

export async function unassignSubject(classId, subjectId) {
  try {
    return await prisma.$transaction(async (tx) => {
      const assignment = await tx.classSubject.findUnique({
        where: { classId_subjectId: { classId, subjectId } },
        select: { classId: true, subjectId: true },
      });
      if (!assignment) throw new HttpError(404, 'ASSIGNMENT_NOT_FOUND', 'Subject assignment not found for this class');
      const timetableCount = await tx.timetableEntry.count({ where: { classId, subjectId } });
      if (timetableCount) {
        throw new HttpError(409, 'TIMETABLE_ENTRIES_EXIST', 'This class subject assignment has timetable entries. Delete those entries before unassigning it.');
      }
      await tx.classSubject.delete({ where: { classId_subjectId: { classId, subjectId } } });
      return { classId, subjectId, removed: true };
    });
  } catch (error) {
    if (error.code === 'P2003') {
      throw new HttpError(409, 'TIMETABLE_ENTRIES_EXIST', 'This class subject assignment has timetable entries. Delete those entries before unassigning it.');
    }
    throw error;
  }
}
