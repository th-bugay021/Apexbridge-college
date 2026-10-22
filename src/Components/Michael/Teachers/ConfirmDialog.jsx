export default function ConfirmDialog({ title, message, busy, onConfirm, onCancel }) {
  return (
    <div className="teacher-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="teacher-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="teacher-form-actions">
          <button className="btn btn-outline" type="button" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" type="button" onClick={onConfirm} disabled={busy}>{busy ? "Working…" : "Confirm"}</button>
        </div>
      </section>
    </div>
  );
}
