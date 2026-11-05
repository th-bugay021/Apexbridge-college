import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../Context/AuthContext';
import { getClasses } from '../../../api/classes';
import { getParents } from '../../../api/parents';
import useDebounce from '../../../hooks/useDebounce';
import StudentModal from '../StudentModal';
import { classDisplayName, guardianFromApi, studentApiErrorMessage } from './studentAdapter';

const departments = ['General', 'Science', 'Arts', 'Business'];
const statuses = ['Active', 'Inactive', 'Graduated'];
const emptyGuardians = [];

export default function AddStudent({ student, guardians = emptyGuardians, onCancel, onSave, returnFocusRef }) {
  const { hasPermission } = useAuth();
  const canPickParents = hasPermission('parents.view') && hasPermission('parents.update');
  const [values, setValues] = useState(() => ({
    studentId: student?.studentId || '',
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    birthDate: student?.birthDate || '',
    gender: student?.gender || '',
    email: student?.email || '',
    password: '',
    phone: student?.phone || '',
    address: student?.address || '',
    department: student ? (student.department || '') : 'General',
    classId: student?.classId || '',
    guardianIds: student?.guardianIds || [],
    admissionDate: student?.admissionDate || '',
    status: student?.status || 'Active',
    photo: student?.photo || '',
  }));
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [parentOptions, setParentOptions] = useState(guardians);
  const [parentsError, setParentsError] = useState('');
  const [knownParents, setKnownParents] = useState(() => new Map(guardians.map((parent) => [parent.id, parent])));
  const [loadedParentQuery, setLoadedParentQuery] = useState(null);
  const parentQuery = useDebounce(parentSearch.trim(), 300);
  const parentsLoading = canPickParents && loadedParentQuery !== parentQuery;
  const update = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === 'email') setEmailError('');
  };

  useEffect(() => {
    let active = true;
    getClasses({ page: 1, limit: 100 })
      .then(async (firstPage) => {
        const allClasses = [...firstPage.classes];
        for (let page = 2; active && page <= firstPage.pagination.totalPages; page += 1) {
          const nextPage = await getClasses({ page, limit: 100 });
          allClasses.push(...nextPage.classes);
        }
        if (active) setClasses(allClasses);
      })
      .catch((loadError) => {
        if (active) setClassesError(loadError.response?.data?.error?.message || 'Classes could not be loaded.');
      })
      .finally(() => { if (active) setClassesLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!canPickParents) return () => { active = false; };
    getParents({ page: 1, limit: 20, search: parentQuery })
      .then((result) => {
        if (!active) return;
        const mapped = result.parents.map(guardianFromApi);
        setParentOptions(mapped);
        setKnownParents((current) => new Map([...current, ...mapped.map((parent) => [parent.id, parent])]));
        setParentsError('');
      })
      .catch((loadError) => {
        if (active) setParentsError(loadError.response?.data?.error?.message || 'Parents could not be loaded.');
      })
      .finally(() => { if (active) setLoadedParentQuery(parentQuery); });
    return () => { active = false; };
  }, [canPickParents, guardians, parentQuery]);

  const parentChoices = useMemo(() => {
    const choices = new Map(parentOptions.map((parent) => [parent.id, parent]));
    values.guardianIds.forEach((id) => {
      const parent = knownParents.get(id);
      if (parent) choices.set(id, parent);
    });
    for (const guardian of guardians) {
      if (values.guardianIds.includes(guardian.id)) choices.set(guardian.id, guardian);
    }
    return [...choices.values()];
  }, [guardians, knownParents, parentOptions, values.guardianIds]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setEmailError('');
    setSaving(true);
    try {
      const message = await onSave({ ...values, guardianIds: canPickParents ? values.guardianIds : (student?.guardianIds || []) });
      if (message) setError(message);
      else onCancel();
    } catch (saveError) {
      const message = studentApiErrorMessage(saveError);
      if (saveError.response?.data?.error?.code === 'EMAIL_EXISTS') setEmailError(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const field = (label, name, props = {}) => {
    const { wide, ...inputProps } = props;
    return <label className={`students-field${wide ? ' students-field-wide' : ''}`} key={name}>
      <span>{label}{props.required && <span className="students-required"> *</span>}</span>
      <input {...inputProps} autoComplete={name === 'password' ? inputProps.autoComplete : 'off'} id={`student-${name}`} name={inputProps.name || name} value={values[name]} onChange={(event) => update(name, event.target.value)} />
    </label>;
  };

  return (
    <StudentModal title={student ? 'Edit student' : 'Add student'} onClose={onCancel} returnFocusRef={returnFocusRef}>
      <form onSubmit={submit} autoComplete="off">
        <div className="mu-modal-body">
          <div className="students-photo-row">
            <div className="students-avatar students-avatar-large" aria-label="Student photo preview">
              {values.photo ? <img src={values.photo} alt="Student preview" /> : `${values.firstName[0] || 'S'}${values.lastName[0] || ''}`}
            </div>
            <span className="students-caption">Enter a photo URL.</span>
          </div>
          <div className="students-form-grid">
            {field('Student ID', 'studentId', { required: Boolean(student), placeholder: 'Generated if left blank' })}
            {field('First name', 'firstName', { required: true, autoComplete: 'given-name' })}
            {field('Last name', 'lastName', { required: true, autoComplete: 'family-name' })}
            {!student && field('Password', 'password', { type: 'password', required: true, minLength: 8, autoComplete: 'new-password' })}
            {field('Date of birth', 'birthDate', { type: 'date' })}
            <label className="students-field"><span>Gender <span className="students-required">*</span></span><select required value={values.gender} onChange={(event) => update('gender', event.target.value)}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Other</option></select></label>
            {field('Email', 'email', { type: 'email', name: 'studentContact', required: true, autoComplete: 'off', 'aria-invalid': Boolean(emailError), 'aria-describedby': emailError ? 'student-email-error' : undefined })}
            {emailError && <span className="mu-field-error students-field-wide" id="student-email-error" role="alert">{emailError}</span>}
            {field('Phone', 'phone', { type: 'tel', autoComplete: 'tel' })}
            <label className="students-field"><span>Class</span><select value={values.classId} onChange={(event) => update('classId', event.target.value)} disabled={classesLoading}><option value="">No class assigned</option>{classes.map((classItem) => <option key={classItem.id} value={classItem.id}>{classDisplayName(classItem)}</option>)}</select>{classesError && <span className="mu-field-error" role="alert">{classesError}</span>}</label>
            <label className="students-field"><span>Department</span><select value={values.department} onChange={(event) => update('department', event.target.value)}><option value="">No department</option>{departments.map((department) => <option key={department}>{department}</option>)}{values.department && !departments.includes(values.department) && <option>{values.department}</option>}</select></label>
            {field('Photo URL', 'photo', { type: 'url', placeholder: 'https://example.com/photo.jpg' })}
            {field('Admission date', 'admissionDate', { type: 'date' })}
            <label className="students-field"><span>Status</span><select value={values.status} onChange={(event) => update('status', event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="students-field students-field-wide"><span>Address</span><textarea autoComplete="off" id="student-address" value={values.address} onChange={(event) => update('address', event.target.value)} rows="2" /></label>
            {canPickParents && <>
              <div className="students-field students-field-wide">
                <span>Guardians <span className="students-caption">Optional. Parents must exist first.</span></span>
                {values.guardianIds.length > 0 && <div className="students-guardian-chips" aria-label="Selected guardians">{values.guardianIds.map((id) => {
                  const guardian = parentChoices.find((parent) => parent.id === id);
                  if (!guardian) return null;
                  return <span className="students-guardian-chip" key={id}>{guardian.fullName || `${guardian.firstName} ${guardian.lastName}`}<button type="button" aria-label={`Remove ${guardian.fullName || guardian.firstName}`} onClick={() => update('guardianIds', values.guardianIds.filter((guardianId) => guardianId !== id))}>×</button></span>;
                })}</div>}
                <input type="search" aria-label="Search parents or guardians" value={parentSearch} onChange={(event) => setParentSearch(event.target.value)} placeholder="Search by name, email or phone" />
                {parentsLoading ? <span className="students-caption" role="status">Loading parents…</span> : parentsError ? <span className="mu-field-error" role="alert">{parentsError}</span> : parentOptions.length === 0 ? <span className="students-caption" role="status">No parents found</span> : <div className="students-guardian-options" role="group" aria-label="Available parents">{parentOptions.map((guardian) => <label className="students-guardian-option" key={guardian.id}><input type="checkbox" checked={values.guardianIds.includes(guardian.id)} onChange={(event) => update('guardianIds', event.target.checked ? [...values.guardianIds, guardian.id] : values.guardianIds.filter((id) => id !== guardian.id))} /><span>{guardian.fullName || `${guardian.firstName} ${guardian.lastName}`} · {guardian.email || 'No email'}</span></label>)}</div>}
              </div>
            </>}
            {!canPickParents && student?.guardianIds?.length > 0 && <p className="students-caption students-field-wide">Existing guardian links will be kept. You do not have permission to edit them.</p>}
          </div>
          {error && <p className="mu-field-error" role="alert">{error}</p>}
        </div>
        <footer className="mu-modal-footer"><button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save student'}</button></footer>
      </form>
    </StudentModal>
  );
}
