import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Mail, UsersRound } from "lucide-react";
import { createInvite, deactivateTeacher, getInvites, getTeachers, reactivateTeacher, revokeInvite } from "../../../api/teachers";
import ResponsiveTable from "../../../Components/common/ResponsiveTable";
import Toast from "../../../Components/Michael/Teachers/Toast";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "../shared/michael-ui.css";
import "./teachers.css";

const statusLabel = (status) => status === "SUSPENDED" ? "Deactivated" : "Active";
const inviteStatus = (invite) => invite.usedAt ? "Used" : invite.revokedAt ? "Revoked" : new Date(invite.expiresAt) <= new Date() ? "Expired" : "Pending";
const inviteBadgeTone = (status) => status === "Pending" || status === "Expired" ? "mu-badge-warning" : "mu-badge-neutral";

function formatDisplayDate(value) {
  if (!value) return "–";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

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
  const [confirmError, setConfirmError] = useState("");
  const [confirmSucceeded, setConfirmSucceeded] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newInvite, setNewInvite] = useState(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSaved, setInviteSaved] = useState(false);

  useEffect(() => {
    if (!inviteOpen && !confirm) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || busy || inviteBusy) return;
      if (inviteOpen) setInviteOpen(false);
      if (confirm) setConfirm(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, confirm, inviteBusy, inviteOpen]);

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
    setConfirmError(""); setConfirmSucceeded(false);
    setBusy(true);
    try {
      const changed = confirm.active ? await deactivateTeacher(confirm.id) : await reactivateTeacher(confirm.id);
      setItems((current) => current.map((teacher) => teacher.id === changed.id ? changed : teacher));
      setToast({ type: "success", message: `Teacher ${confirm.active ? "deactivated" : "reactivated"}.` });
      setConfirmSucceeded(true);
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      setConfirm(null);
      setConfirmSucceeded(false);
    } catch (requestError) {
      const message = apiErrorMessage(requestError, "teacher status");
      setConfirmError(message);
      setToast({ type: "error", message });
    } finally { setBusy(false); }
  };

  const sendInvite = async (event) => {
    event.preventDefault(); setInviteError(""); setInviteSaved(false); setInviteBusy(true);
    try {
      const invite = await createInvite(); setNewInvite(invite); setInvites((current) => [invite, ...current]);
      setToast({ type: "success", message: "Teacher invite created." });
      setInviteSaved(true);
      window.setTimeout(() => setInviteSaved(false), 600);
    } catch (requestError) {
      const message = apiErrorMessage(requestError, "invite");
      setInviteError(message);
      setToast({ type: "error", message });
    }
    finally { setInviteBusy(false); }
  };

  const runRevoke = async () => {
    setConfirmError(""); setConfirmSucceeded(false);
    setBusy(true);
    try {
      await revokeInvite(confirm.id); setInvites((current) => current.map((invite) => invite.id === confirm.id ? { ...invite, revokedAt: new Date().toISOString() } : invite));
      setToast({ type: "success", message: "Invite revoked." });
      setConfirmSucceeded(true);
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      setConfirm(null);
      setConfirmSucceeded(false);
    } catch (requestError) {
      const message = apiErrorMessage(requestError, "invite");
      setConfirmError(message);
      setToast({ type: "error", message });
    }
    finally { setBusy(false); }
  };

  const openConfirm = (value) => {
    setConfirmError(""); setConfirmSucceeded(false); setConfirm(value);
  };

  const openInvite = () => {
    setInviteOpen(true); setNewInvite(null); setInviteError(""); setInviteSaved(false);
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(newInvite.code); setToast({ type: "success", message: "Invite code copied." }); }
    catch { setToast({ type: "error", message: "Could not copy the invite code. Select and copy it manually." }); }
  };

  return (
    <div className="michael-ui">
    <main className="mu-page-content mu-teachers-page">
      <header className="mu-page-header"><div><h1 className="mu-page-title">Teacher Management</h1><p className="mu-caption">View, update and invite teachers.</p></div><div className="mu-page-header-actions"><button className="btn btn-primary" type="button" onClick={openInvite}>Invite Teacher</button></div></header>
      <section className="card mu-card mu-teacher-list-card">
        <div className="mu-toolbar mu-teacher-toolbar">
          <div className="mu-field mu-toolbar-search">
            <label className="mu-field-label" htmlFor="teacher-search">Search teachers</label>
            <input className="input mu-field-control" id="teacher-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" />
          </div>
        </div>
        {loading ? <div className="mu-table-wrap" role="status" aria-label="Loading teachers"><table className="mu-table mu-table-grid" aria-hidden="true"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={5}><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table></div> : error ? <div className="mu-empty-state mu-teacher-error" role="alert"><p>{error}</p><button className="btn btn-outline" type="button" onClick={load}>Retry</button></div> : items.length === 0 ? <div className="mu-empty-state">
          <span className="mu-empty-icon" aria-hidden="true"><UsersRound size={20} strokeWidth={1.8} /></span>
          <strong className="mu-empty-title">No teachers found.</strong>
          <p className="mu-empty-hint">Try another search.</p>
        </div> : <ResponsiveTable
          rows={items}
          rowKey={(teacher) => teacher.id}
          primary={(teacher) => teacher.fullName}
          secondary={(teacher) => teacher.email || teacher.employeeNumber || "—"}
          label="Teachers"
          tableClassName="mu-table mu-table-grid"
          columns={[
            { key: "name", label: "Name", primary: true, render: (teacher) => <Link to={`/teachers/${teacher.id}`}>{teacher.fullName}</Link> },
            { key: "email", label: "Email", render: (teacher) => teacher.email },
            { key: "employeeNumber", label: "Employee number", render: (teacher) => teacher.employeeNumber || "—" },
            { key: "status", label: "Status", render: (teacher) => <span className={`mu-badge ${teacher.status === "SUSPENDED" ? "mu-badge-warning" : "mu-badge-success"}`}>{statusLabel(teacher.status)}</span> },
            { key: "actions", label: "Actions", actions: true, render: (teacher) => <div className="mu-teacher-row-actions"><Link className="btn mu-btn-row-action" to={`/teachers/${teacher.id}`}>View</Link><button type="button" className={`btn ${teacher.status === "SUSPENDED" ? "mu-btn-row-action" : "mu-btn-danger"}`} onClick={() => openConfirm({ kind: "status", id: teacher.id, active: teacher.status !== "SUSPENDED", name: teacher.fullName })}>{teacher.status === "SUSPENDED" ? "Reactivate" : "Deactivate"}</button></div> },
          ]}
        />}
        {!loading && !error && pagination.total > 0 && <nav className="mu-pagination mu-teacher-pagination" aria-label="Teacher pages"><span>{pagination.total} {pagination.total === 1 ? "teacher" : "teachers"}</span><div className="mu-pagination-controls"><button className="btn btn-outline" type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span><button className="btn btn-outline" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div></nav>}
      </section>
      <section className="card mu-card mu-teacher-invites-card"><div className="mu-section-header"><div><h2 className="mu-section-title">Teacher invites</h2><p className="mu-caption">Invite codes are shown only once when created.</p></div></div>
        {loading ? <div className="mu-table-wrap" role="status" aria-label="Loading invites"><table className="mu-table mu-table-grid" aria-hidden="true"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={4}><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table></div> : invites.length === 0 ? <div className="mu-empty-state">
          <span className="mu-empty-icon" aria-hidden="true"><Mail size={20} strokeWidth={1.8} /></span>
          <strong className="mu-empty-title">No invites yet.</strong>
          <p className="mu-empty-hint">Invite a teacher to create an invite code.</p>
        </div> : <ResponsiveTable
          rows={invites}
          rowKey={(invite) => invite.id}
          primary={(invite) => inviteStatus(invite)}
          secondary={(invite) => formatDisplayDate(invite.createdAt)}
          label="Teacher invites"
          tableClassName="mu-table mu-table-grid"
          columns={[
            { key: "created", label: "Created", primary: true, render: (invite) => formatDisplayDate(invite.createdAt) },
            { key: "expires", label: "Expires", render: (invite) => formatDisplayDate(invite.expiresAt) },
            { key: "status", label: "Status", render: (invite) => <span className={`mu-badge ${inviteBadgeTone(inviteStatus(invite))}`}>{inviteStatus(invite)}</span> },
            { key: "actions", label: "Actions", actions: true, render: (invite) => inviteStatus(invite) === "Pending" && <button className="btn mu-btn-danger" type="button" onClick={() => openConfirm({ kind: "invite", id: invite.id })}>Revoke</button> },
          ]}
        />}
      </section>
      {inviteOpen && createPortal(<div className="michael-ui"><div className="mu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !inviteBusy && setInviteOpen(false)}>
        <section className="mu-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-title">
          <header className="mu-modal-header"><h2 className="mu-section-title" id="invite-title">Invite a teacher</h2>{inviteSaved && <span className="mu-badge mu-badge-success" aria-label="Invite created">✓</span>}<button className="mu-modal-close" type="button" aria-label="Close" disabled={inviteBusy} onClick={() => !inviteBusy && setInviteOpen(false)}>×</button></header>
          {newInvite ? <div className="mu-modal-body"><div className="invite-code-panel"><p>Share this code with the teacher. It expires {formatDisplayDate(newInvite.expiresAt)}.</p><code>{newInvite.code}</code><button className="btn btn-primary" type="button" onClick={copyCode}>Copy invite code</button></div></div> : <form noValidate onSubmit={sendInvite}>
            <div className="mu-modal-body"><p>This creates a single use teacher registration code, valid for seven days.</p>{inviteError && <p className="mu-field-error" role="alert" aria-live="polite">{inviteError}</p>}</div>
            <footer className="mu-modal-footer"><button type="button" className="btn btn-outline" disabled={inviteBusy} onClick={() => !inviteBusy && setInviteOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={inviteBusy}>{inviteBusy ? "Saving…" : "Create invite"}</button></footer>
          </form>}
        </section>
      </div></div>, document.body)}
      {confirm && createPortal(<div className="michael-ui"><div className="mu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && setConfirm(null)}>
        <section className="mu-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="teacher-confirm-title">
          <header className="mu-modal-header"><h2 className="mu-section-title" id="teacher-confirm-title">{confirm.kind === "invite" ? "Revoke invite?" : `${confirm.active ? "Deactivate" : "Reactivate"} teacher?`}</h2><button className="mu-modal-close" type="button" aria-label="Close" disabled={busy} onClick={() => !busy && setConfirm(null)}>×</button></header>
          <form noValidate onSubmit={(event) => { event.preventDefault(); if (confirm.kind === "invite") void runRevoke(); else void runStatusChange(); }}>
            <div className="mu-modal-body"><p>{confirm.kind === "invite" ? "This invite can no longer be used to register." : `${confirm.active ? "Deactivate" : "Reactivate"} ${confirm.name}?`}</p>{confirmError && <p className="mu-field-error" role="alert" aria-live="polite">{confirmError}</p>}</div>
            <footer className="mu-modal-footer"><button type="button" className="btn btn-outline" disabled={busy} onClick={() => !busy && setConfirm(null)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{confirmSucceeded ? "✓" : busy ? "Saving…" : "Confirm"}</button></footer>
          </form>
        </section>
      </div></div>, document.body)}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
    </div>
  );
}
