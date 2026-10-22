import { prisma } from '../config/db.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { HttpError } from '../utils/httpError.js';

export const authenticate = async (req, _res, next) => {
  try {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');
    let payload;
    try { payload = verifyAccessToken(token); } catch { throw new HttpError(401, 'INVALID_TOKEN', 'Invalid or expired access token'); }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE' || (payload.tokenVersion ?? 0) !== user.tokenVersion) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');
    req.user = user;
    next();
  } catch (error) { next(error); }
};
