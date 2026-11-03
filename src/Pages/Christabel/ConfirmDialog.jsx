import StudentModal from "./StudentModal";

export default function ConfirmDialog({ title, message, onCancel, onConfirm, returnFocusRef }) {
  return (
    <StudentModal title={title} onClose={onCancel} returnFocusRef={returnFocusRef}>
      <div className="mu-modal-body"><p>{message}</p></div>
      <footer className="mu-modal-footer"><button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button><button type="button" className="btn mu-btn-danger" onClick={onConfirm}>Delete</button></footer>
    </StudentModal>
  );
}
