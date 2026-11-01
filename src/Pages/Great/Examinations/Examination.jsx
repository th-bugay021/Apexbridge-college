import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GreatShell, MetricCard, SectionHeading, StatusPill } from "../../../Components/Great/default";

const starterScores = [
  { student: "Amara Okafor", id: "AP-2041", ca: 27, exam: 61 },
  { student: "Daniel Adeyemi", id: "AP-2037", ca: 23, exam: 54 },
  { student: "Zara Bello", id: "AP-2044", ca: 30, exam: 66 },
  { student: "Michael Eze", id: "AP-2029", ca: 19, exam: 48 },
  { student: "Ifeoma Nwosu", id: "AP-2040", ca: 25, exam: 58 },
];

const gradeFor = (score) => score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : score >= 45 ? "D" : score >= 40 ? "E" : "F";

export default function Examination() {
  const [className, setClassName] = useState("JSS 2A");
  const [subject, setSubject] = useState("Mathematics");
  const [scores, setScores] = useState(starterScores);
  const rankedScores = useMemo(() => {
    const ranked = scores.map((item) => ({ ...item, total: Number(item.ca) + Number(item.exam) }));
    const sorted = [...ranked].sort((a, b) => b.total - a.total);
    return ranked.map((item) => ({ ...item, position: sorted.findIndex((score) => score.id === item.id) + 1 }));
  }, [scores]);
  const average = rankedScores.length ? (rankedScores.reduce((sum, item) => sum + item.total, 0) / rankedScores.length).toFixed(1) : "0";
  const updateScore = (id, key, value) => setScores((items) => items.map((item) => item.id === id ? { ...item, [key]: Math.min(+(key === "ca" ? 30 : 70), Math.max(0, Number(value) || 0)) } : item));

  return <GreatShell active="Examinations" eyebrow="Assessment centre" title="Examinations" description="Set up assessments, enter scores and review calculated class performance." action={<Link className="great-button primary" to="/examinations/new">＋ Create examination</Link>}>
    <div className="great-metrics">
      <MetricCard label="Active examinations" value="04" note="Across 3 year groups" icon="▤" />
      <MetricCard label="Score entry" value="78%" note="156 of 200 scores entered" tone="green" icon="↗" />
      <MetricCard label="Class average" value={`${average}%`} note={`${className} · ${subject}`} tone="violet" icon="∑" />
      <MetricCard label="Awaiting review" value="02" note="Ready for moderation" tone="orange" icon="◷" />
    </div>
    <section className="great-card great-card-pad">
      <SectionHeading title="Score entry" note="Enter continuous assessment and examination marks. Total, grade and class position calculate automatically." action={<button className="great-button" onClick={() => window.print()}>Print score sheet</button>} />
      <div className="great-toolbar"><select aria-label="Class" value={className} onChange={(event) => setClassName(event.target.value)}><option>JSS 2A</option><option>JSS 2B</option><option>SSS 1A</option></select><select aria-label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)}><option>Mathematics</option><option>English Language</option><option>Basic Science</option></select><select aria-label="Term"><option>Second term · 2025/26</option><option>First term · 2025/26</option></select><span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: 10 }}>CA / 30 · Exam / 70 · Total / 100</span></div>
      <div className="great-table-wrap"><table className="great-table"><thead><tr><th>Student</th><th>CA / 30</th><th>Exam / 70</th><th>Total / 100</th><th>Grade</th><th>Position</th></tr></thead><tbody>{rankedScores.map((item) => <tr key={item.id}><td><div className="great-primary-cell"><span className="great-initials">{item.student.split(" ").map((word) => word[0]).join("")}</span><span><b>{item.student}</b><br /><small>{item.id}</small></span></div></td><td><input aria-label={`${item.student} continuous assessment`} className="great-score-input" type="number" min="0" max="30" value={item.ca} onChange={(event) => updateScore(item.id, "ca", event.target.value)} /></td><td><input aria-label={`${item.student} exam score`} className="great-score-input" type="number" min="0" max="70" value={item.exam} onChange={(event) => updateScore(item.id, "exam", event.target.value)} /></td><td><b>{item.total}</b></td><td><StatusPill tone={item.total >= 50 ? "published" : "pending"}>{gradeFor(item.total)}</StatusPill></td><td>{item.position}{item.position === 1 ? "st" : item.position === 2 ? "nd" : item.position === 3 ? "rd" : "th"}</td></tr>)}</tbody></table></div>
      <div className="great-split" style={{ paddingTop: 14 }}><span style={{ color: "var(--color-text-muted)", fontSize: 10 }}>{rankedScores.length} students · Average score {average}%</span><button className="great-button primary" onClick={() => window.alert("Scores saved for review.")}>Save scores</button></div>
    </section>
    <section className="great-card great-card-pad"><SectionHeading title="Current examinations" note="Track assessment setup and publication status." action={<button className="great-button">View all examinations →</button>} /><div className="great-table-wrap"><table className="great-table"><thead><tr><th>Examination</th><th>Term</th><th>Classes</th><th>Subjects</th><th>Due date</th><th>Status</th></tr></thead><tbody><tr><td><b>Second term examinations</b></td><td>Second term</td><td>JSS 1–3</td><td>12 subjects</td><td>14 Nov 2026</td><td><StatusPill tone="pending">In progress</StatusPill></td></tr><tr><td><b>Mid-term assessment</b></td><td>Second term</td><td>JSS 1–SSS 2</td><td>10 subjects</td><td>30 Oct 2026</td><td><StatusPill tone="published">Published</StatusPill></td></tr></tbody></table></div></section>
  </GreatShell>;
}
