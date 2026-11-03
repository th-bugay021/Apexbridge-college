import { useState } from "react";
import { classLabel } from "../../../config/school";
import StudentModal from "../StudentModal";

const departments = ["General", "Science", "Arts", "Business"];
const statuses = ["Active", "Inactive", "Graduated"];

export default function AddStudent({ student, guardians = [], onCancel, onSave, returnFocusRef }) {
  const [values, setValues] = useState(() => ({
    studentId: student?.studentId || "",
    firstName: student?.firstName || "",
    lastName: student?.lastName || "",
    birthDate: student?.birthDate || "",
    gender: student?.gender || "",
    email: student?.email || "",
    phone: student?.phone || "",
    address: student?.address || "",
    department: student?.department || "General",
    className: student?.className || classLabel(7),
    guardianId: student?.guardianIds?.[0] || "",
    admissionDate: student?.admissionDate || "",
    status: student?.status || "Active",
    photo: student?.photo || "",
  }));
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setPhotoError("Choose an image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { update("photo", String(reader.result || "")); setPhotoError(""); };
    reader.readAsDataURL(file);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!values.firstName.trim() || !values.lastName.trim()) {
      setError("Enter the student’s first and last name.");
      return;
    }
    const { guardianId, ...studentValues } = values;
    const message = onSave({ ...studentValues, guardianIds: guardianId ? [guardianId] : [] });
    if (message) setError(message);
  };

  const field = (label, name, props = {}) => (
    <label className="students-field" key={name}>
      <span>{label}{props.required && <span className="students-required"> *</span>}</span>
      <input {...props} id={`student-${name}`} name={name} value={values[name]} onChange={(event) => update(name, event.target.value)} />
    </label>
  );

  return (
    <StudentModal title={student ? "Edit student" : "Add student"} onClose={onCancel} returnFocusRef={returnFocusRef}>
      <form onSubmit={submit}>
        <div className="mu-modal-body">
          <div className="students-photo-row">
            <div className="students-avatar students-avatar-large" aria-label="Student photo preview">
              {values.photo ? <img src={values.photo} alt="Student preview" /> : `${values.firstName[0] || "S"}${values.lastName[0] || ""}`}
            </div>
            <label className="students-upload btn btn-outline" htmlFor="student-photo">Upload photo<input id="student-photo" type="file" accept="image/*" onChange={handlePhoto} /></label>
            <span className="students-caption">Photo is kept for this session only (5 MB max).</span>
          </div>
          {photoError && <p className="mu-field-error" role="alert">{photoError}</p>}
          <div className="students-form-grid">
            {field("Student ID", "studentId", { required: Boolean(student), placeholder: "Generated if left blank" })}
            {field("First name", "firstName", { required: true, autoComplete: "given-name" })}
            {field("Last name", "lastName", { required: true, autoComplete: "family-name" })}
            {field("Date of birth", "birthDate", { type: "date" })}
            <label className="students-field"><span>Gender</span><select value={values.gender} onChange={(event) => update("gender", event.target.value)}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Other</option></select></label>
            {field("Email", "email", { type: "email", autoComplete: "email" })}
            {field("Phone", "phone", { type: "tel", autoComplete: "tel" })}
            <label className="students-field"><span>Class</span><select value={values.className} onChange={(event) => update("className", event.target.value)}>{Array.from({ length: 6 }, (_, index) => classLabel(index + 7)).map((label) => <option key={label}>{label}</option>)}</select></label>
            <label className="students-field"><span>Department</span><select value={values.department} onChange={(event) => update("department", event.target.value)}>{departments.map((department) => <option key={department}>{department}</option>)}</select></label>
            <label className="students-field"><span>Guardian</span><select value={values.guardianId} onChange={(event) => update("guardianId", event.target.value)}><option value="">No guardian linked</option>{guardians.map((guardian) => <option key={guardian.id} value={guardian.id}>{guardian.firstName} {guardian.lastName} · {guardian.relationship}</option>)}</select></label>
            {field("Admission date", "admissionDate", { type: "date" })}
            <label className="students-field"><span>Status</span><select value={values.status} onChange={(event) => update("status", event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="students-field students-field-wide"><span>Address</span><textarea value={values.address} onChange={(event) => update("address", event.target.value)} rows="2" /></label>
          </div>
          {error && <p className="mu-field-error" role="alert">{error}</p>}
        </div>
        <footer className="mu-modal-footer"><button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button><button type="submit" className="btn btn-primary">Save student</button></footer>
      </form>
    </StudentModal>
  );
}
