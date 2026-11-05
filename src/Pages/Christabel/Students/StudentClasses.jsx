import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClasses } from '../../../api/classes';
import { classDisplayName } from './studentAdapter';
import '../studentPages.css';
import '../../Michael/shared/michael-ui.css';

export default function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadClasses() {
      try {
        const firstPage = await getClasses({ page: 1, limit: 100 });
        const rows = [...firstPage.classes];
        for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
          const nextPage = await getClasses({ page, limit: 100 });
          rows.push(...nextPage.classes);
        }
        if (active) setClasses(rows);
      } catch (loadError) {
        if (active) setError(loadError.response?.data?.error?.message || 'Classes could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadClasses();
    return () => { active = false; };
  }, []);

  return (
    <div className="michael-ui students-ui">
      <main className="mu-page-content">
        <header className="mu-page-header">
          <div><h1 className="mu-page-title">Browse by class</h1><p className="mu-caption">Choose a class to view its students.</p></div>
          <div className="mu-page-header-actions"><Link className="btn btn-outline" to="/students">Back to students</Link></div>
        </header>
        {loading ? <div className="mu-empty-state" role="status">Loading classes…</div> : error ? <section className="card mu-card mu-empty-state"><strong className="mu-empty-title">Classes could not be loaded.</strong><p className="mu-field-error" role="alert">{error}</p></section> : classes.length === 0 ? <section className="card mu-card mu-empty-state"><strong className="mu-empty-title">No classes found.</strong><p className="mu-empty-hint">There are no classes to browse yet.</p></section> : <div className="students-class-grid">{classes.map((classItem) => <Link className="card students-class-card" key={classItem.id} to={`/students/classes/${classItem.id}`}>
          <span className="students-class-level">{classItem.level || 'Class'}</span>
          <h2>{classItem.name || classDisplayName(classItem)}</h2>
          <span className="mu-caption">{classItem.studentCount ?? 0} {classItem.studentCount === 1 ? 'student' : 'students'}</span>
        </Link>)}</div>}
      </main>
    </div>
  );
}
