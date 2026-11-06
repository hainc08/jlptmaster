"use client";

import { useEffect, useId, useRef } from "react";
import { Icon } from "./Icon";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Right-hand edit panel: modal dialog with focus trap, Esc/scrim to close, focus restored to the opener. */
export function SidePanel({ open, title, onClose, children, footer }: Props) {
  const titleId = useId();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button.body-focus")?.focus();
    return () => opener?.focus?.();
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const f = Array.from(ref.current?.querySelectorAll<HTMLElement>("button, input, select, textarea, a[href]") ?? []).filter((el) => !el.hasAttribute("disabled"));
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };

  return (
    <>
      <div className="scrim open" onMouseDown={onClose} />
      <aside ref={ref} className="panel open" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown}>
        <header>
          <h2 className="t-title" id={titleId} style={{ flex: 1 }}>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close panel" onClick={onClose}><Icon name="close" /></button>
        </header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </aside>
    </>
  );
}
