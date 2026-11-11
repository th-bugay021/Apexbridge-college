const attendanceStatuses = ["present", "absent", "late", "excused"];

function formatRecentDate(value) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" })
    .format(new Date(`${value}T12:00:00`));
}

export default function ParentChildCard({ child }) {
  const attendance = child.attendance;
  const timetable = [...(child.todayTimetable || [])].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <article className="parent-child-card">
      <header className="parent-child-header">
        <div className="parent-child-heading">
          <p className="parent-card-eyebrow">Student</p>
          <h2>{child.fullName || [child.firstName, child.lastName].filter(Boolean).join(" ")}</h2>
          <p className="parent-admission">Admission number: <strong>{child.admissionNumber}</strong></p>
        </div>
        <span className={`parent-status parent-status--${String(child.status).toLowerCase()}`}>{child.status}</span>
      </header>

      <div className="parent-child-meta">
        <span>Class</span>
        <strong>{child.class?.name || "No class assigned"}</strong>
      </div>

      <section className="parent-child-section" aria-labelledby={`attendance-${child.id}`}>
        <div className="parent-section-heading">
          <div>
            <p className="parent-card-eyebrow">Recent performance</p>
            <h3 id={`attendance-${child.id}`}>Attendance</h3>
          </div>
          <div className="parent-attendance-rate">
            <strong>{attendance.ratePercent === null ? "No records" : `${attendance.ratePercent}%`}</strong>
            <span>Last {attendance.periodDays} days</span>
          </div>
        </div>

        <dl className="parent-attendance-counts">
          {attendanceStatuses.map((status) => (
            <div className={`parent-count parent-count--${status}`} key={status}>
              <dt>{status}</dt>
              <dd>{attendance[status]}</dd>
            </div>
          ))}
        </dl>

        <div className="parent-recent-days">
          <h4>Recent days</h4>
          {attendance.recent.length ? (
            <ul>
              {attendance.recent.map((record) => (
                <li key={`${record.date}-${record.status}`}>
                  <time dateTime={record.date}>{formatRecentDate(record.date)}</time>
                  <span className={`parent-attendance-status parent-attendance-status--${record.status.toLowerCase()}`}>
                    {record.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="parent-muted-copy">No recent attendance records.</p>}
        </div>
      </section>

      <section className="parent-child-section parent-timetable-section" aria-labelledby={`timetable-${child.id}`}>
        <div className="parent-section-heading">
          <div>
            <p className="parent-card-eyebrow">On the schedule</p>
            <h3 id={`timetable-${child.id}`}>Today&apos;s timetable</h3>
          </div>
        </div>
        {timetable.length ? (
          <ol className="parent-timetable-list">
            {timetable.map((entry, index) => (
              <li key={`${entry.startTime}-${entry.subject}-${index}`}>
                <time className="parent-timetable-time">{entry.startTime}–{entry.endTime}</time>
                <div className="parent-timetable-detail">
                  <strong>{entry.subject}</strong>
                  <span>{entry.teacherName}</span>
                  <span>{entry.room || "Room not assigned"}</span>
                </div>
              </li>
            ))}
          </ol>
        ) : <p className="parent-muted-copy parent-no-classes">No classes today</p>}
      </section>
    </article>
  );
}
