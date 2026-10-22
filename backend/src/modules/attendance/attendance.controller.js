import * as service from './attendance.service.js';

export async function mark(req, res) {
  return res.status(200).json(await service.markAttendance(req.body, req.user));
}

export async function daily(req, res) {
  return res.json(await service.getDailyAttendance(req.validatedQuery, req.user));
}

export async function summary(req, res) {
  return res.json(await service.getAttendanceSummary(req.validatedQuery, req.user));
}

export async function studentHistory(req, res) {
  return res.json(await service.getStudentAttendance(req.params.id, req.validatedQuery, req.user));
}

export async function report(req, res) {
  return res.json(await service.getAttendanceReport(req.validatedQuery, req.user));
}
