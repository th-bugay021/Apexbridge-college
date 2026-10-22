import api from "./axios";

export async function getSubjects({ page = 1, limit = 10, search = "" } = {}) {
  return (await api.get("/subjects", { params: { page, limit, search } })).data;
}

export async function getSubject(id) {
  return (await api.get(`/subjects/${id}`)).data.subject;
}

export async function createSubject(values) {
  return (await api.post("/subjects", values)).data.subject;
}

export async function updateSubject(id, values) {
  return (await api.patch(`/subjects/${id}`, values)).data.subject;
}

export async function deleteSubject(id) {
  return api.delete(`/subjects/${id}`);
}
