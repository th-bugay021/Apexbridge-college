import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createClass, deleteClass, getClasses, getMyClasses, updateClass } from "../../../api/classes";
import ConfirmDialog from "../../../Components/Michael/Teachers/ConfirmDialog";
import Toast from "../../../Components/Michael/Teachers/Toast";
import { useAuth } from "../../../Context/AuthContext";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "./academics.css";

const emptyPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function Classes() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const [classes, setClasses] = useState([]);
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
      if (isAdmin) {
        const result = await getClasses({ page: pagination.page, limit: pagination.limit, search: query });
        setClasses(result.classes);
        setPagination(result.pagination);
      } else {
        const ownClasses = await getMyClasses();
        setClasses(ownClasses);
      }
    } catch (requestError) {
      const message = apiErrorMessage(requestError, "classes");
      setError(message);
      setToast({ type: "error", message });
    } finally { setLoading(false); }
  }, [isAdmin, pagination.limit, pagination.page, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    const values = { name: modal.values.name.trim(), level: modal.values.level.trim() || null };
    if (!values.name || values.name.length > 100 || (values.level && values.level.length > 50)) {
      setToast({ type: "error", message: "Enter a class name up to 100 characters and a level up to 50 characters." });
      return;
    }
    setBusy(true);
    try {
      if (modal.classItem) await updateClass(modal.classItem.id, values);
      else await createClass(values);
      setModal(null);
      setToast({ type: "success", message: `Class ${modal.classItem ? "updated" : "created"}.` });
      await load();
    } catch (requestError) {
      setToast({ type: "error", message: apiErrorMessage(requestError, "class") });
    } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteClass(confirm.id);
      setConfirm(null);
      setToast({ type: "success", message: "Class deleted." });
      await load();
    } catch (requestError) {
      setToast({ type: "error", message: apiErrorMessage(requestError, "class") });
    } finally { setBusy(false); }
  };

  return <main className="teacher-page">
    <header className="teacher-page-header"><div><h1>{isAdmin ? "Classes" : user?.role === "TEACHER" ? "My classes" : "My class"}</h1><p>{isAdmin ? "Manage classes, students and subject assignments." : "View your classes and assigned subjects."}</p></div>{isAdmin && <button className="btn btn-primary" type="button" onClick={() => setModal({ values: { name: "", level: "" } })}>Add class</button>}</header>
    <section className="teacher-card">
      {isAdmin && <div className="academic-list-toolbar"><label className="teacher-search">Search classes<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Class name or level" /></label></div>}
      {loading ? <p className="teacher-state" role="status">Loading classes…</p> : error ? <div className="teacher-state teacher-error"><p>{error}</p><button className="btn btn-outline" type="button" onClick={load}>Retry</button></div> : classes.length === 0 ? <p className="teacher-state">{isAdmin ? "No classes found. Add a class or try another search." : "No class information is available for your account yet."}</p> : <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Class</th><th>Level</th>{isAdmin && <><th>Students</th><th>Subjects</th></>}{!isAdmin && <th>Assigned subjects</th>}<th>Actions</th></tr></thead><tbody>{classes.map((classItem) => <tr key={classItem.id}><td>{isAdmin ? <Link to={`/classes/${classItem.id}`}>{classItem.name}</Link> : classItem.name}</td><td>{classItem.level || "—"}</td>{isAdmin && <><td>{classItem.studentCount ?? classItem.students?.length ?? 0}</td><td>{classItem.subjectCount ?? classItem.subjects?.length ?? 0}</td></>}{!isAdmin && <td>{classItem.subjects?.length ? classItem.subjects.map((assignment) => assignment.subject.name).join(", ") : "No subjects assigned"}</td>}<td><div className="teacher-row-actions">{isAdmin && <><Link to={`/classes/${classItem.id}`}>View</Link><button className="teacher-text-button" type="button" onClick={() => setModal({ classItem, values: { name: classItem.name, level: classItem.level || "" } })}>Edit</button><button className="teacher-text-button" type="button" onClick={() => setConfirm(classItem)}>Delete</button></>}{!isAdmin && user?.role === "TEACHER" && <Link to={`/classes/${classItem.id}`}>View details</Link>}</div></td></tr>)}</tbody></table></div>}
      {isAdmin && !loading && !error && pagination.total > 0 && <nav className="teacher-pagination" aria-label="Class pages"><span>{pagination.total} {pagination.total === 1 ? "class" : "classes"}</span><div><button className="btn btn-outline" type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span><button className="btn btn-outline" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div></nav>}
    </section>
    {modal && <div className="teacher-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && setModal(null)}><section className="teacher-modal academic-modal" role="dialog" aria-modal="true" aria-labelledby="class-form-title"><button className="teacher-modal-close" type="button" aria-label="Close" disabled={busy} onClick={() => setModal(null)}>×</button><h2 id="class-form-title">{modal.classItem ? "Edit class" : "Add class"}</h2><form className="academic-form" onSubmit={save}><label>Class name<input autoFocus required maxLength={100} value={modal.values.name} onChange={(event) => setModal((current) => ({ ...current, values: { ...current.values, name: event.target.value } }))} /></label><label>Level <span className="academic-muted">(optional)</span><input maxLength={50} value={modal.values.level} onChange={(event) => setModal((current) => ({ ...current, values: { ...current.values, level: event.target.value } }))} /></label><div className="academic-form-actions"><button className="btn btn-outline" type="button" disabled={busy} onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</button></div></form></section></div>}
    {confirm && <ConfirmDialog title="Delete class?" message={`Delete ${confirm.name}? The server will explain if students, subjects or attendance still depend on it.`} busy={busy} onCancel={() => setConfirm(null)} onConfirm={remove} />}
    <Toast toast={toast} onClose={() => setToast(null)} />
  </main>;
}
