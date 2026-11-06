"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface FuriganaContextType {
  showFurigana: boolean;
  setFurigana: (on: boolean) => void;
  toggleFurigana: () => void;
}

const FuriganaContext = createContext<FuriganaContextType>({
  showFurigana: true,
  setFurigana: () => {},
  toggleFurigana: () => {},
});

const STORAGE_KEY = "jlpt.furigana";

/**
 * Furigana on/off for the whole app. The first render uses `initial` (default on) so server and
 * client markup match; the stored choice is read after mount. Storage may be blocked (private
 * mode), so every access is guarded and the in-memory value still works.
 */
export function FuriganaProvider({ children, initial }: { children: React.ReactNode; initial?: boolean }) {
  const [showFurigana, setShowFurigana] = useState(initial ?? true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "0" || stored === "1") setShowFurigana(stored === "1");
    } catch {
      // storage unavailable: keep the default
    }
  }, []);

  const setFurigana = (on: boolean) => {
    setShowFurigana(on);
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      // storage unavailable: the choice lasts for this page only
    }
  };

  return (
    <FuriganaContext.Provider
      value={{ showFurigana, setFurigana, toggleFurigana: () => setFurigana(!showFurigana) }}
    >
      <div className={showFurigana ? "" : "furigana-hidden"}>{children}</div>
    </FuriganaContext.Provider>
  );
}

export function useFurigana() {
  return useContext(FuriganaContext);
}

export function RubyText({
  kanji,
  reading,
  className = "",
}: {
  kanji: string;
  reading?: string;
  className?: string;
}) {
  if (!reading || reading === kanji) {
    return <span className={`font-japanese ${className}`}>{kanji}</span>;
  }

  return (
    <ruby className={`font-japanese ${className}`}>
      {kanji}
      <rp>(</rp>
      <rt>{reading}</rt>
      <rp>)</rp>
    </ruby>
  );
}
