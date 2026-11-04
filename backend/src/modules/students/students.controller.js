import * as service from './students.service.js';

export async function list(req, res) { return res.json(await service.listStudents(req.validatedQuery)); }
export async function getOne(req, res) { return res.json({ student: await service.getStudent(req.params.id) }); }
export async function create(req, res) { return res.status(201).json({ student: await service.createStudent(req.body) }); }
export async function updateOne(req, res) { return res.json({ student: await service.updateStudent(req.params.id, req.body) }); }
export async function remove(req, res) { await service.deleteStudents([req.params.id]); return res.status(204).end(); }
export async function bulkDelete(req, res) { return res.json(await service.deleteStudents(req.body.ids)); }
