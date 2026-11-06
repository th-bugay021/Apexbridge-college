import { useState } from "react";
import { Upload } from "lucide-react";
import { Avatar, Field, PageHeader } from "./components";

export default function RecordForm({ kind, record = {}, onCancel, onSave }) {
  const isStudent = kind === "student";
  const [photo, setPhoto] = useState(record.photo || "");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    for (const key in values) values[key] = values[key].trim();
    if (!values.firstName || !values.lastName) {
      setError("Please enter a first and last name.");
      return;
    }
    const message = onSave({ ...record, ...values, photo });
    if (message) setError(message);
  }

  function uploadPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <PageHeader
        title={`${record.id ? "Edit" : "New"} ${kind}`}
        subtitle={
          record.id
            ? `Update ${kind} information`
            : isStudent
              ? "Add a new student record"
              : "Add a new guardian"
        }
        onBack={onCancel}
      >
        <button className="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button primary" type="submit" form="record-form">
          Save {kind}
        </button>
      </PageHeader>
      <div className="page-content">
        <form
          id="record-form"
          className="panel record-form"
          onSubmit={handleSubmit}
        >
          {isStudent && (
            <div className="photo-upload">
              <Avatar person={{ ...record, photo }} size="large" />
              <div>
                <label className="button upload-button">
                  <Upload size={20} />
                  Upload photo
                  <input type="file" accept="image/*" onChange={uploadPhoto} />
                </label>
                <small>Photos are kept in this session only.</small>
              </div>
            </div>
          )}
          <div className="form-grid">
            <Field
              label="First name"
              name="firstName"
              value={record.firstName}
              required
            />
            <Field
              label="Last name"
              name="lastName"
              value={record.lastName}
              required
            />
            {isStudent ? (
              <>
                <Field
                  label="Date of birth"
                  name="birthDate"
                  type="date"
                  value={record.birthDate}
                />
                <Field
                  label="Gender"
                  name="gender"
                  value={record.gender}
                  options={["Male", "Female", "Other"]}
                  placeholder="Select gender"
                />
                <Field
                  label="Grade / Class"
                  name="grade"
                  value={record.grade}
                  placeholder="e.g. Grade 10"
                />
                <Field label="Student ID" name="id" value={record.id} />
              </>
            ) : (
              <>
                <Field
                  label="Relationship"
                  name="relationship"
                  value={record.relationship}
                  options={["Mother", "Father", "Guardian"]}
                  placeholder="Select relationship"
                />
                <Field
                  label="Occupation"
                  name="occupation"
                  value={record.occupation}
                />
              </>
            )}
            <Field
              label="Email"
              name="email"
              type="email"
              value={record.email}
            />
            <Field label="Phone" name="phone" type="tel" value={record.phone} />
            {isStudent ? (
              <>
                <Field
                  label="Enrollment date"
                  name="enrollmentDate"
                  type="date"
                  value={record.enrollmentDate}
                />
                <Field
                  label="Status"
                  name="status"
                  value={record.status || "Active"}
                  options={["Active", "Inactive", "Graduated"]}
                />
              </>
            ) : (
              <Field
                label="Address"
                name="address"
                value={record.address}
                wide
              />
            )}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </>
  );
}
