import { useState } from "react";
import {
  BriefcaseBusiness,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { Avatar, PageHeader, Status } from "./components";

export default function RecordDetails({
  kind,
  person,
  students,
  guardians,
  onBack,
  onEdit,
  onDelete,
  onViewStudent,
  onLinkStudent,
}) {
  const [showLink, setShowLink] = useState(false);
  const isGuardian = kind === "guardian";
  const linked = isGuardian
    ? students
        .filter((student) => student.guardianIds.includes(person.id))
        .sort((a, b) => a.firstName.localeCompare(b.firstName))
    : guardians.filter((guardian) => person.guardianIds.includes(guardian.id));
  const available = students.filter(
    (student) => !student.guardianIds.includes(person.id),
  );
  const info = [
    { label: "Email", value: person.email, icon: Mail },
    { label: "Phone", value: person.phone, icon: Phone },
    {
      label: isGuardian ? "Occupation" : "Student ID",
      value: isGuardian ? person.occupation : person.id,
      icon: BriefcaseBusiness,
    },
    {
      label: isGuardian ? "Address" : "Grade / Class",
      value: isGuardian ? person.address : person.grade,
      icon: MapPin,
    },
  ];
  return (
    <>
      <PageHeader
        title={`${person.firstName} ${person.lastName}`}
        subtitle={isGuardian ? person.relationship : person.grade}
        onBack={onBack}
      >
        <button className="button" onClick={onEdit}>
          <Pencil size={20} />
          Edit
        </button>
        <button className="button danger" onClick={onDelete}>
          <Trash2 size={20} />
          Delete
        </button>
      </PageHeader>
      <div className="page-content">
        <div className="details-grid">
          <section className="panel profile-card">
            <Avatar person={person} size="profile" />
            <h2>
              {person.firstName} {person.lastName}
            </h2>
            <p>
              {isGuardian ? (
                person.relationship
              ) : (
                <Status value={person.status} />
              )}
            </p>
          </section>
          <section className="panel contact-card">
            <h3>Contact information</h3>
            <div className="contact-grid">
              {info.map(({ label, value, icon: Icon }) => (
                <div key={label}>
                  <small>
                    <Icon size={17} />
                    {label}
                  </small>
                  <p>{value || "Not provided"}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <section className="panel linked-panel">
          <div className="section-heading">
            <h3>
              {isGuardian ? "Linked children" : "Guardians"} ({linked.length})
            </h3>
            {isGuardian && (
              <button
                className="button primary small-button"
                onClick={() => setShowLink(!showLink)}
              >
                <Plus size={18} />
                Add student
              </button>
            )}
          </div>
          {showLink && (
            <form
              className="link-form"
              onSubmit={(event) => {
                event.preventDefault();
                onLinkStudent(new FormData(event.target).get("studentId"));
                setShowLink(false);
              }}
            >
              <select name="studentId" aria-label="Student to link" required>
                <option value="">Select a student</option>
                {available.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
              <button className="button primary" disabled={!available.length}>
                Link student
              </button>
              <button
                type="button"
                className="button"
                onClick={() => setShowLink(false)}
              >
                Cancel
              </button>
            </form>
          )}
          <div className="linked-grid">
            {linked.map((item) =>
              isGuardian ? (
                <button
                  className="linked-person"
                  key={item.id}
                  onClick={() => onViewStudent(item)}
                >
                  <Avatar person={item} />
                  <span>
                    <strong>
                      {item.firstName} {item.lastName}
                    </strong>
                    <small>
                      {item.grade} <Status value={item.status} />
                    </small>
                  </span>
                </button>
              ) : (
                <div className="linked-person" key={item.id}>
                  <Avatar person={item} />
                  <span>
                    <strong>
                      {item.firstName} {item.lastName}
                    </strong>
                    <small>{item.relationship}</small>
                  </span>
                </div>
              ),
            )}
          </div>
          {linked.length === 0 && (
            <p className="muted">
              No {isGuardian ? "students" : "guardians"} linked yet.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
