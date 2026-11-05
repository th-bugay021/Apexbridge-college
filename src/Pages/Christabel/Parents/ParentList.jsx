import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../../Context/AuthContext';
import { createParent, deleteParent, getParent, getParents, linkStudentToParent, unlinkStudentFromParent, updateParent } from '../../../api/parents';
import useDebounce from '../../../hooks/useDebounce';
import AddParent from './AddParent';
import ConfirmDialog from '../ConfirmDialog';
import { parentApiErrorMessage, parentFromApi, parentToApi } from './parentAdapter';
import '../studentPages.css';
import '../../Michael/shared/michael-ui.css';

const PAGE_SIZE = 8;

export default function ParentList() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('parents.create');
  const canUpdate = hasPermission('parents.update');
  const canDelete = hasPermission('parents.delete');
  const canLinkStudents = canUpdate && hasPermission('students.view');
  const [parents, setParents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loadedRequestKey, setLoadedRequestKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState(null);
  const [guardianToDelete, setGuardianToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const query = useDebounce(search.trim(), 400);
  const addButtonRef = useRef(null);
  const actionButtonRef = useRef(null);
  const fetchIdRef = useRef(0);
  const requestKey = `${page}|${query}`;
  const loading = loadedRequestKey !== requestKey;

  const loadParents = useCallback(async () => {
    const fetchId = fetchIdRef.current + 1;
    fetchIdRef.current = fetchId;
    try {
      const result = await getParents({ page, limit: PAGE_SIZE, search: query });
      if (fetchId !== fetchIdRef.current) return;
      setError('');
      const totalPages = Math.max(1, result.pagination.totalPages);
      if (page > totalPages) {
        setPage(totalPages);
        return;
      }
      setParents(result.parents.map(parentFromApi));
      setPagination(result.pagination);
    } catch (loadError) {
      if (fetchId !== fetchIdRef.current) return;
      setParents([]);
      setError(parentApiErrorMessage(loadError));
    } finally {
      if (fetchId === fetchIdRef.current) setLoadedRequestKey(requestKey);
    }
  }, [page, query, requestKey]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) loadParents(); });
    return () => { active = false; fetchIdRef.current += 1; };
  }, [loadParents]);

  const saveParent = async (values) => {
    try {
      if (editingGuardian) {
        await updateParent(editingGuardian.id, parentToApi(values));
        const latest = await getParent(editingGuardian.id);
        const currentIds = new Set((latest.students || []).map((student) => student.id));
        const selectedIds = new Set(values.studentIds);
        for (const studentId of selectedIds) {
          if (!currentIds.has(studentId)) await linkStudentToParent(editingGuardian.id, studentId);
        }
        for (const studentId of currentIds) {
          if (!selectedIds.has(studentId)) await unlinkStudentFromParent(editingGuardian.id, studentId);
        }
      } else {
        const created = await createParent(parentToApi(values, { creating: true }));
        let linkFailure = '';
        for (const studentId of values.studentIds) {
          try { await linkStudentToParent(created.id, studentId); }
          catch (linkError) { linkFailure = parentApiErrorMessage(linkError); break; }
        }
        if (linkFailure) setNotice(`Parent created, but selected students could not all be linked: ${linkFailure}`);
      }
      await loadParents();
      return '';
    } catch (saveError) {
      return parentApiErrorMessage(saveError);
    }
  };

  const openEdit = (guardian, event) => {
    actionButtonRef.current = event.currentTarget;
    setEditingGuardian(guardian);
    setShowForm(true);
  };

  const openDelete = (guardian, event) => {
    actionButtonRef.current = event.currentTarget;
    setDeleteError('');
    setGuardianToDelete(guardian);
  };

  const confirmGuardianDelete = async () => {
    if (!guardianToDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteParent(guardianToDelete.id);
      setGuardianToDelete(null);
      await loadParents();
    } catch (deleteFailure) {
      setDeleteError(parentApiErrorMessage(deleteFailure));
    } finally {
      setDeleting(false);
    }
  };

  const closeForm = () => { setShowForm(false); setEditingGuardian(null); };
  const pageCount = Math.max(1, pagination.totalPages);

  return (
    <div className="michael-ui students-ui">
      <main className="mu-page-content">
        <header className="mu-page-header">
          <div><h1 className="mu-page-title">Parents &amp; guardians</h1><p className="mu-caption">{pagination.total} guardian contacts and linked students.</p></div>
          <div className="mu-page-header-actions">{canCreate && <button ref={addButtonRef} type="button" className="btn btn-primary" onClick={() => { setEditingGuardian(null); setNotice(''); setShowForm(true); }}><Plus size={16} /> Add parent</button>}</div>
        </header>
        <section className="card mu-card students-list-card" aria-label="Parents and guardians">
          <div className="mu-toolbar students-toolbar"><label className="mu-field mu-toolbar-search"><span className="mu-field-label">Search guardians</span><input className="input mu-field-control" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Name, email or phone" /></label></div>
          {notice && <p className="mu-field-error" role="alert">{notice}</p>}
          {error && !loading && parents.length > 0 && <p className="mu-field-error" role="alert">{error}</p>}
          {loading ? <div className="mu-empty-state" role="status">Loading parents and guardians…</div> : error && parents.length === 0 ? <div className="mu-empty-state" role="alert"><strong className="mu-empty-title">Parents could not be loaded.</strong><p>{error}</p></div> : parents.length === 0 ? <div className="mu-empty-state"><strong className="mu-empty-title">No guardians found.</strong><p className="mu-empty-hint">Try another search.</p></div> : <div className="students-parent-grid">{parents.map((guardian) => {
            const linkedStudents = guardian.students;
            return <article className="card students-parent-card" key={guardian.id}>
              <div className="students-parent-heading"><span className="students-avatar">{guardian.firstName[0] || 'P'}{guardian.lastName[0] || ''}</span><div><h2>{guardian.firstName} {guardian.lastName}</h2><p className="mu-caption">{guardian.relationship}{guardian.occupation ? ` · ${guardian.occupation}` : ''}</p></div></div>
              <dl className="students-contact-list"><div><dt>Email</dt><dd>{guardian.email || 'Not provided'}</dd></div><div><dt>Phone</dt><dd>{guardian.phone || 'Not provided'}</dd></div><div><dt>Address</dt><dd>{guardian.address || 'Not provided'}</dd></div></dl>
              <div className="students-linked-children"><h3>Linked students <span className="mu-badge mu-badge-neutral">{linkedStudents.length}</span></h3>{linkedStudents.length ? linkedStudents.map((student) => <Link key={student.id} to={`/students/${student.id}`}>{student.firstName} {student.lastName} · {student.className}</Link>) : <p className="mu-caption">No students linked yet.</p>}</div>
              <div className="students-parent-actions" aria-label={`Actions for ${guardian.firstName} ${guardian.lastName}`}>
                {canUpdate && <button type="button" className="btn btn-outline" onClick={(event) => openEdit(guardian, event)}><Pencil size={15} /> Edit</button>}
                {canDelete && <button type="button" className="btn students-parent-delete" onClick={(event) => openDelete(guardian, event)}><Trash2 size={15} /> Delete</button>}
              </div>
            </article>;
          })}</div>}
          {!loading && !error && pagination.total > 0 && <nav className="mu-pagination" aria-label="Parent pages"><span>{pagination.total} {pagination.total === 1 ? 'parent' : 'parents'}</span><div className="mu-pagination-controls"><button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" className="btn btn-outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</button></div></nav>}
        </section>
      </main>
      {showForm && <AddParent key={editingGuardian?.id || 'new-parent'} guardian={editingGuardian} canManageLinks={canLinkStudents} onCancel={closeForm} onSave={saveParent} returnFocusRef={editingGuardian ? actionButtonRef : addButtonRef} />}
      {guardianToDelete && <ConfirmDialog title="Delete parent or guardian?" message={`Delete ${guardianToDelete.firstName} ${guardianToDelete.lastName}? This will unlink them from students.`} error={deleteError} busy={deleting} onCancel={() => !deleting && setGuardianToDelete(null)} onConfirm={confirmGuardianDelete} returnFocusRef={actionButtonRef} />}
    </div>
  );
}
