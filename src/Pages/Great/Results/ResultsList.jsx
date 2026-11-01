import { useState } from "react";
import { Link } from "react-router-dom";
import { GreatShell, MetricCard, SectionHeading, StatusPill } from "../../../Components/Great/default";

const results = [
  { name: "Second term examinations", year: "2025/26", term: "Second term", classes: "JSS 1–3, SSS 1", published: "18 Oct 2026", status: "Published", tone: "published", progress: 100 },
  { name: "Mid-term assessment", year: "2025/26", term: "Second term", classes: "JSS 1–SSS 2", published: "—", status: "Awaiting review", tone: "pending", progress: 86 },
  { name: "First term examinations", year: "2025/26", term: "First term", classes: "JSS 1–SSS 3", published: "12 Dec 2025", status: "Published", tone: "published", progress: 100 },
  { name: "Third term examinations", year: "2024/25", term: "Third term", classes: "JSS 1–SSS 3", published: "28 Jul 2025", status: "Published", tone: "published", progress: 100 },
];

export default function ResultsList() {
  const [filter, setFilter] = useState("All results");
  const shown = filter === "All results" ? results : results.filter((item) => item.status === filter);
  return <GreatShell active="Results" eyebrow="Academic records" title="Results" description="Published results, class summaries and report card access across the school." action={<Link className="great-button primary" to="/results/class">Open class results</Link>}>
    <div className="great-metrics"><MetricCard label="Result sets" value="12" note="Across the current year" icon="▤" /><MetricCard label="Published" value="09" note="Available to families" tone="green" icon="✓" /><MetricCard label="In review" value="02" note="Awaiting approval" tone="orange" icon="◷" /><MetricCard label="Classes covered" value="18" note="JSS 1 through SSS 3" tone="violet" icon="⌂" /></div>
    <section className="great-card great-card-pad"><SectionHeading title="Examination results" note="Select a result set to view class averages or individual report cards." /><div className="great-toolbar"><input aria-label="Search results" placeholder="Search by examination…" /><select aria-label="Filter results" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All results</option><option>Published</option><option>Awaiting review</option></select><select aria-label="Academic year"><option>All academic years</option><option>2025/26</option><option>2024/25</option></select></div><div className="great-table-wrap"><table className="great-table"><thead><tr><th>Assessment</th><th>Term</th><th>Classes</th><th>Score entry</th><th>Published</th><th>Status</th><th>Actions</th></tr></thead><tbody>{shown.map((item) => <tr key={item.name}><td><b>{item.name}</b><br /><small>{item.year}</small></td><td>{item.term}</td><td>{item.classes}</td><td><div className="great-progress"><span style={{ width: `${item.progress}%` }} /></div><small>{item.progress}% complete</small></td><td>{item.published}</td><td><StatusPill tone={item.tone}>{item.status}</StatusPill></td><td><Link className="great-text-link" to="/results/class">View classes →</Link></td></tr>)}</tbody></table></div></section>
    <section className="great-card great-card-pad"><SectionHeading title="Quick access by class" note="Jump straight to a class report card view." /> <div className="great-class-grid">{["JSS 1A", "JSS 1B", "JSS 2A", "JSS 2B", "JSS 3A", "SSS 1A"].map((className) => <Link className="great-class-tile" to="/results/class" key={className}><span className="great-class-symbol">▦</span><span><b>{className}</b><small>Second term results</small></span><span className="great-arrow">↗</span></Link>)}</div></section>
  </GreatShell>;
}
