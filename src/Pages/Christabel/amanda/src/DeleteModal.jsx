import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";

export default function DeleteModal({ person, kind, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  // A native dialog keeps keyboard focus inside the modal and supports Escape.
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    cancelRef.current.focus();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="delete-modal"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <button
        className="icon-button modal-close"
        aria-label="Close delete confirmation"
        onClick={onCancel}
      >
        <X />
      </button>
      <div className="modal-icon">
        <Trash2 size={24} />
      </div>
      <h2 id="delete-title">Delete {kind}?</h2>
      <p id="delete-description">
        Are you sure you want to delete{" "}
        <strong>
          {person.firstName} {person.lastName}
        </strong>
        ?
        {kind === "guardian"
          ? " Their links to students will also be removed."
          : " Their student record will be removed."}
      </p>
      <div className="modal-actions">
        <button ref={cancelRef} className="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button delete-button" onClick={onConfirm}>
          Delete {kind}
        </button>
      </div>
    </dialog>
  );
}
