import React from "react";

export function MockBadge({ label = "PROTOTYPE DEMO — DỮ LIỆU MÔ PHỎNG" }: { label?: string }) {
  return (
    <div className="bg-amber-100 border border-amber-300 text-amber-900 text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      <span>{label}</span>
    </div>
  );
}
