"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_LESSONS, MOCK_VOCAB, MOCK_GRAMMAR } from "../../../fixtures/n5-curriculum";
import { RubyText, useFurigana } from "../../../components/RubyText";
import { AudioButton } from "../../../components/AudioButton";
import { LearningToolbar } from "../../../components/LearningToolbar";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";

function LessonContent() {
  const params = useParams();
  const slug = (params?.lessonSlug as string) || "bai-03-danh-tu-va-tro-tu-wa-desu";
  const { showFurigana, toggleFurigana } = useFurigana();

  const [activeTab, setActiveTab] = useState<"THEORY" | "VOCAB" | "KANA">("THEORY");
  const [isCompleted, setIsCompleted] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  const lesson = MOCK_LESSONS.find((l) => l.slug === slug) || MOCK_LESSONS[2];
  const isKanaLesson = slug === "bai-01-kana-nhap-mon";

  // Check if lesson was already completed in localStorage or API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`jlpt_lesson_completed_${slug}`);
      if (saved === "true") {
        setIsCompleted(true);
      }
    }
  }, [slug]);

  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    try {
      const res = await fetch(`/api/v1/lessons/${slug}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (res.ok) {
        setIsCompleted(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(`jlpt_lesson_completed_${slug}`, "true");
        }
      } else {
        window.alert("Không lưu được tiến độ bài học. Vui lòng thử lại.");
      }
    } catch {
      window.alert("Lỗi kết nối: chưa lưu được tiến độ bài học.");
    } finally {
      setMarkingComplete(false);
    }
  };

  const hiraganaTable = [
    { kana: "あ", ro: "a" }, { kana: "い", ro: "i" }, { kana: "う", ro: "u" }, { kana: "え", ro: "e" }, { kana: "お", ro: "o" },
    { kana: "か", ro: "ka" }, { kana: "き", ro: "ki" }, { kana: "く", ro: "ku" }, { kana: "け", ro: "ke" }, { kana: "こ", ro: "ko" },
    { kana: "さ", ro: "sa" }, { kana: "し", ro: "shi" }, { kana: "す", ro: "su" }, { kana: "せ", ro: "se" }, { kana: "そ", ro: "so" },
    { kana: "た", ro: "ta" }, { kana: "ち", ro: "chi" }, { kana: "つ", ro: "tsu" }, { kana: "て", ro: "te" }, { kana: "と", ro: "to" },
    { kana: "な", ro: "na" }, { kana: "に", ro: "ni" }, { kana: "ぬ", ro: "nu" }, { kana: "ね", ro: "ne" }, { kana: "の", ro: "no" },
    { kana: "は", ro: "ha" }, { kana: "ひ", ro: "hi" }, { kana: "ふ", ro: "fu" }, { kana: "へ", ro: "he" }, { kana: "ほ", ro: "ho" },
    { kana: "ま", ro: "ma" }, { kana: "み", ro: "mi" }, { kana: "む", ro: "mu" }, { kana: "め", ro: "me" }, { kana: "も", ro: "mo" },
    { kana: "や", ro: "ya" }, { kana: "ゆ", ro: "yu" }, { kana: "よ", ro: "yo" },
    { kana: "ら", ro: "ra" }, { kana: "り", ro: "ri" }, { kana: "る", ro: "ru" }, { kana: "れ", ro: "re" }, { kana: "ろ", ro: "ro" },
    { kana: "わ", ro: "wa" }, { kana: "を", ro: "wo" }, { kana: "ん", ro: "n" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <LearningToolbar title="Tùy chọn hiển thị Bài học N5" />
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/learn/n5"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          Lộ trình N5
        </Link>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={13} />
              Đã hoàn thành bài học
            </span>
          )}
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Bài giảng chuẩn JLPT N5
          </span>
        </div>
      </div>

      {/* Lesson Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold uppercase bg-red-100 text-primary px-2.5 py-0.5 rounded-full">
            Bài 0{lesson.order}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            Thời lượng dự tính: {lesson.estimatedMinutes} phút
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {lesson.titleVi}
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">{lesson.descriptionVi}</p>

        {/* Navigation Tabs */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setActiveTab("THEORY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "THEORY"
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Lý thuyết trọng tâm
          </button>
          <button
            onClick={() => setActiveTab("VOCAB")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "VOCAB"
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Từ vựng trong bài ({MOCK_VOCAB.length})
          </button>
          {isKanaLesson && (
            <button
              onClick={() => setActiveTab("KANA")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "KANA"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bảng chữ cái Hiragana (46)
            </button>
          )}
        </div>
      </div>

      {/* Tab: Theory & Grammar Points */}
      {activeTab === "THEORY" && (
        <div className="space-y-6">
          {MOCK_GRAMMAR.map((g, idx) => (
            <div
              key={g.id}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Mẫu câu 0{idx + 1}
                </span>
                <span className="text-xs text-gray-500">{g.formation}</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900">{g.pattern}</h2>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1 text-sm">
                <span className="font-bold text-amber-950 block">Ý nghĩa & Cách dùng:</span>
                <p className="text-amber-900 leading-relaxed">{g.meaningVi}</p>
                {g.nuanceVi && (
                  <p className="text-xs text-amber-800 italic mt-1 font-normal">{g.nuanceVi}</p>
                )}
              </div>

              {/* Example with Audio */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Câu ví dụ thực tế:
                </h3>
                <div className="p-3.5 rounded-2xl bg-background border border-gray-100 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-base font-medium text-gray-900 font-japanese">
                      {g.exampleJa}
                    </p>
                    <p className="text-sm font-medium text-emerald-800">{g.exampleVi}</p>
                  </div>
                  <AudioButton textToSpeak={g.exampleJa} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Vocabulary */}
      {activeTab === "VOCAB" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">
            Từ vựng trọng tâm trong bài học
          </h2>
          <div className="divide-y divide-gray-100">
            {MOCK_VOCAB.map((item) => (
              <div key={item.id} className="py-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                      <RubyText kanji={item.kanji} reading={item.reading} />
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                      {item.pos}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-800">{item.meaningVi}</p>
                  <p className="text-xs text-gray-500 italic">{item.exampleJa} — {item.exampleVi}</p>
                </div>
                <AudioButton textToSpeak={item.kanji} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Kana Table */}
      {activeTab === "KANA" && isKanaLesson && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">
            Bảng 46 chữ cái Hiragana cơ bản
          </h2>
          <p className="text-xs text-gray-500">
            Bấm vào từng chữ để nghe phát âm. Hãy luyện tập phát âm đều đặn mỗi ngày.
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {hiraganaTable.map((item) => (
              <div
                key={item.kana}
                className="p-3 rounded-xl border border-gray-200 text-center bg-background flex flex-col items-center justify-center hover:border-red-300 transition-all"
              >
                <span className="text-2xl font-bold font-japanese text-gray-900">{item.kana}</span>
                <span className="text-[10px] text-gray-500 font-medium mt-1">{item.ro}</span>
                <AudioButton textToSpeak={item.kana} size={14} className="mt-1 p-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete & Practice CTA */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-bold text-gray-900">
            Bạn đã sẵn sàng củng cố kiến thức bài học?
          </h3>
          <p className="text-xs text-gray-600">
            Đánh dấu hoàn thành bài học để ghi nhận tiến độ vào hệ thống hoặc làm bài luyện tập trắc nghiệm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isCompleted || markingComplete}
            onClick={handleMarkComplete}
            className={`px-5 py-3 rounded-2xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
              isCompleted
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {markingComplete ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Đang lưu...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-700" />
                Đã hoàn thành bài học
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Đánh dấu hoàn thành
              </>
            )}
          </button>

          <Link
            href="/practice"
            className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer"
          >
            Luyện tập 5 câu hỏi bài này
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LessonDetailPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-12 text-center text-sm text-gray-500">Đang tải bài học...</div>}>
      <LessonContent />
    </Suspense>
  );
}
