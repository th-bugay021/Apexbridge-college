import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';

const parentInclude = {
  user: { select: { id: true, fullName: true, email: true, phone: true, role: true, status: true, createdAt: true, updatedAt: true } },
  children: {
    orderBy: { student: { admissionNumber: 'asc' } },
    include: { student: { select: {
      id: true, admissionNumber: true, firstName: true, lastName: true,
      class: { select: { id: true, name: true, level: true } },
    } } },
  },
};
const missingParent = () => new HttpError(404, 'PARENT_NOT_FOUND', 'Parent not found');
const missingStudent = () => new HttpError(400, 'STUDENT_NOT_FOUND', 'One or more specified students do not exist');
const duplicateLink = () => new HttpError(409, 'PARENT_STUDENT_LINK_EXISTS', 'This student is already linked to the parent');

function asParent({ user, children, ...parent }) {
  return { ...parent, user, students: children.map(({ student }) => student) };
}

const parentProfileData = (input) => Object.fromEntries(
  ['occupation', 'address', 'relationship'].filter((field) => field in input).map((field) => [field, input[field]]),
);

function mapUniqueError(error) {
  if (error.code !== 'P2002') throw error;
  const target = error.meta?.target;
  const field = Array.isArray(target) ? target.join(' ') : String(target ?? '');
  if (field.includes('email')) throw new HttpError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  if (field.includes('parentId') || field.includes('studentId')) throw duplicateLink();
  throw new HttpError(409, 'PARENT_CONFLICT', 'A parent with one of these unique values already exists');
}

async function ensureStudentsExist(studentIds, tx) {
  if (!studentIds.length) return;
  const students = await tx.student.findMany({ where: { id: { in: studentIds } }, select: { id: true } });
  if (students.length !== studentIds.length) throw missingStudent();
}

async function findParent(id, tx = prisma) {
  const parent = await tx.parent.findFirst({ where: { id, user: { role: 'PARENT' } }, include: parentInclude });
  if (!parent) throw missingParent();
  return parent;
}

export async function listParents({ page, limit, search, studentId }) {
  const where = {
    user: {
      role: 'PARENT',
      ...(search ? { OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ] } : {}),
    },
    ...(studentId ? { children: { some: { studentId } } } : {}),
  };
  const [parents, total] = await prisma.$transaction([
    prisma.parent.findMany({ where, include: parentInclude, orderBy: { user: { fullName: 'asc' } }, skip: (page - 1) * limit, take: limit }),
    prisma.parent.count({ where }),
  ]);
  return { parents: parents.map(asParent), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getParent(id) {
  return asParent(await findParent(id));
}

export async function createParent(input) {
  const studentIds = input.studentIds ?? [];
  const passwordHash = await bcrypt.hash(input.password, 12);
  const { fullName, email, password: _password, phone, studentIds: _studentIds, ...profile } = input;
  void _password;
  void _studentIds;
  try {
    const parent = await prisma.$transaction(async (tx) => {
      await ensureStudentsExist(studentIds, tx);
      return tx.parent.create({
        data: {
          ...parentProfileData(profile),
          user: { create: { fullName, email, phone, passwordHash, role: 'PARENT' } },
          ...(studentIds.length ? { children: { create: studentIds.map((studentId) => ({ student: { connect: { id: studentId } } })) } } : {}),
        },
        include: parentInclude,
      });
    });
    return asParent(parent);
  } catch (error) { mapUniqueError(error); }
}

export async function updateParent(id, input) {
  const current = await prisma.parent.findFirst({
    where: { id, user: { role: 'PARENT' } },
    select: { id: true, userId: true },
  });
  if (!current) throw missingParent();
  const userData = Object.fromEntries(['fullName', 'email', 'phone'].filter((field) => field in input).map((field) => [field, input[field]]));
  const parentData = parentProfileData(input);
  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length) await tx.user.update({ where: { id: current.userId }, data: userData });
      if (Object.keys(parentData).length) await tx.parent.update({ where: { id }, data: parentData });
    });
    return getParent(id);
  } catch (error) { mapUniqueError(error); }
}

export async function linkStudent(parentId, studentId) {
  try {
    await prisma.$transaction(async (tx) => {
      await findParent(parentId, tx);
      await ensureStudentsExist([studentId], tx);
      const existing = await tx.parentStudent.findUnique({ where: { parentId_studentId: { parentId, studentId } }, select: { parentId: true } });
      if (existing) throw duplicateLink();
      await tx.parentStudent.create({ data: {
        parent: { connect: { id: parentId } },
        student: { connect: { id: studentId } },
      } });
    });
    return getParent(parentId);
  } catch (error) { mapUniqueError(error); }
}

export async function unlinkStudent(parentId, studentId) {
  return prisma.$transaction(async (tx) => {
    await findParent(parentId, tx);
    const deleted = await tx.parentStudent.deleteMany({ where: { parentId, studentId } });
    if (!deleted.count) throw new HttpError(404, 'PARENT_STUDENT_LINK_NOT_FOUND', 'The student is not linked to this parent');
  });
}

export async function deleteParents(ids) {
  return prisma.$transaction(async (tx) => {
    const parents = await tx.parent.findMany({ where: { id: { in: ids } }, select: { id: true, userId: true, user: { select: { role: true } } } });
    if (parents.length !== ids.length) throw missingParent();
    if (parents.some(({ user }) => user.role !== 'PARENT')) throw new HttpError(409, 'PARENT_USER_ROLE_MISMATCH', 'One or more parent accounts do not have the PARENT role.');
    const deleted = await tx.user.deleteMany({ where: { id: { in: parents.map(({ userId }) => userId) }, role: 'PARENT' } });
    if (deleted.count !== ids.length) throw new HttpError(409, 'PARENT_DELETE_CONFLICT', 'One or more parent accounts could not be deleted.');
    return { deleted: deleted.count };
  });
}
