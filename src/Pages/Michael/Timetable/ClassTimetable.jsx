import { useCallback, useEffect, useState } from "react";
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

  const openCreate = () => {
    setError("");
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

  const save = async (event) => {
    event.preventDefault();
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
      setFormEntry(null);
      setToast({ type: "success", message: "Timetable entry " + (formEntry.entry ? "updated." : "added.") });
      await load();
    } catch (requestError) {
      const message = entryErrorMessage(requestError);
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
    <WeeklyTimetable entries={entries} loading={loading} error={error} onRetry={load} canManage={canManage} onEdit={openEdit} onDelete={setConfirm} />
    {canManage && !classItem.subjects?.length && <p className="timetable-help">Assign a subject and teacher to this class before adding timetable entries.</p>}

    {formEntry && <div className="teacher-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && setFormEntry(null)}>
      <section className="teacher-modal academic-modal timetable-modal" role="dialog" aria-modal="true" aria-labelledby="timetable-form-title">
        <button className="teacher-modal-close" type="button" aria-label="Close" disabled={busy} onClick={() => setFormEntry(null)}>×</button>
        <h2 id="timetable-form-title">{formEntry.entry ? "Edit timetable entry" : "Add timetable entry"}</h2>
        <form className="academic-form" onSubmit={save}>
          <label>Assigned subject<select required value={formEntry.values.subjectId} onChange={(event) => setFormEntry((current) => ({ ...current, values: { ...current.values, subjectId: event.target.value } }))} disabled={busy || !classItem.subjects?.length}>
            <option value="">Choose an assigned subject</option>
            {classItem.subjects?.map((assignment) => <option value={assignment.subjectId} key={assignment.subjectId}>{assignment.subject.name} ({assignment.subject.code})</option>)}
          </select></label>
          <div className="timetable-assigned-teacher"><span>Assigned teacher</span><strong>{selectedAssignment?.teacher?.fullName || "Choose a subject to see its teacher"}</strong></div>
          <label>Day<select value={formEntry.values.dayOfWeek} onChange={(event) => setFormEntry((current) => ({ ...current, values: { ...current.values, dayOfWeek: event.target.value } }))} disabled={busy}>{DAYS.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
          <label>Start time<input required type="time" value={formEntry.values.startTime} onChange={(event) => setFormEntry((current) => ({ ...current, values: { ...current.values, startTime: event.target.value } }))} disabled={busy} /></label>
          <label>End time<input required type="time" value={formEntry.values.endTime} onChange={(event) => setFormEntry((current) => ({ ...current, values: { ...current.values, endTime: event.target.value } }))} disabled={busy} /></label>
          <label>Room <span className="academic-muted">(optional)</span><input maxLength={100} value={formEntry.values.room} onChange={(event) => setFormEntry((current) => ({ ...current, values: { ...current.values, room: event.target.value } }))} disabled={busy} /></label>
          {error && <p className="teacher-form-error" role="alert">{error}</p>}
          <div className="academic-form-actions"><button className="btn btn-outline" type="button" disabled={busy} onClick={() => setFormEntry(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={busy || !classItem.subjects?.length}>{busy ? "Saving…" : "Save entry"}</button></div>
        </form>
      </section>
    </div>}
    {confirm && <ConfirmDialog title="Delete timetable entry?" message={"Remove " + confirm.subject?.name + " on " + confirm.dayOfWeek + " from " + classItem.name + "?"} busy={busy} onCancel={() => setConfirm(null)} onConfirm={remove} />}
    <Toast toast={toast} onClose={() => setToast(null)} />
  </section>;
}
