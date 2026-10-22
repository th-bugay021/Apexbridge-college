import { hasPermission } from '../utils/permissions.js';
import { HttpError } from '../utils/httpError.js';

export const authorize = (...required) => (req, _res, next) => {
  if (!req.user || !required.every((permission) => hasPermission(req.user.role, permission))) {
    return next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
  }
  return next();
};
