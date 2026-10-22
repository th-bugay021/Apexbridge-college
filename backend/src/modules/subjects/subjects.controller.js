import * as service from './subjects.service.js';

export async function list(req, res) {
  return res.json(await service.listSubjects(req.validatedQuery, req.user));
}

export async function getOne(req, res) {
  return res.json({ subject: await service.getSubject(req.params.id, req.user) });
}

export async function create(req, res) {
  return res.status(201).json({ subject: await service.createSubject(req.body) });
}

export async function update(req, res) {
  return res.json({ subject: await service.updateSubject(req.params.id, req.body) });
}

export async function remove(req, res) {
  await service.deleteSubject(req.params.id);
  return res.status(204).end();
}
