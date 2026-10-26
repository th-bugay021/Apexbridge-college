import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createTimetableEntry, deleteTimetableEntry, getClassTimetable, updateTimetableEntry } from "../../../api/timetable";
import ConfirmDialog from "../../../Components/Michael/Teachers/ConfirmDialog";
import Toast from "../../../Components/Michael/Teachers/Toast";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import WeeklyTimetable from "./WeeklyTimetable";
import "./timetable.css";

const DAYS = [
  ["MONDAY", "Monday"],
  ["TUESDAY", "Tuesday"],
  ["WEDNESDAY", "Wednesday"],
  ["THURSDAY", "Thursday"],
  ["FRIDAY", "Friday"],
  ["SATURDAY", "Saturday"],
  ["SUNDAY", "Sunday"],
];

const dayTitle = (day) => DAYS.find(([value]) => value === day)?.[1] || "day";

function entryErrorMessage(error) {
  const apiError = error?.response?.data?.error;
  const fallbacks = {
    CLASS_OVERLAP: "This class already has an entry at an overlapping time.",
    TEACHER_OVERLAP: "This teacher already has an entry at an overlapping time.",
    CLASS_SUBJECT_NOT_ASSIGNED: "Choose a subject that is assigned to this class.",
    TEACHER_INACTIVE: "The assigned teacher is deactivated and cannot be scheduled.",
    INVALID_TIME_RANGE: "The end time must be later than the start time.",
  };
  return apiError?.message || fallbacks[apiError?.code] || apiErrorMessage(error, "timetable");
}

export default function ClassTimetable({ classItem, canManage = false }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [formEntry, setFormEntry] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const subjectRef = useRef(null);
  const dayRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const roomRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getClassTimetable(classItem.id);
      setEntries(result.entries || []);
    } catch (requestError) {
      const message = apiErrorMessage(requestError, "class timetable");
      setError(message);
      setToast({ type: "error", message });
    } finally { setLoading(false); }
  }, [classItem.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!formEntry) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) setFormEntry(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [formEntry, busy]);

  const openCreate = () => {
    setError("");
    setFieldErrors({});
    setFormError("");
    setSaveSucceeded(false);
    setFormEntry({
    values: {
      subjectId: classItem.subjects?.[0]?.subjectId || "",
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "10:00",
      room: "",
    },
    });
  };

  const openEdit = (entry) => {
    setError("");
    setFieldErrors({});
    setFormError("");
    setSaveSucceeded(false);
    setFormEntry({
      entry,
      values: {
        subjectId: entry.subjectId,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room || "",
      },
    });
  };

  const updateField = (field, value) => {
    setFormEntry((current) => ({ ...current, values: { ...current.values, [field]: value } }));
    setFieldErrors((current) => {
      const next = { ...current };
      if (value.trim ? value.trim() : value) delete next[field];
      if ((field === "startTime" || field === "endTime") && formEntry?.values.startTime && formEntry?.values.endTime) {
        const startTime = field === "startTime" ? value : formEntry.values.startTime;
        const endTime = field === "endTime" ? value : formEntry.values.endTime;
        if (endTime > startTime) delete next.endTime;
      }
      return next;
    });
    setFormError("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (!formEntry || busy) return;
    const nextErrors = {};
    if (!formEntry.values.subjectId) nextErrors.subjectId = "Choose a subject.";
    if (!formEntry.values.dayOfWeek) nextErrors.dayOfWeek = "Choose a day.";
    if (!formEntry.values.startTime) nextErrors.startTime = "Enter a start time.";
    if (!formEntry.values.endTime) nextErrors.endTime = "Enter an end time.";
    else if (formEntry.values.startTime && formEntry.values.endTime <= formEntry.values.startTime) nextErrors.endTime = "End time must be after start time.";
    setFieldErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) {
      if (nextErrors.subjectId) subjectRef.current?.focus();
      else if (nextErrors.dayOfWeek) dayRef.current?.focus();
      else if (nextErrors.startTime) startTimeRef.current?.focus();
      else endTimeRef.current?.focus();
      return;
    }
    const values = {
      classId: classItem.id,
      subjectId: formEntry.values.subjectId,
      dayOfWeek: formEntry.values.dayOfWeek,
      startTime: formEntry.values.startTime,
      endTime: formEntry.values.endTime,
      room: formEntry.values.room.trim() || null,
    };
    setBusy(true);
    try {
      if (formEntry.entry) await updateTimetableEntry(formEntry.entry.id, values);
      else await createTimetableEntry(values);
      setToast({ type: "success", message: "Timetable entry " + (formEntry.entry ? "updated." : "added.") });
      setSaveSucceeded(true);
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      setFormEntry(null);
      setFieldErrors({});
      setFormError("");
      setSaveSucceeded(false);
      await load();
    } catch (requestError) {
      const message = entryErrorMessage(requestError);
      const apiError = requestError?.response?.data?.error;
      const fieldHint = apiError?.field || apiError?.details?.field;
      const codeField = {
        CLASS_OVERLAP: "startTime",
        TEACHER_OVERLAP: "startTime",
        CLASS_SUBJECT_NOT_ASSIGNED: "subjectId",
        TEACHER_INACTIVE: "subjectId",
        INVALID_TIME_RANGE: "endTime",
      }[apiError?.code];
      const validFields = ["subjectId", "dayOfWeek", "startTime", "endTime", "room"];
      const targetField = validFields.includes(fieldHint) ? fieldHint : codeField;
      if (targetField) setFieldErrors((current) => ({ ...current, [targetField]: message }));
      else setFormError(message);
      setToast({ type: "error", message });
      setError(message);
    } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteTimetableEntry(confirm.id);
      setConfirm(null);
      setToast({ type: "success", message: "Timetable entry deleted." });
      await load();
    } catch (requestError) {
      const message = entryErrorMessage(requestError);
      setToast({ type: "error", message });
      setError(message);
    } finally { setBusy(false); }
  };

  const selectedAssignment = classItem.subjects?.find((item) => item.subjectId === formEntry?.values.subjectId);

  return <section className="teacher-card timetable-section">
    <div className="teacher-section-header">
      <div><h2>Timetable</h2><p>Weekly schedule for {classItem.name}.</p></div>
      {canManage && <button className="btn btn-primary" type="button" onClick={openCreate}>Add entry</button>}
    </div>
    <WeeklyTimetable entries={entries} loading={loading} error={error} onRetry={load} canManage={canManage} onEdit={openEdit} onDelete={setConfirm} onAdd={openCreate} />
    {canManage && !classItem.subjects?.length && <p className="timetable-help">Assign a subject and teacher to this class before adding timetable entries.</p>}

    {formEntry && createPortal(<div className="michael-ui"><div className="mu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && setFormEntry(null)}>
      <section className="mu-modal-dialog timetable-modal" role="dialog" aria-modal="true" aria-labelledby="timetable-form-title">
        <header className="mu-modal-header">
          <h2 className="mu-section-title" id="timetable-form-title">{formEntry.entry ? "Edit timetable entry" : "Add timetable entry"}</h2>
          <button className="mu-modal-close" type="button" aria-label="Close" disabled={busy} onClick={() => !busy && setFormEntry(null)}>×</button>
        </header>
        <form noValidate onSubmit={save}>
          <div className="mu-modal-body">
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="timetable-subject">Assigned subject</label>
              <select ref={subjectRef} className="select mu-field-control" id="timetable-subject" value={formEntry.values.subjectId} onChange={(event) => updateField("subjectId", event.target.value)} disabled={busy || !classItem.subjects?.length} aria-invalid={Boolean(fieldErrors.subjectId)} aria-describedby={fieldErrors.subjectId ? "timetable-subject-error" : undefined}>
                <option value="">Choose an assigned subject</option>
                {classItem.subjects?.map((assignment) => <option value={assignment.subjectId} key={assignment.subjectId}>{assignment.subject.name} ({assignment.subject.code})</option>)}
              </select>
              {fieldErrors.subjectId && <span className="mu-field-error" id="timetable-subject-error">{fieldErrors.subjectId}</span>}
            </div>
            <div className="timetable-assigned-teacher"><span>Assigned teacher</span><strong>{selectedAssignment?.teacher?.fullName || "Choose a subject to see its teacher"}</strong></div>
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="timetable-day">Day</label>
              <select ref={dayRef} className="select mu-field-control" id="timetable-day" value={formEntry.values.dayOfWeek} onChange={(event) => updateField("dayOfWeek", event.target.value)} disabled={busy} aria-invalid={Boolean(fieldErrors.dayOfWeek)} aria-describedby={fieldErrors.dayOfWeek ? "timetable-day-error" : undefined}>
                <option value="">Choose a day</option>
                {DAYS.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
              </select>
              {fieldErrors.dayOfWeek && <span className="mu-field-error" id="timetable-day-error">{fieldErrors.dayOfWeek}</span>}
            </div>
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="timetable-start-time">Start time</label>
              <input ref={startTimeRef} className="input mu-field-control" id="timetable-start-time" type="time" value={formEntry.values.startTime} onChange={(event) => updateField("startTime", event.target.value)} disabled={busy} aria-invalid={Boolean(fieldErrors.startTime)} aria-describedby={fieldErrors.startTime ? "timetable-start-time-error" : undefined} />
              {fieldErrors.startTime && <span className="mu-field-error" id="timetable-start-time-error">{fieldErrors.startTime}</span>}
            </div>
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="timetable-end-time">End time</label>
              <input ref={endTimeRef} className="input mu-field-control" id="timetable-end-time" type="time" value={formEntry.values.endTime} onChange={(event) => updateField("endTime", event.target.value)} disabled={busy} aria-invalid={Boolean(fieldErrors.endTime)} aria-describedby={fieldErrors.endTime ? "timetable-end-time-error" : undefined} />
              {fieldErrors.endTime && <span className="mu-field-error" id="timetable-end-time-error">{fieldErrors.endTime}</span>}
            </div>
            <div className="mu-field">
              <label className="mu-field-label" htmlFor="timetable-room">Room <span className="mu-field-hint">(optional)</span></label>
              <input ref={roomRef} className="input mu-field-control" id="timetable-room" maxLength={100} value={formEntry.values.room} onChange={(event) => updateField("room", event.target.value)} disabled={busy} aria-invalid={Boolean(fieldErrors.room)} aria-describedby={fieldErrors.room ? "timetable-room-error" : undefined} />
              {fieldErrors.room && <span className="mu-field-error" id="timetable-room-error">{fieldErrors.room}</span>}
            </div>
          </div>
          {formError && <p className="mu-field-error" role="alert">{formError}</p>}
          <footer className="mu-modal-footer">
            <button className="btn btn-outline" type="button" disabled={busy} onClick={() => !busy && setFormEntry(null)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={busy || !classItem.subjects?.length}>{saveSucceeded ? "✓ Saved" : busy ? "Saving…" : "Save entry"}</button>
          </footer>
        </form>
      </section>
    </div></div>, document.body)}
    {confirm && createPortal(<div className="michael-ui"><ConfirmDialog title="Delete timetable entry?" message={`Delete ${confirm.subject?.name || "timetable entry"} on ${dayTitle(confirm.dayOfWeek)}, ${confirm.startTime} – ${confirm.endTime}?`} busy={busy} onCancel={() => !busy && setConfirm(null)} onConfirm={remove} /></div>, document.body)}
    <Toast toast={toast} onClose={() => setToast(null)} />
  </section>;
}
