import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { assignSubject, getActiveTeachers, getClass, unassignSubject } from "../../../api/classes";
import { getSubjects } from "../../../api/subjects";
import ConfirmDialog from "../../../Components/Michael/Teachers/ConfirmDialog";
import Toast from "../../../Components/Michael/Teachers/Toast";
import { useAuth } from "../../../Context/AuthContext";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import ClassTimetable from "../Timetable/ClassTimetable";
import "./academics.css";

async function getEverySubject() {
  const firstPage = await getSubjects({ page: 1, limit: 100 });
  const rows = [...firstPage.subjects];
  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const nextPage = await getSubjects({ page, limit: 100 });
    rows.push(...nextPage.subjects);
  }
  return rows;
}

function assignmentErrorMessage(error) {
  const code = error?.response?.data?.error?.code;
  if (code === "ASSIGNMENT_EXISTS") return "That subject is already assigned to this class.";
  if (code === "TEACHER_INACTIVE") return "Only active teachers can be assigned. Choose another teacher.";
  return apiErrorMessage(error, "subject assignment");
}

export default function ClassDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const [classItem, setClassItem] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const detail = await getClass(id);
      setClassItem(detail);
      navigate(`/classes/${encodeURIComponent(detail.id)}`, {
        replace: true,
        state: { breadcrumbClass: { id: detail.id, name: detail.name } },
      });
      if (isAdmin) {
        const [subjectRows, teacherRows] = await Promise.all([getEverySubject(), getActiveTeachers()]);
        const unassignedSubjects = subjectRows.filter((subject) => !detail.subjects.some((assignment) => assignment.subjectId === subject.id));
        setSubjects(unassignedSubjects);
        setTeachers(teacherRows);
        setSubjectId((current) => unassignedSubjects.some((subject) => subject.id === current) ? current : unassignedSubjects[0]?.id || "");
        setTeacherId((current) => current || teacherRows[0]?.id || "");
      }
    } catch (requestError) {
      const message = apiErrorMessage(requestError, "class details");
      setError(message);
      setToast({ type: "error", message });
    } finally { setLoading(false); }
  }, [id, isAdmin, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const addAssignment = async (event) => {
    event.preventDefault();
    if (!subjectId || !teacherId) {
      setToast({ type: "error", message: "Choose both a subject and an active teacher." });
      return;
    }
    setSaving(true);
    try {
      await assignSubject(id, { subjectId, teacherId });
      setToast({ type: "success", message: "Subject assigned to this class." });
      setSubjectId("");
      await load();
    } catch (requestError) {
      setToast({ type: "error", message: assignmentErrorMessage(requestError) });
    } finally { setSaving(false); }
  };

  const removeAssignment = async () => {
    setSaving(true);
    try {
      await unassignSubject(id, confirm.subjectId);
      setConfirm(null);
      setToast({ type: "success", message: "Subject unassigned." });
      await load();
    } catch (requestError) {
      setToast({ type: "error", message: apiErrorMessage(requestError, "subject assignment") });
    } finally { setSaving(false); }
  };

  return <main className="teacher-page">
    <header className="teacher-page-header"><div><Link to="/classes">← {isAdmin ? "Classes" : "My classes"}</Link><h1>Class details</h1></div></header>
    {loading ? <section className="teacher-card"><p className="teacher-state" role="status">Loading class details…</p></section> : error ? <section className="teacher-card teacher-error"><p className="teacher-state">{error}</p><button className="btn btn-outline" type="button" onClick={load}>Retry</button></section> : !classItem ? <section className="teacher-card"><p className="teacher-state">Class details are unavailable.</p></section> : <>
      <section className="teacher-card">
        <div className="academic-detail-heading"><h2>{classItem.name}</h2>{classItem.level && <span className="teacher-badge is-pending">{classItem.level}</span>}</div>
        <p className="academic-muted">{classItem.students.length} {classItem.students.length === 1 ? "student" : "students"} · {classItem.subjects.length} {classItem.subjects.length === 1 ? "subject" : "subjects"}</p>
      </section>
      <section className="teacher-card">
        <div className="teacher-section-header"><div><h2>Students</h2><p>Read-only class roster.</p></div></div>
        {classItem.students.length === 0 ? <p className="teacher-state">No students are assigned to this class yet.</p> : <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Name</th><th>Admission number</th><th>Status</th></tr></thead><tbody>{classItem.students.map((student) => <tr key={student.id}><td>{student.fullName}</td><td>{student.admissionNumber}</td><td>{student.status}</td></tr>)}</tbody></table></div>}
      </section>
      <section className="teacher-card">
        <div className="teacher-section-header"><div><h2>Subjects and teachers</h2><p>Subjects currently assigned to this class.</p></div></div>
        {isAdmin && <form className="academic-assignment-form" onSubmit={addAssignment}><label>Subject<select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={saving || subjects.length === 0}><option value="">{subjects.length ? "Choose a subject" : "No unassigned subjects"}</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}</select></label><label>Active teacher<select value={teacherId} onChange={(event) => setTeacherId(event.target.value)} disabled={saving || teachers.length === 0}><option value="">{teachers.length ? "Choose a teacher" : "No active teachers available"}</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName} · {teacher.employeeNumber || teacher.email}</option>)}</select></label><button className="btn btn-primary" type="submit" disabled={saving || !subjectId || !teacherId}>{saving ? "Assigning…" : "Assign subject"}</button></form>}
        {classItem.subjects.length === 0 ? <p className="teacher-state">No subjects are assigned to this class yet.</p> : <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Subject</th><th>Code</th><th>Teacher</th><th>Email</th>{isAdmin && <th>Actions</th>}</tr></thead><tbody>{classItem.subjects.map((assignment) => <tr key={assignment.subjectId}><td>{assignment.subject.name}</td><td>{assignment.subject.code}</td><td>{assignment.teacher.fullName}</td><td>{assignment.teacher.email}</td>{isAdmin && <td><button className="teacher-text-button" type="button" onClick={() => setConfirm(assignment)}>Unassign</button></td>}</tr>)}</tbody></table></div>}
      </section>
      <ClassTimetable classItem={classItem} canManage={isAdmin} />
    </>}
    {confirm && <ConfirmDialog title="Unassign subject?" message={`Remove ${confirm.subject.name} from ${classItem?.name}?`} busy={saving} onCancel={() => setConfirm(null)} onConfirm={removeAssignment} />}
    <Toast toast={toast} onClose={() => setToast(null)} />
  </main>;
}
