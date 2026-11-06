import { useState } from "react";
import { ArrowDownUp, Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Avatar, PageHeader, SearchBox, Status } from "./components";

export default function Students({
  students,
  onAdd,
  onView,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [grade, setGrade] = useState("");
  const [gender, setGender] = useState("");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);

  const filtered = students.filter((student) => {
    const name = `${student.firstName} ${student.lastName}`.toLowerCase();
    return (
      name.includes(search.toLowerCase()) &&
      (!status || student.status === status) &&
      (!grade || student.grade === grade) &&
      (!gender || student.gender === gender)
    );
  });
  if (sort === "name")
    filtered.sort((a, b) => a.firstName.localeCompare(b.firstName));
  if (sort === "oldest") filtered.reverse();
  const pageCount = Math.max(1, Math.ceil(filtered.length / 6));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 6, currentPage * 6);
  const allSelected =
    visible.length > 0 &&
    visible.every((student) => selected.includes(student.id));

  function toggleStudent(id) {
    setSelected(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
  }

  function exportStudents() {
    const rows = filtered.filter(
      (student) => selected.length === 0 || selected.includes(student.id),
    );
    const csvRows = [
      ["Student", "ID", "Grade", "Status", "Email"],
      ...rows.map((student) => [
        `${student.firstName} ${student.lastName}`,
        student.id,
        student.grade,
        student.status,
        student.email,
      ]),
    ];
    const csv = csvRows
      .map((row) =>
        row
          .map((value) => {
            // Prevent spreadsheet formulas when exporting user-entered values.
            const safe = /^[=+@\-]/.test(value) ? `'${value}` : value;
            return `"${String(safe).replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "scholar-students.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${students.length} students enrolled`}
      >
        <button className="button" onClick={exportStudents}>
          <Download size={20} />
          Export{selected.length > 0 ? ` (${selected.length})` : ""}
        </button>
        <button className="button primary" onClick={onAdd}>
          <Plus size={20} />
          Add student
        </button>
      </PageHeader>
      <div className="page-content">
        <div className="student-filters">
          <SearchBox
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by name..."
          />
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {["Active", "Inactive", "Graduated"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label="Filter by grade"
            value={grade}
            onChange={(event) => {
              setGrade(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All grades</option>
            {[...new Set(students.map((student) => student.grade))]
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
              .map((item) => (
                <option key={item}>{item}</option>
              ))}
          </select>
          <select
            aria-label="Filter by gender"
            value={gender}
            onChange={(event) => {
              setGender(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All genders</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <div className="sort-select">
            <ArrowDownUp size={19} />
            <select
              aria-label="Sort students"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
        <div className="panel student-table">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th className="checkbox-cell">
                    <input
                      type="checkbox"
                      aria-label="Select all visible students"
                      checked={allSelected}
                      onChange={() =>
                        setSelected(
                          allSelected
                            ? selected.filter(
                                (id) =>
                                  !visible.some((student) => student.id === id),
                              )
                            : [
                                ...new Set([
                                  ...selected,
                                  ...visible.map((student) => student.id),
                                ]),
                              ],
                        )
                      }
                    />
                  </th>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Guardians</th>
                  <th className="actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((student) => (
                  <tr key={student.id}>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        aria-label={`Select ${student.firstName}`}
                        checked={selected.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                      />
                    </td>
                    <td>
                      <button
                        className="person-link"
                        onClick={() => onView(student)}
                      >
                        <Avatar person={student} />
                        <span>
                          <strong>
                            {student.firstName} {student.lastName}
                          </strong>
                          <small>{student.email}</small>
                        </span>
                      </button>
                    </td>
                    <td>{student.id}</td>
                    <td>{student.grade || "—"}</td>
                    <td>
                      <Status value={student.status} />
                    </td>
                    <td>{student.guardianIds.length || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`View ${student.firstName}`}
                          onClick={() => onView(student)}
                        >
                          <Eye />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Edit ${student.firstName}`}
                          onClick={() => onEdit(student)}
                        >
                          <Pencil />
                        </button>
                        <button
                          className="icon-button delete-icon"
                          aria-label={`Delete ${student.firstName}`}
                          onClick={() => onDelete(student)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && (
              <p className="empty-state">
                No students found. Try a different search or filter.
              </p>
            )}
          </div>
          <div className="table-footer">
            <span>
              Showing {filtered.length ? (currentPage - 1) * 6 + 1 : 0}–
              {Math.min(currentPage * 6, filtered.length)} of {filtered.length}
            </span>
            <div className="pagination">
              <button
                className="button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>Page {currentPage}</span>
              <button
                className="button"
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
