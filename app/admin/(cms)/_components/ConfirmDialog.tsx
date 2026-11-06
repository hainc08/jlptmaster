"use client";

import { useEffect, useId, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

/** Accessible alert dialog: focus moves in (to Cancel when destructive), Tab is trapped, Esc cancels, focus returns to the opener. */
export function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", danger = false, onConfirm, onCancel, children }: Props) {
  const titleId = useId();
  const bodyId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    (danger ? cancelRef.current : confirmRef.current)?.focus();
    return () => opener?.focus?.();
  }, [open, danger]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key !== "Tab") return;
    const focusables = Array.from(boxRef.current?.querySelectorAll<HTMLElement>("button, select, input, textarea, [href]") ?? []).filter((el) => !el.hasAttribute("disabled"));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="dlg open" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={boxRef} className="box" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={body ? bodyId : undefined} onKeyDown={onKeyDown}>
        <h2 id={titleId}>{title}</h2>
        {body && <p id={bodyId} className="muted">{body}</p>}
        {children}
        <div className="acts">
          <button ref={cancelRef} type="button" className="btn text" onClick={onCancel}>Cancel</button>
          <button ref={confirmRef} type="button" className={`btn ${danger ? "danger" : "filled"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
