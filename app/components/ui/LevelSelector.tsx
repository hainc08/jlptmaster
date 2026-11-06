"use client";

import React from "react";
import { Lock } from "lucide-react";
import { JLPT_LEVELS } from "../nav-config";

/**
 * JLPT level chips. Only N5 has content; N4–N1 are visibly locked ("Sắp ra mắt") and inert for
 * mouse and keyboard. They stay focusable so screen-reader users hear why they are unavailable.
 */
export function LevelSelector({
  value = "N5",
  onSelect,
}: {
  value?: "N5";
  onSelect?: (code: "N5") => void;
}) {
  return (
    <div role="group" aria-label="Cấp độ JLPT" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
      {JLPT_LEVELS.map((lvl) =>
        lvl.active ? (
          <button
            key={lvl.code}
            type="button"
            aria-pressed={value === lvl.code}
            onClick={() => onSelect?.("N5")}
            className="flex-none min-h-12 px-4 rounded-xl border border-primary bg-primary-container text-on-primary-container font-bold text-sm"
          >
            {lvl.code}
          </button>
        ) : (
          <button
            key={lvl.code}
            type="button"
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.preventDefault();
            }}
            className="flex-none min-h-12 px-3 rounded-xl border border-dashed border-border text-locked text-left cursor-not-allowed flex items-center gap-2"
          >
            <Lock size={14} aria-hidden="true" />
            <span className="flex flex-col leading-tight">
              <span className="font-bold text-sm">{lvl.code}</span>
              <span className="text-[11px] whitespace-nowrap">Sắp ra mắt</span>
            </span>
          </button>
        )
      )}
    </div>
  );
}
