import api from './axios';

export async function getParents({ page = 1, limit = 20, search = '', studentId } = {}) {
  return (await api.get('/parents', { params: { page, limit, search, studentId } })).data;
}

export async function getAllParents(filters = {}) {
  const firstPage = await getParents({ ...filters, page: 1, limit: 100 });
  const parents = [...firstPage.parents];
  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const nextPage = await getParents({ ...filters, page, limit: 100 });
    parents.push(...nextPage.parents);
  }
  return parents;
}

export async function getParent(id) {
  return (await api.get(`/parents/${id}`)).data.parent;
}

export async function linkStudentToParent(parentId, studentId) {
  return (await api.post(`/parents/${parentId}/students`, { studentId })).data.parent;
}

export async function unlinkStudentFromParent(parentId, studentId) {
  return (await api.delete(`/parents/${parentId}/students/${studentId}`)).data;
}
