"use client";

import React from "react";
import { useFurigana } from "./RubyText";

export interface LearningToolbarProps {
  title?: string;
  subtitle?: string;
}

export function LearningToolbar({
  title = "Chế độ hiển thị nội dung tiếng Nhật",
  subtitle = "Bật hoặc tắt phiên âm Hiragana (Furigana) phía trên chữ Hán",
}: LearningToolbarProps) {
  const { showFurigana, toggleFurigana } = useFurigana();

  return (
    <div
      role="region"
      aria-label="Thanh công cụ học tập"
      className="bg-white px-4 py-3 rounded-xl border border-border shadow-sm flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <p className="text-xs font-bold text-foreground">{title}</p>
        <p className="text-[11px] text-muted">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={toggleFurigana}
        aria-pressed={showFurigana}
        className={`min-h-[44px] px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          showFurigana
            ? "bg-primary-subtle text-primary border-primary/30"
            : "bg-background text-muted border-border"
        }`}
      >
        <span
          className="font-bold text-sm"
          style={{ fontFamily: "var(--font-japanese), sans-serif" }}
        >
          振
        </span>
        <span>Furigana: {showFurigana ? "ĐANG BẬT" : "ĐANG TẮT"}</span>
      </button>
    </div>
  );
}

