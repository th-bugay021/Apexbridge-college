import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTeachersOverview } from "../../../api/teachers";
import Toast from "../../../Components/Michael/Teachers/Toast";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "./performance.css";

function lagosToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type) => parts.find((item) => item.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function shiftDate(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function initialRange() {
  const today = lagosToday();
  return { from: shiftDate(today, -29), to: today };
}

function requestMessage(error) {
  return error?.response?.data?.error?.message || apiErrorMessage(error, "teacher overview");
}

function hours(minutes) {
  return `${(minutes / 60).toFixed(1)} h`;
}

export default function PerformanceList() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState(initialRange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = search.trim();
      setQuery((current) => current === nextQuery ? current : nextQuery);
      setPagination((current) => current.page === 1 ? current : { ...current, page: 1 });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getTeachersOverview({ ...range, page: pagination.page, limit: pagination.limit, search: query });
      setRows(result.teachers || []);
      setPagination(result.pagination);
    } catch (requestError) {
      const message = requestMessage(requestError);
      setError(message);
      setToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.page, query, range]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const updateRange = (field, value) => setRange((current) => ({ ...current, [field]: value }));

  return (
    <main className="teacher-page performance-page">
      <header className="teacher-page-header">
        <div><h1>Teacher performance</h1><p>Review teaching assignments, scheduled time and attendance activity.</p></div>
      </header>
      <section className="teacher-card">
        <div className="performance-filters">
          <label className="teacher-search">Search teachers<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" /></label>
          <div className="performance-date-range">
            <label>From<input type="date" value={range.from} onChange={(event) => updateRange("from", event.target.value)} /></label>
            <label>To<input type="date" value={range.to} onChange={(event) => updateRange("to", event.target.value)} /></label>
          </div>
        </div>
        {loading ? <p className="teacher-state" role="status">Loading teacher overview…</p> : error ? <div className="teacher-state teacher-error" role="alert"><p>{error}</p><button className="btn btn-outline" type="button" onClick={() => void load()}>Retry</button></div> : rows.length === 0 ? <p className="teacher-state">No active teachers found. Try another search.</p> : (
          <div className="teacher-table-wrap"><table className="teacher-table performance-table">
            <thead><tr><th>Teacher</th><th>Employee number</th><th>Classes</th><th>Subjects</th><th>Scheduled / week</th><th>Attendance days</th><th>Records entered</th></tr></thead>
            <tbody>{rows.map((teacher) => <tr key={teacher.teacherId}>
              <td><Link to={`/teachers/${teacher.teacherId}/performance`}>{teacher.fullName}</Link></td>
              <td>{teacher.employeeNumber || "—"}</td><td>{teacher.classCount}</td><td>{teacher.subjectCount}</td>
              <td>{hours(teacher.weeklyScheduledMinutes)}</td><td>{teacher.attendanceDaysMarked}</td><td>{teacher.attendanceRecordsEntered}</td>
            </tr>)}</tbody>
          </table></div>
        )}
        {!loading && !error && pagination.total > 0 && <nav className="teacher-pagination" aria-label="Teacher performance pages">
          <span>{pagination.total} {pagination.total === 1 ? "teacher" : "teachers"}</span>
          <div><button className="btn btn-outline" type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
            <span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span>
            <button className="btn btn-outline" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
          </div>
        </nav>}
      </section>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}
