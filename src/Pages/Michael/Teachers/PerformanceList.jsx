import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UsersRound } from "lucide-react";
import { getTeachersOverview } from "../../../api/teachers";
import Toast from "../../../Components/Michael/Teachers/Toast";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "../shared/michael-ui.css";
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

function formatDuration(hoursValue) {
  if (hoursValue == null || hoursValue === "" || !Number.isFinite(Number(hoursValue))) return "–";
  const totalMinutes = Math.round(Number(hoursValue) * 60);
  if (totalMinutes === 0) return "0 min";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const wholeHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes ? `${wholeHours} h ${remainingMinutes} min` : `${wholeHours} h`;
}

function formatDisplayDate(value) {
  if (!value) return "–";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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
    <div className="michael-ui">
    <main className="mu-page-content mu-performance-page">
      <header className="mu-page-header">
        <div><h1 className="mu-page-title">Teacher performance</h1><p className="mu-caption">Review teaching assignments, scheduled time and attendance activity.</p></div>
      </header>
      <section className="card mu-card mu-performance-list-card">
        <div className="mu-performance-filter-group">
          <div className="mu-toolbar mu-performance-toolbar">
            <div className="mu-field mu-toolbar-search">
              <label className="mu-field-label" htmlFor="performance-search">Search teachers</label>
              <input className="input mu-field-control" id="performance-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" />
            </div>
            <div className="mu-performance-range-fields">
              <div className="mu-field">
                <label className="mu-field-label" htmlFor="performance-from">From</label>
                <input className="input mu-field-control" id="performance-from" type="date" value={range.from} onChange={(event) => updateRange("from", event.target.value)} />
              </div>
              <div className="mu-field">
                <label className="mu-field-label" htmlFor="performance-to">To</label>
                <input className="input mu-field-control" id="performance-to" type="date" value={range.to} onChange={(event) => updateRange("to", event.target.value)} />
              </div>
            </div>
          </div>
          <p className="mu-field-hint mu-performance-date-caption">{formatDisplayDate(range.from)} – {formatDisplayDate(range.to)}</p>
        </div>
        {loading ? <div className="mu-table-wrap" role="status" aria-label="Loading teacher overview">
          <table className="mu-table mu-table-grid performance-table" aria-hidden="true"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={7}><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table>
        </div> : error ? <div className="mu-empty-state mu-performance-error" role="alert"><p>{error}</p><button className="btn btn-outline" type="button" onClick={() => void load()}>Retry</button></div> : rows.length === 0 ? <div className="mu-empty-state">
          <span className="mu-empty-icon" aria-hidden="true"><UsersRound size={20} strokeWidth={1.8} /></span>
          <strong className="mu-empty-title">No active teachers found.</strong>
          <p className="mu-empty-hint">Try another search.</p>
        </div> : (
          <div className="mu-table-wrap"><table className="mu-table mu-table-grid performance-table">
            <thead><tr><th>Teacher</th><th>Employee number</th><th className="mu-cell-numeric">Classes</th><th className="mu-cell-numeric">Subjects</th><th className="mu-cell-numeric">Scheduled / week</th><th className="mu-cell-numeric">Attendance days</th><th className="mu-cell-numeric">Records entered</th></tr></thead>
            <tbody>{rows.map((teacher) => <tr key={teacher.teacherId}>
              <td><Link to={`/teachers/${teacher.teacherId}/performance`}>{teacher.fullName}</Link></td>
              <td>{teacher.employeeNumber || "—"}</td><td className="mu-cell-numeric">{teacher.classCount}</td><td className="mu-cell-numeric">{teacher.subjectCount}</td>
              <td className="mu-cell-numeric"><span style={{ fontVariantNumeric: "tabular-nums" }}>{formatDuration(teacher.weeklyScheduledMinutes == null ? teacher.weeklyScheduledMinutes : teacher.weeklyScheduledMinutes / 60)}</span></td><td className="mu-cell-numeric">{teacher.attendanceDaysMarked}</td><td className="mu-cell-numeric">{teacher.attendanceRecordsEntered}</td>
            </tr>)}</tbody>
          </table></div>
        )}
        {!loading && !error && pagination.total > 0 && <nav className="mu-pagination mu-performance-pagination" aria-label="Teacher performance pages">
          <span>{pagination.total} {pagination.total === 1 ? "teacher" : "teachers"}</span>
          <div className="mu-pagination-controls"><button className="btn btn-outline" type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
            <span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span>
            <button className="btn btn-outline" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
          </div>
        </nav>}
      </section>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
    </div>
  );
}
