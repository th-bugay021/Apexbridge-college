import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import "./login.css";

const FORGOT_PASSWORD_PATH = "/forgot-password";
const COVER_DELAY = 750;

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const navigationTimer = useRef(null);
  const skipMotion = useRef(false);

  useEffect(() => {
    skipMotion.current =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(max-width: 767px)").matches;

    const frame = window.requestAnimationFrame(() => setIsReady(true));
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(navigationTimer.current);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRegisterClick(event) {
    if (skipMotion.current) return;
    event.preventDefault();
    if (isLeaving) return;
    setIsLeaving(true);
    navigationTimer.current = window.setTimeout(() => navigate("/register"), COVER_DELAY);
  }

  return (
    <main className={`lg-page${isReady ? " lg-is-ready" : ""}${isLeaving ? " lg-is-leaving" : ""}`}>
      <section className="lg-card lg-card--flip" aria-label="Sign in to Apexbridge College">
        <div className="lg-seam-wrap" aria-hidden="true"><div className="lg-seam" /></div>

        <div className="lg-panel">
          <img className="lg-logo" src="/logo/apexbridge-primary-logo.png" alt="Apexbridge College" />
          <div className="lg-welcome">
            <h1>Welcome <em>back.</em></h1>
            <p>Sign in to continue to your Apexbridge account.</p>
          </div>
        </div>

        <div className="lg-form-side">
          <form className="lg-form-content" onSubmit={handleSubmit}>
            <h2 className="lg-title">Sign in</h2>
            <span className="lg-title-rule" aria-hidden="true" />

            <div className="lg-fields">
              <div className="lg-field">
                <label htmlFor="lg-email">Email</label>
                <input id="lg-email" name="email" type="email" placeholder=" " autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4.5 7 7.5 6 7.5-6" /></svg>
              </div>
              <div className="lg-field">
                <label htmlFor="lg-password">Password</label>
                <input id="lg-password" name="password" type="password" placeholder=" " autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.6" /></svg>
              </div>
            </div>

            <div className="lg-options">
              <Link className="lg-forgot" to={FORGOT_PASSWORD_PATH}>Forgot password?</Link>
            </div>

            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="lg-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
            <p className="lg-register">New here? <Link to="/register" onClick={handleRegisterClick}>Create account</Link></p>
          </form>
        </div>

        <div className="lg-blade" aria-hidden="true">
          <div className="lg-blade-inner"><div className="lg-blade-copy"><img src="/logo/apexbridge-primary-logo.png" alt="" /><p>Welcome <em>back.</em></p></div></div>
        </div>
      </section>
    </main>
  );
}

export default Login;
