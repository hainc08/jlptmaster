import { ApiError } from "../_lib/api";
import { Icon, type IconName } from "./Icon";

export function EmptyState({ title, hint, action, icon = "inbox" }: { title: string; hint?: string; action?: React.ReactNode; icon?: IconName }) {
  return (
    <div className="state">
      <div className="ic"><Icon name={icon} /></div>
      <h2 className="t-sub">{title}</h2>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  );
}

/** A 403 is explained, not retried; anything else can be retried. */
export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const forbidden = error instanceof ApiError && error.status === 403;
  return (
    <div className="state err" role="alert">
      <div className="ic"><Icon name="error" /></div>
      <h2 className="t-sub">{forbidden ? "You don’t have access to this module" : "Couldn’t load this page"}</h2>
      <p className="muted">{forbidden ? "Ask an owner to grant your role access." : "Your data is safe — check your connection and try again."}</p>
      {!forbidden && onRetry && <button type="button" className="btn tonal" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--surface-3)" }}>
          <span className="skel" style={{ width: 36, height: 36, borderRadius: "50%" }} />
          <span className="skel" style={{ width: 180, height: 14 }} />
          <span className="skel" style={{ width: 220, height: 14 }} />
          <span className="skel" style={{ width: 80, height: 24, borderRadius: 12 }} />
        </div>
      ))}
    </div>
  );
}
