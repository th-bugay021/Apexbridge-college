import { useCallback, useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../../../api/teachers";
import TeacherProfileForm from "../../../Components/Michael/Teachers/TeacherProfileForm";
import Toast from "../../../Components/Michael/Teachers/Toast";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "./teachers.css";

export default function MyProfile() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setTeacher(await getMyProfile()); }
    catch (requestError) { const message = apiErrorMessage(requestError, "your profile"); setError(message); setToast({ type: "error", message }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  const save = async (changes) => {
    setSaving(true);
    try { setTeacher(await updateMyProfile(changes)); setEditing(false); setToast({ type: "success", message: "Your profile was updated." }); }
    catch (requestError) { setToast({ type: "error", message: apiErrorMessage(requestError, "your profile") }); }
    finally { setSaving(false); }
  };
  return <main className="teacher-page"><header className="teacher-page-header"><div><h1>My profile</h1><p>View and update your contact details.</p></div>{teacher && !editing && <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit profile</button>}</header>
    <section className="teacher-card">{loading ? <p className="teacher-state" role="status">Loading your profile…</p> : error ? <div className="teacher-state teacher-error"><p>{error}</p><button className="btn btn-outline" onClick={load}>Retry</button></div> : !teacher ? <p className="teacher-state">Your profile is unavailable.</p> : editing ? <TeacherProfileForm key={teacher.id} teacher={teacher} ownProfile saving={saving} onSave={save} onCancel={() => setEditing(false)} /> : <dl className="teacher-details"><div><dt>Name</dt><dd>{teacher.fullName}</dd></div><div><dt>Email</dt><dd>{teacher.email}</dd></div><div><dt>Employee number</dt><dd>{teacher.employeeNumber || "—"}</dd></div><div><dt>Phone</dt><dd>{teacher.phone || "—"}</dd></div><div><dt>Address</dt><dd>{teacher.address || "—"}</dd></div><div><dt>Status</dt><dd><span className={`teacher-badge ${teacher.status === "SUSPENDED" ? "is-inactive" : "is-active"}`}>{teacher.status === "SUSPENDED" ? "Deactivated" : "Active"}</span></dd></div></dl>}</section>
    <Toast toast={toast} onClose={() => setToast(null)} />
  </main>;
}
