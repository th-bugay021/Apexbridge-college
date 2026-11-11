import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ResponsiveTable from '../../../Components/common/ResponsiveTable';
import { getClass } from '../../../api/classes';
import { getStudents } from '../../../api/students';
import useDebounce from '../../../hooks/useDebounce';
import { classDisplayName, studentFromApi } from './studentAdapter';
import '../studentPages.css';
import '../../Michael/shared/michael-ui.css';

const PAGE_SIZE = 10;
const statusToApi = { Active: 'ACTIVE', Inactive: 'INACTIVE', Graduated: 'GRADUATED' };

export default function StudentClassDetail() {
  const { classId } = useParams();
  const [classItem, setClassItem] = useState(null);
  const [loadedClassId, setLoadedClassId] = useState(null);
  const [classError, setClassError] = useState('');
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loadedStudentsKey, setLoadedStudentsKey] = useState('');
  const [studentsError, setStudentsError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const query = useDebounce(search.trim(), 400);
  const studentsKey = `${classId}|${page}|${query}|${status}`;
  const classLoading = loadedClassId !== classId;
  const studentsLoading = loadedStudentsKey !== studentsKey;

  useEffect(() => {
    let active = true;
    getClass(classId)
      .then((result) => { if (active) { setClassItem(result); setClassError(''); } })
      .catch((loadError) => { if (active) { setClassItem(null); setClassError(loadError.response?.data?.error?.message || 'Class could not be loaded.'); } })
      .finally(() => { if (active) setLoadedClassId(classId); });
    return () => { active = false; };
  }, [classId]);

  useEffect(() => {
    let active = true;
    getStudents({ page, limit: PAGE_SIZE, classId, search: query, ...(status ? { status: statusToApi[status] } : {}) })
      .then((result) => {
        if (!active) return;
        setStudentsError('');
        const totalPages = Math.max(1, result.pagination.totalPages);
        if (page > totalPages) { setPage(totalPages); return; }
        setStudents(result.students.map((student) => studentFromApi(student)));
        setPagination(result.pagination);
      })
      .catch((loadError) => { if (active) { setStudents([]); setStudentsError(loadError.response?.data?.error?.message || 'Students could not be loaded.'); } })
      .finally(() => { if (active) setLoadedStudentsKey(studentsKey); });
    return () => { active = false; };
  }, [classId, page, query, status, studentsKey]);

  const updateFilter = (setter, value) => { setter(value); setPage(1); };
  const pageCount = Math.max(1, pagination.totalPages);
  const headerCount = classItem?.studentCount ?? classItem?.students?.length ?? pagination.total;

  return (
    <div className="michael-ui students-ui">
      <main className="mu-page-content">
        <header className="mu-page-header">
          <div><h1 className="mu-page-title">{classLoading ? 'Loading class…' : classItem ? classDisplayName(classItem) : 'Class students'}</h1><p className="mu-caption">{classLoading ? 'Loading class details…' : classError ? 'Class details are unavailable.' : `${headerCount} ${headerCount === 1 ? 'student' : 'students'} in this class.`}</p></div>
          <div className="mu-page-header-actions"><Link className="btn btn-outline" to="/students/classes">Back to classes</Link></div>
        </header>
        {classError && <section className="card mu-card mu-empty-state"><strong className="mu-empty-title">Class could not be loaded.</strong><p className="mu-field-error" role="alert">{classError}</p></section>}
        {!classError && <section className="card mu-card students-list-card" aria-label="Students in class">
          <div className="mu-toolbar students-toolbar">
            <label className="mu-field students-search"><span className="mu-field-label">Search students</span><input className="input mu-field-control" type="search" value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} placeholder="Name or admission number" /></label>
            <label className="mu-field"><span className="mu-field-label">Status</span><select className="input mu-field-control" value={status} onChange={(event) => updateFilter(setStatus, event.target.value)}><option value="">All statuses</option><option>Active</option><option>Inactive</option><option>Graduated</option></select></label>
          </div>
          {studentsLoading ? <div className="mu-empty-state" role="status">Loading students…</div> : studentsError ? <div className="mu-empty-state" role="alert"><strong className="mu-empty-title">Students could not be loaded.</strong><p>{studentsError}</p></div> : students.length === 0 ? <div className="mu-empty-state"><strong className="mu-empty-title">No students in this class yet</strong><p className="mu-empty-hint">Try another search or status filter.</p></div> : <ResponsiveTable
            rows={students}
            rowKey={(student) => student.id}
            primary={(student) => `${student.firstName} ${student.lastName}`}
            secondary={(student) => student.studentId || '—'}
            label="Students in class"
            tableClassName="mu-table mu-table-grid students-table"
            columns={[
              { key: 'student', label: 'Student', primary: true, render: (student) => <Link to={`/students/${student.id}`}><strong>{student.firstName} {student.lastName}</strong></Link> },
              { key: 'admission', label: 'Admission number', render: (student) => student.studentId || '—' },
              { key: 'gender', label: 'Gender', render: (student) => student.gender || '—' },
              { key: 'status', label: 'Status', render: (student) => <span className={`mu-badge ${student.status === 'Active' ? 'mu-badge-success' : student.status === 'Inactive' ? 'mu-badge-neutral' : 'mu-badge-warning'}`}>{student.status}</span> },
            ]}
          />}
          {!studentsLoading && !studentsError && pagination.total > 0 && <nav className="mu-pagination" aria-label="Class student pages"><span>{pagination.total} {pagination.total === 1 ? 'student' : 'students'}</span><div className="mu-pagination-controls"><button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" className="btn btn-outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</button></div></nav>}
        </section>}
      </main>
    </div>
  );
}
