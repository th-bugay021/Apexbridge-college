import api from './axios';

export async function getStudents(params = {}) {
  return (await api.get('/students', { params })).data;
}

export async function getStudent(id) {
  return (await api.get(`/students/${id}`)).data.student;
}

export async function createStudent(values) {
  return (await api.post('/students', values)).data.student;
}

export async function updateStudent(id, values) {
  return (await api.patch(`/students/${id}`, values)).data.student;
}

export async function deleteStudent(id) {
  return (await api.delete(`/students/${id}`)).data;
}

export async function bulkDeleteStudents(ids) {
  return (await api.post('/students/bulk-delete', { ids })).data;
}
