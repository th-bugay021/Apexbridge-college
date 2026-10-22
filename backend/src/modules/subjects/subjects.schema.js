import { z } from 'zod';

const id = z.string().trim().min(1).max(64);
const empty = z.object({});
const emptyBody = z.unknown().optional();
const subjectFields = {
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(32),
};
const subjectChanges = z.object({
  name: subjectFields.name.optional(),
  code: subjectFields.code.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one subject field is required',
});

export const subjectListSchema = z.object({
  body: emptyBody,
  params: empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).default(''),
  }).strict(),
});

export const subjectIdSchema = z.object({ body: emptyBody, params: z.object({ id }) });
export const createSubjectSchema = z.object({
  body: z.object(subjectFields).strict(),
  params: empty,
});
export const updateSubjectSchema = z.object({ body: subjectChanges, params: z.object({ id }) });
