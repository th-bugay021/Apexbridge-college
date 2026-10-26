import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, ClipboardList, UsersRound } from "lucide-react";
import { getMyProfile, getTeacherOverview } from "../../../api/teachers";
import Toast from "../../../Components/Michael/Teachers/Toast";
import WeeklyTimetable from "../Timetable/WeeklyTimetable";
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
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export default function PerformanceDetail() {
  const { id } = useParams();
  const ownView = !id;
  const [draftRange, setDraftRange] = useState(initialRange);
  const [range, setRange] = useState(initialRange);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let teacherId = id;
      if (ownView) {
        const profile = await getMyProfile();
        teacherId = profile.id;
      }
      setOverview(await getTeacherOverview(teacherId, range));
    } catch (requestError) {
      const message = requestMessage(requestError);
      setError(message);
      setToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [id, ownView, range]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const setDraft = (field, value) => setDraftRange((current) => ({ ...current, [field]: value }));
  const applyRange = (event) => {
    event.preventDefault();
    setRange({ ...draftRange });
  };
  const classes = overview?.classes || [];
  const subjectsTaught = classes.reduce((total, classItem) => total + classItem.subjects.length, 0);
  const attendanceByClass = overview?.attendance?.byClass || [];

  return (
    <div className="michael-ui">
    <main className="mu-page-content mu-performance-page">
      <header className="mu-page-header">
        <div><h1 className="mu-page-title">{ownView ? "My performance" : "Teacher performance"}</h1><p className="mu-caption">{overview?.teacher?.fullName || (loading ? "Loading teacher…" : "Teaching and attendance overview")}</p></div>
        {!ownView && <Link className="btn btn-outline" to="/teachers/performance">Back to teacher overview</Link>}
      </header>
      <section className="card mu-card">
        <form className="mu-toolbar mu-performance-toolbar" onSubmit={applyRange}>
          <div className="mu-performance-range-fields">
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="performance-detail-from">Attendance from</label>
              <input className="input mu-field-control" id="performance-detail-from" type="date" value={draftRange.from} onChange={(event) => setDraft("from", event.target.value)} />
            </div>
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="performance-detail-to">To</label>
              <input className="input mu-field-control" id="performance-detail-to" type="date" value={draftRange.to} onChange={(event) => setDraft("to", event.target.value)} />
            </div>
            <p className="mu-field-hint mu-performance-date-caption">{formatDisplayDate(draftRange.from)} – {formatDisplayDate(draftRange.to)}</p>
          </div>
          <button className="btn btn-outline mu-performance-apply" type="submit">Apply dates</button>
        </form>
      </section>

      {loading ? <>
        <section className="mu-stat-grid" aria-label="Loading performance summary" role="status">
          {Array.from({ length: 4 }, (_, index) => <article className="mu-stat-card" key={index}><div className="mu-skeleton mu-skeleton-text" /></article>)}
        </section>
        <section className="card mu-card mu-performance-section"><h2 className="mu-section-title">Classes and subjects</h2><div className="mu-table-wrap" aria-hidden="true"><table className="mu-table"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table></div></section>
        <section className="card mu-card mu-performance-section"><h2 className="mu-section-title">Weekly schedule</h2><WeeklyTimetable entries={[]} loading /></section>
        <section className="card mu-card mu-performance-section"><h2 className="mu-section-title">Attendance activity</h2><div className="mu-table-wrap" aria-hidden="true"><table className="mu-table"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table></div></section>
      </> : error ? <section className="card mu-card mu-empty-state mu-performance-error" role="alert"><p>{error}</p><button className="btn btn-outline" type="button" onClick={() => void load()}>Retry</button></section> : overview ? <>
        <section className="mu-stat-grid" aria-label="Performance summary">
          <article className="mu-stat-card"><span className="mu-stat-label">Classes taught</span><strong className="mu-stat-number">{classes.length}</strong></article>
          <article className="mu-stat-card"><span className="mu-stat-label">Subjects taught</span><strong className="mu-stat-number">{subjectsTaught}</strong></article>
          <article className="mu-stat-card"><span className="mu-stat-label">Scheduled per week</span><strong className="mu-stat-number"><span style={{ fontVariantNumeric: "tabular-nums" }}>{formatDuration(overview.weeklyScheduledMinutes == null ? overview.weeklyScheduledMinutes : overview.weeklyScheduledMinutes / 60)}</span></strong></article>
          <article className="mu-stat-card"><span className="mu-stat-label">Attendance days marked</span><strong className="mu-stat-number">{overview.attendance?.daysMarked ?? 0}</strong><p className="mu-stat-caption">{overview.attendance?.recordsEntered ?? 0} records entered</p></article>
        </section>

        <section className="card mu-card mu-performance-section">
          <h2 className="mu-section-title">Classes and subjects</h2>
          {!classes.length ? <div className="mu-empty-state">
            <span className="mu-empty-icon" aria-hidden="true"><UsersRound size={20} strokeWidth={1.8} /></span>
            <strong className="mu-empty-title">No class and subject assignments are available yet.</strong>
            <p className="mu-empty-hint">Review the teacher’s class and subject assignments.</p>
          </div> : <div className="mu-table-wrap"><table className="mu-table performance-table">
            <thead><tr><th>Class</th><th>Level</th><th>Subjects</th></tr></thead>
            <tbody>{classes.map((classItem) => <tr key={classItem.classId}><td>{classItem.name}</td><td><span className="mu-badge mu-badge-neutral">{classItem.level || "—"}</span></td><td>{classItem.subjects.length ? classItem.subjects.map((subject) => `${subject.name} (${subject.code})`).join(", ") : "—"}</td></tr>)}</tbody>
          </table></div>}
        </section>

        <section className="card mu-card mu-performance-section">
          <h2 className="mu-section-title">Weekly schedule</h2>
          <WeeklyTimetable entries={overview.weeklySchedule || []} showClass />
        </section>

        <section className="card mu-card mu-performance-section">
          <h2 className="mu-section-title">Attendance activity</h2>
          <p className="mu-caption">Marks entered by this teacher from {formatDisplayDate(range.from)} – {formatDisplayDate(range.to)}.</p>
          {!attendanceByClass.length ? <div className="mu-empty-state">
            <span className="mu-empty-icon" aria-hidden="true"><CalendarDays size={20} strokeWidth={1.8} /></span>
            <strong className="mu-empty-title">No attendance marks were entered in this date range.</strong>
            <p className="mu-empty-hint">Try another date range.</p>
          </div> : <div className="mu-table-wrap"><table className="mu-table performance-table">
            <thead><tr><th>Class</th><th className="mu-cell-numeric">Days marked</th></tr></thead>
            <tbody>{attendanceByClass.map((item) => <tr key={item.classId}><td>{item.name}</td><td className="mu-cell-numeric">{item.daysMarked}</td></tr>)}</tbody>
          </table></div>}
        </section>
        <p className="mu-caption mu-performance-results-note">Results-based metrics will appear once the Results module is available.</p>
      </> : <section className="card mu-card mu-empty-state">
        <span className="mu-empty-icon" aria-hidden="true"><ClipboardList size={20} strokeWidth={1.8} /></span>
        <strong className="mu-empty-title">No overview data is available.</strong>
        <p className="mu-empty-hint">Try another date range.</p>
      </section>}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
    </div>
  );
}
