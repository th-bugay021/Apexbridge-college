import dotenv from 'dotenv';
import process from 'node:process';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().default('postgresql://localhost:5432/apexbridge'),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = schema.parse(process.env);
process.env.DATABASE_URL = env.DATABASE_URL;

if (env.NODE_ENV === 'production' && (!env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET)) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production');
}

if (env.NODE_ENV !== 'production') {
  env.JWT_ACCESS_SECRET ||= 'development-access-secret-change-me';
  env.JWT_REFRESH_SECRET ||= 'development-refresh-secret-change-me';
}
