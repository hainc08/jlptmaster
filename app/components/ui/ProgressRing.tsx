import React from "react";

/** Circular progress. The arc is clamped to 0–100%; the label carries the real numbers. */
export function ProgressRing({
  value,
  max,
  label,
  tone = "primary",
  size = 96,
  children,
}: {
  value: number;
  max: number;
  label: string;
  tone?: "primary" | "ok";
  size?: number;
  children?: React.ReactNode;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const offset = ratio >= 1 ? 0 : c * (1 - ratio);
  const color = tone === "ok" ? "var(--success-text)" : "var(--primary)";
  return (
    <div role="img" aria-label={label} className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary-container)" strokeWidth={stroke} />
        <circle
          data-arc
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      {children && <div aria-hidden="true" className="absolute inset-0 grid place-items-center text-center">{children}</div>}
    </div>
  );
}
