import api from "./axios";
import { getTeachers } from "./teachers";

export async function getClasses({ page = 1, limit = 10, search = "" } = {}) {
  return (await api.get("/classes", { params: { page, limit, search } })).data;
}

export async function getClass(id) {
  return (await api.get(`/classes/${id}`)).data.class;
}

export async function createClass(values) {
  return (await api.post("/classes", values)).data.class;
}

export async function updateClass(id, values) {
  return (await api.patch(`/classes/${id}`, values)).data.class;
}

export async function deleteClass(id) {
  return api.delete(`/classes/${id}`);
}

export async function getMyClasses() {
  return (await api.get("/classes/me")).data.classes;
}

export async function assignSubject(classId, { subjectId, teacherId }) {
  return (await api.post(`/classes/${classId}/subjects`, { subjectId, teacherId })).data.assignment;
}

export async function unassignSubject(classId, subjectId) {
  return (await api.delete(`/classes/${classId}/subjects/${subjectId}`)).data.assignment;
}

export async function getActiveTeachers() {
  const firstPage = await getTeachers({ page: 1, limit: 100 });
  const rows = [...firstPage.teachers];
  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const nextPage = await getTeachers({ page, limit: 100 });
    rows.push(...nextPage.teachers);
  }
  return rows.filter((teacher) => teacher.status === "ACTIVE");
}
