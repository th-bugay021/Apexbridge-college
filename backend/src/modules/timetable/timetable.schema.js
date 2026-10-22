import { z } from 'zod';

const id = z.string().trim().min(1).max(64);
const empty = z.object({});
const noBody = z.unknown().optional();
const dayOfWeek = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm in 24-hour format');
const room = z.string().trim().max(100).nullable().optional();

const scheduleFields = {
  classId: id,
  subjectId: id,
  dayOfWeek,
  startTime: time,
  endTime: time,
  room,
};

export const createTimetableEntrySchema = z.object({
  body: z.object(scheduleFields).strict(),
  params: empty,
});

const changes = z.object({
  classId: id.optional(),
  subjectId: id.optional(),
  dayOfWeek: dayOfWeek.optional(),
  startTime: time.optional(),
  endTime: time.optional(),
  room,
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one timetable field is required',
});

export const updateTimetableEntrySchema = z.object({
  body: changes,
  params: z.object({ id }),
});

export const timetableEntryIdSchema = z.object({
  body: noBody,
  params: z.object({ id }),
});

export const classTimetableSchema = z.object({
  body: noBody,
  params: z.object({ classId: id }),
  query: empty,
});

export const myTimetableSchema = z.object({
  body: noBody,
  params: empty,
  query: empty,
});
