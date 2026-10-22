import * as service from './classes.service.js';

export async function list(req, res) {
  return res.json(await service.listClasses(req.validatedQuery, req.user));
}

export async function getOne(req, res) {
  return res.json({ class: await service.getClass(req.params.id, req.user) });
}

export async function getMine(req, res) {
  return res.json(await service.getOwnClasses(req.user));
}

export async function create(req, res) {
  return res.status(201).json({ class: await service.createClass(req.body) });
}

export async function update(req, res) {
  return res.json({ class: await service.updateClass(req.params.id, req.body) });
}

export async function remove(req, res) {
  await service.deleteClass(req.params.id);
  return res.status(204).end();
}

export async function assignSubject(req, res) {
  return res.status(201).json({ assignment: await service.assignSubject(req.params.id, req.body) });
}

export async function unassignSubject(req, res) {
  return res.json({ assignment: await service.unassignSubject(req.params.id, req.params.subjectId) });
}
