import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTeacher, updateTeacher } from "../../../api/teachers";
import TeacherProfileForm from "../../../Components/Michael/Teachers/TeacherProfileForm";
import Toast from "../../../Components/Michael/Teachers/Toast";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "./teachers.css";

export default function TeacherProfile() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setTeacher(await getTeacher(id)); }
    catch (requestError) { const message = apiErrorMessage(requestError, "teacher profile"); setError(message); setToast({ type: "error", message }); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  const save = async (changes) => {
    setSaving(true);
    try { setTeacher(await updateTeacher(id, changes)); setEditing(false); setToast({ type: "success", message: "Teacher profile updated." }); }
    catch (requestError) { setToast({ type: "error", message: apiErrorMessage(requestError, "teacher profile") }); }
    finally { setSaving(false); }
  };

  return <main className="teacher-page"><header className="teacher-page-header"><div><Link to="/teachers">← Teachers</Link><h1>Teacher profile</h1></div>{teacher && !editing && <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit profile</button>}</header>
    <section className="teacher-card">{loading ? <p className="teacher-state" role="status">Loading teacher profile…</p> : error ? <div className="teacher-state teacher-error"><p>{error}</p><button className="btn btn-outline" onClick={load}>Retry</button></div> : !teacher ? <p className="teacher-state">Teacher profile is unavailable.</p> : editing ? <TeacherProfileForm key={teacher.id} teacher={teacher} saving={saving} onSave={save} onCancel={() => setEditing(false)} /> : <dl className="teacher-details"><div><dt>Name</dt><dd>{teacher.fullName}</dd></div><div><dt>Email</dt><dd>{teacher.email}</dd></div><div><dt>Employee number</dt><dd>{teacher.employeeNumber || "—"}</dd></div><div><dt>Phone</dt><dd>{teacher.phone || "—"}</dd></div><div><dt>Address</dt><dd>{teacher.address || "—"}</dd></div><div><dt>Status</dt><dd><span className={`teacher-badge ${teacher.status === "SUSPENDED" ? "is-inactive" : "is-active"}`}>{teacher.status === "SUSPENDED" ? "Deactivated" : "Active"}</span></dd></div></dl>}</section>
    <section className="teacher-card"><h2>Subjects, classes and schedule</h2><p className="teacher-state">No subject, class or schedule information is available yet.</p></section>
    <Toast toast={toast} onClose={() => setToast(null)} />
  </main>;
}
