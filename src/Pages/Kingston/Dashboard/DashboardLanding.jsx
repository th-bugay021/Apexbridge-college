import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { FiBookOpen, FiDollarSign, FiUsers, FiUserCheck, FiUserPlus, FiTrendingUp } from "react-icons/fi";
import { getClasses } from "../../../api/classes";
import { getDailyAttendance } from "../../../api/attendance";
import { getTeachers } from "../../../api/teachers";
import { getStudents } from "../../../api/students";
import { useAuth } from "../../../Context/AuthContext";
import { useTheme } from "../../../Context/useTheme";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import { money } from "../../../Components/Great/money";
import StatsCard from "../../../Components/Kingston/StatsCard";
import {
  mockFinanceTotals,
  mockFeeCollection,
  mockPerformanceByClass,
  mockRecentAdmissions,
  mockRecentPayments,
  mockTrendBadges,
  mockUpcomingEvents,
  mockUpcomingExams,
} from "./dashboardMockData";
import "./adminDashboard.css";

const AttendanceChart = lazy(() => import("../../../Components/Kingston/AttendanceChart"));
const GenderChart = lazy(() => import("../../../Components/Kingston/GenderChart"));
const PopulationChart = lazy(() => import("../../../Components/Kingston/PopulationChart"));
const FeeChart = lazy(() => import("../../../Components/Kingston/FeeChart"));
const PerformanceChart = lazy(() => import("../../../Components/Kingston/PerformanceChart"));
const ActivityList = lazy(() => import("../../../Components/Kingston/ActivityList"));
const TeacherDashboard = lazy(() => import("./TeacherDashboard"));

const EMPTY_ATTENDANCE = { present: 0, absent: 0, marked: 0 };

function getDashboardColors() {
  const wrapper = document.querySelector(".app-layout") || document.documentElement;
  const styles = getComputedStyle(wrapper);
  const read = (name) => styles.getPropertyValue(name).trim();
  return {
    accent: read("--color-accent"), info: read("--color-info"), success: read("--color-success"),
    danger: read("--color-danger"), warning: read("--color-warning"), text: read("--color-text-primary"), muted: read("--color-text-muted"),
    border: read("--color-border"), grid: read("--color-border-light"), surface: read("--color-surface"),
  };
}

const formatCurrency = money;

function datesForPeriod(period) {
  const today = new Date();
  const dates = [];
  const start = new Date(today);
  if (period === "weekly") {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  } else start.setDate(1);
  for (const date = new Date(start); date <= today; date.setDate(date.getDate() + 1)) {
    if (date.getDay() !== 0 && date.getDay() !== 6) dates.push(new Date(date));
  }
  return dates;
}

function dateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

async function loadAttendance(classes, period) {
  const totals = new Map();
  const dates = datesForPeriod(period);
  const jobs = classes.flatMap((classItem) => dates.map((date) => ({ classItem, date })));
  let nextJob = 0;
  let failure = null;
  const workers = Array.from({ length: Math.min(6, jobs.length) }, async () => {
    while (nextJob < jobs.length && !failure) {
      const job = jobs[nextJob];
      nextJob += 1;
      try {
        const response = await getDailyAttendance({ classId: job.classItem.id, date: dateKey(job.date) });
        const day = job.date.toLocaleDateString(undefined, { weekday: "short" });
        const value = totals.get(day) || { ...EMPTY_ATTENDANCE };
        for (const row of response.attendance || []) {
          if (["PRESENT", "LATE"].includes(row.status)) value.present += 1;
          if (row.status === "ABSENT") value.absent += 1;
          if (["PRESENT", "LATE", "ABSENT", "EXCUSED"].includes(row.status)) value.marked += 1;
        }
        totals.set(day, value);
      } catch (error) { failure = error; }
    }
  });
  await Promise.all(workers);
  if (failure) throw failure;
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const data = dayNames.map((day) => ({ day, ...(totals.get(day) || EMPTY_ATTENDANCE) }));
  const summary = data.reduce((acc, row) => ({ present: acc.present + row.present, absent: acc.absent + row.absent, marked: acc.marked + row.marked }), { ...EMPTY_ATTENDANCE });
  return { data, summary };
}

function AdminDashboard() {
  useTheme();
  const colors = getDashboardColors();
  const [teachersState, setTeachersState] = useState({ loading: true, error: "", total: null });
  const [studentsState, setStudentsState] = useState({ loading: true, error: "", total: null });
  const [genderState, setGenderState] = useState({ loading: true, error: "", data: [] });
  const [classesState, setClassesState] = useState({ loading: true, error: "", total: null, rows: [] });
  const [attendanceState, setAttendanceState] = useState({ loading: true, error: "", data: [], summary: EMPTY_ATTENDANCE });
  const [period, setPeriod] = useState("weekly");

  useEffect(() => {
    let active = true;
    getStudents({ page: 1, limit: 1 })
      .then((result) => active && setStudentsState({ loading: false, error: "", total: result.pagination?.total ?? null }))
      .catch((error) => active && setStudentsState({ loading: false, error: apiErrorMessage(error, "students"), total: null }));
    Promise.all(["MALE", "FEMALE", "OTHER"].map((gender) => getStudents({ page: 1, limit: 1, gender })))
      .then((results) => active && setGenderState({ loading: false, error: "", data: results.map((result, index) => ({ name: ["Boys", "Girls", "Other"][index], value: result.pagination?.total ?? 0 })).filter((item) => item.name !== "Other" || item.value > 0) }))
      .catch((error) => active && setGenderState({ loading: false, error: apiErrorMessage(error, "students"), data: [] }));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    getTeachers({ page: 1, limit: 1 })
      .then((result) => active && setTeachersState({ loading: false, error: "", total: result.pagination?.total ?? null }))
      .catch((error) => active && setTeachersState({ loading: false, error: apiErrorMessage(error, "teachers"), total: null }));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchAllClasses() {
      try {
        const firstPage = await getClasses({ page: 1, limit: 100 });
        const rows = [...(firstPage.classes || [])];
        for (let page = 2; page <= (firstPage.pagination?.totalPages || 1); page += 1) {
          const nextPage = await getClasses({ page, limit: 100 });
          rows.push(...(nextPage.classes || []));
        }
        if (active) setClassesState({ loading: false, error: "", total: firstPage.pagination?.total ?? rows.length, rows });
      } catch (error) {
        if (active) setClassesState({ loading: false, error: apiErrorMessage(error, "classes"), total: null, rows: [] });
      }
    }
    void fetchAllClasses();
    return () => { active = false; };
  }, []);

  const refreshAttendance = useCallback(async () => {
    if (classesState.loading) return;
    if (classesState.error) {
      setAttendanceState({ loading: false, error: classesState.error, data: [], summary: EMPTY_ATTENDANCE });
      return;
    }
    if (!classesState.rows.length) {
      setAttendanceState({ loading: false, error: "", data: [], summary: EMPTY_ATTENDANCE });
      return;
    }
    setAttendanceState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const result = await loadAttendance(classesState.rows, period);
      setAttendanceState({ loading: false, error: "", ...result });
    } catch (error) {
      setAttendanceState({ loading: false, error: apiErrorMessage(error, "attendance"), data: [], summary: EMPTY_ATTENDANCE });
    }
  }, [classesState, period]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshAttendance(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshAttendance]);

  const attendanceRate = attendanceState.summary.marked ? Math.round((attendanceState.summary.present / attendanceState.summary.marked) * 100) : null;
  const populationData = useMemo(() => classesState.rows.map((classItem) => ({ name: classItem.name || classItem.className || "Class", students: Number(classItem.studentCount || 0) })), [classesState.rows]);
  const statCards = [
    { title: "Total students", value: studentsState.total?.toLocaleString(), Icon: FiUsers, tone: "accent", loading: studentsState.loading, error: studentsState.error, empty: !studentsState.loading && !studentsState.error && studentsState.total === null },
    { title: "Total teachers", value: teachersState.total?.toLocaleString(), Icon: FiUserCheck, trend: mockTrendBadges.teachers, tone: "info", loading: teachersState.loading, error: teachersState.error, empty: !teachersState.loading && !teachersState.error && teachersState.total === null },
    { title: "Total classes", value: classesState.total?.toLocaleString(), Icon: FiBookOpen, trend: mockTrendBadges.classes, tone: "success", loading: classesState.loading, error: classesState.error, empty: !classesState.loading && !classesState.error && classesState.total === null },
    { title: "Attendance rate", value: attendanceRate === null ? null : attendanceRate + "%", Icon: FiUserPlus, trend: mockTrendBadges.attendance, tone: "info", loading: attendanceState.loading, error: attendanceState.error, empty: !attendanceState.loading && !attendanceState.error && attendanceRate === null },
    { title: "Outstanding fees", value: formatCurrency(mockFinanceTotals.outstandingFees), Icon: FiDollarSign, trend: mockTrendBadges.fees, tone: "warning" },
    { title: "Revenue", value: formatCurrency(mockFinanceTotals.revenue), Icon: FiTrendingUp, trend: mockTrendBadges.revenue, tone: "success" },
  ];

  return (
    <main className="admin-dashboard">
      <header className="dashboard-page-heading">
        <div><p className="dashboard-page-eyebrow">School overview</p><h1>Dashboard</h1><p className="dashboard-page-description">A quick look at the school&apos;s key numbers and daily activity.</p></div>
      </header>
      <style>{`.dashboard-stats-grid > .dashboard-stat-card:first-child .dashboard-stat-card-top::after, .dashboard-gender-card .dashboard-chart-header::after { display: none; }`}</style>
      <section className="dashboard-stats-grid" aria-label="School statistics">{statCards.map((card) => <StatsCard key={card.title} {...card} />)}</section>
      <Suspense fallback={<div className="dashboard-lazy-fallback" role="status">Loading dashboard charts…</div>}>
        <section className="dashboard-chart-grid" aria-label="Student and attendance charts">
          <GenderChart data={genderState.data} colors={colors} loading={genderState.loading} error={genderState.error} />
          <AttendanceChart data={attendanceState.data} period={period} onPeriodChange={setPeriod} colors={colors} loading={attendanceState.loading} error={attendanceState.error} />
        </section>
        <section className="dashboard-population-section" aria-label="Student population by class"><PopulationChart data={populationData} colors={colors} loading={classesState.loading} error={classesState.error} /></section>
      </Suspense>
      <Suspense fallback={<div className="dashboard-lazy-fallback" role="status">Loading dashboard summaries…</div>}>
        <section className="dashboard-secondary-chart-grid" aria-label="Fee collection and student performance">
          <FeeChart data={mockFeeCollection.terms} colors={colors} formatCurrency={formatCurrency} />
          <PerformanceChart data={mockPerformanceByClass} colors={colors} />
        </section>
        <section className="dashboard-activity-grid" aria-label="Recent school activity">
          <ActivityList title="Recent admissions" items={mockRecentAdmissions} />
          <ActivityList title="Recent payments" items={mockRecentPayments} />
          <ActivityList title="Upcoming events" items={mockUpcomingEvents} />
          <ActivityList title="Upcoming exams" items={mockUpcomingExams} />
        </section>
      </Suspense>
    </main>
  );
}

export default function DashboardLanding() {
  const { user } = useAuth();
  if (user?.role === "TEACHER") return <Suspense fallback={<div className="dashboard-lazy-fallback" role="status">Loading your dashboard…</div>}><TeacherDashboard /></Suspense>;
  if (["ADMIN", "SUPER_ADMIN"].includes(user?.role)) return <AdminDashboard />;
  return <h1>Dashboard</h1>;
}
