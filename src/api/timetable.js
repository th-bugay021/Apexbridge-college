import api from "./axios";

export async function getMyTimetable() {
  return (await api.get("/timetable/me")).data;
}

export async function getClassTimetable(classId) {
  return (await api.get("/timetable/classes/" + classId)).data;
}

export async function createTimetableEntry(values) {
  return (await api.post("/timetable", values)).data.entry;
}

export async function updateTimetableEntry(id, values) {
  return (await api.patch("/timetable/" + id, values)).data.entry;
}

export async function deleteTimetableEntry(id) {
  return api.delete("/timetable/" + id);
}
