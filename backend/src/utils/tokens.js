import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const hashToken = (token) => createHash('sha256').update(token).digest('hex');
export const createAccessToken = (user) => jwt.sign({ sub: user.id, role: user.role, tokenVersion: user.tokenVersion ?? 0 }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
export const createRefreshToken = (user) => jwt.sign({ sub: user.id, type: 'refresh', tokenVersion: user.tokenVersion ?? 0, jti: randomBytes(16).toString('hex') }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);
export const createInviteCode = () => randomBytes(24).toString('base64url');
