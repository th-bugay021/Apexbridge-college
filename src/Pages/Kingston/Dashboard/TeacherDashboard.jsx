import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiBookOpen, FiClock, FiUserCheck, FiUsers } from "react-icons/fi";
import StatsCard from "../../../Components/Kingston/StatsCard";
import { getMyTimetable } from "../../../api/timetable";
import { getMyProfile, getTeacherOverview } from "../../../api/teachers";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import "./TeacherDashboard.css";

function dateKeyInLagos(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function shiftDate(date, days) {
  const shifted = new Date(`${date}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function performanceRange() {
  const today = dateKeyInLagos(new Date());
  return { from: shiftDate(today, -29), to: today };
}

function formatDuration(minutesValue) {
  if (minutesValue == null || minutesValue === "" || !Number.isFinite(Number(minutesValue))) return null;
  const totalMinutes = Math.round(Number(minutesValue));
  if (totalMinutes === 0) return "0 min";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}

function todayDayKey() {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", weekday: "long" })
    .format(new Date())
    .toUpperCase();
}

function TeacherDashboard() {
  const [overviewState, setOverviewState] = useState({ loading: true, error: "", data: null });
  const [timetableState, setTimetableState] = useState({ loading: true, error: "", data: null });

  const loadOverview = useCallback(async () => {
    setOverviewState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const profile = await getMyProfile();
      const data = await getTeacherOverview(profile.id, performanceRange());
      setOverviewState({ loading: false, error: "", data });
    } catch (error) {
      setOverviewState({ loading: false, error: apiErrorMessage(error, "teacher performance"), data: null });
    }
  }, []);

  const loadTimetable = useCallback(async () => {
    setTimetableState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await getMyTimetable();
      setTimetableState({ loading: false, error: "", data });
    } catch (error) {
      setTimetableState({ loading: false, error: apiErrorMessage(error, "my timetable"), data: null });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOverview();
      void loadTimetable();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOverview, loadTimetable]);

  const overview = overviewState.data;
  const classes = overview?.classes || [];
  const subjectsCount = classes.reduce((total, classItem) => total + (classItem.subjects?.length || 0), 0);
  const todayLessons = useMemo(() => (timetableState.data?.entries || [])
    .filter((entry) => entry.dayOfWeek === todayDayKey())
    .sort((left, right) => (left.startTime || "").localeCompare(right.startTime || "")), [timetableState.data]);
  const noOverviewData = !overviewState.loading && !overviewState.error && !overview;

  const statCards = [
    { title: "My classes", value: overview ? classes.length.toLocaleString() : null, Icon: FiBookOpen, tone: "accent", caption: "Assigned teaching classes" },
    { title: "My subjects", value: overview ? subjectsCount.toLocaleString() : null, Icon: FiUsers, tone: "info", caption: "Across your classes" },
    { title: "Lessons today", value: timetableState.data ? todayLessons.length.toLocaleString() : null, Icon: FiUserCheck, tone: "success", caption: "From today's timetable" },
    { title: "Weekly teaching time", value: overview ? formatDuration(overview.weeklyScheduledMinutes) : null, Icon: FiClock, tone: "warning", caption: "Scheduled each week" },
  ];

  return (
    <main className="admin-dashboard teacher-dashboard">
      <header className="dashboard-page-heading teacher-dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-page-description">Your teaching schedule and class assignments at a glance.</p>
        </div>
        <Link className="teacher-dashboard-profile-link" to="/teachers/me">My profile</Link>
      </header>

      <section className="dashboard-stats-grid teacher-dashboard-stats" aria-label="My teaching statistics">
        {statCards.map((card, index) => {
          const isOverviewStat = index < 2 || index === 3;
          const state = isOverviewStat ? overviewState : timetableState;
          return <StatsCard key={card.title} {...card} loading={state.loading} error={state.error} empty={noOverviewData && isOverviewStat} />;
        })}
      </section>

      <section className="teacher-dashboard-content-grid">
        <article className="dashboard-activity-card teacher-dashboard-card" aria-labelledby="teacher-timetable-title">
          <header className="teacher-dashboard-card-header">
            <h2 id="teacher-timetable-title">Today&apos;s timetable</h2>
            <Link className="teacher-dashboard-small-link" to="/timetable">View full timetable</Link>
          </header>
          {timetableState.loading ? (
            <div className="teacher-dashboard-state" role="status">Loading today&apos;s timetable…</div>
          ) : timetableState.error ? (
            <div className="teacher-dashboard-state" role="alert"><p>{timetableState.error}</p><button type="button" onClick={() => void loadTimetable()}>Try again</button></div>
          ) : !todayLessons.length ? (
            <div className="teacher-dashboard-state">No lessons today.</div>
          ) : (
            <ol className="teacher-dashboard-today-list">
              {todayLessons.map((lesson) => (
                <li key={lesson.id}>
                  <span className="teacher-dashboard-time">{lesson.startTime} – {lesson.endTime}</span>
                  <span className="teacher-dashboard-lesson-copy"><strong>{lesson.subject?.name || "Subject"}</strong><span>{lesson.class?.name || "Class"}</span></span>
                </li>
              ))}
            </ol>
          )}
        </article>

        <article className="dashboard-activity-card teacher-dashboard-card" aria-labelledby="teacher-classes-title">
          <header className="teacher-dashboard-card-header">
            <h2 id="teacher-classes-title">My classes</h2>
            <Link className="teacher-dashboard-small-link" to="/teachers/me/performance">View my performance</Link>
          </header>
          {overviewState.loading ? (
            <div className="teacher-dashboard-state" role="status">Loading your classes…</div>
          ) : overviewState.error ? (
            <div className="teacher-dashboard-state" role="alert"><p>{overviewState.error}</p><button type="button" onClick={() => void loadOverview()}>Try again</button></div>
          ) : !classes.length ? (
            <div className="teacher-dashboard-state">No class assignments available yet.</div>
          ) : (
            <ul className="teacher-dashboard-class-list">
              {classes.map((classItem) => (
                <li key={classItem.classId}>
                  <div className="teacher-dashboard-class-copy">
                    <strong>{classItem.name || classItem.className || "Class"}</strong>
                    <span>{classItem.subjects?.length ? classItem.subjects.map((subject) => subject.name).join(", ") : "No subjects assigned"}</span>
                    {classItem.studentCount != null && <small>{classItem.studentCount} students</small>}
                  </div>
                  <Link className="teacher-dashboard-attendance-link" to="/attendance">Mark attendance</Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}

export default TeacherDashboard;
