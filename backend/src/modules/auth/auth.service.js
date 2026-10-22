import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';
import { createAccessToken, createInviteCode, createRefreshToken, hashToken, verifyRefreshToken } from '../../utils/tokens.js';
import { permissionsForRole } from '../../utils/permissions.js';

// tokens.js owns token signing and hashing; permissions are attached only to the public user shape.
const publicUser = (user) => ({ id: user.id, fullName: user.fullName, email: user.email, role: user.role, permissions: permissionsForRole(user.role) });
const invalidCredentials = () => new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
async function issueSession(user) {
  const refreshToken = createRefreshToken(user);
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
  return { user: publicUser(user), accessToken: createAccessToken(user), refreshToken };
}

export async function register(input) {
  const email = input.email.toLowerCase();
  const selfServe = ['STUDENT', 'PARENT'].includes(input.role);
  let role;
  let invite;
  if (selfServe) role = input.role;
  else {
    if (!input.inviteCode) throw new HttpError(403, 'INVITE_REQUIRED', 'A valid invite code is required for this role');
    invite = await prisma.invite.findUnique({ where: { code: hashToken(input.inviteCode) } });
    if (!invite || invite.usedAt || invite.revokedAt || invite.expiresAt <= new Date()) throw new HttpError(400, 'INVALID_INVITE', 'Invite code is invalid, expired, revoked, or already used');
    role = invite.role;
  }
  if (await prisma.user.findUnique({ where: { email } })) throw new HttpError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  const passwordHash = await bcrypt.hash(input.password, 12);
  const userData = { email, passwordHash, fullName: input.fullName, phone: input.phone, role };
  try {
    const user = await prisma.$transaction(async (tx) => {
      if (invite) {
        const claimed = await tx.invite.updateMany({ where: { id: invite.id, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
        if (!claimed.count) throw new HttpError(400, 'INVALID_INVITE', 'Invite code is invalid, expired, revoked, or already used');
      }
      const admissionNumber = `STU-${randomUUID().slice(0, 8).toUpperCase()}`;
      return tx.user.create({ data: { ...userData, ...(role === 'STUDENT' ? { student: { create: { admissionNumber } } } : {}), ...(role === 'PARENT' ? { parent: { create: {} } } : {}), ...(role === 'TEACHER' ? { teacher: { create: {} } } : {}) } });
    });
    return issueSession(user);
  } catch (error) {
    if (error.code === 'P2002') throw new HttpError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    throw error;
  }
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw invalidCredentials();
  if (user.status !== 'ACTIVE') throw new HttpError(403, 'ACCOUNT_INACTIVE', 'This account is not active');
  return issueSession(user);
}

export async function refresh(rawToken) {
  if (!rawToken) throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
  let payload;
  try { payload = verifyRefreshToken(rawToken); } catch { throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired'); }
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) }, include: { user: true } });
  if (!stored || stored.revokedAt || stored.expiresAt <= new Date() || stored.user.status !== 'ACTIVE' || (payload.tokenVersion ?? 0) !== stored.user.tokenVersion) throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
  const nextRefreshToken = createRefreshToken(stored.user);
  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.create({ data: { userId: stored.userId, tokenHash: hashToken(nextRefreshToken), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
  ]);
  if (payload.sub !== stored.userId) throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
  return { user: publicUser(stored.user), accessToken: createAccessToken(stored.user), refreshToken: nextRefreshToken };
}

export async function logout(rawToken) {
  if (rawToken) await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(rawToken), revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function createInvite(creator, role) {
  const allowed = creator.role === 'SUPER_ADMIN' || (creator.role === 'ADMIN' && ['TEACHER', 'ACCOUNTANT'].includes(role));
  if (!allowed) throw new HttpError(403, 'FORBIDDEN', 'You cannot create an invite for this role');
  const code = createInviteCode();
  const invite = await prisma.invite.create({ data: { code: hashToken(code), role, createdById: creator.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  return { id: invite.id, code, role: invite.role, expiresAt: invite.expiresAt, usedAt: invite.usedAt, createdAt: invite.createdAt };
}

// The raw invite code is shown once when created; only its hash is stored, so listings expose metadata only.
export const listInvites = (user) => prisma.invite.findMany({ where: user.role === 'SUPER_ADMIN' ? {} : { createdById: user.id }, orderBy: { createdAt: 'desc' }, select: { id: true, role: true, expiresAt: true, usedAt: true, revokedAt: true, createdAt: true, createdBy: { select: { id: true, fullName: true, email: true } } } });

export async function revokeInvite(actor, inviteId) {
  const where = { id: inviteId, ...(actor.role === 'SUPER_ADMIN' ? {} : { createdById: actor.id }) };
  const invite = await prisma.invite.findFirst({ where });
  if (!invite) throw new HttpError(404, 'INVITE_NOT_FOUND', 'Invite not found');
  if (invite.usedAt || invite.revokedAt || invite.expiresAt <= new Date()) throw new HttpError(409, 'INVITE_NOT_REVOCABLE', 'Only unused, unexpired invites can be revoked');
  const updated = await prisma.invite.updateMany({ where: { ...where, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, data: { revokedAt: new Date() } });
  if (!updated.count) throw new HttpError(409, 'INVITE_NOT_REVOCABLE', 'Only unused, unexpired invites can be revoked');
  return { id: invite.id, role: invite.role, expiresAt: invite.expiresAt, usedAt: invite.usedAt, revokedAt: new Date(), createdAt: invite.createdAt };
}
