"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface FuriganaContextType {
  showFurigana: boolean;
  toggleFurigana: () => void;
}

const FuriganaContext = createContext<FuriganaContextType>({
  showFurigana: true,
  toggleFurigana: () => {},
});

export function FuriganaProvider({ children }: { children: React.ReactNode }) {
  const [showFurigana, setShowFurigana] = useState(true);

  return (
    <FuriganaContext.Provider value={{ showFurigana, toggleFurigana: () => setShowFurigana(!showFurigana) }}>
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
