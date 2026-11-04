import { z } from 'zod';

const id = z.string().trim().min(1).max(64);
const emptyBody = z.unknown().optional();
const emptyParams = z.object({});

const profileFields = {
  fullName: z.string().trim().min(1).max(150),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).nullable().optional(),
  occupation: z.string().trim().max(100).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  relationship: z.string().trim().max(100).nullable().optional(),
};

export const parentListSchema = z.object({
  body: emptyBody,
  params: emptyParams,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).default(''),
    studentId: id.optional(),
  }).strict(),
});

export const parentIdSchema = z.object({ body: emptyBody, params: z.object({ id }) });
export const createParentSchema = z.object({
  body: z.object({
    ...profileFields,
    studentIds: z.array(id).refine((ids) => new Set(ids).size === ids.length, 'Student ids must be unique').optional(),
  }).strict(),
  params: emptyParams,
});

const updateFields = Object.fromEntries(Object.entries(profileFields).filter(([field]) => field !== 'password').map(([field, schema]) => [field, schema.optional()]));
export const updateParentSchema = z.object({
  body: z.object(updateFields).strict().refine((value) => Object.keys(value).length > 0, { message: 'At least one parent field is required' }),
  params: z.object({ id }),
});

export const linkStudentSchema = z.object({
  body: z.object({ studentId: id }).strict(),
  params: z.object({ id }),
});
export const unlinkStudentSchema = z.object({
  body: emptyBody,
  params: z.object({ id, studentId: id }),
});
export const bulkDeleteParentsSchema = z.object({
  body: z.object({ ids: z.array(id).min(1).max(100).refine((ids) => new Set(ids).size === ids.length, 'Parent ids must be unique') }).strict(),
  params: emptyParams,
});
