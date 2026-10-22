import { useCallback, useEffect, useState } from "react";
import { createSubject, deleteSubject, getSubjects, updateSubject } from "../../../api/subjects";
import ConfirmDialog from "../../../Components/Michael/Teachers/ConfirmDialog";
import Toast from "../../../Components/Michael/Teachers/Toast";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "./academics.css";

const emptyPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPagination((current) => ({ ...current, page: 1 }));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getSubjects({ page: pagination.page, limit: pagination.limit, search: query });
      setSubjects(result.subjects);
      setPagination(result.pagination);
    } catch (requestError) {
      const message = apiErrorMessage(requestError, "subjects");
      setError(message);
      setToast({ type: "error", message });
    } finally { setLoading(false); }
  }, [pagination.limit, pagination.page, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    const values = { name: modal.values.name.trim(), code: modal.values.code.trim() };
    if (!values.name || values.name.length > 100 || !values.code || values.code.length > 32) {
      setToast({ type: "error", message: "Enter a subject name (up to 100 characters) and code (up to 32 characters)." });
      return;
    }
    setBusy(true);
    try {
      if (modal.subject) await updateSubject(modal.subject.id, values);
      else await createSubject(values);
      setModal(null);
      setToast({ type: "success", message: `Subject ${modal.subject ? "updated" : "created"}.` });
      await load();
    } catch (requestError) {
      setToast({ type: "error", message: apiErrorMessage(requestError, "subject") });
    } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteSubject(confirm.id);
      setSubjects((current) => current.filter((item) => item.id !== confirm.id));
      setConfirm(null);
      setToast({ type: "success", message: "Subject deleted." });
      await load();
    } catch (requestError) {
      setToast({ type: "error", message: apiErrorMessage(requestError, "subject") });
    } finally { setBusy(false); }
  };

  return <main className="teacher-page">
    <header className="teacher-page-header"><div><h1>Subjects</h1><p>Manage the subjects offered at the school.</p></div><button className="btn btn-primary" type="button" onClick={() => setModal({ values: { name: "", code: "" } })}>Add subject</button></header>
    <section className="teacher-card">
      <div className="academic-list-toolbar"><label className="teacher-search">Search subjects<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or code" /></label></div>
      {loading ? <p className="teacher-state" role="status">Loading subjects…</p> : error ? <div className="teacher-state teacher-error"><p>{error}</p><button className="btn btn-outline" type="button" onClick={load}>Retry</button></div> : subjects.length === 0 ? <p className="teacher-state">No subjects found. Add a subject or try another search.</p> : <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Name</th><th>Code</th><th>Actions</th></tr></thead><tbody>{subjects.map((subject) => <tr key={subject.id}><td>{subject.name}</td><td>{subject.code}</td><td><div className="teacher-row-actions"><button className="teacher-text-button" type="button" onClick={() => setModal({ subject, values: { name: subject.name, code: subject.code } })}>Edit</button><button className="teacher-text-button" type="button" onClick={() => setConfirm(subject)}>Delete</button></div></td></tr>)}</tbody></table></div>}
      {!loading && !error && pagination.total > 0 && <nav className="teacher-pagination" aria-label="Subject pages"><span>{pagination.total} {pagination.total === 1 ? "subject" : "subjects"}</span><div><button className="btn btn-outline" type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span><button className="btn btn-outline" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div></nav>}
    </section>
    {modal && <div className="teacher-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && setModal(null)}><section className="teacher-modal academic-modal" role="dialog" aria-modal="true" aria-labelledby="subject-form-title"><button className="teacher-modal-close" type="button" aria-label="Close" disabled={busy} onClick={() => setModal(null)}>×</button><h2 id="subject-form-title">{modal.subject ? "Edit subject" : "Add subject"}</h2><form className="academic-form" onSubmit={save}><label>Subject name<input autoFocus maxLength={100} required value={modal.values.name} onChange={(event) => setModal((current) => ({ ...current, values: { ...current.values, name: event.target.value } }))} /></label><label>Code<input maxLength={32} required value={modal.values.code} onChange={(event) => setModal((current) => ({ ...current, values: { ...current.values, code: event.target.value } }))} /></label><div className="academic-form-actions"><button className="btn btn-outline" type="button" disabled={busy} onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</button></div></form></section></div>}
    {confirm && <ConfirmDialog title="Delete subject?" message={`Delete ${confirm.name}? If it is assigned or has results, the server will explain why it cannot be removed.`} busy={busy} onCancel={() => setConfirm(null)} onConfirm={remove} />}
    <Toast toast={toast} onClose={() => setToast(null)} />
  </main>;
}
