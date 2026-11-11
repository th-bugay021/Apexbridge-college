import * as service from './parents.service.js';

export async function list(req, res) { return res.json(await service.listParents(req.validatedQuery)); }
export async function getMine(req, res) { return res.json(await service.getMyChildren(req.user.id)); }
export async function getOne(req, res) { return res.json({ parent: await service.getParent(req.params.id) }); }
export async function create(req, res) { return res.status(201).json({ parent: await service.createParent(req.body) }); }
export async function updateOne(req, res) { return res.json({ parent: await service.updateParent(req.params.id, req.body) }); }
export async function linkStudent(req, res) { return res.status(201).json({ parent: await service.linkStudent(req.params.id, req.body.studentId) }); }
export async function unlinkStudent(req, res) { await service.unlinkStudent(req.params.id, req.params.studentId); return res.status(204).end(); }
export async function remove(req, res) { await service.deleteParents([req.params.id]); return res.status(204).end(); }
export async function bulkDelete(req, res) { return res.json(await service.deleteParents(req.body.ids)); }
