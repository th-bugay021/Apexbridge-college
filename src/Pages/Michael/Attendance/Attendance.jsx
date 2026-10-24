import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, CircleHelp, CircleX, Clock3, School, UsersRound } from "lucide-react";
import { getClass, getClasses, getMyClasses } from "../../../api/classes";
import { getAttendanceReport, getAttendanceSummary, getDailyAttendance, getStudentAttendance, markAttendance } from "../../../api/attendance";
import Toast from "../../../Components/Michael/Teachers/Toast";
import { useAuth } from "../../../Context/AuthContext";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "../shared/michael-ui.css";
import "./attendance.css";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
const statusLabels = { PRESENT: "Present", ABSENT: "Absent", LATE: "Late", EXCUSED: "Excused" };

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
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(String(value).slice(0, 10) + "T12:00:00Z");
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
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

function SkeletonRows({ columns = 4 }) {
  return <div className="mu-table-wrap" role="status" aria-label="Loading attendance">
    <table className="mu-table" aria-hidden="true"><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={columns}><div className="mu-skeleton mu-skeleton-row" /></td></tr>)}</tbody></table>
  </div>;
}

function EmptyState({ Icon = BookOpen, title, hint, className = "" }) {
  return <div className={`mu-empty-state mu-attendance-empty ${className}`}>
    <span className="mu-empty-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
    <strong className="mu-empty-title">{title}</strong>
    {hint && <p className="mu-empty-hint">{hint}</p>}
  </div>;
}

function StatusSelector({ student, value, onChange }) {
  const buttonRefs = useRef([]);
  const onKeyDown = (event, currentIndex) => {
    const directions = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!directions[event.key]) return;
    event.preventDefault();
    const nextIndex = (currentIndex + directions[event.key] + STATUSES.length) % STATUSES.length;
    onChange(STATUSES[nextIndex]);
    buttonRefs.current[nextIndex]?.focus();
  };

  return <div className="mu-segmented mu-attendance-segmented" role="radiogroup" aria-label={`Attendance for ${student.fullName}`} data-value={value || ""}>
    {STATUSES.map((status, index) => <button
      key={status}
      ref={(element) => { buttonRefs.current[index] = element; }}
      className="mu-segmented-option"
      type="button"
      role="radio"
      aria-label={statusLabels[status]}
      aria-checked={value === status}
      tabIndex={value === status || (!value && index === 0) ? 0 : -1}
      onClick={() => onChange(status)}
      onKeyDown={(event) => onKeyDown(event, index)}
    >{statusLabels[status]}</button>)}
  </div>;
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
  const [saveSucceeded, setSaveSucceeded] = useState(false);
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
  const dailyCounts = useMemo(() => STATUSES.reduce((counts, status) => {
    counts[status] = activeStudents.reduce((total, student) => total + (records[student.id] === status ? 1 : 0), 0);
    return counts;
  }, {}), [activeStudents, records]);

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
    setSaving(true); setSaveSucceeded(false); setError("");
    try {
      await markAttendance({ classId, date, records: activeStudents.map((student) => ({ studentId: student.id, status: records[student.id] })) });
      setToast({ type: "success", message: "Attendance saved." });
      setSaveSucceeded(true);
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      setSaveSucceeded(false);
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
    const rows = [["Student", "Admission number", ...statuses.map((status) => statusLabels[status]), "Total marked days", "Attendance percentage"], ...report.students.map((student) => [student.fullName, student.admissionNumber, ...statuses.map((s) => student.counts?.[s] || 0), student.totalMarkedDays, student.attendancePercentage])];
    const csv = rows.map((row) => row.map((value) => "\"" + String(value ?? "").replaceAll("\"", "\"\"") + "\"").join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "attendance-" + (classItem?.name || "class") + "-" + range.from + "-" + range.to + ".csv"; link.click(); URL.revokeObjectURL(url);
  };
  const setRangePreset = () => setRange(presetRange(today, tab));
  const rangeControls = <div className="mu-toolbar attendance-range">
    <div className="mu-toolbar-search mu-attendance-range-field"><label className="mu-field-label" htmlFor="attendance-from">From</label><input className="input mu-field-control" id="attendance-from" type="date" max={today} value={range.from} onChange={(e) => setRange((old) => ({ ...old, from: e.target.value }))} /></div>
    <div className="mu-toolbar-search mu-attendance-range-field"><label className="mu-field-label" htmlFor="attendance-to">To</label><input className="input mu-field-control" id="attendance-to" type="date" max={today} value={range.to} onChange={(e) => setRange((old) => ({ ...old, to: e.target.value }))} /></div>
    <div className="mu-toolbar-actions"><button className="btn btn-outline" type="button" onClick={setRangePreset}>{tab === "monthly" ? "This month" : "This week"}</button></div>
  </div>;

  return <div className="michael-ui">
    <main className="mu-page-content mu-attendance-page">
      <header className="mu-page-header">
        <div><h1 className="mu-page-title">{isStudent ? "My attendance history" : "Attendance"}</h1><p className="mu-caption">{isStudent ? "Review your marked attendance records." : "Mark attendance and review class attendance."}</p></div>
      </header>

      {loading ? <section className="card mu-card"><SkeletonRows columns={4} /></section> : isStudent ? <section className="card mu-card mu-detail-card">
        {error && <div className="mu-empty-state" role="alert"><p>{error}</p><button className="btn btn-outline" type="button" onClick={() => void loadClasses()}>Retry</button></div>}
        {historyStudent && <>
          <div className="mu-section-header"><div className="mu-card-heading"><h2 className="mu-section-title">{historyStudent.fullName}</h2><p className="mu-card-subtitle">{historyStudent.admissionNumber || "Student"} · Read-only</p></div></div>
          <div className="mu-toolbar">{rangeControls}<div className="mu-toolbar-actions"><button className="btn btn-outline" type="button" onClick={() => void reloadHistory()}>Apply range</button></div></div>
          {viewLoading ? <SkeletonRows columns={4} /> : history?.history?.length ? <HistoryTable rows={history.history} /> : <EmptyState Icon={BookOpen} title="No attendance records for this period" />}
        </>}
      </section> : <>
        {error && !classId && <section className="mu-empty-state" role="alert"><p>{error}</p><button className="btn btn-outline" type="button" onClick={() => void loadClasses()}>Retry</button></section>}
        <section className="card mu-card mu-attendance-toolbar">
          <div className="mu-toolbar">
            <div className="mu-attendance-toolbar-field"><label className="mu-field-label" htmlFor="attendance-class">Class</label><select className="select mu-field-control" id="attendance-class" value={classId} onChange={(e) => void selectClass(e.target.value)} disabled={!classes.length || viewLoading}><option value="">Choose a class</option>{classes.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select></div>
            {tab === "daily" ? <div className="mu-attendance-toolbar-field"><label className="mu-field-label" htmlFor="attendance-date">Date</label><input className="input mu-field-control" id="attendance-date" type="date" max={today} value={date} onChange={(e) => { setRecords({}); setViewLoading(true); setDate(e.target.value); }} /><span className="mu-caption mu-attendance-readable-date">{formatDate(date)}</span></div> : rangeControls}
            {tab === "daily" && <div className="mu-toolbar-actions mu-attendance-action-wrap"><span className="mu-field-label mu-attendance-toolbar-spacer" aria-hidden="true">&nbsp;</span><button className="btn btn-outline mu-attendance-mark-all" type="button" disabled={!activeStudents.length || viewLoading} onClick={() => setRecords(Object.fromEntries(activeStudents.map((student) => [student.id, "PRESENT"]))) }>Mark all present</button></div>}
          </div>
        </section>

        {classes.length === 0 && !error ? <section className="card mu-card"><EmptyState Icon={School} title="Select a class to take attendance" hint="Classes assigned to your account will appear here." /></section> : <>
          <nav className="mu-tabs" role="tablist" aria-label="Attendance views">{[["daily", "Daily"], ["weekly", "Weekly"], ["monthly", "Monthly"], ["report", "Report"]].map(([key, title]) => <button key={key} type="button" role="tab" className="mu-tab" aria-selected={tab === key} onClick={() => { setTab(key); setError(""); }}>{title}</button>)}</nav>
          {error && classId && <section className="mu-empty-state" role="alert"><p>{error}</p><button className="btn btn-outline" type="button" onClick={() => tab === "daily" ? void loadDaily() : void loadAggregate()}>Retry</button></section>}
          {tab === "daily" && <section className="card mu-card mu-detail-card">
            <div className="mu-section-header"><div className="mu-card-heading"><h2 className="mu-section-title">{classItem ? label(classItem) : "Class roster"}</h2><p className="mu-card-subtitle">Only active students can be marked.</p></div><button className="btn btn-primary" type="button" disabled={saving || viewLoading || !activeStudents.length} onClick={() => void save()}>{saveSucceeded ? "✓ Saved" : saving ? "Saving…" : "Save attendance"}</button></div>
            {classItem && <div className="mu-stat-grid mu-attendance-stat-grid" aria-label="Attendance counts for this day">
              {[["PRESENT", "Present", Check], ["ABSENT", "Absent", CircleX], ["LATE", "Late", Clock3], ["EXCUSED", "Excused", CircleHelp]].map(([status, title, Icon]) => <article className={`mu-stat-card mu-attendance-stat-card mu-attendance-stat-${status.toLowerCase()}`} key={status}>
                <div className="mu-stat-card-header"><span className="mu-stat-label">{title}</span><span className="mu-stat-icon" aria-hidden="true"><Icon size={16} strokeWidth={1.8} /></span></div>
                <strong className="mu-stat-number">{dailyCounts[status]}</strong>
                <p className="mu-stat-caption">Marked</p>
              </article>)}
            </div>}
            {viewLoading ? <SkeletonRows columns={4} /> : !classItem ? <EmptyState Icon={School} title="Select a class to take attendance" hint="Choose a class above to load its roster." /> : !activeStudents.length ? <EmptyState Icon={UsersRound} title={(classItem.students || []).length ? "No active students to mark" : "No students in this class yet"} hint={(classItem.students || []).length ? "Only active students can be marked for attendance." : "Students appear here once they are enrolled in this class."} className={(classItem.students || []).length ? "" : "mu-attendance-no-students"} /> : <div className="mu-table-wrap">
              <table className="mu-table"><thead><tr><th scope="col">Student</th><th scope="col">Admission number</th><th scope="col">Attendance status</th><th scope="col">History</th></tr></thead><tbody>{activeStudents.map((student) => <tr key={student.id}><td>{student.fullName}</td><td>{student.admissionNumber}</td><td><StatusSelector student={student} value={records[student.id] || ""} onChange={(status) => setRecords((old) => ({ ...old, [student.id]: status }))} /></td><td><button className="btn mu-btn-row-action" type="button" onClick={() => void openHistory(student)}>View history</button></td></tr>)}</tbody></table>
            </div>}
          </section>}
          {(tab === "weekly" || tab === "monthly") && <section className="card mu-card mu-detail-card">
            <div className="mu-section-header"><div className="mu-card-heading"><h2 className="mu-section-title">{tab === "weekly" ? "Weekly" : "Monthly"} summary</h2><p className="mu-card-subtitle">{label(classItem)} · {formatDate(range.from)} – {formatDate(range.to)}</p></div><button className="btn btn-outline" type="button" disabled={viewLoading} onClick={() => void loadAggregate()}>Refresh</button></div>
            {viewLoading ? <SkeletonRows columns={6} /> : summary?.students?.length ? <SummaryTable rows={summary.students} onHistory={openHistory} /> : <EmptyState Icon={BookOpen} title="No attendance records for this period" />}
          </section>}
          {tab === "report" && <section className="card mu-card mu-detail-card">
            <div className="mu-section-header"><div className="mu-card-heading"><h2 className="mu-section-title">Attendance report</h2><p className="mu-card-subtitle">{label(classItem)} · {formatDate(range.from)} – {formatDate(range.to)}</p></div><button className="btn btn-outline" type="button" disabled={!report?.students?.length} onClick={downloadCsv}>Download CSV</button></div>
            {report && <div className="mu-attendance-totals"><strong>Overall attendance: {report.totals?.attendancePercentage ?? 0}%</strong><span>{report.totals?.totalMarkedDays ?? 0} total marked student days</span>{STATUSES.map((status) => <span key={status}>{statusLabels[status]}: {report.totals?.counts?.[status] ?? 0}</span>)}</div>}
            {viewLoading ? <SkeletonRows columns={8} /> : report?.students?.length ? <ReportTable rows={report.students} onHistory={openHistory} /> : <EmptyState Icon={BookOpen} title="No attendance records for this period" />}
          </section>}
          {historyStudent && <section className="card mu-card mu-detail-card mu-attendance-history">
            <div className="mu-section-header"><div className="mu-card-heading"><h2 className="mu-section-title">{historyStudent.fullName} · Attendance history</h2><p className="mu-card-subtitle">{historyStudent.admissionNumber || "Student"}</p></div><button className="btn btn-outline" type="button" onClick={() => { setHistoryStudent(null); setHistory(null); }}>Close history</button></div>
            <div className="mu-toolbar">{rangeControls}<div className="mu-toolbar-actions"><button className="btn btn-outline" type="button" onClick={() => void reloadHistory()}>Apply range</button></div></div>
            {viewLoading ? <SkeletonRows columns={4} /> : history?.history?.length ? <HistoryTable rows={history.history} /> : <EmptyState Icon={BookOpen} title="No attendance records for this period" />}
          </section>}
        </>}
      </>}
    </main>
    <Toast toast={toast} onClose={() => setToast(null)} />
  </div>;
}

function SummaryTable({ rows, onHistory }) {
  return <div className="mu-table-wrap"><table className="mu-table"><thead><tr><th scope="col">Student</th>{STATUSES.map((status) => <th className="mu-cell-numeric" key={status} scope="col">{statusLabels[status]}</th>)}<th className="mu-cell-numeric" scope="col">Total days</th></tr></thead><tbody>{rows.map((student) => <tr key={student.studentId}><td><button className="btn mu-btn-row-action" type="button" onClick={() => onHistory({ id: student.studentId, fullName: student.fullName, admissionNumber: student.admissionNumber })}>{student.fullName}</button></td>{STATUSES.map((status) => <td className="mu-cell-numeric" key={status}>{student.counts?.[status] ?? 0}</td>)}<td className="mu-cell-numeric">{student.totalMarkedDays}</td></tr>)}</tbody></table></div>;
}

function ReportTable({ rows, onHistory }) {
  return <div className="mu-table-wrap"><table className="mu-table"><thead><tr><th scope="col">Student</th><th scope="col">Admission number</th>{STATUSES.map((status) => <th className="mu-cell-numeric" key={status} scope="col">{statusLabels[status]}</th>)}<th className="mu-cell-numeric" scope="col">Total days</th><th className="mu-cell-numeric" scope="col">Attendance</th></tr></thead><tbody>{rows.map((student) => <tr key={student.studentId}><td><button className="btn mu-btn-row-action" type="button" onClick={() => onHistory({ id: student.studentId, fullName: student.fullName, admissionNumber: student.admissionNumber })}>{student.fullName}</button></td><td>{student.admissionNumber || "—"}</td>{STATUSES.map((status) => <td className="mu-cell-numeric" key={status}>{student.counts?.[status] ?? 0}</td>)}<td className="mu-cell-numeric">{student.totalMarkedDays}</td><td className="mu-cell-numeric">{student.attendancePercentage}%</td></tr>)}</tbody></table></div>;
}

function HistoryTable({ rows }) {
  return <div className="mu-table-wrap"><table className="mu-table"><thead><tr><th scope="col">Date</th><th scope="col">Class</th><th scope="col">Status</th><th scope="col">Marked by</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{formatDate(row.date)}</td><td>{label(row.class)}</td><td><span className={`mu-badge mu-status-badge-${row.status.toLowerCase()}`}>{statusLabels[row.status] || row.status.toLowerCase().replace(/^./, (first) => first.toUpperCase())}</span></td><td>{row.markedBy?.fullName || "—"}</td></tr>)}</tbody></table></div>;
}
