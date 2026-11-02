import { useState } from "react";
import { GraduationCap, LogOut, Users } from "lucide-react";
import { initialGuardians, initialStudents } from "./data";
import Students from "./Students";
import Guardians from "./Guardians";
import RecordForm from "./RecordForm";
import RecordDetails from "./RecordDetails";
import DeleteModal from "./DeleteModal";

export default function App() {
  // React state updates the screen when a record is added, edited, or deleted.
  const [students, setStudents] = useState(initialStudents);
  const [guardians, setGuardians] = useState(initialGuardians);
  const [section, setSection] = useState("students");
  const [view, setView] = useState("list");
  const [record, setRecord] = useState(null);
  const [signedOut, setSignedOut] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const kind = section === "students" ? "student" : "guardian";

  function navigate(nextSection) {
    setSection(nextSection);
    setView("list");
    setRecord(null);
  }

  function openRecord(person, nextView) {
    setRecord(person);
    setView(nextView);
  }

  function saveRecord(values) {
    if (kind === "student") {
      const id =
        values.id ||
        `STU-${Math.max(1000, ...students.map((student) => Number(student.id.replace("STU-", "")) || 0)) + 1}`;
      if (
        students.some(
          (student) => student.id === id && student.id !== record?.id,
        )
      )
        return "This student ID is already in use. Please choose another.";
      const updated = { ...values, id, guardianIds: record?.guardianIds || [] };
      setStudents(
        record
          ? students.map((student) =>
              student.id === record.id ? updated : student,
            )
          : [updated, ...students],
      );
    } else {
      const updated = {
        ...values,
        id: record?.id || Date.now(),
        relationship: values.relationship || "Guardian",
      };
      setGuardians(
        record
          ? guardians.map((guardian) =>
              guardian.id === record.id ? updated : guardian,
            )
          : [...guardians, updated],
      );
    }
    setView("list");
    setRecord(null);
  }

  function deleteRecord(person) {
    if (kind === "student")
      setStudents(students.filter((student) => student.id !== person.id));
    else {
      setGuardians(guardians.filter((guardian) => guardian.id !== person.id));
      setStudents(
        students.map((student) => ({
          ...student,
          guardianIds: student.guardianIds.filter((id) => id !== person.id),
        })),
      );
    }
    setView("list");
    setRecord(null);
    setPendingDelete(null);
  }

  if (signedOut)
    return (
      <div className="signed-out">
        <div className="panel">
          <div className="brand-icon">
            <GraduationCap />
          </div>
          <h1>See you soon</h1>
          <p>You have signed out of the Scholar demo.</p>
          <button
            className="button primary"
            onClick={() => setSignedOut(false)}
          >
            Return to demo
          </button>
        </div>
      </div>
    );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap size={25} />
          </div>
          <div>
            <strong>Scholar</strong>
            <small>Student Management</small>
          </div>
        </div>
        <nav aria-label="Main navigation">
          <button
            className={section === "students" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("students")}
          >
            <GraduationCap size={21} />
            Students
          </button>
          <button
            className={section === "guardians" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("guardians")}
          >
            <Users size={21} />
            Guardians
          </button>
        </nav>
        <button className="sign-out" onClick={() => setSignedOut(true)}>
          <LogOut size={21} />
          Sign out
        </button>
      </aside>
      <main>
        {view === "list" &&
          (section === "students" ? (
            <Students
              students={students}
              onAdd={() => openRecord(null, "form")}
              onView={(person) => openRecord(person, "details")}
              onEdit={(person) => openRecord(person, "form")}
              onDelete={setPendingDelete}
            />
          ) : (
            <Guardians
              guardians={guardians}
              onAdd={() => openRecord(null, "form")}
              onView={(person) => openRecord(person, "details")}
            />
          ))}
        {view === "form" && (
          <RecordForm
            key={`${kind}-${record?.id || "new"}`}
            kind={kind}
            record={record || {}}
            onCancel={() => setView(record ? "details" : "list")}
            onSave={saveRecord}
          />
        )}
        {view === "details" && record && (
          <RecordDetails
            key={`${kind}-${record.id}`}
            kind={kind}
            person={record}
            students={students}
            guardians={guardians}
            onBack={() => setView("list")}
            onEdit={() => setView("form")}
            onDelete={() => setPendingDelete(record)}
            onViewStudent={(student) => {
              setSection("students");
              openRecord(student, "details");
            }}
            onLinkStudent={(id) =>
              setStudents(
                students.map((student) =>
                  student.id === id
                    ? {
                        ...student,
                        guardianIds: [...student.guardianIds, record.id],
                      }
                    : student,
                ),
              )
            }
          />
        )}
      </main>
      {pendingDelete && (
        <DeleteModal
          person={pendingDelete}
          kind={kind}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => deleteRecord(pendingDelete)}
        />
      )}
    </div>
  );
}
