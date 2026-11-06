"use client";

import React, { useEffect, useRef, useState } from "react";
import { Headphones, Loader2 } from "lucide-react";

const SPEAKER_RE = /(?:おんなの ひと|おとこの ひと|おんなのひと|おとこのひと)：/;

/** Split "おんなの ひと：A おとこの ひと：B" into [{female?, text}] lines without the speaker labels. */
export function parseDialogue(script: string): { text: string; pitch: number }[] {
  const parts = script.split(/\s+(?=(?:おんなの ?ひと|おとこの ?ひと)：)/).filter((p) => p.trim());
  return parts.map((part) => {
    const isFemale = /^おんなの ?ひと：/.test(part.trim());
    const isMale = /^おとこの ?ひと：/.test(part.trim());
    return {
      text: part.replace(SPEAKER_RE, "").trim(),
      pitch: isFemale ? 1.25 : isMale ? 0.8 : 1,
    };
  });
}

/**
 * Plays a listening item with the browser's speech synthesis (no audio file exists yet).
 * The script is NEVER rendered on screen, and plays are limited like the real exam (2 times).
 */
export function ListeningPlayer({
  trackId,
  text,
  maxPlays = 2,
}: {
  trackId: string;
  text: string;
  maxPlays?: number;
}) {
  const [playsUsed, setPlaysUsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const cancelled = useRef(false);

  const supported =
    typeof window !== "undefined" &&
    Boolean((window as unknown as { speechSynthesis?: unknown }).speechSynthesis) &&
    typeof (globalThis as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance === "function";

  // Reset when moving to another listening item; stop speech on unmount.
  useEffect(() => {
    setPlaysUsed(0);
    setPlaying(false);
    return () => {
      cancelled.current = true;
      if (typeof window !== "undefined") window.speechSynthesis?.cancel?.();
    };
  }, [trackId]);

  const play = () => {
    if (!supported || playing || playsUsed >= maxPlays) return;
    cancelled.current = false;
    const lines = parseDialogue(text);
    setPlaying(true);

    const finish = () => {
      setPlaying(false);
      setPlaysUsed((n) => n + 1);
    };

    const speakAt = (i: number) => {
      if (cancelled.current) return;
      if (i >= lines.length) {
        finish();
        return;
      }
      const u = new SpeechSynthesisUtterance(lines[i].text);
      u.lang = "ja-JP";
      u.rate = 0.85;
      u.pitch = lines[i].pitch;
      u.onend = () => speakAt(i + 1);
      u.onerror = () => finish();
      window.speechSynthesis.speak(u);
    };

    window.speechSynthesis.cancel();
    speakAt(0);
  };

  const remaining = Math.max(0, maxPlays - playsUsed);

  if (!supported) {
    return (
      <p role="alert" className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
        Trình duyệt của bạn không hỗ trợ phát âm thanh bài nghe. Hãy dùng Chrome, Edge hoặc Safari bản mới.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
      <button
        type="button"
        onClick={play}
        disabled={playing || remaining === 0}
        aria-label="Nghe bài hội thoại"
        className="px-4 py-2.5 rounded-xl bg-[#2B4C7E] hover:bg-[#223d66] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
      >
        {playing ? <Loader2 size={16} className="animate-spin" /> : <Headphones size={16} />}
        {playing ? "Đang phát..." : "Nghe"}
      </button>
      <span className="text-xs text-gray-600" aria-live="polite">
        {remaining > 0 ? `Còn ${remaining} lượt nghe` : "Đã hết lượt nghe"}
      </span>
    </div>
  );
}
