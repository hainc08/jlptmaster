import React from "react";

/** Minutes studied per day this week. `null` = a day that has not come yet (dashed bar). */
export function WeekBars({
  days,
  todayIndex,
  height = 96,
}: {
  days: { label: string; minutes: number | null }[];
  todayIndex: number;
  height?: number;
}) {
  const peak = Math.max(1, ...days.map((d) => d.minutes ?? 0));
  const label = days
    .map((d) => `${d.label}: ${d.minutes === null ? "chưa tới" : `${d.minutes} phút`}`)
    .join(", ");
  return (
    <div role="img" aria-label={label} className="grid grid-cols-7 gap-2 items-end" style={{ height: height + 24 }}>
      {days.map((d, i) => {
        const h = d.minutes === null ? height : Math.max(4, Math.round((d.minutes / peak) * height));
        return (
          <div key={d.label} aria-hidden="true" className="flex flex-col items-center gap-1.5">
            {d.minutes === null ? (
              <div data-future className="w-full rounded-lg border-2 border-dashed border-border" style={{ height: h }} />
            ) : (
              <div
                className={`w-full rounded-lg ${i === todayIndex ? "bg-accent" : "bg-primary"}`}
                style={{ height: h }}
              />
            )}
            <span className={`text-xs ${i === todayIndex ? "font-bold text-foreground" : "text-muted"}`}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
