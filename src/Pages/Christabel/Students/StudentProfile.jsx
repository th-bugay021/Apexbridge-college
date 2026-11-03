import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import useStudentSampleData from "../useStudentSampleData";
import AddStudent from "./AddStudent";
import ConfirmDialog from "../ConfirmDialog";
import "../studentPages.css";
import "../../Michael/shared/michael-ui.css";

function statusTone(status) {
  return status === "Active" ? "mu-badge-success" : status === "Inactive" ? "mu-badge-neutral" : "mu-badge-warning";
}

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { students, guardians, loading, updateStudent, deleteStudents } = useStudentSampleData();
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const actionButtonRef = useRef(null);
  const student = students.find((item) => item.id === id);
  const linkedGuardians = student ? guardians.filter((guardian) => (student.guardianIds || []).includes(guardian.id)) : [];

  const saveStudent = (values) => {
    if (!student) return "This student record is no longer available.";
    const message = updateStudent(student.id, values);
    if (!message) setShowEdit(false);
    return message;
  };
  const removeStudent = () => {
    if (!student) return;
    deleteStudents([student.id]);
    setConfirmDelete(false);
    navigate("/students");
  };

  return (
    <div className="michael-ui students-ui">
      <main className="mu-page-content">
        <header className="mu-page-header">
          <div><h1 className="mu-page-title">Student profile</h1><p className="mu-caption">Student record details and linked guardians.</p></div>
          <div className="mu-page-header-actions"><span className="students-sample-tag">Sample data</span><Link className="btn btn-outline" to="/students">Back to students</Link>{student && hasPermission("students.update") && <button type="button" className="btn btn-primary" onClick={(event) => { actionButtonRef.current = event.currentTarget; setShowEdit(true); }}>Edit student</button>}{student && hasPermission("students.delete") && <button type="button" className="btn mu-btn-danger" onClick={(event) => { actionButtonRef.current = event.currentTarget; setConfirmDelete(true); }}>Delete</button>}</div>
        </header>
        {loading ? <div className="mu-empty-state" role="status">Loading student record…</div> : !student ? <section className="card mu-card mu-empty-state"><strong className="mu-empty-title">Student not found.</strong><Link className="btn btn-outline" to="/students">Return to students</Link></section> : <>
          <section className="card mu-card students-profile-card">
            <div className="students-profile-identity">{student.photo ? <img className="students-avatar students-avatar-profile" src={student.photo} alt={`${student.firstName} ${student.lastName}`} /> : <span className="students-avatar students-avatar-profile" aria-hidden="true">{student.firstName[0]}{student.lastName[0]}</span>}<div><h2>{student.firstName} {student.lastName}</h2><p className="mu-caption">{student.studentId} · {student.className}</p><span className={`mu-badge ${statusTone(student.status)}`}>{student.status}</span></div></div>
            <dl className="students-profile-details">
              <div><dt>Date of birth</dt><dd>{student.birthDate || "Not provided"}</dd></div><div><dt>Gender</dt><dd>{student.gender || "Not provided"}</dd></div>
              <div><dt>Email</dt><dd>{student.email || "Not provided"}</dd></div><div><dt>Phone</dt><dd>{student.phone || "Not provided"}</dd></div>
              <div><dt>Department</dt><dd>{student.department || "Not provided"}</dd></div><div><dt>Admission date</dt><dd>{student.admissionDate || "Not provided"}</dd></div>
              <div className="students-profile-wide"><dt>Address</dt><dd>{student.address || "Not provided"}</dd></div>
            </dl>
          </section>
          <section className="card mu-card students-guardian-panel"><div className="students-section-title"><h2>Guardians</h2><Link className="students-inline-link" to="/parents">Manage parents</Link></div>{linkedGuardians.length ? <div className="students-guardian-grid">{linkedGuardians.map((guardian) => <article key={guardian.id}><strong>{guardian.firstName} {guardian.lastName}</strong><span>{guardian.relationship}</span><span>{guardian.email || "No email"}</span><span>{guardian.phone || "No phone"}</span></article>)}</div> : <p className="mu-caption">No guardians linked to this student.</p>}</section>
        </>}
      </main>
      {student && showEdit && <AddStudent key={student.id} student={student} guardians={guardians} onCancel={() => setShowEdit(false)} onSave={saveStudent} returnFocusRef={actionButtonRef} />}
      {student && confirmDelete && <ConfirmDialog title="Delete student?" message={`Delete ${student.firstName} ${student.lastName}'s student record?`} onCancel={() => setConfirmDelete(false)} onConfirm={removeStudent} returnFocusRef={actionButtonRef} />}
    </div>
  );
}
