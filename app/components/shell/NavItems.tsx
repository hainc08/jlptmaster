"use client";

import React from "react";
import { Home, BookOpen, ClipboardCheck, UserRound } from "lucide-react";
import type { TabId } from "../nav-config";

/** Tab icon. Kanji uses the glyph 字 as in the design review. */
export function TabIcon({ id, size = 22 }: { id: TabId; size?: number }) {
  switch (id) {
    case "home":
      return <Home size={size} aria-hidden="true" />;
    case "learn":
      return <BookOpen size={size} aria-hidden="true" />;
    case "test":
      return <ClipboardCheck size={size} aria-hidden="true" />;
    case "kanji":
      return (
        <span aria-hidden="true" className="font-japanese font-bold text-lg leading-6 w-6 text-center">
          字
        </span>
      );
    case "profile":
      return <UserRound size={size} aria-hidden="true" />;
  }
}

export function Logo() {
  return (
    <span
      aria-hidden="true"
      className="relative grid place-items-center w-8 h-8 rounded-[9px] bg-primary text-white font-japanese font-bold flex-none"
    >
      日
      <span className="absolute -right-[3px] -bottom-[3px] w-[11px] h-[11px] rounded-full bg-accent border-2 border-surface" />
    </span>
  );
}
