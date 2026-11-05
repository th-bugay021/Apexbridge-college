import StudentModal from "./StudentModal";

export default function ConfirmDialog({ title, message, error, busy = false, onCancel, onConfirm, returnFocusRef }) {
  return (
    <StudentModal title={title} onClose={onCancel} returnFocusRef={returnFocusRef}>
      <div className="mu-modal-body"><p>{message}</p>{error && <p className="mu-field-error" role="alert">{error}</p>}</div>
      <footer className="mu-modal-footer"><button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>Cancel</button><button type="button" className="btn mu-btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</button></footer>
    </StudentModal>
  );
}
