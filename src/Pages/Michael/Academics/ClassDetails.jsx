import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, UsersRound } from "lucide-react";
import { assignSubject, getActiveTeachers, getClass, unassignSubject } from "../../../api/classes";
import { getSubjects } from "../../../api/subjects";
import ConfirmDialog from "../../../Components/Michael/Teachers/ConfirmDialog";
import Toast from "../../../Components/Michael/Teachers/Toast";
import { useAuth } from "../../../Context/AuthContext";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import ClassTimetable from "../Timetable/ClassTimetable";
import "../shared/michael-ui.css";
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

function studentStatus(status) {
  if (status === "ACTIVE") return { label: "Active", badge: "mu-badge-success" };
  if (status === "SUSPENDED") return { label: "Suspended", badge: "mu-badge-warning" };
  const label = String(status || "Unknown").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  return { label, badge: "mu-badge-neutral" };
}

function LoadingClassDetails() {
  return <div className="mu-page-content" role="status" aria-label="Loading class details">
    <div className="card mu-card"><div className="mu-skeleton mu-skeleton-card" /></div>
    <section className="card mu-card">
      <div className="mu-table-wrap"><table className="mu-table" aria-hidden="true"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan="3"><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table></div>
    </section>
  </div>;
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
    } finally {
      setLoading(false);
    }
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
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async () => {
    if (!confirm || saving) return;
    setSaving(true);
    try {
      await unassignSubject(id, confirm.subjectId);
      setConfirm(null);
      setToast({ type: "success", message: "Subject unassigned." });
      await load();
    } catch (requestError) {
      setToast({ type: "error", message: apiErrorMessage(requestError, "subject assignment") });
    } finally {
      setSaving(false);
    }
  };

  const students = classItem?.students || [];
  const classSubjects = classItem?.subjects || [];

  return <div className="michael-ui">
    <main className="mu-page-content">
      <header className="mu-page-header">
        <div>
          <h1 className="mu-page-title">{loading ? "Class" : classItem?.name || "Class"}</h1>
          {!loading && classItem && <p className="mu-caption">Level: {classItem.level || "Not specified"}</p>}
        </div>
      </header>

      {loading ? <LoadingClassDetails /> : error ? <section className="card mu-card mu-empty-state" role="alert">
        <p>{error}</p>
        <button className="btn btn-outline" type="button" onClick={load}>Retry</button>
      </section> : !classItem ? <section className="card mu-card mu-empty-state"><p>Class details are unavailable.</p></section> : <>
        <div className="mu-stat-grid" aria-label="Class statistics">
          <article className="mu-stat-card mu-stagger-item" style={{ "--mu-i": 0 }}>
            <div className="mu-stat-card-header"><span className="mu-stat-label">Students</span><span className="mu-stat-icon" aria-hidden="true"><UsersRound size={16} strokeWidth={1.8} /></span></div>
            <strong className="mu-stat-number">{students.length}</strong>
            <p className="mu-stat-caption">Enrolled in this class</p>
          </article>
          <article className="mu-stat-card mu-stagger-item" style={{ "--mu-i": 1 }}>
            <div className="mu-stat-card-header"><span className="mu-stat-label">Subjects</span><span className="mu-stat-icon" aria-hidden="true"><BookOpen size={16} strokeWidth={1.8} /></span></div>
            <strong className="mu-stat-number">{classSubjects.length}</strong>
            <p className="mu-stat-caption">Assigned to this class</p>
          </article>
        </div>

        <section className="card mu-card mu-detail-card">
          <header className="mu-section-header">
            <div className="mu-card-heading"><h2 className="mu-section-title">Students</h2><p className="mu-card-subtitle">Read-only class roster.</p></div>
          </header>
          {students.length === 0 ? <div className="mu-empty-state mu-students-empty">
            <span className="mu-empty-icon" aria-hidden="true"><UsersRound size={16} strokeWidth={1.8} /></span>
            <strong className="mu-empty-title">No students in this class yet</strong>
            <p className="mu-empty-hint">Students appear here once they are enrolled</p>
          </div> : <div className="mu-table-wrap">
            <table className="mu-table">
              <thead><tr><th scope="col">Name</th><th scope="col">Admission number</th><th scope="col">Status</th></tr></thead>
              <tbody>{students.map((student) => {
                const status = studentStatus(student.status);
                return <tr key={student.id}><td>{student.fullName}</td><td>{student.admissionNumber}</td><td><span className={`mu-badge ${status.badge}`}>{status.label}</span></td></tr>;
              })}</tbody>
            </table>
          </div>}
        </section>

        <section className="card mu-card mu-detail-card">
          <header className="mu-section-header">
            <div className="mu-card-heading"><h2 className="mu-section-title">Subjects and teachers</h2><p className="mu-card-subtitle">Subjects currently assigned to this class.</p></div>
          </header>
          {isAdmin && <form className="academic-assignment-form" onSubmit={addAssignment}>
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="assignment-subject">Subject</label>
              <select className="select mu-field-control" id="assignment-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={saving || subjects.length === 0}>
                <option value="">{subjects.length ? "Choose a subject" : "No unassigned subjects"}</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
              </select>
            </div>
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="assignment-teacher">Active teacher</label>
              <select className="select mu-field-control" id="assignment-teacher" value={teacherId} onChange={(event) => setTeacherId(event.target.value)} disabled={saving || teachers.length === 0}>
                <option value="">{teachers.length ? "Choose a teacher" : "No active teachers available"}</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName} · {teacher.employeeNumber || teacher.email}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving || !subjectId || !teacherId}>{saving ? "Assigning…" : "Assign subject"}</button>
          </form>}
          {classSubjects.length === 0 ? <div className="mu-empty-state"><strong className="mu-empty-title">No subjects assigned to this class yet</strong></div> : <div className="mu-table-wrap">
            <table className="mu-table">
              <thead><tr><th scope="col">Subject</th><th scope="col">Code</th><th scope="col">Teacher</th><th scope="col">Email</th>{isAdmin && <th scope="col">Actions</th>}</tr></thead>
              <tbody>{classSubjects.map((assignment) => <tr key={assignment.subjectId}>
                <td>{assignment.subject.name}</td><td><span className="mu-badge mu-badge-neutral">{assignment.subject.code}</span></td><td>{assignment.teacher.fullName}</td><td>{assignment.teacher.email}</td>
                {isAdmin && <td><button className="btn mu-btn-danger" type="button" onClick={() => setConfirm(assignment)}>Unassign</button></td>}
              </tr>)}</tbody>
            </table>
          </div>}
        </section>
        <ClassTimetable classItem={classItem} canManage={isAdmin} />
      </>}
    </main>

    {confirm && <ConfirmDialog title="Unassign subject?" message={`Remove ${confirm.subject.name} from ${classItem?.name}?`} busy={saving} onCancel={() => !saving && setConfirm(null)} onConfirm={removeAssignment} />}
    <Toast toast={toast} onClose={() => setToast(null)} />
  </div>;
}
