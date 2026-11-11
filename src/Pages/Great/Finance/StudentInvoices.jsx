import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GreatShell, MetricCard, SectionHeading, StatusPill } from "../../../Components/Great/default";
import ResponsiveTable from "../../../Components/common/ResponsiveTable";
import { money } from "../../../Components/Great/money";
import { classLabel, currencyCode, currencySymbol } from "../../../config/school";
import { useTheme } from "../../../Context/useTheme";

const initialInvoices = [
  { id: "INV-26041", student: "Amara Okafor", studentId: "AP-2041", className: classLabel(8, "A"), amount: 2480, paid: 1280, due: "20 Oct 2026" },
  { id: "INV-26042", student: "Daniel Adeyemi", studentId: "AP-2037", className: classLabel(8, "A"), amount: 2480, paid: 750, due: "20 Oct 2026" },
  { id: "INV-26043", student: "Zara Bello", studentId: "AP-2044", className: classLabel(8, "A"), amount: 2480, paid: 1200, due: "20 Oct 2026" },
  { id: "INV-26044", student: "Michael Eze", studentId: "AP-2029", className: classLabel(8, "B"), amount: 2380, paid: 0, due: "20 Oct 2026" },
  { id: "INV-26045", student: "Ifeoma Nwosu", studentId: "AP-2040", className: classLabel(8, "B"), amount: 2480, paid: 1000, due: "20 Oct 2026" },
];
const initialPayments = [
  { receipt: "RCT-008742", student: "Amara Okafor", id: "AP-2041", amount: 1280, method: "Bank transfer", date: "23 Oct 2026", reference: "GTB-982731" },
  { receipt: "RCT-008741", student: "Zara Bello", id: "AP-2044", amount: 1200, method: "Card", date: "22 Oct 2026", reference: "POS-440921" },
  { receipt: "RCT-008740", student: "Daniel Adeyemi", id: "AP-2037", amount: 750, method: "Bank transfer", date: "22 Oct 2026", reference: "FBN-101552" },
  { receipt: "RCT-008739", student: "Ifeoma Nwosu", id: "AP-2040", amount: 1000, method: "Cash", date: "21 Oct 2026", reference: "CASH-781" },
];

export default function StudentInvoices() {
  const { theme } = useTheme();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [payments, setPayments] = useState(initialPayments);
  const [view, setView] = useState("Invoices");
  const [filter, setFilter] = useState("All invoices");
  const [query, setQuery] = useState("");
  const [paymentForm, setPaymentForm] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const paymentInvoiceRef = useRef(null);
  const paymentOpenerRef = useRef(null);
  const paymentDialogWasOpenRef = useRef(false);
  const paymentDialogOpen = Boolean(paymentForm);
  const openPaymentDialog = (nextForm, event) => { paymentOpenerRef.current = event.currentTarget; setPaymentForm(nextForm); };
  const closePaymentDialog = () => setPaymentForm(null);

  useEffect(() => {
    if (!paymentDialogOpen) {
      if (paymentDialogWasOpenRef.current) {
        paymentOpenerRef.current?.focus();
        paymentDialogWasOpenRef.current = false;
      }
      return undefined;
    }
    paymentDialogWasOpenRef.current = true;
    paymentInvoiceRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setPaymentForm(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [paymentDialogOpen]);
  const shownInvoices = useMemo(() => invoices.filter((invoice) => {
    const remaining = invoice.amount - invoice.paid;
    const matchesStatus = filter === "All invoices" || (filter === "Paid" ? remaining === 0 : filter === "Partial" ? invoice.paid > 0 && remaining > 0 : remaining > 0);
    return matchesStatus && `${invoice.student} ${invoice.studentId} ${invoice.id}`.toLowerCase().includes(query.toLowerCase());
  }), [invoices, filter, query]);
  const submitPayment = (event) => {
    event.preventDefault();
    const invoice = invoices.find((item) => item.id === paymentForm.invoiceId);
    if (!invoice || Number(paymentForm.amount) <= 0) return;
    const amount = Math.min(Number(paymentForm.amount), invoice.amount - invoice.paid);
    const newPayment = { receipt: `RCT-${String(8743 + payments.length - initialPayments.length).padStart(6, "0")}`, student: invoice.student, id: invoice.studentId, amount, method: paymentForm.method, date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), reference: paymentForm.reference || "—" };
    setInvoices((items) => items.map((item) => item.id === invoice.id ? { ...item, paid: item.paid + amount } : item));
    setPayments((items) => [newPayment, ...items]); setPaymentForm(null); setReceipt(newPayment);
  };
  const printReceipt = (payment) => {
    const win = window.open("", "_blank", "width=700,height=700"); if (!win) return;
    win.document.write(`<html><head><title>Payment receipt ${payment.receipt}</title><style>body{font:14px Arial;color:#213553;padding:45px;max-width:650px;margin:auto}header{text-align:center;border-bottom:2px solid #3157d5;padding-bottom:20px}h1{margin:4px}article{border:1px solid #dce2eb;padding:24px;margin-top:24px}p{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:9px 0}strong{color:#253a5a}.amount{font-size:25px;color:#3157d5;text-align:center;margin:25px}</style></head><body><header><h1>Apexbridge College</h1><p>OFFICIAL PAYMENT RECEIPT</p></header><article><p><span>Receipt number</span><strong>${payment.receipt}</strong></p><p><span>Received from</span><strong>${payment.student} (${payment.id})</strong></p><p><span>Date</span><strong>${payment.date}</strong></p><p><span>Payment method</span><strong>${payment.method}</strong></p><p><span>Reference</span><strong>${payment.reference}</strong></p><div class="amount">${money(payment.amount)}</div><p><span>Status</span><strong>Payment received</strong></p></article><script>window.print()</script></body></html>`); win.document.close();
  };
  const statusFor = (invoice) => invoice.paid >= invoice.amount ? ["Paid", "paid"] : invoice.paid > 0 ? ["Partial", "partial"] : ["Outstanding", "unpaid"];

  return <>
  <GreatShell active="Fees & payments" eyebrow="Finance / Collections" title="Student invoices" description="Monitor fee collection, record payments and issue printable payment receipts." action={<button type="button" className="great-button primary" onClick={(event) => openPaymentDialog({ invoiceId: invoices.find((item) => item.amount > item.paid)?.id ?? "", amount: "", method: "Bank transfer", reference: "" }, event)}>＋ Record payment</button>}>
    <div className="great-metrics"><MetricCard label="Total billed" value={money(250000)} note="Second term · 2025/26" icon={currencySymbol} /><MetricCard label="Collected" value={money(195000)} note="78% of billed fees" tone="green" icon="↗" /><MetricCard label="Outstanding" value={money(55000)} note="Across 436 student invoices" tone="orange" icon="◷" /><MetricCard label="Collection rate" value="78%" note="Up 4.2% from last term" tone="violet" icon="∑" /></div>
    <section className="great-card great-card-pad"><SectionHeading title="Accountant finance summary" note="Second term collections across the school." action={<button className="great-button" onClick={() => window.print()}>Print summary</button>} /><div className="great-summary-grid"><div className="great-summary-box"><span>Amount billed</span><strong>{money(250000)}</strong><div className="great-progress"><span style={{ width: "78%" }} /></div><small>School fee target</small></div><div className="great-summary-box collected"><span>Collected</span><strong>{money(195000)}</strong><small>Received payments</small></div><div className="great-summary-box outstanding"><span>Outstanding balance</span><strong>{money(55000)}</strong><small>Fees awaiting payment</small></div></div></section>
    <section className="great-card great-card-pad"><div className="great-tabs"><button className={view === "Invoices" ? "active" : ""} onClick={() => setView("Invoices")}>Student invoices</button><button className={view === "History" ? "active" : ""} onClick={() => setView("History")}>Payment history <span className="great-tab-count">{payments.length}</span></button></div>
      {view === "Invoices" ? <><SectionHeading title="Invoices" note="Search balances or record a part or full payment." /><div className="great-toolbar"><input aria-label="Search student invoices" placeholder="Find student or invoice…" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Invoice status" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All invoices</option><option>Outstanding</option><option>Partial</option><option>Paid</option></select><select aria-label="Invoice class"><option>All classes</option><option>{classLabel(8, "A")}</option><option>{classLabel(8, "B")}</option></select></div><ResponsiveTable rows={shownInvoices} rowKey={(invoice) => invoice.id} primary={(invoice) => invoice.student} secondary={(invoice) => invoice.className} label="Student invoices" tableClassName="great-table" wrapClassName="great-table-wrap" columns={[
        { key: "invoice", label: "Invoice", render: (invoice) => <b>{invoice.id}</b> },
        { key: "student", label: "Student", primary: true, render: (invoice) => <>{invoice.student}<br /><small>{invoice.studentId}</small></>, mobileDetails: (invoice) => [{ label: "Student ID", value: invoice.studentId }] },
        { key: "class", label: "Class", render: (invoice) => invoice.className },
        { key: "amount", label: "Amount due", render: (invoice) => money(invoice.amount) },
        { key: "paid", label: "Paid", render: (invoice) => money(invoice.paid) },
        { key: "balance", label: "Balance", render: (invoice) => <b>{money(invoice.amount - invoice.paid)}</b> },
        { key: "due", label: "Due date", render: (invoice) => invoice.due },
        { key: "status", label: "Status", render: (invoice) => { const [label, tone] = statusFor(invoice); return <StatusPill tone={tone}>{label}</StatusPill>; } },
        { key: "action", label: "Action", actions: true, render: (invoice) => invoice.paid < invoice.amount && <button type="button" className="great-button subtle" onClick={(event) => openPaymentDialog({ invoiceId: invoice.id, amount: "", method: "Bank transfer", reference: "" }, event)}>Record payment</button> },
      ]} /></> : <><SectionHeading title="Payment history" note="Recorded transactions and receipt references." /><div className="great-toolbar"><input aria-label="Search payments" placeholder="Find student or receipt…" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Payment date"><option>All dates</option><option>Today</option><option>This week</option></select><select aria-label="Payment method"><option>All methods</option><option>Bank transfer</option><option>Card</option><option>Cash</option></select></div><ResponsiveTable rows={payments.filter((payment) => `${payment.student} ${payment.id} ${payment.receipt}`.toLowerCase().includes(query.toLowerCase()))} rowKey={(payment) => payment.receipt} primary={(payment) => payment.student} secondary={(payment) => payment.date} label="Payment history" tableClassName="great-table" wrapClassName="great-table-wrap" columns={[
        { key: "receipt", label: "Receipt", render: (payment) => <b>{payment.receipt}</b> },
        { key: "student", label: "Student", primary: true, render: (payment) => <>{payment.student}<br /><small>{payment.id}</small></>, mobileDetails: (payment) => [{ label: "Student ID", value: payment.id }] },
        { key: "amount", label: "Amount received", render: (payment) => <b>{money(payment.amount)}</b> },
        { key: "method", label: "Method", render: (payment) => payment.method },
        { key: "reference", label: "Reference", render: (payment) => payment.reference },
        { key: "date", label: "Date", render: (payment) => payment.date },
        { key: "action", label: "Receipt", actions: true, render: (payment) => <button type="button" className="great-button subtle" onClick={() => printReceipt(payment)}>Print ↗</button> },
      ]} /></>}
    </section>
    {receipt && <div className="great-toast" role="status">Payment recorded · {receipt.receipt}<button onClick={() => printReceipt(receipt)}>Print receipt</button><button aria-label="Dismiss" onClick={() => setReceipt(null)}>×</button></div>}
  </GreatShell>
  {paymentForm && createPortal(
    <div className="michael-ui" data-theme={theme}>
      <div className="mu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closePaymentDialog()}>
        <section className="mu-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title">
          <header className="mu-modal-header">
            <div><p className="great-eyebrow">Finance / Collections</p><h2 className="mu-section-title" id="payment-dialog-title">Record payment</h2><p className="great-description">Add a payment to the student&apos;s invoice and generate a receipt.</p></div>
            <button type="button" className="mu-modal-close" aria-label="Close dialog" onClick={closePaymentDialog}>×</button>
          </header>
          <form onSubmit={submitPayment}>
            <div className="mu-modal-body"><div className="great-form-grid">
              <div className="great-field full"><label htmlFor="payment-invoice">Student invoice</label><select ref={paymentInvoiceRef} id="payment-invoice" value={paymentForm.invoiceId} onChange={(event) => setPaymentForm({ ...paymentForm, invoiceId: event.target.value })}>{invoices.filter((item) => item.paid < item.amount).map((item) => <option key={item.id} value={item.id}>{item.student} · {item.id} · balance {money(item.amount - item.paid)}</option>)}</select></div>
              <div className="great-field"><label htmlFor="payment-amount">Amount received ({currencyCode})</label><input id="payment-amount" type="number" required min="1" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} /></div>
              <div className="great-field"><label htmlFor="payment-method">Payment method</label><select id="payment-method" value={paymentForm.method} onChange={(event) => setPaymentForm({ ...paymentForm, method: event.target.value })}><option>Bank transfer</option><option>Card</option><option>Cash</option><option>Online payment</option></select></div>
              <div className="great-field full"><label htmlFor="payment-reference">Transaction reference</label><input id="payment-reference" value={paymentForm.reference} onChange={(event) => setPaymentForm({ ...paymentForm, reference: event.target.value })} placeholder="Bank or terminal reference" /></div>
            </div></div>
            <footer className="mu-modal-footer"><button type="button" className="great-button" onClick={closePaymentDialog}>Cancel</button><button className="great-button primary" type="submit">Save payment</button></footer>
          </form>
        </section>
      </div>
    </div>,
    document.body,
  )}
  </>;
}

