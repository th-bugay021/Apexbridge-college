import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import "./login.css"; // shared card, blade and field styles (lg- classes)


// Same timing as Login: the sweep lasts 900ms, we navigate when it nearly covers the card.
const COVER_DELAY = 750;

const STRENGTH_LABELS = ["Use 8 characters or more.", "Weak", "Okay", "Good", "Strong"];
const STAFF_ROLES = [
  ["TEACHER", "Teacher"],
  ["ACCOUNTANT", "Accountant"],
  ["ADMIN", "Admin"],
  ["SUPER_ADMIN", "Super Admin"],
];

function friendlyRegistrationError(requestError) {
  const message = requestError?.message?.toLowerCase() || "";
  if (message.includes("invite")) {
    return "This invite code is invalid, expired, revoked, or already used. Ask your administrator for a new one.";
  }
  if (message.includes("email") && message.includes("already exists")) {
    return "An account with that email already exists. Try signing in instead.";
  }
  return "We couldn’t create your account. Check your details and try again.";
}

// Visual only: scores a password 0 to 4 so the bar can fill up.
function scorePassword(value) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.max(score, 1);
}

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(() => new URLSearchParams(window.location.search).has("invite") ? "TEACHER" : "STUDENT");
  const [registrationMode, setRegistrationMode] = useState(() => new URLSearchParams(window.location.search).has("invite") ? "STAFF" : "SELF_SERVE");
  const [inviteCode, setInviteCode] = useState(() => new URLSearchParams(window.location.search).get("invite")?.trim() || "");
  const [inviteError, setInviteError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigationTimer = useRef(null);
  const skipMotion = useRef(false);

  const strength = scorePassword(password);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("invite")) return;
    params.delete("invite");
    const remainingQuery = params.toString();
    const nextUrl = `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, []);

  useEffect(() => {
    // No sweep for reduced motion or phones: navigate straight away.
    skipMotion.current =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(max-width: 767px)").matches;

    const frame = window.requestAnimationFrame(() => setIsReady(true));

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(navigationTimer.current);
    };
  }, []);

  function handleLoginClick(event) {
    if (skipMotion.current) return;

    event.preventDefault();
    if (isLeaving) return;

    setIsLeaving(true);
    navigationTimer.current = window.setTimeout(() => navigate("/login"), COVER_DELAY);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setInviteError("");
    setIsSubmitting(true);
    try {
      const details = { fullName, email, password, role };
      if (registrationMode === "STAFF") {
        details.role = role;
        details.inviteCode = inviteCode.trim();
      }
      await register(details);
      setInviteCode("");
      navigate("/dashboard");
    } catch (requestError) {
      const friendlyError = friendlyRegistrationError(requestError);
      if (registrationMode === "STAFF" && requestError?.message?.toLowerCase().includes("invite")) {
        setInviteError(friendlyError);
      } else {
        setError(friendlyError);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`lg-page${isReady ? " lg-is-ready" : ""}${isLeaving ? " lg-is-leaving" : ""}`}>
      <section className="lg-card" aria-label="Create your Apexbridge College account">
        <div className="lg-seam-wrap" aria-hidden="true">
          <div className="lg-seam" />
        </div>

        <div className="lg-panel">
          <img
            className="lg-logo"
            src="/logo/apexbridge-primary-logo.png"
            alt="Apexbridge College"
          />
          <div className="lg-welcome">
            <h1>
              Start your <em>journey.</em>
            </h1>
            <p>Create your Apexbridge account to get started.</p>
          </div>
        </div>

        <div className="lg-form-side">
          <form className="lg-form-content" onSubmit={handleSubmit}>
            <fieldset className="rg-mode-switch" aria-label="Registration type" role="radiogroup">
              <label className={registrationMode === "SELF_SERVE" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="registrationMode"
                  value="SELF_SERVE"
                  checked={registrationMode === "SELF_SERVE"}
                  onChange={() => { setRegistrationMode("SELF_SERVE"); setRole("STUDENT"); setError(""); setInviteError(""); }}
                />
                <span>Student or Parent</span>
              </label>
              <label className={registrationMode === "STAFF" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="registrationMode"
                  value="STAFF"
                  checked={registrationMode === "STAFF"}
                  onChange={() => { setRegistrationMode("STAFF"); setRole("TEACHER"); setError(""); setInviteError(""); }}
                />
                <span>Staff (invite code)</span>
              </label>
            </fieldset>
            <h2 className="lg-title">Create account</h2>
            <span className="lg-title-rule" aria-hidden="true" />

            <div className="lg-fields rg-fields">
              <div className="lg-field">
                <label htmlFor="rg-name">Full name</label>
                <input id="rg-name" name="fullName" type="text" placeholder=" " autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <circle cx="12" cy="8.5" r="3.5" />
                  <path d="M5 19.5c.8-3.4 3.6-5 7-5s6.2 1.6 7 5" />
                </svg>
              </div>

              <div className="lg-field">
                <label htmlFor="rg-email">Email</label>
                <input id="rg-email" name="email" type="email" placeholder=" " autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                  <path d="m4.5 7 7.5 6 7.5-6" />
                </svg>
              </div>

              <div>
                <div className="lg-field">
                  <label htmlFor="rg-password">Password</label>
                  <input
                    id="rg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    autoComplete="new-password"
                    value={password}
                    minLength={8}
                    required
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button className="lg-password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
                      <circle cx="12" cy="12" r="2.6" />
                    </svg>
                  </button>
                </div>

                <div className="rg-strength" data-level={strength}>
                  <span className="rg-strength-bars" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="rg-strength-label" aria-live="polite">
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
              </div>
            </div>

            <div className={`rg-mode-fields ${registrationMode === "STAFF" ? "is-staff" : "is-self-serve"}`}>
              <div className="rg-mode-field rg-self-serve-field" aria-hidden={registrationMode !== "SELF_SERVE"}>
                <label className="rg-account-type" htmlFor="rg-role">Account type</label>
                <select className="rg-account-select" id="rg-role" value={role === "PARENT" ? "PARENT" : "STUDENT"} onChange={(event) => setRole(event.target.value)} tabIndex={registrationMode === "SELF_SERVE" ? 0 : -1}>
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent</option>
                </select>
              </div>
              <div className="rg-mode-field rg-staff-field" aria-hidden={registrationMode !== "STAFF"}>
                <label className="rg-account-type" htmlFor="rg-staff-role">Staff account type</label>
                <select className="rg-account-select" id="rg-staff-role" value={STAFF_ROLES.some(([value]) => value === role) ? role : "TEACHER"} onChange={(event) => setRole(event.target.value)} tabIndex={registrationMode === "STAFF" ? 0 : -1}>
                  {STAFF_ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <div className={`lg-field rg-invite-field${inviteError ? " has-error" : ""}`}>
                  <label htmlFor="rg-invite-code">Invite code</label>
                  <input
                    id="rg-invite-code"
                    name="inviteCode"
                    type="text"
                    placeholder=" "
                    value={inviteCode}
                    autoComplete="off"
                    spellCheck="false"
                    autoCapitalize="off"
                    className="rg-invite-input"
                    aria-invalid={Boolean(inviteError)}
                    aria-describedby={inviteError ? "rg-invite-error rg-invite-help" : "rg-invite-help"}
                    onChange={(event) => { setInviteCode(event.target.value); setInviteError(""); }}
                    tabIndex={registrationMode === "STAFF" ? 0 : -1}
                  />
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <circle cx="8" cy="15" r="4" />
                    <path d="m11 12 8-8 3 3-2 2-2-1-1 2-2-1-2 2" />
                  </svg>
                </div>
                <p className="rg-invite-help" id="rg-invite-help">Staff accounts need an invite code from your administrator.</p>
                <p className="rg-invite-error" id="rg-invite-error" aria-live="polite">{inviteError && <><span aria-hidden="true">⚠</span> {inviteError}</>}</p>
              </div>
            </div>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="lg-submit" type="submit" disabled={isSubmitting || (registrationMode === "STAFF" && (!fullName.trim() || !email.trim() || !password || !inviteCode.trim()))}>
              {isSubmitting ? <><span className="rg-spinner" aria-hidden="true" />Creating account…</> : "Create account"}
            </button>
            <p className="lg-register">
              Already have an account?{" "}
              <Link to="/login" onClick={handleLoginClick}>
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <div className="lg-blade" aria-hidden="true">
          <div className="lg-blade-inner">
            <div className="lg-blade-copy">
              <img src="/logo/apexbridge-primary-logo.png" alt="" />
              <p>
                Start your <em>journey.</em>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Register;
