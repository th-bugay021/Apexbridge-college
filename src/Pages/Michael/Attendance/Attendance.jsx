import { useCallback, useEffect, useMemo, useState } from "react";
import { getClass, getClasses, getMyClasses } from "../../../api/classes";
import { getAttendanceReport, getAttendanceSummary, getDailyAttendance, getStudentAttendance, markAttendance } from "../../../api/attendance";
import Toast from "../../../Components/Michael/Teachers/Toast";
import { useAuth } from "../../../Context/AuthContext";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "./attendance.css";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
function lagosDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type) => parts.find((item) => item.type === type)?.value;
  return get("year") + "-" + get("month") + "-" + get("day");
}
function shiftDate(value, amount) {
  const date = new Date(value + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
function presetRange(today, mode) {
  if (mode === "monthly") {
    const [year, month] = today.split("-").map(Number);
    const end = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { from: year + "-" + String(month).padStart(2, "0") + "-01", to: year + "-" + String(month).padStart(2, "0") + "-" + String(end).padStart(2, "0") };
  }
  const day = new Date(today + "T12:00:00Z").getUTCDay();
  const from = shiftDate(today, day === 0 ? -6 : 1 - day);
  return { from, to: shiftDate(from, 6) };
}
const label = (item) => [item?.name, item?.level].filter(Boolean).join(" · ") || "—";
async function getAllClasses() {
  const first = await getClasses({ page: 1, limit: 100 });
  const rows = [...first.classes];
  for (let page = 2; page <= first.pagination.totalPages; page += 1) rows.push(...(await getClasses({ page, limit: 100 })).classes);
  return rows;
}

export default function Attendance() {
  const { user } = useAuth();
  const role = user?.role;
  const isStudent = role === "STUDENT";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const today = useMemo(() => lagosDate(), []);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [classItem, setClassItem] = useState(null);
  const [date, setDate] = useState(today);
  const [range, setRange] = useState({ from: shiftDate(today, isStudent ? -30 : -6), to: today });
  const [tab, setTab] = useState(isStudent ? "history" : "daily");
  const [records, setRecords] = useState({});
  const [summary, setSummary] = useState(null);
  const [report, setReport] = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewLoading, setViewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isStudent || !isAdmin) {
        const own = await getMyClasses();
        setClasses(own);
        if (isStudent) {
          const student = own[0]?.students?.[0];
          if (!student) throw new Error("Your student profile or class is not available yet.");
          setHistoryStudent(student);
          setHistory(await getStudentAttendance(student.id, { from: shiftDate(today, -30), to: today }));
        } else if (own[0]) {
          setClassId(own[0].id);
          setClassItem(own[0]);
        }
      } else {
        const all = await getAllClasses();
        setClasses(all);
        if (all[0]) {
          setClassId(all[0].id);
          setClassItem(await getClass(all[0].id));
        }
      }
    } catch (e) {
      const message = e.message || apiErrorMessage(e, "attendance");
      setError(message);
      setToast({ type: "error", message });
    } finally { setLoading(false); }
  }, [isAdmin, isStudent, today]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadClasses(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadClasses]);

  const activeStudents = useMemo(() => (classItem?.students || []).filter((student) => student.status === "ACTIVE"), [classItem]);
  const selectClass = async (id) => {
    setClassId(id); setClassItem(null); setRecords({}); setError("");
    setViewLoading(Boolean(id));
    if (!id) return;
    setViewLoading(true);
    try { setClassItem(await getClass(id)); }
    catch (e) { const message = apiErrorMessage(e, "class roster"); setError(message); setToast({ type: "error", message }); }
    finally { setViewLoading(false); }
  };
  const loadDaily = useCallback(async () => {
    if (!classId || !classItem || !date) { setViewLoading(false); return; }
    setViewLoading(true); setError("");
    try {
      const data = await getDailyAttendance({ classId, date });
      const next = Object.fromEntries((classItem.students || []).map((student) => [student.id, ""]));
      data.attendance.forEach((row) => { next[row.studentId] = row.status; });
      setRecords(next);
    } catch (e) { const message = apiErrorMessage(e, "daily attendance"); setError(message); setToast({ type: "error", message }); }
    finally { setViewLoading(false); }
  }, [classId, classItem, date]);
  useEffect(() => {
    if (tab !== "daily" || !classItem) return undefined;
    const timer = window.setTimeout(() => { void loadDaily(); }, 0);
    return () => window.clearTimeout(timer);
  }, [tab, classItem, loadDaily]);

  const loadAggregate = useCallback(async () => {
    if (!classId || !range.from || !range.to) return;
    setViewLoading(true); setError("");
    try {
      const params = { classId, ...range };
      if (tab === "weekly" || tab === "monthly") setSummary(await getAttendanceSummary(params));
      if (tab === "report") setReport(await getAttendanceReport(params));
    } catch (e) { const message = apiErrorMessage(e, "attendance"); setError(message); setToast({ type: "error", message }); }
    finally { setViewLoading(false); }
  }, [classId, range, tab]);
  useEffect(() => {
    if (!["weekly", "monthly", "report"].includes(tab)) return undefined;
    const timer = window.setTimeout(() => { void loadAggregate(); }, 0);
    return () => window.clearTimeout(timer);
  }, [tab, loadAggregate]);

  const save = async () => {
    if (!activeStudents.length) return;
    if (activeStudents.some((student) => !STATUSES.includes(records[student.id]))) {
      setToast({ type: "error", message: "Choose a status for every active student before saving." }); return;
    }
    setSaving(true); setError("");
    try {
      await markAttendance({ classId, date, records: activeStudents.map((student) => ({ studentId: student.id, status: records[student.id] })) });
      setToast({ type: "success", message: "Attendance saved." });
    } catch (e) { const message = apiErrorMessage(e, "attendance"); setError(message); setToast({ type: "error", message }); }
    finally { setSaving(false); }
  };

  const openHistory = async (student) => {
    setHistoryStudent(student); setHistory(null); setError(""); setViewLoading(true);
    try { setHistory(await getStudentAttendance(student.id, range)); }
    catch (e) { const message = apiErrorMessage(e, "student attendance history"); setError(message); setToast({ type: "error", message }); }
    finally { setViewLoading(false); }
  };
  const reloadHistory = async () => {
    if (!historyStudent?.id) return;
    setViewLoading(true); setError("");
    try { setHistory(await getStudentAttendance(historyStudent.id, range)); }
    catch (e) { const message = apiErrorMessage(e, "student attendance history"); setError(message); setToast({ type: "error", message }); }
    finally { setViewLoading(false); }
  };
  const downloadCsv = () => {
    if (!report) return;
    const statuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
    const rows = [["Student", "Admission number", ...statuses, "Total marked days", "Attendance percentage"], ...report.students.map((student) => [student.fullName, student.admissionNumber, ...statuses.map((s) => student.counts?.[s] || 0), student.totalMarkedDays, student.attendancePercentage])];
    const csv = rows.map((row) => row.map((value) => "\"" + String(value ?? "").replaceAll("\"", "\"\"") + "\"").join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "attendance-" + (classItem?.name || "class") + "-" + range.from + "-" + range.to + ".csv"; link.click(); URL.revokeObjectURL(url);
  };
  const setRangePreset = () => setRange(presetRange(today, tab));
  const rangeControls = <div className="attendance-range"><label>From<input type="date" max={today} value={range.from} onChange={(e) => setRange((old) => ({ ...old, from: e.target.value }))} /></label><label>To<input type="date" max={today} value={range.to} onChange={(e) => setRange((old) => ({ ...old, to: e.target.value }))} /></label><button className="btn btn-outline" type="button" onClick={setRangePreset}>{tab === "monthly" ? "This month" : "This week"}</button></div>;

  return <main className="teacher-page attendance-page">
    <header className="teacher-page-header"><div><h1>{isStudent ? "My attendance history" : "Attendance"}</h1><p>{isStudent ? "Review your marked attendance records." : "Mark attendance and review class attendance."}</p></div></header>
    {loading ? <section className="teacher-card"><p className="teacher-state" role="status">Loading attendance…</p></section> : isStudent ? <section className="teacher-card">
      {error && <p className="teacher-state teacher-error" role="alert">{error}</p>}
      {historyStudent && <><div className="attendance-history-heading"><div><h2>{historyStudent.fullName}</h2><p>{historyStudent.admissionNumber || "Student"} · Read-only</p></div>{rangeControls}<button className="btn btn-outline" type="button" onClick={() => void reloadHistory()}>Apply range</button></div>
        {viewLoading ? <p className="teacher-state" role="status">Loading history…</p> : history?.history?.length ? <HistoryTable rows={history.history} /> : <p className="teacher-state">No attendance records were found for this date range.</p>}</>}
    </section> : <>
      {error && !classId && <section className="teacher-card teacher-error"><p className="teacher-state" role="alert">{error}</p><button className="btn btn-outline" type="button" onClick={() => void loadClasses()}>Retry</button></section>}
      <section className="teacher-card attendance-toolbar"><label>Class<select value={classId} onChange={(e) => void selectClass(e.target.value)} disabled={!classes.length || viewLoading}><option value="">Choose a class</option>{classes.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select></label>
        {tab === "daily" ? <label>Date<input type="date" max={today} value={date} onChange={(e) => { setRecords({}); setViewLoading(true); setDate(e.target.value); }} /></label> : rangeControls}</section>
      {classes.length === 0 && !error ? <section className="teacher-card"><p className="teacher-state">No classes are available for attendance.</p></section> : <>
        <nav className="attendance-tabs" aria-label="Attendance views">{[["daily", "Daily"], ["weekly", "Weekly"], ["monthly", "Monthly"], ["report", "Report"]].map(([key, title]) => <button key={key} type="button" className={tab === key ? "is-selected" : ""} aria-pressed={tab === key} onClick={() => { setTab(key); setError(""); }}>{title}</button>)}</nav>
        {error && classId && <section className="teacher-card teacher-error"><p className="teacher-state" role="alert">{error}</p><button className="btn btn-outline" type="button" onClick={() => tab === "daily" ? void loadDaily() : void loadAggregate()}>Retry</button></section>}
        {tab === "daily" && <section className="teacher-card"><div className="teacher-section-header"><div><h2>{classItem ? label(classItem) : "Class roster"}</h2><p>Only active students can be marked.</p></div><div className="attendance-actions"><button className="btn btn-outline" type="button" disabled={!activeStudents.length || viewLoading} onClick={() => setRecords(Object.fromEntries(activeStudents.map((s) => [s.id, "PRESENT"])))}>Mark all present</button><button className="btn btn-primary" type="button" disabled={saving || viewLoading || !activeStudents.length} onClick={() => void save()}>{saving ? "Saving…" : "Save attendance"}</button></div></div>
          {viewLoading ? <p className="teacher-state" role="status">Loading roster and existing marks…</p> : !classItem ? <p className="teacher-state">Select a class to view its roster.</p> : !activeStudents.length ? <p className="teacher-state">No active students are available to mark.</p> : <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Student</th><th>Admission number</th><th>Status</th><th>History</th></tr></thead><tbody>{activeStudents.map((student) => <tr key={student.id}><td>{student.fullName}</td><td>{student.admissionNumber}</td><td><select aria-label={"Attendance status for " + student.fullName} value={records[student.id] || ""} onChange={(e) => setRecords((old) => ({ ...old, [student.id]: e.target.value }))}><option value="">Choose status</option>{STATUSES.map((status) => <option key={status} value={status}>{status[0] + status.slice(1).toLowerCase()}</option>)}</select></td><td><button className="teacher-text-button" type="button" onClick={() => void openHistory(student)}>View history</button></td></tr>)}</tbody></table></div>}</section>}
        {(tab === "weekly" || tab === "monthly") && <section className="teacher-card"><div className="teacher-section-header"><div><h2>{tab === "weekly" ? "Weekly" : "Monthly"} summary</h2><p>{label(classItem)} · {range.from} to {range.to}</p></div><button className="btn btn-outline" type="button" disabled={viewLoading} onClick={() => void loadAggregate()}>Refresh</button></div>{viewLoading ? <p className="teacher-state" role="status">Loading summary…</p> : summary?.students?.length ? <SummaryTable rows={summary.students} onHistory={openHistory} /> : <p className="teacher-state">No attendance summary is available for this date range.</p>}</section>}
        {tab === "report" && <section className="teacher-card"><div className="teacher-section-header"><div><h2>Attendance report</h2><p>{label(classItem)} · {range.from} to {range.to}</p></div><button className="btn btn-outline" type="button" disabled={!report?.students?.length} onClick={downloadCsv}>Download CSV</button></div>{report && <div className="attendance-totals"><strong>Overall attendance: {report.totals?.attendancePercentage ?? 0}%</strong><span>{report.totals?.totalMarkedDays ?? 0} total marked student days</span>{STATUSES.map((s) => <span key={s}>{s[0] + s.slice(1).toLowerCase()}: {report.totals?.counts?.[s] ?? 0}</span>)}</div>}{viewLoading ? <p className="teacher-state" role="status">Loading report…</p> : report?.students?.length ? <ReportTable rows={report.students} onHistory={openHistory} /> : <p className="teacher-state">No report data is available for this date range.</p>}</section>}
        {historyStudent && <section className="teacher-card attendance-history"><div className="teacher-section-header"><div><h2>{historyStudent.fullName} · Attendance history</h2><p>{historyStudent.admissionNumber || "Student"}</p></div><button className="btn btn-outline" type="button" onClick={() => { setHistoryStudent(null); setHistory(null); }}>Close history</button></div>{rangeControls}{viewLoading ? <p className="teacher-state" role="status">Loading history…</p> : history?.history?.length ? <HistoryTable rows={history.history} /> : <p className="teacher-state">No attendance records were found for this date range.</p>}</section>}
      </>}
    </>}
    <Toast toast={toast} onClose={() => setToast(null)} />
  </main>;
}

function SummaryTable({ rows, onHistory }) {
  return <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Student</th>{STATUSES.map((s) => <th key={s}>{s}</th>)}<th>Total days</th></tr></thead><tbody>{rows.map((student) => <tr key={student.studentId}><td><button className="teacher-text-button" type="button" onClick={() => onHistory({ id: student.studentId, fullName: student.fullName, admissionNumber: student.admissionNumber })}>{student.fullName}</button></td>{STATUSES.map((s) => <td key={s}>{student.counts?.[s] ?? 0}</td>)}<td>{student.totalMarkedDays}</td></tr>)}</tbody></table></div>;
}
function ReportTable({ rows, onHistory }) {
  return <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Student</th><th>Admission number</th>{STATUSES.map((s) => <th key={s}>{s}</th>)}<th>Total days</th><th>Attendance</th></tr></thead><tbody>{rows.map((student) => <tr key={student.studentId}><td><button className="teacher-text-button" type="button" onClick={() => onHistory({ id: student.studentId, fullName: student.fullName, admissionNumber: student.admissionNumber })}>{student.fullName}</button></td><td>{student.admissionNumber || "—"}</td>{STATUSES.map((s) => <td key={s}>{student.counts?.[s] ?? 0}</td>)}<td>{student.totalMarkedDays}</td><td>{student.attendancePercentage}%</td></tr>)}</tbody></table></div>;
}
function HistoryTable({ rows }) {
  return <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Date</th><th>Class</th><th>Status</th><th>Marked by</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.date}</td><td>{label(row.class)}</td><td><span className={"teacher-badge " + (row.status === "PRESENT" || row.status === "LATE" ? "is-active" : row.status === "ABSENT" ? "is-inactive" : "is-pending")}>{row.status}</span></td><td>{row.markedBy?.fullName || "—"}</td></tr>)}</tbody></table></div>;
}
