import { z } from 'zod';

const id = z.string().trim().min(1).max(64);
const emptyBody = z.unknown().optional();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD').refine((value) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, 'Date must be a real calendar date');

const overviewQueryFields = {
  from: dateOnly.optional(),
  to: dateOnly.optional(),
};

function validOverviewRange({ from, to }) {
  if (!from && !to) return true;
  if (!from || !to || from > to) return false;
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 < 366;
}

const overviewRangeMessage = 'Provide both from and to, with from on or before to and a maximum range of 366 days';

export const teacherListSchema = z.object({
  body: emptyBody,
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).default(''),
  }).strict(),
});

export const teacherOverviewListSchema = z.object({
  body: emptyBody,
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).default(''),
    ...overviewQueryFields,
  }).strict().refine(validOverviewRange, overviewRangeMessage),
});

export const teacherOverviewSchema = z.object({
  body: emptyBody,
  params: z.object({ id }),
  query: z.object(overviewQueryFields).strict().refine(validOverviewRange, overviewRangeMessage),
});

export const teacherIdSchema = z.object({ body: emptyBody, params: z.object({ id }) });
const teacherProfileFields = {
  fullName: z.string().trim().min(1).max(150).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  employeeNumber: z.string().trim().min(1).max(50).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
};
const hasProfileChanges = (values) => Object.keys(values).length > 0;
const profileChangesRequired = { message: 'At least one profile field is required' };
const teacherProfile = z.object(teacherProfileFields).strict().refine(hasProfileChanges, profileChangesRequired);
const ownTeacherProfile = z.object({
  fullName: teacherProfileFields.fullName,
  email: teacherProfileFields.email,
  phone: teacherProfileFields.phone,
  address: teacherProfileFields.address,
}).strict().refine(hasProfileChanges, profileChangesRequired);

export const updateTeacherSchema = z.object({ body: teacherProfile, params: z.object({ id }) });
export const updateOwnTeacherSchema = z.object({ body: ownTeacherProfile, params: z.object({}) });
