import "../../Styles/Great/defaultcss.css";

export function GreatShell({ active, eyebrow, title, description, action, children }) {
  const links = [
    ["Overview", "/dashboard"],
    ["Examinations", "/examinations"],
    ["Results", "/results"],
    ["Fees & payments", "/fees"],
  ];

  return (
    <main className="great-workspace">
      <aside className="great-rail">
        <a className="great-brand" href="/dashboard" aria-label="Apexbridge home">
          <span className="great-brand-mark">A</span>
          <span>Apexbridge <small>College portal</small></span>
        </a>
        <p className="great-nav-label">ACADEMIC OFFICE</p>
        <nav className="great-nav" aria-label="Academic office">
          {links.map(([label, href]) => (
            <a className={active === label ? "active" : ""} href={href} key={label}>
              <span className="great-nav-dot" />{label}
            </a>
          ))}
        </nav>
        <div className="great-rail-note">
          <span className="great-note-icon">✓</span>
          <strong>School year 2025/26</strong>
          <span>Second term · In progress</span>
        </div>
        <div className="great-user"><span className="great-avatar">AD</span><span><b>Admin desk</b><small>School administrator</small></span></div>
      </aside>
      <section className="great-main">
        <header className="great-topbar"><span>School administration <span className="great-slash">/</span> {active}</span><span className="great-topbar-right"><span className="great-live-dot" /> All changes saved <span className="great-date">Fri, 23 Oct 2026</span></span></header>
        <div className="great-content">
          <div className="great-heading-row">
            <div><p className="great-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="great-description">{description}</p></div>
            {action && <div className="great-heading-action">{action}</div>}
          </div>
          {children}
          <footer className="great-footer">Apexbridge College <span>·</span> Academic and finance office</footer>
        </div>
      </section>
    </main>
  );
}

export function MetricCard({ label, value, note, tone = "blue", icon }) {
  return <article className="great-metric"><div className="great-metric-top"><span>{label}</span><span className={`great-metric-icon ${tone}`}>{icon}</span></div><strong>{value}</strong><small>{note}</small></article>;
}

export function StatusPill({ children, tone = "neutral" }) {
  return <span className={`great-status ${tone}`}>{children}</span>;
}

export function SectionHeading({ title, note, action }) {
  return <div className="great-section-heading"><div><h2>{title}</h2>{note && <p>{note}</p>}</div>{action}</div>;
}

export function EmptyState({ title, note }) {
  return <div className="great-empty"><span>✳</span><strong>{title}</strong><p>{note}</p></div>;
}
