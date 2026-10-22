import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./Unauthorized.css";

function Unauthorized() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // The session is cleared by AuthContext even if the logout request fails.
    }
    navigate("/login", { replace: true });
  }

  return (
    <main className="unauthorized-page">
      <section className="unauthorized-card" aria-labelledby="access-denied-heading">
        <span className="unauthorized-mark" aria-hidden="true">403</span>
        <h1 id="access-denied-heading">Access denied</h1>
        <p>You don’t have permission to view this page. Return to your dashboard or sign out.</p>
        <div className="unauthorized-actions">
          <Link className="btn btn-primary" to="/dashboard">Go to my dashboard</Link>
          <button className="btn btn-outline" type="button" onClick={handleLogout}>Log out</button>
        </div>
      </section>
    </main>
  );
}

export default Unauthorized;
