import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../../Context/AuthContext';
import { getClasses } from '../../../api/classes';
import { getAllParents, linkStudentToParent, unlinkStudentFromParent } from '../../../api/parents';
import { bulkDeleteStudents, createStudent, deleteStudent, getStudents, updateStudent } from '../../../api/students';
import useDebounce from '../../../hooks/useDebounce';
import ConfirmDialog from '../ConfirmDialog';
import AddStudent from './AddStudent';
import { classDisplayName, genderValueToApi, guardianFromApi, statusValueToApi, studentApiErrorMessage, studentFromApi, studentToApi } from './studentAdapter';
import '../studentPages.css';
import '../../Michael/shared/michael-ui.css';

const PAGE_SIZE = 8;

function statusTone(status) {
  return status === 'Active' ? 'mu-badge-success' : status === 'Inactive' ? 'mu-badge-neutral' : 'mu-badge-warning';
}

function csvValue(value) {
  const text = String(value ?? '');
  const safe = /^[-=+@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

async function loadAllClasses() {
  const firstPage = await getClasses({ page: 1, limit: 100 });
  const classes = [...firstPage.classes];
  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const nextPage = await getClasses({ page, limit: 100 });
    classes.push(...nextPage.classes);
  }
  return classes;
}

export default function StudentList() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('students.create');
  const canUpdate = hasPermission('students.update');
  const canDelete = hasPermission('students.delete');
  const canViewParents = hasPermission('parents.view');
  const canUpdateParents = hasPermission('parents.update');
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classesError, setClassesError] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [studentModal, setStudentModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const actionButtonRef = useRef(null);
  const fetchIdRef = useRef(0);
  const query = useDebounce(search.trim(), 400);

  const fetchStudents = useCallback(async () => {
    const fetchId = fetchIdRef.current + 1;
    fetchIdRef.current = fetchId;
    setLoading(true);
    setError('');
    try {
      const result = await getStudents({
        page,
        limit: PAGE_SIZE,
        search: query,
        ...(classFilter ? { classId: classFilter } : {}),
        ...(statusFilter ? { status: statusValueToApi(statusFilter) } : {}),
        ...(genderFilter ? { gender: genderValueToApi(genderFilter) } : {}),
        ...(departmentFilter ? { department: departmentFilter } : {}),
      });
      if (fetchId !== fetchIdRef.current) return;
      const totalPages = Math.max(1, result.pagination.totalPages);
      if (page > totalPages) {
        setPage(totalPages);
        return;
      }
      setStudents(result.students.map((student) => {
        const linkedParents = parents.filter((parent) => parent.students.some((linked) => linked.id === student.id));
        return studentFromApi(student, linkedParents.map((parent) => parent.id));
      }));
      setPagination(result.pagination);
    } catch (loadError) {
      if (fetchId !== fetchIdRef.current) return;
      setStudents([]);
      setError(studentApiErrorMessage(loadError));
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [classFilter, departmentFilter, genderFilter, page, parents, query, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    let active = true;
    loadAllClasses()
      .then((result) => { if (active) setClasses(result); })
      .catch((loadError) => { if (active) setClassesError(loadError.response?.data?.error?.message || 'Classes could not be loaded.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!canViewParents) {
      setParents([]);
      return () => { active = false; };
    }
    getAllParents()
      .then((result) => { if (active) setParents(result.map(guardianFromApi)); })
      .catch(() => { if (active) setParents([]); });
    return () => { active = false; };
  }, [canViewParents]);

  const visible = useMemo(() => [...students].sort((left, right) => {
    if (sort === 'name') return left.lastName.localeCompare(right.lastName) || left.firstName.localeCompare(right.firstName);
    const direction = sort === 'oldest' ? 1 : -1;
    return direction * (left.admissionDate || '').localeCompare(right.admissionDate || '');
  }), [sort, students]);
  const currentPage = page;
  const pageCount = Math.max(1, pagination.totalPages);
  const allVisibleSelected = visible.length > 0 && visible.every((student) => selected.includes(student.id));
  const parentsById = useMemo(() => new Map(parents.map((parent) => [parent.id, parent])), [parents]);
  const guardianName = (student) => student.guardianIds.map((id) => parentsById.get(id)?.fullName).filter(Boolean).join(', ') || '—';

  const updateFilter = (setter, value) => { setter(value); setPage(1); };
  const toggleOne = (id) => setSelected((current) => {
    if (current.includes(id)) return current.filter((item) => item !== id);
    if (current.length >= 100) {
      setError('You can select up to 100 students for bulk deletion at a time.');
      return current;
    }
    return [...current, id];
  });
  const toggleVisible = () => setSelected((current) => {
    if (allVisibleSelected) return current.filter((id) => !visible.some((student) => student.id === id));
    const combined = [...new Set([...current, ...visible.map((student) => student.id)])];
    if (combined.length > 100) {
      setError('You can select up to 100 students for bulk deletion at a time.');
      return current;
    }
    return combined;
  });
  const openStudentForm = (student, event) => { actionButtonRef.current = event.currentTarget; setStudentModal({ student: student || null }); };

  const syncGuardians = async (studentId, selectedGuardianIds) => {
    const currentParents = await getAllParents({ studentId });
    const currentIds = new Set(currentParents.map((parent) => parent.id));
    const selectedIds = new Set(selectedGuardianIds);
    for (const parentId of selectedIds) {
      if (!currentIds.has(parentId)) await linkStudentToParent(parentId, studentId);
    }
    for (const parentId of currentIds) {
      if (!selectedIds.has(parentId)) await unlinkStudentFromParent(parentId, studentId);
    }
  };

  const saveStudent = async (values) => {
    const selectedGuardianIds = values.guardianIds || [];
    let postSaveNotice = '';
    try {
      if (studentModal?.student) {
        await updateStudent(studentModal.student.id, studentToApi(values));
        setStudentModal(null);
        if (canViewParents && canUpdateParents) {
          try { await syncGuardians(studentModal.student.id, selectedGuardianIds); }
          catch (linkError) { postSaveNotice = `Student updated, but guardian links could not be saved: ${linkError.response?.data?.error?.message || linkError.message}`; }
        }
      } else {
        const created = await createStudent(studentToApi(values, { creating: true }));
        setStudentModal(null);
        if (selectedGuardianIds.length && canUpdateParents) {
          for (const parentId of selectedGuardianIds) {
            try { await linkStudentToParent(parentId, created.id); }
            catch (linkError) {
              postSaveNotice = `Student created, but a guardian could not be linked: ${linkError.response?.data?.error?.message || linkError.message}`;
              break;
            }
          }
        }
      }
      await fetchStudents();
      if (postSaveNotice) setError(postSaveNotice);
      return '';
    } catch (saveError) {
      return studentApiErrorMessage(saveError);
    }
  };

  const openDelete = (ids, message, event) => {
    actionButtonRef.current = event.currentTarget;
    setConfirm({ ids, message, error: '' });
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.ids.length === 1) await deleteStudent(confirm.ids[0]);
      else await bulkDeleteStudents(confirm.ids);
      setSelected((current) => current.filter((id) => !confirm.ids.includes(id)));
      setConfirm(null);
      await fetchStudents();
    } catch (deleteError) {
      setConfirm((current) => current ? { ...current, error: studentApiErrorMessage(deleteError) } : current);
    } finally {
      setDeleting(false);
    }
  };

  const exportRows = () => {
    const rows = visible.filter((student) => selected.length === 0 || selected.includes(student.id));
    const fields = ['Student ID', 'First name', 'Last name', 'Date of birth', 'Gender', 'Email', 'Phone', 'Address', 'Department', 'Class', 'Guardian', 'Admission date', 'Status'];
    const csv = [fields, ...rows.map((student) => [student.studentId, student.firstName, student.lastName, student.birthDate, student.gender, student.email, student.phone, student.address, student.department, student.className, guardianName(student), student.admissionDate, student.status])].map((row) => row.map(csvValue).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'apexbridge-students.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="michael-ui students-ui">
      <main className="mu-page-content">
        <header className="mu-page-header">
          <div><h1 className="mu-page-title">Students</h1><p className="mu-caption">{pagination.total} student records.</p></div>
          <div className="mu-page-header-actions"><Link className="btn btn-outline" to="/students/classes">Browse by class</Link><button type="button" className="btn btn-outline" onClick={exportRows}><Download size={16} /> Export{selected.length ? ` (${selected.length})` : ''}</button>{canCreate && <button type="button" className="btn btn-primary" onClick={(event) => openStudentForm(null, event)}><Plus size={16} /> Add student</button>}</div>
        </header>
        <section className="card mu-card students-list-card" aria-label="Student list">
          <div className="mu-toolbar students-toolbar">
            <label className="mu-field students-search"><span className="mu-field-label">Search students</span><input className="input mu-field-control" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Name, email or student ID" /></label>
            <label className="mu-field"><span className="mu-field-label">Status</span><select className="input mu-field-control" value={statusFilter} onChange={(event) => updateFilter(setStatusFilter, event.target.value)}><option value="">All statuses</option>{['Active', 'Inactive', 'Graduated'].map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="mu-field"><span className="mu-field-label">Class</span><select className="input mu-field-control" value={classFilter} onChange={(event) => updateFilter(setClassFilter, event.target.value)}><option value="">All classes</option>{classes.map((classItem) => <option key={classItem.id} value={classItem.id}>{classDisplayName(classItem)}</option>)}</select></label>
            <label className="mu-field"><span className="mu-field-label">Gender</span><select className="input mu-field-control" value={genderFilter} onChange={(event) => updateFilter(setGenderFilter, event.target.value)}><option value="">All genders</option>{['Female', 'Male', 'Other'].map((gender) => <option key={gender}>{gender}</option>)}</select></label>
            <label className="mu-field"><span className="mu-field-label">Department</span><select className="input mu-field-control" value={departmentFilter} onChange={(event) => updateFilter(setDepartmentFilter, event.target.value)}><option value="">All departments</option>{['General', 'Science', 'Arts', 'Business'].map((department) => <option key={department}>{department}</option>)}</select></label>
            <label className="mu-field"><span className="mu-field-label">Sort</span><select className="input mu-field-control" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select></label>
          </div>
          {classesError && <p className="mu-field-error" role="alert">{classesError}</p>}
          {error && students.length > 0 && <p className="mu-field-error" role="alert">{error}</p>}
          {canDelete && selected.length > 0 && <div className="students-bulk-actions"><span>{selected.length} selected</span><button type="button" className="btn mu-btn-danger" onClick={(event) => openDelete(selected, `Delete ${selected.length} selected student${selected.length === 1 ? '' : 's'}?`, event)}>Delete selected</button></div>}
          {loading ? <div className="mu-table-wrap" role="status" aria-label="Loading students"><table className="mu-table"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table></div> : error && students.length === 0 ? <div className="mu-empty-state" role="alert"><strong className="mu-empty-title">Students could not be loaded.</strong><p>{error}</p></div> : visible.length === 0 ? <div className="mu-empty-state"><strong className="mu-empty-title">No students found.</strong><p className="mu-empty-hint">Try a different search or filter.</p></div> : <div className="mu-table-wrap">
            <table className="mu-table mu-table-grid students-table">
              <thead><tr>{canDelete && <th scope="col" className="students-checkbox-cell"><input className="input students-checkbox" type="checkbox" aria-label="Select all students on this page" checked={allVisibleSelected} onChange={toggleVisible} /></th>}<th scope="col">Student</th><th scope="col">Student ID</th><th scope="col">Class</th><th scope="col">Guardian</th><th scope="col">Status</th><th scope="col" className="mu-cell-action">Actions</th></tr></thead>
              <tbody>{visible.map((student) => <tr key={student.id}>
                {canDelete && <td className="students-checkbox-cell"><input className="input students-checkbox" type="checkbox" aria-label={`Select ${student.firstName} ${student.lastName}`} checked={selected.includes(student.id)} onChange={() => toggleOne(student.id)} /></td>}
                <td><div className="students-person-cell">{student.photo ? <img className="students-avatar" src={student.photo} alt="" /> : <span className="students-avatar" aria-hidden="true">{student.firstName[0] || 'S'}{student.lastName[0] || ''}</span>}<span><Link to={`/students/${student.id}`}><strong>{student.firstName} {student.lastName}</strong></Link><small title={student.email || 'No email'}>{student.email || 'No email'}</small></span></div></td>
                <td>{student.studentId}</td><td>{student.className || '—'}</td><td>{guardianName(student)}</td><td><span className={`mu-badge ${statusTone(student.status)}`}>{student.status}</span></td>
                <td className="mu-cell-action"><div className="students-row-actions"><Link className="btn mu-btn-row-action" to={`/students/${student.id}`} aria-label={`View ${student.firstName}`}><Eye size={15} /></Link>{canUpdate && <button className="btn mu-btn-row-action" type="button" aria-label={`Edit ${student.firstName}`} onClick={(event) => openStudentForm(student, event)}><Pencil size={15} /></button>}{canDelete && <button className="btn mu-btn-danger" type="button" aria-label={`Delete ${student.firstName}`} onClick={(event) => openDelete([student.id], `Delete ${student.firstName} ${student.lastName}'s student record?`, event)}><Trash2 size={15} /></button>}</div></td>
              </tr>)}</tbody>
            </table>
          </div>}
          {!loading && pagination.total > 0 && <nav className="mu-pagination" aria-label="Student pages"><span>{pagination.total} {pagination.total === 1 ? 'student' : 'students'}</span><div className="mu-pagination-controls"><button type="button" className="btn btn-outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button type="button" className="btn btn-outline" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></div></nav>}
        </section>
      </main>
      {studentModal && <AddStudent key={studentModal.student?.id || 'new-student'} student={studentModal.student} guardians={parents} onCancel={() => setStudentModal(null)} onSave={saveStudent} returnFocusRef={actionButtonRef} />}
      {confirm && <ConfirmDialog title="Delete student records?" message={confirm.message} error={confirm.error} busy={deleting} onCancel={() => !deleting && setConfirm(null)} onConfirm={confirmDelete} returnFocusRef={actionButtonRef} />}
    </div>
  );
}
