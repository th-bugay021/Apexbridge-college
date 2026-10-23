import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createClass, deleteClass, getClasses, getMyClasses, updateClass } from "../../../api/classes";
import ConfirmDialog from "../../../Components/Michael/Teachers/ConfirmDialog";
import Toast from "../../../Components/Michael/Teachers/Toast";
import { useAuth } from "../../../Context/AuthContext";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "../shared/michael-ui.css";
import "./academics.css";

const emptyPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
const emptyValues = { name: "", level: "" };

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const nameRef = useRef(null);
  const levelRef = useRef(null);

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
    } finally {
      setLoading(false);
    }
  }, [isAdmin, pagination.limit, pagination.page, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!modal) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) setModal(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal, busy]);

  const openAdd = () => {
    setFieldErrors({});
    setFormError("");
    setSaveSucceeded(false);
    setModal({ values: { ...emptyValues } });
  };

  const openEdit = (classItem) => {
    setFieldErrors({});
    setFormError("");
    setSaveSucceeded(false);
    setModal({ classItem, values: { name: classItem.name, level: classItem.level || "" } });
  };

  const updateField = (field, value) => {
    setModal((current) => ({ ...current, values: { ...current.values, [field]: value } }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const trimmed = value.trim();
      const isValid = field === "name" ? trimmed.length > 0 && trimmed.length <= 100 : trimmed.length <= 50;
      return isValid ? { ...current, [field]: "" } : current;
    });
    setFormError("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (!modal || busy) return;
    const values = { name: modal.values.name.trim(), level: modal.values.level.trim() || null };
    const nextErrors = {};
    if (!values.name) nextErrors.name = "Class name is required.";
    else if (values.name.length > 100) nextErrors.name = "Class name must be 100 characters or fewer.";
    if (values.level && values.level.length > 50) nextErrors.level = "Level must be 50 characters or fewer.";
    setFieldErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) {
      if (nextErrors.name) nameRef.current?.focus();
      else levelRef.current?.focus();
      return;
    }

    setBusy(true);
    setSaveSucceeded(false);
    try {
      if (modal.classItem) await updateClass(modal.classItem.id, values);
      else await createClass(values);
      setToast({ type: "success", message: `Class ${modal.classItem ? "updated" : "created"}.` });
      setSaveSucceeded(true);
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      setModal(null);
      setFieldErrors({});
      setSaveSucceeded(false);
      await load();
    } catch (requestError) {
      const message = apiErrorMessage(requestError, "class");
      const responseError = requestError?.response?.data?.error;
      const fieldHint = responseError?.field || responseError?.details?.field;
      const lowerMessage = String(responseError?.message || message).toLowerCase();
      const targetField = fieldHint === "name" || /name|duplicate|already exists|already in use/.test(lowerMessage)
        ? "name"
        : fieldHint === "level" || /level/.test(lowerMessage)
          ? "level"
          : null;
      if (targetField) {
        setFieldErrors((current) => ({ ...current, [targetField]: message }));
        (targetField === "name" ? nameRef : levelRef).current?.focus();
      } else {
        setFormError(message);
      }
      setToast({ type: "error", message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm || busy) return;
    setBusy(true);
    try {
      await deleteClass(confirm.id);
      setConfirm(null);
      setToast({ type: "success", message: "Class deleted." });
      await load();
    } catch (requestError) {
      setToast({ type: "error", message: apiErrorMessage(requestError, "class") });
    } finally {
      setBusy(false);
    }
  };

  const hasSearch = Boolean(query || search.trim());
  const pageTitle = isAdmin ? "Classes" : user?.role === "TEACHER" ? "My classes" : "My class";
  const columns = isAdmin ? 5 : 4;

  return <div className="michael-ui">
    <main className="mu-page-content">
      <header className="mu-page-header">
        <div>
          <h1 className="mu-page-title">{pageTitle}</h1>
          <p className="mu-caption">{isAdmin ? "Manage classes, students and subject assignments." : "View your classes and assigned subjects."}</p>
        </div>
        {isAdmin && <div className="mu-page-header-actions"><button className="btn btn-primary" type="button" onClick={openAdd}>Add class</button></div>}
      </header>

      <section className="card mu-card" aria-label="Class list">
        {isAdmin && <div className="academic-list-toolbar">
          <div className="mu-field">
            <label className="mu-field-label" htmlFor="class-search">Search classes</label>
            <input className="input mu-field-control" id="class-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Class name or level" />
          </div>
        </div>}

        {loading ? <div className="mu-table-wrap" role="status" aria-label="Loading classes">
          <table className="mu-table" aria-hidden="true"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={columns}><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table>
        </div> : error ? <div className="mu-empty-state" role="alert">
          <p>{error}</p>
          <button className="btn btn-outline" type="button" onClick={load}>Retry</button>
        </div> : classes.length === 0 ? <div className="mu-empty-state">
          <strong className="mu-empty-title">{isAdmin && hasSearch ? "No classes match your search" : "No classes yet"}</strong>
          {isAdmin && !hasSearch && <button className="btn btn-primary" type="button" onClick={openAdd}>Add class</button>}
        </div> : <div className="mu-table-wrap">
          <table className="mu-table">
            <thead><tr><th scope="col">Class</th><th scope="col">Level</th>{isAdmin ? <><th scope="col">Students</th><th scope="col">Subjects</th></> : <th scope="col">Assigned subjects</th>}<th scope="col">Actions</th></tr></thead>
            <tbody>{classes.map((classItem) => <tr key={classItem.id}>
              <td>{isAdmin ? <Link to={`/classes/${classItem.id}`}>{classItem.name}</Link> : classItem.name}</td>
              <td><span className="mu-badge mu-badge-neutral">{classItem.level || "Not set"}</span></td>
              {isAdmin ? <>
                <td>{classItem.studentCount ?? classItem.students?.length ?? 0}</td>
                <td>{classItem.subjectCount ?? classItem.subjects?.length ?? 0}</td>
              </> : <td>{classItem.subjects?.length ? classItem.subjects.map((assignment) => assignment.subject.name).join(", ") : "No subjects assigned"}</td>}
              <td><div className="mu-section-header-actions">
                {isAdmin && <>
                  <Link className="btn mu-btn-row-action" to={`/classes/${classItem.id}`}>View</Link>
                  <button className="btn mu-btn-row-action" type="button" onClick={() => openEdit(classItem)}>Edit</button>
                  <button className="btn mu-btn-danger" type="button" onClick={() => setConfirm(classItem)}>Delete</button>
                </>}
                {!isAdmin && user?.role === "TEACHER" && <Link className="btn mu-btn-row-action" to={`/classes/${classItem.id}`}>View details</Link>}
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>}

        {isAdmin && !loading && !error && pagination.total > 0 && <nav className="mu-pagination" aria-label="Class pages">
          <span>{pagination.total} {pagination.total === 1 ? "class" : "classes"}</span>
          <div className="mu-pagination-controls">
            <button className="btn btn-outline" type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
            <span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span>
            <button className="btn btn-outline" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
          </div>
        </nav>}
      </section>
    </main>

    {modal && <div className="mu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && setModal(null)}>
      <section className="mu-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="class-form-title">
        <header className="mu-modal-header">
          <h2 className="mu-section-title" id="class-form-title">{modal.classItem ? "Edit class" : "Add class"}</h2>
          <button className="mu-modal-close" type="button" aria-label="Close" disabled={busy} onClick={() => !busy && setModal(null)}>×</button>
        </header>
        <form noValidate onSubmit={save}>
          <div className="mu-modal-body">
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="class-name">Class name</label>
              <input ref={nameRef} className="input mu-field-control" id="class-name" autoFocus maxLength={100} value={modal.values.name} onChange={(event) => updateField("name", event.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "class-name-error" : undefined} />
              {fieldErrors.name && <span className="mu-field-error" id="class-name-error">{fieldErrors.name}</span>}
            </div>
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="class-level">Level <span className="mu-caption">(optional)</span></label>
              <input ref={levelRef} className="input mu-field-control" id="class-level" maxLength={50} value={modal.values.level} onChange={(event) => updateField("level", event.target.value)} aria-invalid={Boolean(fieldErrors.level)} aria-describedby={fieldErrors.level ? "class-level-error" : undefined} />
              {fieldErrors.level && <span className="mu-field-error" id="class-level-error">{fieldErrors.level}</span>}
            </div>
            {formError && <p className="mu-field-error" role="alert">{formError}</p>}
          </div>
          <footer className="mu-modal-footer">
            <button className="btn btn-outline" type="button" disabled={busy} onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={busy}>{saveSucceeded ? "✓ Saved" : busy ? "Saving…" : "Save"}</button>
          </footer>
        </form>
      </section>
    </div>}

    {confirm && <ConfirmDialog title="Delete class?" message={`Delete ${confirm.name}? The server will explain if students, subjects or attendance still depend on it.`} busy={busy} onCancel={() => !busy && setConfirm(null)} onConfirm={remove} />}
    <Toast toast={toast} onClose={() => setToast(null)} />
  </div>;
}
