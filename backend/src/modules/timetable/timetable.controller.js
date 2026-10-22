import * as service from './timetable.service.js';

export async function create(req, res) {
  return res.status(201).json({ entry: await service.createEntry(req.body) });
}

export async function update(req, res) {
  return res.json({ entry: await service.updateEntry(req.params.id, req.body) });
}

export async function remove(req, res) {
  await service.deleteEntry(req.params.id);
  return res.status(204).end();
}

export async function getClass(req, res) {
  return res.json(await service.getClassTimetable(req.params.classId, req.user));
}

export async function getMine(req, res) {
  return res.json(await service.getMyTimetable(req.user));
}
