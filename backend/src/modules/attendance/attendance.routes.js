import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { hasPermission } from '../../utils/permissions.js';
import { HttpError } from '../../utils/httpError.js';
import * as controller from './attendance.controller.js';
import {
  attendanceReportSchema,
  attendanceSummarySchema,
  dailyAttendanceSchema,
  markAttendanceSchema,
  studentAttendanceSchema,
} from './attendance.schema.js';

const router = Router();

const authorizeClassAttendance = (req, _res, next) => {
  const role = req.user?.role;
  if (['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(role) && hasPermission(role, 'attendance.view')) return next();
  return next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to view class attendance'));
};

const authorizeHistory = (req, _res, next) => {
  const role = req.user?.role;
  if (role === 'STUDENT' || (['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(role) && hasPermission(role, 'attendance.view'))) return next();
  return next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to view attendance history'));
};

router.use(authenticate);
router.post('/', authorize('attendance.manage'), validate(markAttendanceSchema), controller.mark);
router.get('/summary', authorizeClassAttendance, validate(attendanceSummarySchema), controller.summary);
router.get('/report', authorizeClassAttendance, validate(attendanceReportSchema), controller.report);
router.get('/students/:id', authorizeHistory, validate(studentAttendanceSchema), controller.studentHistory);
router.get('/', authorizeClassAttendance, validate(dailyAttendanceSchema), controller.daily);

export default router;
