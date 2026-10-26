import "./timetable.css";
import { CalendarDays } from "lucide-react";

const WEEKDAYS = [
  ["MONDAY", "Monday"],
  ["TUESDAY", "Tuesday"],
  ["WEDNESDAY", "Wednesday"],
  ["THURSDAY", "Thursday"],
  ["FRIDAY", "Friday"],
  ["SATURDAY", "Saturday"],
  ["SUNDAY", "Sunday"],
];

export default function WeeklyTimetable({ entries = [], loading = false, error = "", onRetry, showClass = false, canManage = false, onEdit, onDelete, onAdd }) {
  const visibleDays = WEEKDAYS.filter(([key]) => (
    !["SATURDAY", "SUNDAY"].includes(key) || entries.some((entry) => entry.dayOfWeek === key)
  ));

  if (loading) return <div className="timetable-grid" style={{ "--timetable-day-count": visibleDays.length }} role="status" aria-label="Loading timetable">
    {visibleDays.map(([key, title]) => <section className="timetable-day" key={key} aria-label={title}>
      <h3>{title}</h3>
      <div className="timetable-day-entries">{[0, 1].map((item) => <div className="mu-skeleton mu-skeleton-card" key={item} />)}</div>
    </section>)}
  </div>;
  if (error) return <div className="mu-empty-state mu-timetable-state" role="alert"><p>{error}</p>{onRetry && <button className="btn btn-outline" type="button" onClick={onRetry}>Retry</button>}</div>;
  if (!entries.length) return <div className="mu-empty-state mu-timetable-state">
    <span className="mu-empty-icon" aria-hidden="true"><CalendarDays size={16} strokeWidth={1.8} /></span>
    <strong className="mu-empty-title">No timetable entries yet</strong>
    <p className="mu-empty-hint">Add the first entry to build the weekly schedule.</p>
    {canManage && onAdd && <button className="btn btn-primary" type="button" onClick={onAdd}>Add entry</button>}
  </div>;

  return <div className="timetable-grid" style={{ "--timetable-day-count": visibleDays.length }}>
    {visibleDays.map(([key, title]) => {
      const dayEntries = entries.filter((entry) => entry.dayOfWeek === key)
        .sort((left, right) => left.startTime.localeCompare(right.startTime));
      return <section className="timetable-day" key={key} aria-label={title}>
        <h3>{title}</h3>
        {dayEntries.length ? <div className="timetable-day-entries">{dayEntries.map((entry) => (
          <article className="timetable-entry" key={entry.id}>
            {showClass && <p className="timetable-entry-class">{entry.class?.name || "Class"}</p>}
            <h4>{entry.subject?.name || "Subject"}</h4>
            {entry.subject?.code && <p className="timetable-entry-code">{entry.subject.code}</p>}
            <p className="timetable-entry-time mu-timetable-time">{entry.startTime} – {entry.endTime}</p>
            {entry.teacher?.fullName && <p className="timetable-entry-teacher">{entry.teacher.fullName}</p>}
            {entry.room && <p className="timetable-entry-room">Room: {entry.room}</p>}
            {canManage && <div className="timetable-card-actions"><button className="btn mu-btn-row-action" type="button" onClick={() => onEdit(entry)}>Edit</button><button className="btn mu-btn-danger" type="button" onClick={() => onDelete(entry)}>Delete</button></div>}
          </article>
        ))}</div> : <p className="timetable-day-empty mu-caption">No classes</p>}
      </section>;
    })}
  </div>;
}
