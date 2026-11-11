import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GreatShell, MetricCard, SectionHeading, StatusPill } from "../../../Components/Great/default";
import ResponsiveTable from "../../../Components/common/ResponsiveTable";
import { CreateExaminationForm } from "./CreateExamination";
import { useTheme } from "../../../Context/useTheme";
import { classLabel } from "../../../config/school";

const starterScores = [
  { student: "Amara Okafor", id: "AP-2041", ca: 27, exam: 61 },
  { student: "Daniel Adeyemi", id: "AP-2037", ca: 23, exam: 54 },
  { student: "Zara Bello", id: "AP-2044", ca: 30, exam: 66 },
  { student: "Michael Eze", id: "AP-2029", ca: 19, exam: 48 },
  { student: "Ifeoma Nwosu", id: "AP-2040", ca: 25, exam: 58 },
];

const gradeFor = (score) => score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : score >= 45 ? "D" : score >= 40 ? "E" : "F";

export default function Examination() {
  const { theme } = useTheme();
  const [className, setClassName] = useState(classLabel(8, "A"));
  const [subject, setSubject] = useState("Mathematics");
  const [scores, setScores] = useState(starterScores);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const createButtonRef = useRef(null);
  const wasDialogOpenRef = useRef(false);
  const rankedScores = useMemo(() => {
    const ranked = scores.map((item) => ({ ...item, total: Number(item.ca) + Number(item.exam) }));
    const sorted = [...ranked].sort((a, b) => b.total - a.total);
    return ranked.map((item) => ({ ...item, position: sorted.findIndex((score) => score.id === item.id) + 1 }));
  }, [scores]);
  const average = rankedScores.length ? (rankedScores.reduce((sum, item) => sum + item.total, 0) / rankedScores.length).toFixed(1) : "0";
  const updateScore = (id, key, value) => setScores((items) => items.map((item) => item.id === id ? { ...item, [key]: Math.min(+(key === "ca" ? 30 : 70), Math.max(0, Number(value) || 0)) } : item));
  const closeCreateDialog = () => setShowCreateDialog(false);

  useEffect(() => {
    if (!showCreateDialog) {
      if (wasDialogOpenRef.current) {
        createButtonRef.current?.focus();
        wasDialogOpenRef.current = false;
      }
      return undefined;
    }
    wasDialogOpenRef.current = true;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowCreateDialog(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showCreateDialog]);

  return <>
    <GreatShell active="Examinations" eyebrow="Assessment centre" title="Examinations" description="Set up assessments, enter scores and review calculated class performance." action={<button type="button" ref={createButtonRef} className="great-button primary" onClick={() => setShowCreateDialog(true)}>＋ Create examination</button>}>
    <div className="great-metrics">
      <MetricCard label="Active examinations" value="04" note="Across 3 year groups" icon="▤" />
      <MetricCard label="Score entry" value="78%" note="156 of 200 scores entered" tone="green" icon="↗" />
      <MetricCard label="Class average" value={`${average}%`} note={`${className} · ${subject}`} tone="violet" icon="∑" />
      <MetricCard label="Awaiting review" value="02" note="Ready for moderation" tone="orange" icon="◷" />
    </div>
    <section className="great-card great-card-pad">
      <SectionHeading title="Score entry" note="Enter continuous assessment and examination marks. Total, grade and class position calculate automatically." action={<button className="great-button" onClick={() => window.print()}>Print score sheet</button>} />
      <div className="great-toolbar"><select aria-label="Class" value={className} onChange={(event) => setClassName(event.target.value)}><option>{classLabel(8, "A")}</option><option>{classLabel(8, "B")}</option><option>{classLabel(10, "A")}</option></select><select aria-label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)}><option>Mathematics</option><option>English Language</option><option>Basic Science</option></select><select aria-label="Term"><option>Second term · 2025/26</option><option>First term · 2025/26</option></select><span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: 10 }}>CA / 30 · Exam / 70 · Total / 100</span></div>
      <div className="great-table-wrap"><table className="great-table"><thead><tr><th>Student</th><th>CA / 30</th><th>Exam / 70</th><th>Total / 100</th><th>Grade</th><th>Position</th></tr></thead><tbody>{rankedScores.map((item) => <tr key={item.id}><td><div className="great-primary-cell"><span className="great-initials">{item.student.split(" ").map((word) => word[0]).join("")}</span><span><b>{item.student}</b><br /><small>{item.id}</small></span></div></td><td><input aria-label={`${item.student} continuous assessment`} className="great-score-input" type="number" min="0" max="30" value={item.ca} onChange={(event) => updateScore(item.id, "ca", event.target.value)} /></td><td><input aria-label={`${item.student} exam score`} className="great-score-input" type="number" min="0" max="70" value={item.exam} onChange={(event) => updateScore(item.id, "exam", event.target.value)} /></td><td><b>{item.total}</b></td><td><StatusPill tone={item.total >= 50 ? "published" : "pending"}>{gradeFor(item.total)}</StatusPill></td><td>{item.position}{item.position === 1 ? "st" : item.position === 2 ? "nd" : item.position === 3 ? "rd" : "th"}</td></tr>)}</tbody></table></div>
      <div className="great-split" style={{ paddingTop: 14 }}><span style={{ color: "var(--color-text-muted)", fontSize: 10 }}>{rankedScores.length} students · Average score {average}%</span><button className="great-button primary" onClick={() => window.alert("Scores saved for review.")}>Save scores</button></div>
    </section>
    <section className="great-card great-card-pad"><SectionHeading title="Current examinations" note="Track assessment setup and publication status." action={<button className="great-button">View all examinations →</button>} /><ResponsiveTable rows={[
      { exam: "Second term examinations", term: "Second term", classes: classLabel("7–9"), subjects: "12 subjects", due: "14 Nov 2026", status: "In progress", tone: "pending" },
      { exam: "Mid-term assessment", term: "Second term", classes: classLabel("7–11"), subjects: "10 subjects", due: "30 Oct 2026", status: "Published", tone: "published" },
    ]} rowKey={(item) => item.exam} primary={(item) => item.exam} secondary={(item) => item.term} label="Current examinations" tableClassName="great-table" wrapClassName="great-table-wrap" columns={[
      { key: "exam", label: "Examination", primary: true, render: (item) => <b>{item.exam}</b> },
      { key: "term", label: "Term", render: (item) => item.term },
      { key: "classes", label: "Classes", render: (item) => item.classes },
      { key: "subjects", label: "Subjects", render: (item) => item.subjects },
      { key: "due", label: "Due date", render: (item) => item.due },
      { key: "status", label: "Status", render: (item) => <StatusPill tone={item.tone}>{item.status}</StatusPill> },
    ]} /></section>
    </GreatShell>
    {showCreateDialog && createPortal(
      <div className="michael-ui" data-theme={theme}>
        <div className="mu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeCreateDialog()}>
          <section className="mu-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="create-examination-dialog-title">
            <header className="mu-modal-header">
              <h2 className="mu-section-title" id="create-examination-dialog-title">Create examination</h2>
              <button type="button" className="mu-modal-close" aria-label="Close dialog" onClick={closeCreateDialog}>×</button>
            </header>
            <CreateExaminationForm inDialog onCancel={closeCreateDialog} onSaved={closeCreateDialog} />
          </section>
        </div>
      </div>,
      document.body,
    )}
  </>;
}
