import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../Context/AuthContext';
import { getAllParents, linkStudentToParent, unlinkStudentFromParent } from '../../../api/parents';
import { deleteStudent, getStudent, updateStudent } from '../../../api/students';
import AddStudent from './AddStudent';
import ConfirmDialog from '../ConfirmDialog';
import { guardianFromApi, studentApiErrorMessage, studentFromApi, studentToApi } from './studentAdapter';
import '../studentPages.css';
import '../../Michael/shared/michael-ui.css';

function statusTone(status) {
  return status === 'Active' ? 'mu-badge-success' : status === 'Inactive' ? 'mu-badge-neutral' : 'mu-badge-warning';
}

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canViewParents = hasPermission('parents.view');
  const canUpdateParents = hasPermission('parents.update');
  const [student, setStudent] = useState(null);
  const [guardians, setGuardians] = useState([]);
  const [loadedStudentId, setLoadedStudentId] = useState(null);
  const [loadedGuardiansForStudent, setLoadedGuardiansForStudent] = useState(null);
  const [error, setError] = useState('');
  const [guardianError, setGuardianError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const actionButtonRef = useRef(null);
  const guardianIdsRef = useRef([]);
  const loading = loadedStudentId !== id;
  const guardiansLoading = canViewParents && loadedGuardiansForStudent !== id;

  useEffect(() => {
    let active = true;
    getStudent(id)
      .then((result) => {
        if (!active) return;
        setStudent((current) => studentFromApi(result, current?.guardianIds || guardianIdsRef.current));
        setError('');
      })
      .catch((loadError) => {
        if (!active) return;
        setStudent(null);
        setError(studentApiErrorMessage(loadError));
      })
      .finally(() => { if (active) setLoadedStudentId(id); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    if (!canViewParents) return () => { active = false; };
    getAllParents({ studentId: id })
      .then((result) => {
        if (!active) return;
        const mapped = result.map(guardianFromApi);
        guardianIdsRef.current = mapped.map((guardian) => guardian.id);
        setGuardians(mapped);
        setStudent((current) => current ? { ...current, guardianIds: guardianIdsRef.current } : current);
        setGuardianError('');
      })
      .catch((loadError) => {
        if (!active) return;
        setGuardians([]);
        setGuardianError(loadError.response?.data?.error?.message || 'Linked guardians could not be loaded.');
      })
      .finally(() => { if (active) setLoadedGuardiansForStudent(id); });
    return () => { active = false; };
  }, [canViewParents, id]);

  const saveStudent = async (values) => {
    try {
      await updateStudent(id, studentToApi(values));
      if (canViewParents && canUpdateParents) {
        const currentParents = await getAllParents({ studentId: id });
        const currentIds = new Set(currentParents.map((parent) => parent.id));
        const selectedIds = new Set(values.guardianIds || []);
        for (const parentId of selectedIds) {
          if (!currentIds.has(parentId)) await linkStudentToParent(parentId, id);
        }
        for (const parentId of currentIds) {
          if (!selectedIds.has(parentId)) await unlinkStudentFromParent(parentId, id);
        }
      }
      const freshStudent = await getStudent(id);
      const freshParents = canViewParents ? await getAllParents({ studentId: id }) : [];
      const mappedGuardians = freshParents.map(guardianFromApi);
      guardianIdsRef.current = mappedGuardians.map((guardian) => guardian.id);
      setGuardians(mappedGuardians);
      setStudent(studentFromApi(freshStudent, guardianIdsRef.current));
      setGuardianError('');
      setShowEdit(false);
      return '';
    } catch (saveError) {
      return studentApiErrorMessage(saveError);
    }
  };

  const removeStudent = async () => {
    if (!student) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteStudent(student.id);
      setConfirmDelete(false);
      navigate('/students');
    } catch (deleteFailure) {
      setDeleteError(studentApiErrorMessage(deleteFailure));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="michael-ui students-ui">
      <main className="mu-page-content">
        <header className="mu-page-header">
          <div><h1 className="mu-page-title">Student profile</h1><p className="mu-caption">Student record details and linked guardians.</p></div>
          <div className="mu-page-header-actions"><Link className="btn btn-outline" to="/students">Back to students</Link>{student && hasPermission('students.update') && <button type="button" className="btn btn-primary" onClick={(event) => { actionButtonRef.current = event.currentTarget; setShowEdit(true); }}>Edit student</button>}{student && hasPermission('students.delete') && <button type="button" className="btn mu-btn-danger" onClick={(event) => { actionButtonRef.current = event.currentTarget; setDeleteError(''); setConfirmDelete(true); }}>Delete</button>}</div>
        </header>
        {loading ? <div className="mu-empty-state" role="status">Loading student record…</div> : error ? <section className="card mu-card mu-empty-state"><strong className="mu-empty-title">Student could not be loaded.</strong><p className="mu-field-error" role="alert">{error}</p><Link className="btn btn-outline" to="/students">Return to students</Link></section> : !student ? <section className="card mu-card mu-empty-state"><strong className="mu-empty-title">Student not found.</strong><Link className="btn btn-outline" to="/students">Return to students</Link></section> : <>
          <section className="card mu-card students-profile-card">
            <div className="students-profile-identity">{student.photo ? <img className="students-avatar students-avatar-profile" src={student.photo} alt={`${student.firstName} ${student.lastName}`} /> : <span className="students-avatar students-avatar-profile" aria-hidden="true">{student.firstName[0] || 'S'}{student.lastName[0] || ''}</span>}<div><h2>{student.firstName} {student.lastName}</h2><p className="mu-caption">{student.studentId} · {student.className || 'No class assigned'}</p><span className={`mu-badge ${statusTone(student.status)}`}>{student.status}</span></div></div>
            <dl className="students-profile-details">
              <div><dt>Date of birth</dt><dd>{student.birthDate || 'Not provided'}</dd></div><div><dt>Gender</dt><dd>{student.gender || 'Not provided'}</dd></div>
              <div><dt>Email</dt><dd>{student.email || 'Not provided'}</dd></div><div><dt>Phone</dt><dd>{student.phone || 'Not provided'}</dd></div>
              <div><dt>Department</dt><dd>{student.department || 'Not provided'}</dd></div><div><dt>Admission date</dt><dd>{student.admissionDate || 'Not provided'}</dd></div>
              <div className="students-profile-wide"><dt>Address</dt><dd>{student.address || 'Not provided'}</dd></div>
            </dl>
          </section>
          <section className="card mu-card students-guardian-panel"><div className="students-section-title"><h2>Guardians</h2>{canViewParents && <Link className="students-inline-link" to="/parents">Manage parents</Link>}</div>{guardiansLoading ? <p className="mu-caption" role="status">Loading linked guardians…</p> : !canViewParents ? <p className="mu-caption">You do not have permission to view linked guardians.</p> : guardianError ? <p className="mu-field-error" role="alert">{guardianError}</p> : guardians.length ? <div className="students-guardian-grid">{guardians.map((guardian) => <article key={guardian.id}><strong>{guardian.fullName}</strong><span>{guardian.relationship || 'Guardian'}</span><span>{guardian.email || 'No email'}</span><span>{guardian.phone || 'No phone'}</span></article>)}</div> : <p className="mu-caption">No guardians linked to this student.</p>}</section>
        </>}
      </main>
      {student && showEdit && <AddStudent key={student.id} student={student} guardians={guardians} onCancel={() => setShowEdit(false)} onSave={saveStudent} returnFocusRef={actionButtonRef} />}
      {student && confirmDelete && <ConfirmDialog title="Delete student?" message={`Delete ${student.firstName} ${student.lastName}'s student record?`} error={deleteError} busy={deleting} onCancel={() => !deleting && setConfirmDelete(false)} onConfirm={removeStudent} returnFocusRef={actionButtonRef} />}
    </div>
  );
}
