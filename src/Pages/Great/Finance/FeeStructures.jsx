import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { GreatShell, MetricCard, SectionHeading, StatusPill } from "../../../Components/Great/default";
import { money } from "../../../Components/Great/money";
import { classLabel, currencyCode, currencySymbol } from "../../../config/school";
import { useTheme } from "../../../Context/useTheme";

const defaults = [
  { name: "Tuition", detail: "Core academic programme", className: classLabel("7–9"), amount: 1850, type: "Required", status: "Active" },
  { name: "Development levy", detail: "Campus improvement", className: "All classes", amount: 250, type: "Required", status: "Active" },
  { name: "Laboratory fee", detail: "Science practicals", className: classLabel("10–12"), amount: 180, type: "Required", status: "Active" },
  { name: "ICT and digital learning", detail: "Technology resources", className: "All year groups", amount: 120, type: "Required", status: "Active" },
  { name: "Sports and activities", detail: "Co-curricular programme", className: "All classes", amount: 100, type: "Optional", status: "Active" },
];

export default function FeeStructures() {
  const { theme } = useTheme();
  const [fees, setFees] = useState(defaults);
  const [form, setForm] = useState({ name: "", detail: "", className: "All classes", amount: "", type: "Required" });
  const [showForm, setShowForm] = useState(false);
  const addFeeButtonRef = useRef(null);
  const firstFieldRef = useRef(null);
  const wasDialogOpenRef = useRef(false);
  const closeDialog = () => setShowForm(false);
  const saveFee = (event) => { event.preventDefault(); setFees((items) => [...items, { ...form, amount: Number(form.amount), status: "Active" }]); setForm({ name: "", detail: "", className: "All classes", amount: "", type: "Required" }); setShowForm(false); };

  useEffect(() => {
    if (!showForm) {
      if (wasDialogOpenRef.current) {
        addFeeButtonRef.current?.focus();
        wasDialogOpenRef.current = false;
      }
      return undefined;
    }
    wasDialogOpenRef.current = true;
    firstFieldRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowForm(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showForm]);

  return (
    <>
      <GreatShell active="Fees & payments" eyebrow="Finance / Fee setup" title="Fee structures" description="Configure term charges by class and manage required and optional fee items." action={<button ref={addFeeButtonRef} className="great-button primary" onClick={() => setShowForm(true)}>＋ Add fee item</button>}>
        <div className="great-metrics"><MetricCard label={`${classLabel("7–9")} core fees`} value={money(2200)} note="Required charges per student" tone="green" icon={currencySymbol} /><MetricCard label="Fee items" value={String(fees.length).padStart(2, "0")} note="Across all classes" icon="▤" /><MetricCard label="Optional charges" value={money(100)} note="Per eligible student" tone="violet" icon="＋" /><MetricCard label="Applied to invoices" value="98%" note="2025/26 · Second term" tone="orange" icon="↗" /></div>
        <section className="great-card great-card-pad"><SectionHeading title="Active fee schedule" note="Second term · 2025/26 academic year" action={<Link className="great-button" to="/payments">View student invoices →</Link>} /><div className="great-toolbar"><select aria-label="Term"><option>Second term · 2025/26</option><option>First term · 2025/26</option></select><select aria-label="Class filter"><option>All classes</option><option>{classLabel("7–9")}</option><option>{classLabel("10–12")}</option></select><span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: 10 }}>Last updated 18 Oct 2026</span></div><div className="great-table-wrap"><table className="great-table"><thead><tr><th>Fee item</th><th>Class scope</th><th>Amount per student</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>{fees.map((fee) => <tr key={fee.name}><td><b>{fee.name}</b><br /><small>{fee.detail || "Term fee"}</small></td><td>{fee.className}</td><td><b>{money(fee.amount)}</b></td><td>{fee.type}</td><td><StatusPill tone="published">{fee.status}</StatusPill></td><td><button className="great-button subtle">Edit</button></td></tr>)}</tbody></table></div></section>
        <div className="great-inline-note">Fee changes apply to newly generated invoices. Existing student invoices keep their recorded amounts for clear payment reconciliation.</div>
      </GreatShell>
      {showForm && createPortal(
        <div className="michael-ui" data-theme={theme}>
          <div className="mu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDialog()}>
            <section className="mu-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="fee-dialog-title">
              <header className="mu-modal-header">
                <div><h2 className="mu-section-title" id="fee-dialog-title">Add fee item</h2><p className="great-description">Choose the class scope and amount to charge per student.</p></div>
                <button type="button" className="mu-modal-close" aria-label="Close dialog" onClick={closeDialog}>×</button>
              </header>
              <form onSubmit={saveFee}>
                <div className="mu-modal-body"><div className="great-form-grid">
                  <div className="great-field"><label htmlFor="fee-name">Fee name *</label><input ref={firstFieldRef} id="fee-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Examination fee" /></div>
                  <div className="great-field"><label htmlFor="fee-amount">Amount ({currencyCode}) *</label><input id="fee-amount" required min="0" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0" /></div>
                  <div className="great-field"><label htmlFor="fee-class">Applies to</label><select id="fee-class" value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })}><option>All classes</option><option>{classLabel("7–9")}</option><option>{classLabel("10–12")}</option><option>{classLabel(7)}</option><option>{classLabel(8)}</option><option>{classLabel(9)}</option></select></div>
                  <div className="great-field"><label htmlFor="fee-type">Fee type</label><select id="fee-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Required</option><option>Optional</option></select></div>
                  <div className="great-field full"><label htmlFor="fee-detail">Description</label><input id="fee-detail" value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} placeholder="What this charge covers" /></div>
                </div></div>
                <footer className="mu-modal-footer"><button type="button" className="great-button" onClick={closeDialog}>Cancel</button><button type="submit" className="great-button primary">Save fee item</button></footer>
              </form>
            </section>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

