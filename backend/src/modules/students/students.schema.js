import { z } from 'zod';

const id = z.string().trim().min(1).max(64);
const emptyBody = z.unknown().optional();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD').refine((value) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, 'Date must be a real calendar date');

const profileFields = {
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).nullable().optional(),
  admissionNumber: z.string().trim().min(1).max(50).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  photoUrl: z.string().trim().url().max(2048).nullable().optional(),
  department: z.string().trim().max(100).nullable().optional(),
  admissionDate: dateOnly.nullable().optional(),
  dateOfBirth: dateOnly.nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  classId: id.nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED']).optional(),
};
const emptyParams = z.object({});

export const studentListSchema = z.object({
  body: emptyBody,
  params: emptyParams,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).default(''),
    classId: id.optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED']).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    department: z.string().trim().max(100).optional(),
  }).strict(),
});

export const studentIdSchema = z.object({ body: emptyBody, params: z.object({ id }) });
export const createStudentSchema = z.object({
  body: z.object(profileFields).strict(),
  params: emptyParams,
});
const updateFields = Object.fromEntries(Object.entries(profileFields).filter(([field]) => field !== 'password').map(([field, schema]) => [field, schema.optional()]));
export const updateStudentSchema = z.object({
  body: z.object(updateFields).strict().refine((value) => Object.keys(value).length > 0, { message: 'At least one student field is required' }),
  params: z.object({ id }),
});
export const bulkDeleteStudentsSchema = z.object({
  body: z.object({ ids: z.array(id).min(1).max(100).refine((ids) => new Set(ids).size === ids.length, 'Student ids must be unique') }).strict(),
  params: emptyParams,
});
