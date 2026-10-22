import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({ email: z.email(), password: z.string().min(8), fullName: z.string().min(1).max(150), phone: z.string().optional(), role: z.enum(['STUDENT', 'PARENT', 'TEACHER', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']).optional(), inviteCode: z.string().optional() }),
  params: z.object({}),
});
export const loginSchema = z.object({ body: z.object({ email: z.email(), password: z.string() }), params: z.object({}) });
export const inviteSchema = z.object({ body: z.object({ role: z.enum(['TEACHER', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']) }), params: z.object({}) });
export const inviteIdSchema = z.object({ body: z.unknown().optional(), params: z.object({ id: z.string().trim().min(1).max(64) }) });
