import { z } from 'zod';

const id = z.string().trim().min(1).max(64);
const noBody = z.unknown().optional();
const noParams = z.object({});
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD').refine((value) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, 'Date must be a real calendar date');
const status = z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);

const dateRangeFields = { from: dateOnly, to: dateOnly };

export const markAttendanceSchema = z.object({
  body: z.object({
    classId: id,
    date: dateOnly,
    records: z.array(z.object({ studentId: id, status }).strict()).min(1),
  }).strict().refine(({ records }) => new Set(records.map((record) => record.studentId)).size === records.length, {
    message: 'Each student may appear only once in an attendance request',
  }),
  params: noParams,
});

export const dailyAttendanceSchema = z.object({
  body: noBody,
  params: noParams,
  query: z.object({ classId: id, date: dateOnly }).strict(),
});

export const attendanceSummarySchema = z.object({
  body: noBody,
  params: noParams,
  query: z.object({ classId: id, ...dateRangeFields }).strict().refine(({ from, to }) => from <= to, {
    message: 'from must be on or before to',
  }),
});

export const studentAttendanceSchema = z.object({
  body: noBody,
  params: z.object({ id }),
  query: z.object({ from: dateOnly.optional(), to: dateOnly.optional() }).strict().refine(({ from, to }) => !from || !to || from <= to, {
    message: 'from must be on or before to',
  }),
});

export const attendanceReportSchema = attendanceSummarySchema;
