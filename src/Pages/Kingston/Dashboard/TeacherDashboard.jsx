import { Link } from "react-router-dom";
import "../../../Styles/Ayomide/pageStyles.css";

export default function TeacherDashboard() {
  return (
    <main className="page-container teacher-dashboard-placeholder">
      <header className="page-header">
        <div>
          <h1 className="page-title">Teacher dashboard coming soon</h1>
          <p className="page-subtitle">Your teaching tools and updates will appear here.</p>
        </div>
      </header>
      <section className="card page-content-card">
        <h2>Welcome to Apexbridge</h2>
        <p>Your account is ready. You can review your teacher details here.</p>
        <div className="page-actions">
          <Link className="btn btn-primary" to="/teachers/me">Go to My profile</Link>
        </div>
      </section>
      {/* TODO for the dashboard owner: replace this temporary landing with the teacher dashboard. */}
    </main>
  );
}
