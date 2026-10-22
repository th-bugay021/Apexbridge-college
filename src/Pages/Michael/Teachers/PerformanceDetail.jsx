import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyProfile, getTeacherOverview } from "../../../api/teachers";
import Toast from "../../../Components/Michael/Teachers/Toast";
import WeeklyTimetable from "../Timetable/WeeklyTimetable";
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

function scheduledHours(minutes) {
  return `${(minutes / 60).toFixed(1)} hours`;
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
    <main className="teacher-page performance-page">
      <header className="teacher-page-header">
        <div><h1>{ownView ? "My performance" : "Teacher performance"}</h1><p>{overview?.teacher?.fullName || (loading ? "Loading teacher…" : "Teaching and attendance overview")}</p></div>
        {!ownView && <Link className="btn btn-outline" to="/teachers/performance">Back to teacher overview</Link>}
      </header>
      <section className="teacher-card">
        <form className="performance-range-form" onSubmit={applyRange}>
          <div className="performance-date-range">
            <label>Attendance from<input type="date" value={draftRange.from} onChange={(event) => setDraft("from", event.target.value)} /></label>
            <label>To<input type="date" value={draftRange.to} onChange={(event) => setDraft("to", event.target.value)} /></label>
          </div>
          <button className="btn btn-outline" type="submit">Apply dates</button>
        </form>
      </section>

      {loading ? <section className="teacher-card"><p className="teacher-state" role="status">Loading teacher overview…</p></section> : error ? <section className="teacher-card"><div className="teacher-state teacher-error" role="alert"><p>{error}</p><button className="btn btn-outline" type="button" onClick={() => void load()}>Retry</button></div></section> : overview ? <>
        <section className="performance-summary" aria-label="Performance summary">
          <article className="teacher-card performance-stat"><span>Classes taught</span><strong>{classes.length}</strong></article>
          <article className="teacher-card performance-stat"><span>Subjects taught</span><strong>{subjectsTaught}</strong></article>
          <article className="teacher-card performance-stat"><span>Scheduled per week</span><strong>{scheduledHours(overview.weeklyScheduledMinutes || 0)}</strong></article>
          <article className="teacher-card performance-stat"><span>Attendance days marked</span><strong>{overview.attendance?.daysMarked ?? 0}</strong><small>{overview.attendance?.recordsEntered ?? 0} records entered</small></article>
        </section>

        <section className="teacher-card">
          <h2>Classes and subjects</h2>
          {!classes.length ? <p className="teacher-state">No class and subject assignments are available yet.</p> : <div className="teacher-table-wrap"><table className="teacher-table performance-table">
            <thead><tr><th>Class</th><th>Level</th><th>Subjects</th></tr></thead>
            <tbody>{classes.map((classItem) => <tr key={classItem.classId}><td>{classItem.name}</td><td>{classItem.level || "—"}</td><td>{classItem.subjects.length ? classItem.subjects.map((subject) => `${subject.name} (${subject.code})`).join(", ") : "—"}</td></tr>)}</tbody>
          </table></div>}
        </section>

        <section className="teacher-card">
          <h2>Weekly schedule</h2>
          <WeeklyTimetable entries={overview.weeklySchedule || []} showClass />
        </section>

        <section className="teacher-card">
          <h2>Attendance activity</h2>
          <p className="performance-caption">Marks entered by this teacher from {range.from} to {range.to}.</p>
          {!attendanceByClass.length ? <p className="teacher-state">No attendance marks were entered in this date range.</p> : <div className="teacher-table-wrap"><table className="teacher-table performance-table">
            <thead><tr><th>Class</th><th>Days marked</th></tr></thead>
            <tbody>{attendanceByClass.map((item) => <tr key={item.classId}><td>{item.name}</td><td>{item.daysMarked}</td></tr>)}</tbody>
          </table></div>}
        </section>
        <p className="performance-results-note">Results-based metrics will appear once the Results module is available.</p>
      </> : <section className="teacher-card"><p className="teacher-state">No overview data is available.</p></section>}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}
