import { useCallback, useEffect, useRef, useState } from "react";
import { createSubject, deleteSubject, getSubjects, updateSubject } from "../../../api/subjects";
import ConfirmDialog from "../../../Components/Michael/Teachers/ConfirmDialog";
import Toast from "../../../Components/Michael/Teachers/Toast";
import ResponsiveTable from "../../../Components/common/ResponsiveTable";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "../shared/michael-ui.css";
import "./academics.css";

const emptyPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
const emptyValues = { name: "", code: "" };

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const nameRef = useRef(null);
  const codeRef = useRef(null);

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
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.page, query]);

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

  const openEdit = (subject) => {
    setFieldErrors({});
    setFormError("");
    setSaveSucceeded(false);
    setModal({ subject, values: { name: subject.name, code: subject.code } });
  };

  const updateField = (field, value) => {
    setModal((current) => ({ ...current, values: { ...current.values, [field]: value } }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const trimmed = value.trim();
      const isValid = field === "name"
        ? trimmed.length > 0 && trimmed.length <= 100
        : trimmed.length > 0 && trimmed.length <= 32;
      return isValid ? { ...current, [field]: "" } : current;
    });
    setFormError("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (!modal || busy) return;

    const values = { name: modal.values.name.trim(), code: modal.values.code.trim() };
    const nextErrors = {};
    if (!values.name) nextErrors.name = "Subject name is required.";
    else if (values.name.length > 100) nextErrors.name = "Subject name must be 100 characters or fewer.";
    if (!values.code) nextErrors.code = "Subject code is required.";
    else if (values.code.length > 32) nextErrors.code = "Subject code must be 32 characters or fewer.";
    setFieldErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) {
      if (nextErrors.name) nameRef.current?.focus();
      else codeRef.current?.focus();
      return;
    }

    setBusy(true);
    setSaveSucceeded(false);
    try {
      if (modal.subject) await updateSubject(modal.subject.id, values);
      else await createSubject(values);
      setToast({ type: "success", message: `Subject ${modal.subject ? "updated" : "created"}.` });
      setSaveSucceeded(true);
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      setModal(null);
      setFieldErrors({});
      setSaveSucceeded(false);
      await load();
    } catch (requestError) {
      const message = apiErrorMessage(requestError, "subject");
      const responseError = requestError?.response?.data?.error;
      const fieldHint = responseError?.field || responseError?.details?.field;
      const lowerMessage = String(responseError?.message || message).toLowerCase();
      const targetField = fieldHint === "code" || /code|duplicate|already exists|already in use/.test(lowerMessage)
        ? "code"
        : fieldHint === "name" || /name/.test(lowerMessage)
          ? "name"
          : null;
      if (targetField) {
        setFieldErrors((current) => ({ ...current, [targetField]: message }));
        (targetField === "name" ? nameRef : codeRef).current?.focus();
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
      await deleteSubject(confirm.id);
      setSubjects((current) => current.filter((item) => item.id !== confirm.id));
      setConfirm(null);
      setToast({ type: "success", message: "Subject deleted." });
      await load();
    } catch (requestError) {
      setToast({ type: "error", message: apiErrorMessage(requestError, "subject") });
    } finally {
      setBusy(false);
    }
  };

  const hasSearch = Boolean(query || search.trim());
  const tableColumns = [
    { key: "name", label: "Name", primary: true, render: (subject) => subject.name },
    { key: "code", label: "Code", render: (subject) => <span className="mu-badge mu-badge-neutral">{subject.code}</span> },
    { key: "actions", label: "Actions", actions: true, render: (subject) => <div className="mu-section-header-actions"><button className="btn mu-btn-row-action" type="button" onClick={() => openEdit(subject)}>Edit</button><button className="btn mu-btn-danger" type="button" onClick={() => setConfirm(subject)}>Delete</button></div> },
  ];

  return <div className="michael-ui">
    <main className="mu-page-content">
      <header className="mu-page-header">
        <div>
          <h1 className="mu-page-title">Subjects</h1>
          <p className="mu-caption">Manage the subjects offered at the school.</p>
        </div>
        <div className="mu-page-header-actions">
          <button className="btn btn-primary" type="button" onClick={openAdd}>Add subject</button>
        </div>
      </header>

      <section className="card mu-card" aria-label="Subject list">
        <div className="academic-list-toolbar">
          <div className="mu-field">
            <label className="mu-field-label" htmlFor="subject-search">Search subjects</label>
            <input className="input mu-field-control" id="subject-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or code" />
          </div>
        </div>

        {loading ? <div className="mu-table-wrap" role="status" aria-label="Loading subjects">
          <table className="mu-table" aria-hidden="true"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan="3"><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table>
        </div> : error ? <div className="mu-empty-state" role="alert">
          <p>{error}</p>
          <button className="btn btn-outline" type="button" onClick={load}>Retry</button>
        </div> : subjects.length === 0 ? <div className="mu-empty-state">
          <strong className="mu-empty-title">{hasSearch ? "No subjects match your search" : "No subjects yet"}</strong>
          {!hasSearch && <button className="btn btn-primary" type="button" onClick={openAdd}>Add subject</button>}
        </div> : <ResponsiveTable columns={tableColumns} rows={subjects} rowKey={(subject) => subject.id} primary={(subject) => subject.name} secondary={(subject) => subject.code} label="Subjects" />}

        {!loading && !error && pagination.total > 0 && <nav className="mu-pagination" aria-label="Subject pages">
          <span>{pagination.total} {pagination.total === 1 ? "subject" : "subjects"}</span>
          <div className="mu-pagination-controls">
            <button className="btn btn-outline" type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
            <span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span>
            <button className="btn btn-outline" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
          </div>
        </nav>}
      </section>
    </main>

    {modal && <div className="mu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && setModal(null)}>
      <section className="mu-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="subject-form-title">
        <header className="mu-modal-header">
          <h2 className="mu-section-title" id="subject-form-title">{modal.subject ? "Edit subject" : "Add subject"}</h2>
          <button className="mu-modal-close" type="button" aria-label="Close" disabled={busy} onClick={() => !busy && setModal(null)}>×</button>
        </header>
        <form noValidate onSubmit={save}>
          <div className="mu-modal-body">
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="subject-name">Subject name</label>
              <input ref={nameRef} className="input mu-field-control" id="subject-name" autoFocus maxLength={100} value={modal.values.name} onChange={(event) => updateField("name", event.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "subject-name-error" : undefined} />
              {fieldErrors.name && <span className="mu-field-error" id="subject-name-error">{fieldErrors.name}</span>}
            </div>
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="subject-code">Code</label>
              <input ref={codeRef} className="input mu-field-control" id="subject-code" maxLength={32} value={modal.values.code} onChange={(event) => updateField("code", event.target.value)} aria-invalid={Boolean(fieldErrors.code)} aria-describedby={fieldErrors.code ? "subject-code-error subject-code-hint" : "subject-code-hint"} />
              <span className="mu-field-hint" id="subject-code-hint">Short code, like MATH</span>
              {fieldErrors.code && <span className="mu-field-error" id="subject-code-error">{fieldErrors.code}</span>}
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

    {confirm && <ConfirmDialog title="Delete subject?" message={`Delete ${confirm.name}? If it is assigned or has results, the server will explain why it cannot be removed.`} busy={busy} onCancel={() => !busy && setConfirm(null)} onConfirm={remove} />}
    <Toast toast={toast} onClose={() => setToast(null)} />
  </div>;
}
