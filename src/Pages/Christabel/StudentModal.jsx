import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function StudentModal({ title, children, onClose, returnFocusRef }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = returnFocusRef?.current;
    const focusTimer = window.setTimeout(() => {
      const target = dialogRef.current?.querySelector("[autofocus], input:not([type='hidden']), select, button");
      target?.focus();
    }, 0);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      opener?.focus();
    };
  }, [returnFocusRef]);

  return createPortal(
    <div className="michael-ui students-ui">
      <div className="mu-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <section className="mu-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="students-dialog-title" ref={dialogRef}>
          <header className="mu-modal-header">
            <h2 className="mu-section-title" id="students-dialog-title">{title}</h2>
            <button className="mu-modal-close" type="button" aria-label="Close dialog" onClick={onClose}>×</button>
          </header>
          {children}
        </section>
      </div>
    </div>,
    document.body,
  );
}
