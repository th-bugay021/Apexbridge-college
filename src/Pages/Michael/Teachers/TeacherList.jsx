import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createInvite, deactivateTeacher, getInvites, getTeachers, reactivateTeacher, revokeInvite } from "../../../api/teachers";
import ConfirmDialog from "../../../Components/Michael/Teachers/ConfirmDialog";
import Toast from "../../../Components/Michael/Teachers/Toast";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "./teachers.css";

const statusLabel = (status) => status === "SUSPENDED" ? "Deactivated" : "Active";
const inviteStatus = (invite) => invite.usedAt ? "Used" : invite.revokedAt ? "Revoked" : new Date(invite.expiresAt) <= new Date() ? "Expired" : "Pending";

export default function TeacherList() {
  const [items, setItems] = useState([]);
  const [invites, setInvites] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newInvite, setNewInvite] = useState(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { setQuery(search); setPagination((current) => ({ ...current, page: 1 })); }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [result, inviteRows] = await Promise.all([
        getTeachers({ page: pagination.page, limit: 10, search: query }),
        getInvites(),
      ]);
      setItems(result.teachers);
      setPagination(result.pagination);
      setInvites(inviteRows);
    } catch (requestError) {
      const message = apiErrorMessage(requestError, "teachers");
      setError(message);
      setToast({ type: "error", message });
    } finally { setLoading(false); }
  }, [pagination.page, query]);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  const runStatusChange = async () => {
    setBusy(true);
    try {
      const changed = confirm.active ? await deactivateTeacher(confirm.id) : await reactivateTeacher(confirm.id);
      setItems((current) => current.map((teacher) => teacher.id === changed.id ? changed : teacher));
      setToast({ type: "success", message: `Teacher ${confirm.active ? "deactivated" : "reactivated"}.` });
      setConfirm(null);
    } catch (requestError) {
      setToast({ type: "error", message: apiErrorMessage(requestError, "teacher status") });
    } finally { setBusy(false); }
  };

  const sendInvite = async (event) => {
    event.preventDefault(); setInviteBusy(true);
    try {
      const invite = await createInvite(); setNewInvite(invite); setInvites((current) => [invite, ...current]);
      setToast({ type: "success", message: "Teacher invite created." });
    } catch (requestError) { setToast({ type: "error", message: apiErrorMessage(requestError, "invite") }); }
    finally { setInviteBusy(false); }
  };

  const runRevoke = async () => {
    setBusy(true);
    try {
      await revokeInvite(confirm.id); setInvites((current) => current.map((invite) => invite.id === confirm.id ? { ...invite, revokedAt: new Date().toISOString() } : invite));
      setToast({ type: "success", message: "Invite revoked." }); setConfirm(null);
    } catch (requestError) { setToast({ type: "error", message: apiErrorMessage(requestError, "invite") }); }
    finally { setBusy(false); }
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(newInvite.code); setToast({ type: "success", message: "Invite code copied." }); }
    catch { setToast({ type: "error", message: "Could not copy the invite code. Select and copy it manually." }); }
  };

  return (
    <main className="teacher-page">
      <header className="teacher-page-header"><div><h1>Teacher Management</h1><p>View, update and invite teachers.</p></div><button className="btn btn-primary" type="button" onClick={() => { setInviteOpen(true); setNewInvite(null); }}>Invite Teacher</button></header>
      <section className="teacher-card">
        <label className="teacher-search">Search teachers<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" /></label>
        {loading ? <p className="teacher-state" role="status">Loading teachers…</p> : error ? <div className="teacher-state teacher-error"><p>{error}</p><button className="btn btn-outline" onClick={load}>Retry</button></div> : items.length === 0 ? <p className="teacher-state">No teachers found. Try another search.</p> : <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Name</th><th>Email</th><th>Employee number</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((teacher) => <tr key={teacher.id}><td><Link to={`/teachers/${teacher.id}`}>{teacher.fullName}</Link></td><td>{teacher.email}</td><td>{teacher.employeeNumber || "—"}</td><td><span className={`teacher-badge ${teacher.status === "SUSPENDED" ? "is-inactive" : "is-active"}`}>{statusLabel(teacher.status)}</span></td><td><div className="teacher-row-actions"><Link to={`/teachers/${teacher.id}`}>View</Link><button type="button" className="teacher-text-button" onClick={() => setConfirm({ kind: "status", id: teacher.id, active: teacher.status !== "SUSPENDED", name: teacher.fullName })}>{teacher.status === "SUSPENDED" ? "Reactivate" : "Deactivate"}</button></div></td></tr>)}</tbody></table></div>}
        {!loading && !error && pagination.total > 0 && <nav className="teacher-pagination" aria-label="Teacher pages"><span>{pagination.total} {pagination.total === 1 ? "teacher" : "teachers"}</span><div><button className="btn btn-outline" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span><button className="btn btn-outline" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div></nav>}
      </section>
      <section className="teacher-card"><div className="teacher-section-header"><div><h2>Teacher invites</h2><p>Invite codes are shown only once when created.</p></div></div>
        {loading ? <p className="teacher-state">Loading invites…</p> : invites.length === 0 ? <p className="teacher-state">No invites yet.</p> : <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Created</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead><tbody>{invites.map((invite) => <tr key={invite.id}><td>{new Date(invite.createdAt).toLocaleDateString()}</td><td>{new Date(invite.expiresAt).toLocaleDateString()}</td><td><span className="teacher-badge is-pending">{inviteStatus(invite)}</span></td><td>{inviteStatus(invite) === "Pending" && <button className="teacher-text-button" type="button" onClick={() => setConfirm({ kind: "invite", id: invite.id })}>Revoke</button>}</td></tr>)}</tbody></table></div>}
      </section>
      {inviteOpen && <div className="teacher-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setInviteOpen(false)}><section className="teacher-modal" role="dialog" aria-modal="true" aria-labelledby="invite-title"><button className="teacher-modal-close" type="button" aria-label="Close" onClick={() => setInviteOpen(false)}>×</button><h2 id="invite-title">Invite a teacher</h2>{newInvite ? <div className="invite-code-panel"><p>Share this code with the teacher. It expires {new Date(newInvite.expiresAt).toLocaleDateString()}.</p><code>{newInvite.code}</code><button className="btn btn-primary" type="button" onClick={copyCode}>Copy invite code</button></div> : <form onSubmit={sendInvite}><p>This creates a single use teacher registration code, valid for seven days.</p><div className="teacher-form-actions"><button type="button" className="btn btn-outline" onClick={() => setInviteOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={inviteBusy}>{inviteBusy ? "Creating…" : "Create invite"}</button></div></form>}</section></div>}
      {confirm && <ConfirmDialog title={confirm.kind === "invite" ? "Revoke invite?" : `${confirm.active ? "Deactivate" : "Reactivate"} teacher?`} message={confirm.kind === "invite" ? "This invite can no longer be used to register." : `${confirm.active ? "Deactivate" : "Reactivate"} ${confirm.name}?`} busy={busy} onCancel={() => setConfirm(null)} onConfirm={confirm.kind === "invite" ? runRevoke : runStatusChange} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}
