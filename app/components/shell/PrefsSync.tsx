"use client";

import { useEffect } from "react";
import { writeStoredValue } from "../stored-value";

/**
 * Applies the furigana and language choices saved on the account to a device that has no local
 * choice yet (e.g. a new phone). A local choice always wins; signed-out visitors are skipped.
 */
let synced = false;

export function PrefsSync() {
  useEffect(() => {
    // Once per page session: a later remount must not overwrite a choice made since then.
    if (synced) return;
    synced = true;
    fetch("/api/v1/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const d = json?.data;
        if (!d) return;
        let furi: string | null = null;
        let lang: string | null = null;
        try {
          furi = window.localStorage.getItem("jlpt.furigana");
          lang = window.localStorage.getItem("jlpt.locale");
        } catch {}
        if (furi === null && typeof d.furiganaDefault === "boolean") writeStoredValue("jlpt.furigana", d.furiganaDefault ? "1" : "0");
        if (lang === null && (d.uiLanguage === "vi" || d.uiLanguage === "en")) writeStoredValue("jlpt.locale", d.uiLanguage);
      })
      .catch(() => {});
  }, []);
  return null;
}
