import { useState } from "react";
import StudentModal from "../StudentModal";

export default function AddParent({ guardian, onCancel, onSave, returnFocusRef }) {
  const [values, setValues] = useState(() => ({
    firstName: guardian?.firstName || "",
    lastName: guardian?.lastName || "",
    relationship: guardian?.relationship || "Guardian",
    email: guardian?.email || "",
    phone: guardian?.phone || "",
    occupation: guardian?.occupation || "",
    address: guardian?.address || "",
  }));
  const [error, setError] = useState("");
  const update = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!values.firstName.trim() || !values.lastName.trim()) {
      setError("Enter the guardian’s first and last name.");
      return;
    }
    onSave(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])));
  };

  return (
    <StudentModal title={guardian ? "Edit parent or guardian" : "Add parent or guardian"} onClose={onCancel} returnFocusRef={returnFocusRef}>
      <form onSubmit={submit}>
        <div className="mu-modal-body">
          <div className="students-form-grid">
            <label className="students-field"><span>First name *</span><input autoFocus required value={values.firstName} onChange={(event) => update("firstName", event.target.value)} /></label>
            <label className="students-field"><span>Last name *</span><input required value={values.lastName} onChange={(event) => update("lastName", event.target.value)} /></label>
            <label className="students-field"><span>Relationship</span><select value={values.relationship} onChange={(event) => update("relationship", event.target.value)}><option>Mother</option><option>Father</option><option>Guardian</option></select></label>
            <label className="students-field"><span>Occupation</span><input value={values.occupation} onChange={(event) => update("occupation", event.target.value)} /></label>
            <label className="students-field"><span>Email</span><input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} /></label>
            <label className="students-field"><span>Phone</span><input type="tel" value={values.phone} onChange={(event) => update("phone", event.target.value)} /></label>
            <label className="students-field students-field-wide"><span>Address</span><textarea rows="2" value={values.address} onChange={(event) => update("address", event.target.value)} /></label>
          </div>
          {error && <p className="mu-field-error" role="alert">{error}</p>}
        </div>
        <footer className="mu-modal-footer"><button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button><button type="submit" className="btn btn-primary">{guardian ? "Save changes" : "Save guardian"}</button></footer>
      </form>
    </StudentModal>
  );
}
