import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GreatShell, MetricCard, SectionHeading, StatusPill } from "../../../Components/Great/default";
import ResponsiveTable from "../../../Components/common/ResponsiveTable";
import { classLabel } from "../../../config/school";

const records = [
  { name: "Amara Okafor", id: "AP-2041", attendance: 96, scores: [84, 78, 91, 72] },
  { name: "Daniel Adeyemi", id: "AP-2037", attendance: 92, scores: [76, 81, 68, 75] },
  { name: "Zara Bello", id: "AP-2044", attendance: 98, scores: [91, 88, 94, 86] },
  { name: "Michael Eze", id: "AP-2029", attendance: 88, scores: [64, 58, 72, 69] },
  { name: "Ifeoma Nwosu", id: "AP-2040", attendance: 94, scores: [79, 83, 76, 81] },
];
const gradeFor = (score) => score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : score >= 45 ? "D" : score >= 40 ? "E" : "F";

export default function ClassResults() {
  const [selectedClass, setSelectedClass] = useState(classLabel(8, "A"));
  const [term, setTerm] = useState("Second term · 2025/26");
  const results = useMemo(() => {
    const withAverage = records.map((student) => ({ ...student, average: Math.round(student.scores.reduce((sum, score) => sum + score, 0) / student.scores.length) }));
    const sorted = [...withAverage].sort((a, b) => b.average - a.average);
    return withAverage.map((student) => ({ ...student, position: sorted.findIndex((item) => item.id === student.id) + 1 }));
  }, []);
  const classAverage = Math.round(results.reduce((sum, item) => sum + item.average, 0) / results.length);
  const report = (student) => { const win = window.open("", "_blank", "width=850,height=800"); if (!win) return; win.document.write(`<html><head><title>${student.name} · Report card</title><style>body{font:14px Arial;color:#213553;padding:42px}header{text-align:center;border-bottom:2px solid #3157d5;padding-bottom:20px}h1{margin:4px}table{width:100%;border-collapse:collapse;margin:22px 0}td,th{border:1px solid #dce2eb;padding:10px;text-align:left}footer{margin-top:50px;display:flex;justify-content:space-between}.report-table-wrap{max-width:100%;overflow-x:auto}</style></head><body><header><h1>Apexbridge College</h1><p>Student report card · ${term}</p></header><p><b>Student:</b> ${student.name} &nbsp; <b>Student ID:</b> ${student.id} &nbsp; <b>Class:</b> ${selectedClass}</p><div class="report-table-wrap"><table><thead><tr><th>Subject</th><th>Score</th></tr></thead><tbody>${["Mathematics", "English Language", "Basic Science", "Social Studies"].map((subject, index) => `<tr><td>${subject}</td><td>${student.scores[index]} · Grade ${gradeFor(student.scores[index])}</td></tr>`).join("")}</tbody></table></div><p><b>Average:</b> ${student.average}% &nbsp; <b>Class position:</b> ${student.position} of ${results.length}</p><p><b>Attendance:</b> ${student.attendance}%</p><footer><span>Class teacher __________________</span><span>Parent / guardian __________________</span></footer><script>window.print()</script></body></html>`); win.document.close(); };

  return <GreatShell active="Results" eyebrow="Academic records" title="Class results" description="Review class performance and print individual student report cards." action={<button className="great-button primary" onClick={() => window.print()}>Print class summary</button>}>
    <div className="great-toolbar"><select aria-label="Class" value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}><option>{classLabel(8, "A")}</option><option>{classLabel(8, "B")}</option><option>{classLabel(9, "A")}</option><option>{classLabel(10, "A")}</option></select><select aria-label="Term" value={term} onChange={(event) => setTerm(event.target.value)}><option>First term · 2025/26</option><option>Second term · 2025/26</option><option>Third term · 2025/26</option></select><span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: 10 }}>Last updated 23 Oct 2026</span></div>
    <div className="great-metrics"><MetricCard label="Class average" value={`${classAverage}%`} note="Across 4 subjects" icon="∑" /><MetricCard label="Students in class" value="32" note="5 report cards shown" tone="green" icon="♙" /><MetricCard label="Top position" value={`${results[0]?.average}%`} note={results[0]?.name ?? "—"} tone="violet" icon="↗" /><MetricCard label="Class attendance" value="93.6%" note="Term to date" tone="orange" icon="◷" /></div>
    <section className="great-card great-card-pad"><SectionHeading title={`${selectedClass} report cards`} note={`Published results · ${term}`} action={<Link className="great-button" to="/results">View all results →</Link>} /><ResponsiveTable rows={results} rowKey={(student) => student.id} primary={(student) => student.name} secondary={(student) => student.id} avatar={(student) => <span className="great-initials">{student.name.split(" ").map((word) => word[0]).join("")}</span>} label="Class report cards" tableClassName="great-table" wrapClassName="great-table-wrap" columns={[
      { key: "student", label: "Student", primary: true, render: (student) => <div className="great-primary-cell"><span className="great-initials">{student.name.split(" ").map((word) => word[0]).join("")}</span><span><b>{student.name}</b><br /><small>{student.id}</small></span></div> },
      ...["Mathematics", "English", "Basic Science", "Social Studies"].map((subject, index) => ({ key: `score-${index}`, label: subject, render: (student) => <>{student.scores[index]} <span className="great-table-grade">{gradeFor(student.scores[index])}</span></> })),
      { key: "average", label: "Average", render: (student) => <b>{student.average}%</b> },
      { key: "grade", label: "Grade", render: (student) => <StatusPill tone={student.average >= 50 ? "published" : "pending"}>{gradeFor(student.average)}</StatusPill> },
      { key: "position", label: "Position", render: (student) => `${student.position}${student.position === 1 ? "st" : student.position === 2 ? "nd" : student.position === 3 ? "rd" : "th"}` },
      { key: "report", label: "Report card", actions: true, render: (student) => <button className="great-button subtle" onClick={() => report(student)}>Print ↗</button> },
    ]} /></section>
    <section className="great-card great-card-pad"><SectionHeading title="Class teacher’s note" note="Included at the foot of report cards." /><textarea className="great-note-area" defaultValue="A positive term. Keep up your consistent effort and class participation." aria-label="Class teacher note" /><div className="great-form-actions"><button className="great-button">Save note</button><span style={{ color: "var(--color-text-muted)", fontSize: 10 }}>Report cards are printable on A4 paper.</span></div></section>
  </GreatShell>;
}
