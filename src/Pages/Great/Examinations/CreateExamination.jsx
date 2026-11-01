import { useState } from "react";
import { Link } from "react-router-dom";
import { GreatShell, SectionHeading } from "../../../Components/Great/default";

export function CreateExaminationForm({ onCancel, onSaved, inDialog = false }) {
  const [form, setForm] = useState({ title: "", term: "Second term", year: "2025/26", start: "", end: "", classes: ["JSS 1", "JSS 2", "JSS 3"], mode: "Examination + CA" });
  const [saved, setSaved] = useState(false);
  const toggleClass = (className) => setForm((current) => ({ ...current, classes: current.classes.includes(className) ? current.classes.filter((item) => item !== className) : [...current.classes, className] }));
  const submit = (event) => { event.preventDefault(); setSaved(true); onSaved?.(); };

  const fields = <>
    <div className="great-field full"><label htmlFor="exam-title">Examination name *</label><input id="exam-title" required autoFocus={inDialog} placeholder="e.g. Second term examinations" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
    <div className="great-field"><label htmlFor="term">Term *</label><select id="term" value={form.term} onChange={(event) => setForm({ ...form, term: event.target.value })}><option>First term</option><option>Second term</option><option>Third term</option></select></div>
    <div className="great-field"><label htmlFor="year">Academic year *</label><select id="year" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}><option>2025/26</option><option>2026/27</option></select></div>
    <div className="great-field"><label htmlFor="start-date">Start date *</label><input id="start-date" type="date" required value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /></div>
    <div className="great-field"><label htmlFor="end-date">Score submission deadline *</label><input id="end-date" type="date" required value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} /></div>
    <div className="great-field full"><label htmlFor="score-mode">Scoring structure</label><select id="score-mode" value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value })}><option>Examination + CA</option><option>Examination only</option><option>Custom weighting</option></select></div>
    <fieldset className="great-class-choice"><legend>Classes included</legend>{["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"].map((className) => <label key={className}><input type="checkbox" checked={form.classes.includes(className)} onChange={() => toggleClass(className)} />{className}</label>)}</fieldset>
  </>;

  return (
    <form className={inDialog ? "great-examination-dialog-form" : "great-card great-card-pad"} onSubmit={submit}>
      {!inDialog && <SectionHeading title="Examination details" note="Fields marked required must be completed." />}
      {inDialog ? <div className="mu-modal-body"><div className="great-form-grid">{fields}</div></div> : <div className="great-form-grid">{fields}</div>}
      <div className={inDialog ? "mu-modal-footer" : "great-form-actions"}>
        {inDialog ? <button type="button" className="great-button" onClick={onCancel}>Cancel</button> : <Link to="/examinations" className="great-button">Cancel</Link>}
        <button className="great-button primary" type="submit">Create examination</button>
      </div>
      {saved && !inDialog && <p className="great-success-message" role="status">Examination details saved. You can now enter subject scores.</p>}
    </form>
  );
}

export default function CreateExamination() {
  return (
    <GreatShell active="Examinations" eyebrow="Assessment centre / Setup" title="Create examination" description="Define the assessment window, classes and scoring method for this term." action={<Link className="great-button" to="/examinations">← Back to examinations</Link>}>
      <div className="great-grid-2">
        <CreateExaminationForm />
        <aside>
          <section className="great-card great-card-pad"><SectionHeading title="Scoring guide" /><div className="great-formula"><b>Continuous assessment</b> contributes up to 30 marks.<br /><b>Examination</b> contributes up to 70 marks.<br /><b>Total</b> is calculated out of 100; grade and position update automatically.</div><div className="great-total-row"><span>Grade A</span><strong>70–100</strong></div><div className="great-total-row"><span>Grade B</span><strong>60–69</strong></div><div className="great-total-row"><span>Grade C</span><strong>50–59</strong></div><div className="great-total-row"><span>Grade D / E / F</span><strong>Below 50</strong></div></section>
          <div className="great-inline-note">Once created, the examination appears in the assessment centre for score entry, moderation and publication.</div>
        </aside>
      </div>
    </GreatShell>
  );
}
