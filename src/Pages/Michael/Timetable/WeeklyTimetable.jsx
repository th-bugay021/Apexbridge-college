import "./timetable.css";

const WEEKDAYS = [
  ["MONDAY", "Monday"],
  ["TUESDAY", "Tuesday"],
  ["WEDNESDAY", "Wednesday"],
  ["THURSDAY", "Thursday"],
  ["FRIDAY", "Friday"],
  ["SATURDAY", "Saturday"],
  ["SUNDAY", "Sunday"],
];

export default function WeeklyTimetable({ entries = [], loading = false, error = "", onRetry, showClass = false, canManage = false, onEdit, onDelete }) {
  const visibleDays = WEEKDAYS.filter(([key]) => (
    !["SATURDAY", "SUNDAY"].includes(key) || entries.some((entry) => entry.dayOfWeek === key)
  ));

  if (loading) return <p className="teacher-state" role="status">Loading timetable…</p>;
  if (error) return <div className="teacher-state teacher-error" role="alert"><p>{error}</p>{onRetry && <button className="btn btn-outline" type="button" onClick={onRetry}>Retry</button>}</div>;
  if (!entries.length) return <p className="teacher-state">No timetable entries are available yet.</p>;

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
            <p className="timetable-entry-time">{entry.startTime} – {entry.endTime}</p>
            {entry.teacher?.fullName && <p className="timetable-entry-teacher">{entry.teacher.fullName}</p>}
            {entry.room && <p className="timetable-entry-room">Room: {entry.room}</p>}
            {canManage && <div className="timetable-card-actions"><button className="teacher-text-button" type="button" onClick={() => onEdit(entry)}>Edit</button><button className="teacher-text-button timetable-delete-action" type="button" onClick={() => onDelete(entry)}>Delete</button></div>}
          </article>
        ))}</div> : <p className="timetable-day-empty">No classes</p>}
      </section>;
    })}
  </div>;
}
