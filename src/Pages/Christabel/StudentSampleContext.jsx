import { useCallback, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { guardianSampleData, studentSampleData } from "./studentSampleData";
import StudentSampleContext from "./studentSampleContextStore";

export function StudentSampleProvider() {
  const [students, setStudents] = useState(studentSampleData);
  const [guardians, setGuardians] = useState(guardianSampleData);
  const loading = false;

  const addStudent = useCallback((values) => {
    const studentId = values.studentId.trim() || `STU-${Math.max(1000, ...students.map((item) => Number(item.studentId.replace("STU-", "")) || 0)) + 1}`;
    if (students.some((item) => item.studentId === studentId)) return "This student ID is already in use.";
    const id = `student-${studentId.replace(/\D/g, "")}`;
    setStudents((current) => [{ ...values, id, studentId }, ...current]);
    return "";
  }, [students]);

  const updateStudent = useCallback((id, values) => {
    if (students.some((item) => item.id !== id && item.studentId === values.studentId.trim())) return "This student ID is already in use.";
    setStudents((current) => current.map((item) => item.id === id ? { ...values, id, studentId: values.studentId.trim() } : item));
    return "";
  }, [students]);

  const deleteStudents = useCallback((ids) => {
    const removed = new Set(ids);
    setStudents((current) => current.filter((item) => !removed.has(item.id)));
  }, []);

  const addGuardian = useCallback((values) => {
    const id = `guardian-${Date.now()}`;
    setGuardians((current) => [{ ...values, id }, ...current]);
  }, []);

  const updateGuardian = useCallback((id, values) => {
    setGuardians((current) => current.map((guardian) => guardian.id === id ? { ...values, id } : guardian));
  }, []);

  const deleteGuardian = useCallback((id) => {
    setGuardians((current) => current.filter((guardian) => guardian.id !== id));
    setStudents((current) => current.map((student) => ({
      ...student,
      guardianIds: (student.guardianIds || []).filter((guardianId) => guardianId !== id),
    })));
  }, []);

  const value = useMemo(() => ({ students, guardians, loading, addStudent, updateStudent, deleteStudents, addGuardian, updateGuardian, deleteGuardian }), [students, guardians, loading, addStudent, updateStudent, deleteStudents, addGuardian, updateGuardian, deleteGuardian]);

  return <StudentSampleContext.Provider value={value}><Outlet /></StudentSampleContext.Provider>;
}

