import { useCallback, useEffect, useState } from "react";
import { getMyTimetable } from "../../../api/timetable";
import { useAuth } from "../../../Context/AuthContext";
import apiErrorMessage from "../../../utils/apiErrorMessage";
import WeeklyTimetable from "./WeeklyTimetable";
import "./timetable.css";

export default function MyTimetable() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await getMyTimetable()); }
    catch (requestError) { setError(apiErrorMessage(requestError, "my timetable")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const isTeacher = user?.role === "TEACHER";
  const classTitle = data?.class ? [data.class.name, data.class.level].filter(Boolean).join(" · ") : "";

  return <main className="teacher-page timetable-page">
    <header className="teacher-page-header"><div><h1>My timetable</h1><p>{isTeacher ? "Your teaching schedule across assigned classes." : "Your class schedule for the week."}</p></div></header>
    {classTitle && <section className="teacher-card timetable-class-summary"><h2>{classTitle}</h2></section>}
    <section className="teacher-card">
      <WeeklyTimetable entries={data?.entries || []} loading={loading} error={error} onRetry={load} showClass={isTeacher} />
    </section>
  </main>;
}
