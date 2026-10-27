"use client";

import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function AudioButton({
  textToSpeak,
  className = "",
  size = 18,
}: {
  textToSpeak: string;
  className?: string;
  size?: number;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert(`Phát âm mô phỏng: ${textToSpeak}`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      aria-label={`Nghe phát âm: ${textToSpeak}`}
      title={`Nghe phát âm tiếng Nhật`}
      className={`p-2 rounded-full hover:bg-red-50 text-[#B9343F] transition-colors touch-target inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#B9343F] ${className}`}
    >
      {isPlaying ? (
        <VolumeX size={size} className="animate-pulse" />
      ) : (
        <Volume2 size={size} />
      )}
    </button>
  );
}
