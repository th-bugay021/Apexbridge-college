import { useState } from "react";
import { Link } from "react-router-dom";
import { GreatShell, MetricCard, SectionHeading, StatusPill } from "../../../Components/Great/default";
import ResponsiveTable from "../../../Components/common/ResponsiveTable";
import { classLabel } from "../../../config/school";

const results = [
  { name: "Second term examinations", year: "2025/26", term: "Second term", classes: `${classLabel("7–9")}, ${classLabel(10)}`, published: "18 Oct 2026", status: "Published", tone: "published", progress: 100 },
  { name: "Mid-term assessment", year: "2025/26", term: "Second term", classes: `${classLabel("7–11")}`, published: "—", status: "Awaiting review", tone: "pending", progress: 86 },
  { name: "First term examinations", year: "2025/26", term: "First term", classes: `${classLabel("7–12")}`, published: "12 Dec 2025", status: "Published", tone: "published", progress: 100 },
  { name: "Third term examinations", year: "2024/25", term: "Third term", classes: `${classLabel("7–12")}`, published: "28 Jul 2025", status: "Published", tone: "published", progress: 100 },
];

export default function ResultsList() {
  const [filter, setFilter] = useState("All results");
  const shown = filter === "All results" ? results : results.filter((item) => item.status === filter);
  return <GreatShell active="Results" eyebrow="Academic records" title="Results" description="Published results, class summaries and report card access across the school." action={<Link className="great-button primary" to="/results/class">Open class results</Link>}>
    <div className="great-metrics"><MetricCard label="Result sets" value="12" note="Across the current year" icon="▤" /><MetricCard label="Published" value="09" note="Available to families" tone="green" icon="✓" /><MetricCard label="In review" value="02" note="Awaiting approval" tone="orange" icon="◷" /><MetricCard label="Classes covered" value="18" note={`${classLabel(7)} through ${classLabel(12)}`} tone="violet" icon="⌂" /></div>
    <section className="great-card great-card-pad"><SectionHeading title="Examination results" note="Select a result set to view class averages or individual report cards." /><div className="great-toolbar"><input aria-label="Search results" placeholder="Search by examination…" /><select aria-label="Filter results" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All results</option><option>Published</option><option>Awaiting review</option></select><select aria-label="Academic year"><option>All academic years</option><option>2025/26</option><option>2024/25</option></select></div><ResponsiveTable rows={shown} rowKey={(item) => item.name} primary={(item) => item.name} secondary={(item) => item.term} label="Examination results" tableClassName="great-table" wrapClassName="great-table-wrap" columns={[
      { key: "assessment", label: "Assessment", primary: true, render: (item) => <><b>{item.name}</b><br /><small>{item.year}</small></> },
      { key: "term", label: "Term", render: (item) => item.term },
      { key: "classes", label: "Classes", render: (item) => item.classes },
      { key: "progress", label: "Score entry", render: (item) => <><div className="great-progress"><span style={{ width: `${item.progress}%` }} /></div><small>{item.progress}% complete</small></> },
      { key: "published", label: "Published", render: (item) => item.published },
      { key: "status", label: "Status", render: (item) => <StatusPill tone={item.tone}>{item.status}</StatusPill> },
      { key: "actions", label: "Actions", actions: true, render: () => <Link className="great-text-link" to="/results/class">View classes →</Link> },
    ]} /></section>
    <section className="great-card great-card-pad"><SectionHeading title="Quick access by class" note="Jump straight to a class report card view." /> <div className="great-class-grid">{[classLabel(7, "A"), classLabel(7, "B"), classLabel(8, "A"), classLabel(8, "B"), classLabel(9, "A"), classLabel(10, "A")].map((className) => <Link className="great-class-tile" to="/results/class" key={className}><span className="great-class-symbol">▦</span><span><b>{className}</b><small>Second term results</small></span><span className="great-arrow">↗</span></Link>)}</div></section>
  </GreatShell>;
}
