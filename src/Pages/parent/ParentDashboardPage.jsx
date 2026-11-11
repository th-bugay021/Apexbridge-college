import { useCallback, useEffect, useState } from "react";
import { getMyChildren } from "../../api/parents";
import { useAuth } from "../../Context/AuthContext";
import apiErrorMessage from "../../utils/apiErrorMessage";
import ParentChildCard from "./ParentChildCard";
import "./ParentDashboardPage.css";

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const parentName = user?.name || user?.fullName || "there";

  const loadChildren = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMyChildren();
      setChildren(Array.isArray(response.children) ? response.children : []);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "your children"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadChildren(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadChildren]);

  return (
    <main className="parent-dashboard">
      <header className="parent-dashboard-heading">
        <div>
          <p className="parent-card-eyebrow">Family overview</p>
          <h1>Parent Dashboard</h1>
          <p>Welcome, {parentName}. Here&apos;s a quick look at your children&apos;s attendance and schedule.</p>
        </div>
      </header>

      {loading ? (
        <div className="parent-children-grid" role="status" aria-label="Loading your children">
          {[0, 1].map((item) => <div className="parent-loading-card" key={item}><span /><span /><span /></div>)}
        </div>
      ) : error ? (
        <section className="parent-dashboard-state" role="alert">
          <strong>We couldn&apos;t load your children.</strong>
          <p>{error}</p>
          <button className="parent-retry-button" type="button" onClick={() => void loadChildren()}>Retry</button>
        </section>
      ) : children.length === 0 ? (
        <section className="parent-dashboard-state" role="status">
          <strong>No children are linked to your account yet</strong>
          <p>Once your account is linked to a student, their attendance and timetable will appear here.</p>
        </section>
      ) : (
        <section className="parent-children-grid" aria-label="Your children">
          {children.map((child) => <ParentChildCard child={child} key={child.id} />)}
        </section>
      )}
    </main>
  );
}
