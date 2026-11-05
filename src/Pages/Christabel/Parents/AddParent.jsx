import { useEffect, useMemo, useState } from 'react';
import { getStudents } from '../../../api/students';
import useDebounce from '../../../hooks/useDebounce';
import StudentModal from '../StudentModal';
import { parentStudentFromApi } from './parentAdapter';

export default function AddParent({ guardian, canManageLinks, onCancel, onSave, returnFocusRef }) {
  const [values, setValues] = useState(() => ({
    firstName: guardian?.firstName || '',
    lastName: guardian?.lastName || '',
    relationship: guardian?.relationship || 'Guardian',
    email: guardian?.email || '',
    password: '',
    phone: guardian?.phone || '',
    occupation: guardian?.occupation || '',
    address: guardian?.address || '',
    studentIds: guardian?.students?.map((student) => student.id) || [],
  }));
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentOptions, setStudentOptions] = useState([]);
  const [studentError, setStudentError] = useState('');
  const [loadedQuery, setLoadedQuery] = useState(null);
  const [knownStudents, setKnownStudents] = useState(() => new Map((guardian?.students || []).map((student) => [student.id, student])));
  const query = useDebounce(studentSearch.trim(), 300);
  const loadingStudents = loadedQuery !== query;
  const update = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  useEffect(() => {
    let active = true;
    if (!canManageLinks) return () => { active = false; };
    getStudents({ page: 1, limit: 20, search: query })
      .then((result) => {
        if (!active) return;
        const options = result.students.map(parentStudentFromApi);
        setStudentOptions(options);
        setKnownStudents((current) => new Map([...current, ...options.map((student) => [student.id, student])]));
        setStudentError('');
      })
      .catch((loadError) => {
        if (active) setStudentError(loadError.response?.data?.error?.message || 'Students could not be loaded.');
      })
      .finally(() => { if (active) setLoadedQuery(query); });
    return () => { active = false; };
  }, [canManageLinks, query]);

  const selectedStudents = useMemo(() => values.studentIds.map((id) => knownStudents.get(id)).filter(Boolean), [knownStudents, values.studentIds]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!values.firstName.trim() || !values.lastName.trim()) {
      setError('Enter the parent’s first and last name.');
      return;
    }
    if (!guardian && values.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      const result = await onSave({ ...values, studentIds: values.studentIds });
      if (result) {
        setError(result);
        if (/email address is already in use/i.test(result)) setEmailError(true);
      } else onCancel();
    } catch (saveError) {
      const message = saveError.response?.data?.error?.code === 'EMAIL_EXISTS'
        ? 'That email address is already in use. Enter a different email.'
        : saveError.response?.data?.error?.message || saveError.message || 'The parent could not be saved.';
      setError(message);
      setEmailError(saveError.response?.data?.error?.code === 'EMAIL_EXISTS');
    } finally {
      setSaving(false);
    }
  };
  return (
    <StudentModal title={guardian ? 'Edit parent or guardian' : 'Add parent or guardian'} onClose={onCancel} returnFocusRef={returnFocusRef}>
      <form onSubmit={submit} autoComplete="off">
        <div className="mu-modal-body">
          <div className="students-form-grid">
            <label className="students-field"><span>First name *</span><input autoFocus autoComplete="off" required value={values.firstName} onChange={(event) => update('firstName', event.target.value)} /></label>
            <label className="students-field"><span>Last name *</span><input autoComplete="off" required value={values.lastName} onChange={(event) => update('lastName', event.target.value)} /></label>
            <label className="students-field"><span>Relationship</span><select value={values.relationship} onChange={(event) => update('relationship', event.target.value)}><option>Mother</option><option>Father</option><option>Guardian</option>{values.relationship && !['Mother', 'Father', 'Guardian'].includes(values.relationship) && <option>{values.relationship}</option>}</select></label>
            <label className="students-field"><span>Occupation</span><input autoComplete="off" value={values.occupation} onChange={(event) => update('occupation', event.target.value)} /></label>
            <label className="students-field"><span>Email *</span><input autoComplete="off" type="email" required value={values.email} aria-invalid={emailError} onChange={(event) => { update('email', event.target.value); setEmailError(false); }} /></label>
            {!guardian && <label className="students-field"><span>Password *</span><input autoComplete="new-password" type="password" required minLength={8} value={values.password} onChange={(event) => update('password', event.target.value)} /></label>}
            <label className="students-field"><span>Phone</span><input autoComplete="off" type="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} /></label>
            <label className="students-field students-field-wide"><span>Address</span><textarea autoComplete="off" rows="2" value={values.address} onChange={(event) => update('address', event.target.value)} /></label>
            {canManageLinks ? <div className="students-field students-field-wide">
              <span>Link students <span className="students-caption">Optional. Select existing students.</span></span>
              {selectedStudents.length > 0 && <div className="students-guardian-chips" aria-label="Selected students">{selectedStudents.map((student) => <span className="students-guardian-chip" key={student.id}>{student.firstName} {student.lastName}<button type="button" aria-label={`Remove ${student.firstName} ${student.lastName}`} onClick={() => update('studentIds', values.studentIds.filter((id) => id !== student.id))}>×</button></span>)}</div>}
              <input autoComplete="off" type="search" aria-label="Search students" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search by name or admission number" />
              {loadingStudents ? <span className="students-caption" role="status">Loading students…</span> : studentError ? <span className="mu-field-error" role="alert">{studentError}</span> : studentOptions.length === 0 ? <span className="students-caption" role="status">No students found</span> : <div className="students-guardian-options" role="group" aria-label="Available students">{studentOptions.map((student) => <label className="students-guardian-option" key={student.id}><input type="checkbox" checked={values.studentIds.includes(student.id)} onChange={(event) => update('studentIds', event.target.checked ? [...values.studentIds, student.id] : values.studentIds.filter((id) => id !== student.id))} /><span>{student.firstName} {student.lastName} · {student.studentId || 'No admission number'} · {student.className}</span></label>)}</div>}
            </div> : <p className="students-caption students-field-wide">You do not have permission to link students to parents.</p>}
          </div>
          {error && <p className="mu-field-error" role="alert">{error}</p>}
        </div>
        <footer className="mu-modal-footer"><button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : guardian ? 'Save changes' : 'Save parent'}</button></footer>
      </form>
    </StudentModal>
  );
}
