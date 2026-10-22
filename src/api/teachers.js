import api from "./axios";

export async function getTeachers({ page = 1, limit = 20, search = "" } = {}) {
  return (await api.get("/teachers", { params: { page, limit, search } })).data;
}

export async function getTeachersOverview({ page = 1, limit = 10, search = "", from, to } = {}) {
  return (await api.get("/teachers/overview", { params: { page, limit, search, from, to } })).data;
}

export async function getTeacherOverview(id, { from, to } = {}) {
  return (await api.get(`/teachers/${id}/overview`, { params: { from, to } })).data;
}

export async function getTeacher(id) {
  return (await api.get(`/teachers/${id}`)).data.teacher;
}

export async function updateTeacher(id, changes) {
  return (await api.patch(`/teachers/${id}`, changes)).data.teacher;
}

export async function deactivateTeacher(id) {
  return (await api.post(`/teachers/${id}/deactivate`)).data.teacher;
}

export async function reactivateTeacher(id) {
  return (await api.post(`/teachers/${id}/reactivate`)).data.teacher;
}

export async function getMyProfile() {
  return (await api.get("/teachers/me")).data.teacher;
}

export async function updateMyProfile(changes) {
  return (await api.patch("/teachers/me", changes)).data.teacher;
}

export async function createInvite() {
  return (await api.post("/invites", { role: "TEACHER" })).data.invite;
}

export async function getInvites() {
  return (await api.get("/invites")).data.invites;
}

export async function revokeInvite(id) {
  return (await api.post(`/invites/${id}/revoke`)).data.invite;
}
