import React from "react";
import Link from "next/link";
import { AlertTriangle, Inbox, Lock } from "lucide-react";

type Action = { label: string; onClick?: () => void; href?: string };

/** Loading (S1), empty (S2), error (S3) and locked (S4) states from the design review. */
export function StateView({
  kind,
  title,
  body,
  action,
}: {
  kind: "loading" | "empty" | "error" | "locked";
  title: string;
  body?: string;
  action?: Action;
}) {
  if (kind === "loading") {
    return (
      <div aria-busy="true" aria-live="polite" className="flex flex-col gap-3">
        <span className="sr-only">{title}</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface-hover animate-pulse" />
        ))}
      </div>
    );
  }

  const Icon = kind === "error" ? AlertTriangle : kind === "locked" ? Lock : Inbox;
  const tone =
    kind === "error"
      ? "bg-danger-bg text-danger-text"
      : kind === "locked"
      ? "bg-surface-hover text-locked"
      : "bg-primary-container text-on-primary-container";

  return (
    <div
      role={kind === "error" ? "alert" : undefined}
      className="flex flex-col items-center text-center gap-3 rounded-2xl border border-border bg-surface px-6 py-10"
    >
      <span className={`grid place-items-center w-14 h-14 rounded-full ${tone}`}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <p className="font-bold text-base text-foreground">{title}</p>
      {body && <p className="text-sm text-muted max-w-sm">{body}</p>}
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="min-h-12 px-5 inline-flex items-center rounded-xl bg-primary text-white font-semibold text-sm"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="min-h-12 px-5 rounded-xl bg-primary text-white font-semibold text-sm"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
