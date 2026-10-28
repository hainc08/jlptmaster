"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MOCK_SRS_CARDS, SrsCard } from "../fixtures/srs-cards";
import { RubyText } from "../components/RubyText";
import { AudioButton } from "../components/AudioButton";
import {
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
  HelpCircle,
  Volume2,
} from "lucide-react";

export default function FlashcardsReviewPage() {
  const [cards, setCards] = useState<SrsCard[]>(MOCK_SRS_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/v1/reviews/due?limit=20")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!ignore && Array.isArray(json?.data) && json.data.length > 0) {
          const mapped: SrsCard[] = json.data
            .filter((item: any) => item.contentItem?.vocabulary)
            .map((item: any, idx: number) => {
              const v = item.contentItem.vocabulary;
              return {
                id: item.id,
                frontKanji: v.surface,
                frontReading: v.reading,
                romaji: v.searchNormalized?.split(" ")[0] || "",
                meaningVi: v.meaningVi,
                exampleJa: v.exampleJa || `${v.surface} は大切です。`,
                exampleVi: v.exampleVi || `${v.meaningVi} rất quan trọng.`,
                intervalText: idx === 0 ? "Đến hạn hôm nay" : "Ôn tập N5",
              };
            });
          if (mapped.length > 0) {
            setCards(mapped);
          }
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleGrade = (grade: "AGAIN" | "HARD" | "GOOD" | "EASY") => {
    const ratingMap = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 } as const;
    if (currentCard?.id) {
      fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewCardId: currentCard.id,
          rating: ratingMap[grade],
          idempotencyKey: `srs-${currentCard.id}-${Date.now()}`,
        }),
      }).catch(() => {});
    }

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setIsCompleted(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("jlpt_srs_reviewed_today", "true");
      }
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleGrade("AGAIN");
        if (e.key === "2") handleGrade("HARD");
        if (e.key === "3") handleGrade("GOOD");
        if (e.key === "4") handleGrade("EASY");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, currentIndex, isCompleted]);

  if (isCompleted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Xuất sắc! Đã hoàn thành phiên ôn tập hôm nay 🎉
          </h1>
          <p className="text-sm text-gray-600">
            Bạn đã ôn tập toàn bộ {cards.length} thẻ nhớ SRS đến hạn. Thuật toán đã tính toán lịch ôn tập tiếp theo cho bạn.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm max-w-sm mx-auto text-xs text-gray-600">
          <span className="font-bold text-gray-900 block mb-1">Cập nhật chỉ số SRS:</span>
          <span>Hàng đợi hôm nay: <strong>0 thẻ</strong> • Chuỗi streak: <strong>5 ngày</strong></span>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs shadow-md transition-all"
          >
            Quay lại Bảng điều khiển
          </Link>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
              setIsCompleted(false);
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all"
          >
            Ôn tập lại từ đầu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#B9343F] transition-colors"
        >
          <ChevronLeft size={16} />
          Bảng điều khiển
        </Link>
        <span className="text-xs font-semibold text-[#B9343F] bg-[#FBEBEB] px-3 py-1 rounded-full">
          Thuật toán SRS 4 mức độ
        </span>
        <span className="text-xs font-bold text-gray-500">
          Thẻ {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#B9343F] transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* 3D Flashcard Container */}
      <div
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label="Nhấn để lật thẻ flashcard"
        className="w-full min-h-[340px] sm:min-h-[380px] bg-white rounded-3xl border-2 border-gray-200 hover:border-red-300 shadow-xl cursor-pointer p-8 flex flex-col items-center justify-between text-center select-none transition-all relative overflow-hidden group"
      >
        <div className="w-full flex items-center justify-between text-xs text-gray-400">
          <span className="font-semibold uppercase tracking-wider bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
            {currentCard.kind}
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <RotateCcw size={12} />
            {isFlipped ? "Đang xem mặt sau" : "Nhấn Space hoặc chạm để lật"}
          </span>
        </div>

        {/* Front Side */}
        {!isFlipped ? (
          <div className="my-auto space-y-4">
            <span className="text-5xl sm:text-6xl font-extrabold text-gray-900 font-japanese block">
              {currentCard.frontText}
            </span>
            <div className="flex items-center justify-center gap-2">
              <AudioButton textToSpeak={currentCard.frontText} size={22} />
              <span className="text-xs text-gray-500 font-medium">Nghe phát âm</span>
            </div>
            <p className="text-xs text-gray-400 pt-2">
              (Chạm vào thẻ để xem phiên âm Hán-Việt & nghĩa)
            </p>
          </div>
        ) : (
          /* Back Side */
          <div className="my-auto space-y-4 animate-in fade-in duration-200">
            <span className="text-4xl font-extrabold text-gray-900 font-japanese block">
              <RubyText kanji={currentCard.frontText} reading={currentCard.frontReading} />
            </span>
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">
                ÂM HÁN-VIỆT: {currentCard.hanViet}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-emerald-800">
                {currentCard.backMeaningVi}
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-left max-w-md mx-auto space-y-1">
              <span className="font-bold text-gray-500 block">Ví dụ minh họa:</span>
              <p className="text-gray-900 font-japanese font-medium">{currentCard.exampleJa}</p>
              <p className="text-gray-600 italic">{currentCard.exampleVi}</p>
            </div>
          </div>
        )}

        <div className="w-full text-[11px] text-gray-400">
          {isFlipped
            ? "Hãy chọn mức độ ghi nhớ phía dưới để lên lịch ôn tập:"
            : "Chưa lật thẻ — Kiểm tra trí nhớ của bạn trước khi xem đáp án"}
        </div>
      </div>

      {/* 4 Recall Grading Buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleGrade("AGAIN")}
            className="p-3.5 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-900 text-center transition-all flex flex-col items-center justify-center"
          >
            <span className="text-xs font-bold">1 - Chưa nhớ</span>
            <span className="text-[10px] text-red-600 font-semibold mt-0.5">+10 phút</span>
          </button>

          <button
            type="button"
            onClick={() => handleGrade("HARD")}
            className="p-3.5 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-center transition-all flex flex-col items-center justify-center"
          >
            <span className="text-xs font-bold">2 - Khó nhớ</span>
            <span className="text-[10px] text-amber-700 font-semibold mt-0.5">+1 ngày</span>
          </button>

          <button
            type="button"
            onClick={() => handleGrade("GOOD")}
            className="p-3.5 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-center transition-all flex flex-col items-center justify-center"
          >
            <span className="text-xs font-bold">3 - Nhớ tốt</span>
            <span className="text-[10px] text-blue-700 font-semibold mt-0.5">+3 ngày</span>
          </button>

          <button
            type="button"
            onClick={() => handleGrade("EASY")}
            className="p-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-center transition-all flex flex-col items-center justify-center"
          >
            <span className="text-xs font-bold">4 - Rất dễ</span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5">+7 ngày</span>
          </button>
        </div>
        <p className="text-[11px] text-gray-400 text-center">
          Mẹo phím tắt: Nhấn phím <strong>Space</strong> để lật thẻ • Nhấn các phím <strong>1, 2, 3, 4</strong> để đánh giá nhanh.
        </p>
      </div>
    </div>
  );
}
