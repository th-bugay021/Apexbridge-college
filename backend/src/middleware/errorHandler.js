import { env } from '../config/env.js';

export const errorHandler = (error, _req, res, _next) => {
  void _next;
  const status = error.status ?? (error.code === 'P2002' ? 409 : 500);
  const code = error.code && typeof error.code === 'string' ? error.code : status === 409 ? 'CONFLICT' : 'INTERNAL_ERROR';
  const message = error.code === 'P2002' ? 'A record with this value already exists' : status >= 500 && env.NODE_ENV === 'production' ? 'An unexpected error occurred' : (error.message ?? 'An unexpected error occurred');
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: { code, message } });
};
