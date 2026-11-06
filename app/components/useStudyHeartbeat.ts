"use client";

import { useEffect } from "react";

/** Records one study minute every 60 s while the tab is visible (lesson and exam screens). */
export function useStudyHeartbeat(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/v1/progress/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: 1 }),
        keepalive: true,
      }).catch(() => {});
    }, 60_000);
    return () => window.clearInterval(id);
  }, [enabled]);
}
