import * as service from './auth.service.js';
import { env } from '../../config/env.js';
import { permissionsForRole } from '../../utils/permissions.js';

const cookieOptions = () => ({ httpOnly: true, sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax', secure: env.NODE_ENV === 'production', path: '/api/auth' });
const sendSession = (res, session) => {
  res.cookie('refreshToken', session.refreshToken, { ...cookieOptions(), maxAge: 30 * 24 * 60 * 60 * 1000 });
  return res.json({ user: session.user, accessToken: session.accessToken });
};

export async function register(req, res) { return sendSession(res, await service.register(req.body)); }
export async function login(req, res) { return sendSession(res, await service.login(req.body)); }
export async function refresh(req, res) { return sendSession(res, await service.refresh(req.cookies?.refreshToken)); }
export async function logout(req, res) {
  await service.logout(req.cookies?.refreshToken);
  res.clearCookie('refreshToken', cookieOptions());
  return res.status(204).end();
}
export function me(req, res) {
  const { id, fullName, email, role } = req.user;
  return res.json({ user: { id, fullName, email, role, permissions: permissionsForRole(role) } });
}
export function notImplemented(_req, res) { return res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented yet' } }); }
export async function createInvite(req, res) { return res.status(201).json({ invite: await service.createInvite(req.user, req.body.role) }); }
export async function listInvites(req, res) { return res.json({ invites: await service.listInvites(req.user) }); }
export async function revokeInvite(req, res) { return res.json({ invite: await service.revokeInvite(req.user, req.params.id) }); }
