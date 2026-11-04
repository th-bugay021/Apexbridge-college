import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';

const studentInclude = {
  user: { select: { id: true, fullName: true, email: true, phone: true, role: true, status: true, createdAt: true, updatedAt: true } },
  class: { select: { id: true, name: true, level: true } },
};
const missingStudent = () => new HttpError(404, 'STUDENT_NOT_FOUND', 'Student not found');
const classNotFound = () => new HttpError(400, 'CLASS_NOT_FOUND', 'The specified class does not exist');
const dateValue = (value) => value == null ? value : new Date(`${value}T00:00:00.000Z`);
const toStudentData = (input) => Object.fromEntries(
  ['admissionNumber', 'firstName', 'lastName', 'gender', 'photoUrl', 'department', 'status', 'address']
    .filter((field) => field in input).map((field) => [field, input[field]]),
);
const toDateData = (input) => Object.fromEntries(
  ['admissionDate', 'dateOfBirth'].filter((field) => field in input).map((field) => [field, dateValue(input[field])]),
);

function mapUniqueError(error) {
  if (error.code !== 'P2002') throw error;
  const target = error.meta?.target;
  const field = Array.isArray(target) ? target.join(' ') : String(target ?? '');
  if (field.includes('email')) throw new HttpError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  if (field.includes('admissionNumber')) throw new HttpError(409, 'ADMISSION_NUMBER_EXISTS', 'A student with this admission number already exists');
  throw new HttpError(409, 'STUDENT_CONFLICT', 'A student with one of these unique values already exists');
}

async function ensureClassExists(classId, tx = prisma) {
  if (classId && !await tx.class.findUnique({ where: { id: classId }, select: { id: true } })) throw classNotFound();
}

export async function listStudents({ page, limit, search, classId, status, gender, department }) {
  const where = {
    ...(classId ? { classId } : {}),
    ...(status ? { status } : {}),
    ...(gender ? { gender } : {}),
    ...(department ? { department: { contains: department, mode: 'insensitive' } } : {}),
    ...(search ? { OR: [
      { admissionNumber: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ] } : {}),
  };
  const [students, total] = await prisma.$transaction([
    prisma.student.findMany({ where, include: studentInclude, orderBy: { user: { fullName: 'asc' } }, skip: (page - 1) * limit, take: limit }),
    prisma.student.count({ where }),
  ]);
  return { students, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getStudent(id) {
  const student = await prisma.student.findUnique({ where: { id }, include: studentInclude });
  if (!student) throw missingStudent();
  return student;
}

export async function createStudent(input) {
  await ensureClassExists(input.classId);
  const admissionNumber = input.admissionNumber ?? `STU-${randomUUID().slice(0, 8).toUpperCase()}`;
  const passwordHash = await bcrypt.hash(input.password, 12);
  const { email, phone, password: _password, firstName, lastName, ...profile } = input;
  void _password;
  try {
    const student = await prisma.$transaction(async (tx) => tx.student.create({
      data: {
        ...toStudentData({ ...profile, admissionNumber, firstName, lastName }),
        ...toDateData(profile),
        ...(input.classId == null ? {} : { class: { connect: { id: input.classId } } }),
        user: { create: { email, phone, fullName: `${firstName} ${lastName}`, passwordHash, role: 'STUDENT' } },
      },
      include: studentInclude,
    }));
    return student;
  } catch (error) { mapUniqueError(error); }
}

export async function updateStudent(id, input) {
  const current = await prisma.student.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!current) throw missingStudent();
  await ensureClassExists(input.classId);
  const userData = Object.fromEntries(['email', 'phone'].filter((field) => field in input).map((field) => [field, input[field]]));
  if ('firstName' in input || 'lastName' in input) {
    const user = await prisma.user.findUnique({ where: { id: current.userId }, select: { fullName: true } });
    const [existingFirst = '', ...existingLast] = user.fullName.split(' ');
    userData.fullName = `${input.firstName ?? existingFirst} ${input.lastName ?? existingLast.join(' ')}`.trim();
  }
  const studentData = {
    ...toStudentData(input),
    ...toDateData(input),
    ...('classId' in input ? { class: input.classId == null ? { disconnect: true } : { connect: { id: input.classId } } } : {}),
  };
  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length) await tx.user.update({ where: { id: current.userId }, data: userData });
      if (Object.keys(studentData).length) await tx.student.update({ where: { id }, data: studentData });
    });
    return getStudent(id);
  } catch (error) { mapUniqueError(error); }
}

async function findBlockedStudents(ids, tx) {
  const [results, invoices, payments, attendance] = await Promise.all([
    tx.result.findMany({ where: { studentId: { in: ids } }, select: { studentId: true }, distinct: ['studentId'] }),
    tx.invoice.findMany({ where: { studentId: { in: ids } }, select: { studentId: true }, distinct: ['studentId'] }),
    tx.payment.findMany({ where: { studentId: { in: ids } }, select: { studentId: true }, distinct: ['studentId'] }),
    tx.attendance.findMany({ where: { studentId: { in: ids } }, select: { studentId: true }, distinct: ['studentId'] }),
  ]);
  return new Set([...results, ...invoices, ...payments, ...attendance].map(({ studentId }) => studentId));
}

export async function deleteStudents(ids) {
  return prisma.$transaction(async (tx) => {
    const students = await tx.student.findMany({ where: { id: { in: ids } }, select: { id: true, userId: true, user: { select: { role: true } } } });
    if (students.length !== ids.length) throw missingStudent();
    const blocked = await findBlockedStudents(ids, tx);
    if (blocked.size) throw new HttpError(409, 'STUDENT_HAS_LINKED_RECORDS', 'One or more students have linked attendance, results, invoices, or payments. Set their status to INACTIVE instead.');
    if (students.some(({ user }) => user.role !== 'STUDENT')) throw new HttpError(409, 'STUDENT_USER_ROLE_MISMATCH', 'One or more student accounts do not have the STUDENT role.');
    await tx.user.deleteMany({ where: { id: { in: students.map(({ userId }) => userId) }, role: 'STUDENT' } });
    return { deleted: students.length };
  });
}
