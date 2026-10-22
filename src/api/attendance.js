import api from "./axios";

export async function getDailyAttendance({ classId, date }) {
  return (await api.get("/attendance", { params: { classId, date } })).data;
}

export async function markAttendance({ classId, date, records }) {
  return (await api.post("/attendance", { classId, date, records })).data;
}

export async function getAttendanceSummary({ classId, from, to }) {
  return (await api.get("/attendance/summary", { params: { classId, from, to } })).data;
}

export async function getAttendanceReport({ classId, from, to }) {
  return (await api.get("/attendance/report", { params: { classId, from, to } })).data;
}

export async function getStudentAttendance(studentId, { from, to }) {
  return (await api.get(`/attendance/students/${studentId}`, { params: { from, to } })).data;
}
