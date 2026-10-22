import { prisma } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';

const notFound = () => new HttpError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
const duplicate = () => new HttpError(409, 'SUBJECT_CONFLICT', 'A subject with this name or code already exists');
const teacherScope = (userId) => ({ classes: { some: { teacher: { userId } } } });

export async function listSubjects({ page, limit, search }, actor) {
  const where = {
    ...(actor.role === 'TEACHER' ? teacherScope(actor.id) : {}),
    ...(search ? { OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ] } : {}),
  };
  const [subjects, total] = await prisma.$transaction([
    prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, name: true, code: true, createdAt: true, updatedAt: true },
    }),
    prisma.subject.count({ where }),
  ]);
  return { subjects, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getSubject(id, actor) {
  const subject = await prisma.subject.findUnique({
    where: { id },
    select: { id: true, name: true, code: true, createdAt: true, updatedAt: true },
  });
  if (!subject) throw notFound();
  if (actor.role === 'TEACHER') {
    const assignment = await prisma.classSubject.findFirst({
      where: { subjectId: id, teacher: { userId: actor.id } },
      select: { subjectId: true },
    });
    if (!assignment) throw notFound();
  }
  return subject;
}

export async function createSubject(input) {
  try {
    return await prisma.subject.create({
      data: input,
      select: { id: true, name: true, code: true, createdAt: true, updatedAt: true },
    });
  } catch (error) {
    if (error.code === 'P2002') throw duplicate();
    throw error;
  }
}

export async function updateSubject(id, changes) {
  if (!(await prisma.subject.findUnique({ where: { id }, select: { id: true } }))) throw notFound();
  try {
    return await prisma.subject.update({
      where: { id },
      data: changes,
      select: { id: true, name: true, code: true, createdAt: true, updatedAt: true },
    });
  } catch (error) {
    if (error.code === 'P2002') throw duplicate();
    throw error;
  }
}

export async function deleteSubject(id) {
  const subject = await prisma.subject.findUnique({
    where: { id },
    select: { id: true, _count: { select: { classes: true, results: true } } },
  });
  if (!subject) throw notFound();
  if (subject._count.classes || subject._count.results) {
    throw new HttpError(409, 'SUBJECT_IN_USE', 'Subject has class assignments or results and cannot be deleted');
  }
  await prisma.subject.delete({ where: { id } });
}
