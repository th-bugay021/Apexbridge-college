import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../../Context/AuthContext";
import useDebounce from "../../../hooks/useDebounce";
import useStudentSampleData from "../useStudentSampleData";
import AddParent from "./AddParent";
import ConfirmDialog from "../ConfirmDialog";
import "../studentPages.css";
import "../../Michael/shared/michael-ui.css";

export default function ParentList() {
  const { hasPermission } = useAuth();
  const { guardians, students, addGuardian, updateGuardian, deleteGuardian, loading } = useStudentSampleData();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState(null);
  const [guardianToDelete, setGuardianToDelete] = useState(null);
  const query = useDebounce(search.trim().toLowerCase(), 400);
  const addButtonRef = useRef(null);
  const actionButtonRef = useRef(null);
  const canCreate = hasPermission("parents.create");
  const canDelete = hasPermission("parents.view");
  const shown = useMemo(() => guardians.filter((guardian) => `${guardian.firstName} ${guardian.lastName} ${guardian.email}`.toLowerCase().includes(query)), [guardians, query]);

  const saveParent = (values) => {
    if (editingGuardian) updateGuardian(editingGuardian.id, values);
    else addGuardian(values);
    setShowForm(false);
    setEditingGuardian(null);
  };

  const openEdit = (guardian, event) => {
    actionButtonRef.current = event.currentTarget;
    setEditingGuardian(guardian);
    setShowForm(true);
  };

  const openDelete = (guardian, event) => {
    actionButtonRef.current = event.currentTarget;
    setGuardianToDelete(guardian);
  };

  const confirmGuardianDelete = () => {
    if (!guardianToDelete) return;
    deleteGuardian(guardianToDelete.id);
    setGuardianToDelete(null);
  };

  return (
    <div className="michael-ui students-ui">
      <main className="mu-page-content">
        <header className="mu-page-header">
          <div><h1 className="mu-page-title">Parents &amp; guardians</h1><p className="mu-caption">Guardian contacts and linked students.</p></div>
          <div className="mu-page-header-actions"><span className="students-sample-tag">Sample data</span>{canCreate && <button ref={addButtonRef} type="button" className="btn btn-primary" onClick={() => { setEditingGuardian(null); setShowForm(true); }}><Plus size={16} /> Add parent</button>}</div>
        </header>
        <section className="card mu-card students-list-card" aria-label="Parents and guardians">
          <div className="mu-toolbar students-toolbar"><label className="mu-field mu-toolbar-search"><span className="mu-field-label">Search guardians</span><input className="input mu-field-control" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" /></label></div>
          {loading ? <div className="mu-empty-state" role="status">Loading sample guardians…</div> : shown.length === 0 ? <div className="mu-empty-state"><strong className="mu-empty-title">No guardians found.</strong><p className="mu-empty-hint">Try another search.</p></div> : <div className="students-parent-grid">{shown.map((guardian) => {
            const linkedStudents = students.filter((student) => (student.guardianIds || []).includes(guardian.id));
            return <article className="card students-parent-card" key={guardian.id}>
              <div className="students-parent-heading"><span className="students-avatar">{guardian.firstName[0]}{guardian.lastName[0]}</span><div><h2>{guardian.firstName} {guardian.lastName}</h2><p className="mu-caption">{guardian.relationship}{guardian.occupation ? ` · ${guardian.occupation}` : ""}</p></div></div>
              <dl className="students-contact-list"><div><dt>Email</dt><dd>{guardian.email || "Not provided"}</dd></div><div><dt>Phone</dt><dd>{guardian.phone || "Not provided"}</dd></div><div><dt>Address</dt><dd>{guardian.address || "Not provided"}</dd></div></dl>
              <div className="students-linked-children"><h3>Linked students <span className="mu-badge mu-badge-neutral">{linkedStudents.length}</span></h3>{linkedStudents.length ? linkedStudents.map((student) => <Link key={student.id} to={`/students/${student.id}`}>{student.firstName} {student.lastName} · {student.className}</Link>) : <p className="mu-caption">No students linked yet.</p>}</div>
              <div className="students-parent-actions" aria-label={`Actions for ${guardian.firstName} ${guardian.lastName}`}>
                {canCreate && <button type="button" className="btn btn-outline" onClick={(event) => openEdit(guardian, event)}><Pencil size={15} /> Edit</button>}
                {canDelete && <button type="button" className="btn students-parent-delete" onClick={(event) => openDelete(guardian, event)}><Trash2 size={15} /> Delete</button>}
              </div>
            </article>;
          })}</div>}
        </section>
      </main>
      {showForm && <AddParent key={editingGuardian?.id || "new-parent"} guardian={editingGuardian} onCancel={() => { setShowForm(false); setEditingGuardian(null); }} onSave={saveParent} returnFocusRef={editingGuardian ? actionButtonRef : addButtonRef} />}
      {guardianToDelete && <ConfirmDialog title="Delete parent or guardian?" message={`Delete ${guardianToDelete.firstName} ${guardianToDelete.lastName}? This will unlink them from students.`} onCancel={() => setGuardianToDelete(null)} onConfirm={confirmGuardianDelete} returnFocusRef={actionButtonRef} />}
    </div>
  );
}
