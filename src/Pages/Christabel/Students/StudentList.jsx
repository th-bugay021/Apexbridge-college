import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../../Context/AuthContext";
import useDebounce from "../../../hooks/useDebounce";
import useStudentSampleData from "../useStudentSampleData";
import ConfirmDialog from "../ConfirmDialog";
import AddStudent from "./AddStudent";
import "../studentPages.css";
import "../../Michael/shared/michael-ui.css";

const PAGE_SIZE = 8;

function statusTone(status) {
  return status === "Active" ? "mu-badge-success" : status === "Inactive" ? "mu-badge-neutral" : "mu-badge-warning";
}

function csvValue(value) {
  const text = String(value ?? "");
  const safe = /^[-=+@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export default function StudentList() {
  const { hasPermission } = useAuth();
  const { students, guardians, loading, addStudent, updateStudent, deleteStudents } = useStudentSampleData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [studentModal, setStudentModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const actionButtonRef = useRef(null);
  const query = useDebounce(search.trim().toLowerCase(), 400);
  const canCreate = hasPermission("students.create");
  const canUpdate = hasPermission("students.update");
  const canDelete = hasPermission("students.delete");
  const classOptions = useMemo(() => [...new Set(students.map((student) => student.className).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [students]);
  const filtered = useMemo(() => {
    const rows = students.filter((student) => {
      const name = `${student.firstName} ${student.lastName}`.toLowerCase();
      return name.includes(query) && (!statusFilter || student.status === statusFilter) && (!classFilter || student.className === classFilter) && (!genderFilter || student.gender === genderFilter);
    });
    if (sort === "name") rows.sort((left, right) => left.lastName.localeCompare(right.lastName) || left.firstName.localeCompare(right.firstName));
    else rows.sort((left, right) => (sort === "oldest" ? 1 : -1) * (left.admissionDate || "").localeCompare(right.admissionDate || ""));
    return rows;
  }, [students, query, statusFilter, classFilter, genderFilter, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allVisibleSelected = visible.length > 0 && visible.every((student) => selected.includes(student.id));
  const guardianName = (student) => (student.guardianIds || []).map((id) => guardians.find((guardian) => guardian.id === id)).filter(Boolean).map((guardian) => `${guardian.firstName} ${guardian.lastName}`).join(", ") || "—";

  const updateFilter = (setter, value) => { setter(value); setPage(1); };
  const toggleOne = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleVisible = () => setSelected((current) => allVisibleSelected ? current.filter((id) => !visible.some((student) => student.id === id)) : [...new Set([...current, ...visible.map((student) => student.id)])]);
  const openStudentForm = (student, event) => { actionButtonRef.current = event.currentTarget; setStudentModal({ student: student || null }); };
  const saveStudent = (values) => {
    if (!studentModal) return "The student form is no longer open.";
    const message = studentModal.student ? updateStudent(studentModal.student.id, values) : addStudent(values);
    if (!message) setStudentModal(null);
    return message;
  };
  const confirmDelete = () => {
    if (!confirm) return;
    deleteStudents(confirm.ids);
    setSelected((current) => current.filter((id) => !confirm.ids.includes(id)));
    setConfirm(null);
  };

  const exportRows = () => {
    const rows = filtered.filter((student) => selected.length === 0 || selected.includes(student.id));
    const fields = ["Student ID", "First name", "Last name", "Date of birth", "Gender", "Email", "Phone", "Address", "Department", "Class", "Guardian", "Admission date", "Status"];
    const csv = [fields, ...rows.map((student) => [student.studentId, student.firstName, student.lastName, student.birthDate, student.gender, student.email, student.phone, student.address, student.department, student.className, guardianName(student), student.admissionDate, student.status])].map((row) => row.map(csvValue).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "apexbridge-students.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="michael-ui students-ui">
      <main className="mu-page-content">
        <header className="mu-page-header">
          <div><h1 className="mu-page-title">Students</h1><p className="mu-caption">{students.length} student records.</p></div>
          <div className="mu-page-header-actions"><span className="students-sample-tag">Sample data</span><button type="button" className="btn btn-outline" onClick={exportRows}><Download size={16} /> Export{selected.length ? ` (${selected.length})` : ""}</button>{canCreate && <button type="button" className="btn btn-primary" onClick={(event) => openStudentForm(null, event)}><Plus size={16} /> Add student</button>}</div>
        </header>
        <section className="card mu-card students-list-card" aria-label="Student list">
          <div className="mu-toolbar students-toolbar">
            <label className="mu-field students-search"><span className="mu-field-label">Search students</span><input className="input mu-field-control" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Name or student ID" /></label>
            <label className="mu-field"><span className="mu-field-label">Status</span><select className="input mu-field-control" value={statusFilter} onChange={(event) => updateFilter(setStatusFilter, event.target.value)}><option value="">All statuses</option>{["Active", "Inactive", "Graduated"].map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="mu-field"><span className="mu-field-label">Class</span><select className="input mu-field-control" value={classFilter} onChange={(event) => updateFilter(setClassFilter, event.target.value)}><option value="">All classes</option>{classOptions.map((className) => <option key={className}>{className}</option>)}</select></label>
            <label className="mu-field"><span className="mu-field-label">Gender</span><select className="input mu-field-control" value={genderFilter} onChange={(event) => updateFilter(setGenderFilter, event.target.value)}><option value="">All genders</option>{["Female", "Male", "Other"].map((gender) => <option key={gender}>{gender}</option>)}</select></label>
            <label className="mu-field"><span className="mu-field-label">Sort</span><select className="input mu-field-control" value={sort} onChange={(event) => updateFilter(setSort, event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select></label>
          </div>
          {canDelete && selected.length > 0 && <div className="students-bulk-actions"><span>{selected.length} selected</span><button type="button" className="btn mu-btn-danger" onClick={(event) => { actionButtonRef.current = event.currentTarget; setConfirm({ ids: selected, message: `Delete ${selected.length} selected student${selected.length === 1 ? "" : "s"}?` }); }}>Delete selected</button></div>}
          {loading ? <div className="mu-table-wrap" role="status" aria-label="Loading students"><table className="mu-table"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table></div> : filtered.length === 0 ? <div className="mu-empty-state"><strong className="mu-empty-title">No students found.</strong><p className="mu-empty-hint">Try a different search or filter.</p></div> : <div className="mu-table-wrap">
            <table className="mu-table mu-table-grid students-table">
              <thead><tr><th scope="col" className="students-checkbox-cell"><input className="input students-checkbox" type="checkbox" aria-label="Select all students on this page" checked={allVisibleSelected} onChange={toggleVisible} /></th><th scope="col">Student</th><th scope="col">Student ID</th><th scope="col">Class</th><th scope="col">Guardian</th><th scope="col">Status</th><th scope="col" className="mu-cell-action">Actions</th></tr></thead>
              <tbody>{visible.map((student) => <tr key={student.id}>
                <td className="students-checkbox-cell"><input className="input students-checkbox" type="checkbox" aria-label={`Select ${student.firstName} ${student.lastName}`} checked={selected.includes(student.id)} onChange={() => toggleOne(student.id)} /></td>
                <td><div className="students-person-cell">{student.photo ? <img className="students-avatar" src={student.photo} alt="" /> : <span className="students-avatar" aria-hidden="true">{student.firstName[0]}{student.lastName[0]}</span>}<span><Link to={`/students/${student.id}`}><strong>{student.firstName} {student.lastName}</strong></Link><small title={student.email || "No email"}>{student.email || "No email"}</small></span></div></td>
                <td>{student.studentId}</td><td>{student.className}</td><td>{guardianName(student)}</td><td><span className={`mu-badge ${statusTone(student.status)}`}>{student.status}</span></td>
                <td className="mu-cell-action"><div className="students-row-actions"><Link className="btn mu-btn-row-action" to={`/students/${student.id}`} aria-label={`View ${student.firstName}`}><Eye size={15} /></Link>{canUpdate && <button className="btn mu-btn-row-action" type="button" aria-label={`Edit ${student.firstName}`} onClick={(event) => openStudentForm(student, event)}><Pencil size={15} /></button>}{canDelete && <button className="btn mu-btn-danger" type="button" aria-label={`Delete ${student.firstName}`} onClick={(event) => { actionButtonRef.current = event.currentTarget; setConfirm({ ids: [student.id], message: `Delete ${student.firstName} ${student.lastName}'s student record?` }); }}><Trash2 size={15} /></button>}</div></td>
              </tr>)}</tbody>
            </table>
          </div>}
          {!loading && filtered.length > 0 && <nav className="mu-pagination" aria-label="Student pages"><span>{filtered.length} {filtered.length === 1 ? "student" : "students"}</span><div className="mu-pagination-controls"><button type="button" className="btn btn-outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button type="button" className="btn btn-outline" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></div></nav>}
        </section>
      </main>
      {studentModal && <AddStudent key={studentModal.student?.id || "new-student"} student={studentModal.student} guardians={guardians} onCancel={() => setStudentModal(null)} onSave={saveStudent} returnFocusRef={actionButtonRef} />}
      {confirm && <ConfirmDialog title="Delete student records?" message={confirm.message} onCancel={() => setConfirm(null)} onConfirm={confirmDelete} returnFocusRef={actionButtonRef} />}
    </div>
  );
}
