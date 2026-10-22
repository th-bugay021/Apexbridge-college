import { z } from 'zod';

const id = z.string().trim().min(1).max(64);
const empty = z.object({});
const emptyBody = z.unknown().optional();
const classFields = {
  name: z.string().trim().min(1).max(100),
  level: z.string().trim().max(50).nullable().optional(),
};
const classChanges = z.object({
  name: classFields.name.optional(),
  level: classFields.level,
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one class field is required',
});

export const classListSchema = z.object({
  body: emptyBody,
  params: empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).default(''),
  }).strict(),
});

export const classIdSchema = z.object({ body: emptyBody, params: z.object({ id }) });
export const createClassSchema = z.object({
  body: z.object({ name: classFields.name, level: classFields.level }).strict(),
  params: empty,
});
export const updateClassSchema = z.object({ body: classChanges, params: z.object({ id }) });
export const assignSubjectSchema = z.object({
  body: z.object({ subjectId: id, teacherId: id }).strict(),
  params: z.object({ id }),
});
export const unassignSubjectSchema = z.object({
  body: emptyBody,
  params: z.object({ id, subjectId: id }),
});
