import { useState } from "react";
import validateTeacherProfile from "../../../utils/validateTeacherProfile";

export default function TeacherProfileForm({ teacher, ownProfile = false, saving, onSave, onCancel }) {
  const [values, setValues] = useState({
    fullName: teacher.fullName || "", email: teacher.email || "", phone: teacher.phone || "",
    address: teacher.address || "", employeeNumber: teacher.employeeNumber || "",
  });
  const [validationError, setValidationError] = useState("");
  const setField = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const issue = validateTeacherProfile(values);
    if (issue) { setValidationError(issue); return; }
    setValidationError("");
    const payload = { fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim() || null, address: values.address.trim() || null };
    if (!ownProfile) payload.employeeNumber = values.employeeNumber.trim() || null;
    onSave(payload);
  };

  return <form className="teacher-form" onSubmit={submit} noValidate>
    <label>Name<input name="fullName" value={values.fullName} maxLength={151} onChange={setField} required /></label>
    <label>Email<input name="email" type="email" value={values.email} onChange={setField} required /></label>
    <label>Phone<input name="phone" value={values.phone} maxLength={31} onChange={setField} /></label>
    <label>Address<textarea name="address" value={values.address} maxLength={501} onChange={setField} rows="3" /></label>
    {ownProfile ? <label>Employee number<input value={teacher.employeeNumber || "—"} readOnly /></label> : <label>Employee number<input name="employeeNumber" value={values.employeeNumber} maxLength={50} onChange={setField} /></label>}
    {validationError && <p className="teacher-form-error" role="alert">{validationError}</p>}
    <div className="teacher-form-actions"><button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>
  </form>;
}
