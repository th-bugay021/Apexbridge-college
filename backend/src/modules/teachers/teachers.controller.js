import * as service from './teachers.service.js';

export async function list(req, res) { return res.json(await service.listTeachers(req.validatedQuery)); }
export async function overviewList(req, res) { return res.json(await service.listTeacherOverviews(req.validatedQuery)); }
export async function overview(req, res) { return res.json(await service.getTeacherOverview(req.params.id, req.validatedQuery, req.user)); }
export async function getOne(req, res) { return res.json({ teacher: await service.getTeacher(req.params.id) }); }
export async function getOwn(req, res) { return res.json({ teacher: await service.getOwnTeacher(req.user.id) }); }
export async function updateOne(req, res) { return res.json({ teacher: await service.updateTeacher(req.params.id, req.body) }); }
export async function updateOwn(req, res) { return res.json({ teacher: await service.updateOwnTeacher(req.user.id, req.body) }); }
export async function deactivate(req, res) { return res.json({ teacher: await service.setTeacherStatus(req.params.id, 'SUSPENDED') }); }
export async function reactivate(req, res) { return res.json({ teacher: await service.setTeacherStatus(req.params.id, 'ACTIVE') }); }
