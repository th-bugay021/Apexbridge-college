import "../../Styles/Great/defaultcss.css";

export function GreatShell({ active, eyebrow, title, description, action, children }) {
  return (
    <div className="great-content" data-great-active={active}>
      <div className="great-heading-row">
        <div><p className="great-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="great-description">{description}</p></div>
        {action && <div className="great-heading-action">{action}</div>}
      </div>
      {children}
    </div>
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
