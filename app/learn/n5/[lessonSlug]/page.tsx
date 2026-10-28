"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_LESSONS, MOCK_VOCAB, MOCK_GRAMMAR } from "../../../fixtures/n5-curriculum";
import { RubyText, useFurigana } from "../../../components/RubyText";
import { AudioButton } from "../../../components/AudioButton";
import { LearningToolbar } from "../../../components/LearningToolbar";
import { MockBadge } from "../../../components/MockBadge";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Volume2,
  Sparkles,
  HelpCircle,
} from "lucide-react";

function LessonContent() {
  const params = useParams();
  const slug = (params?.lessonSlug as string) || "bai-03-danh-tu-va-tro-tu-wa-desu";
  const { showFurigana, toggleFurigana } = useFurigana();

  const [activeTab, setActiveTab] = useState<"THEORY" | "VOCAB" | "KANA">("THEORY");
  const [completedState, setCompletedState] = useState(false);

  const lesson = MOCK_LESSONS.find((l) => l.slug === slug) || MOCK_LESSONS[2];
  const isKanaLesson = slug === "bai-01-kana-nhap-mon";

  const hiraganaTable = [
    { kana: "あ", ro: "a" }, { kana: "い", ro: "i" }, { kana: "う", ro: "u" }, { kana: "え", ro: "e" }, { kana: "お", ro: "o" },
    { kana: "か", ro: "ka" }, { kana: "き", ro: "ki" }, { kana: "く", ro: "ku" }, { kana: "け", ro: "ke" }, { kana: "こ", ro: "ko" },
    { kana: "さ", ro: "sa" }, { kana: "し", ro: "shi" }, { kana: "す", ro: "su" }, { kana: "せ", ro: "se" }, { kana: "そ", ro: "so" },
    { kana: "た", ro: "ta" }, { kana: "ち", ro: "chi" }, { kana: "つ", ro: "tsu" }, { kana: "て", ro: "te" }, { kana: "と", ro: "to" },
    { kana: "な", ro: "na" }, { kana: "に", ro: "ni" }, { kana: "ぬ", ro: "nu" }, { kana: "ね", ro: "ne" }, { kana: "の", ro: "no" },
    { kana: "は", ro: "ha" }, { kana: "ひ", ro: "hi" }, { kana: "ふ", ro: "fu" }, { kana: "へ", ro: "he" }, { kana: "ほ", ro: "ho" },
    { kana: "ま", ro: "ma" }, { kana: "み", ro: "mi" }, { kana: "む", ro: "mu" }, { kana: "め", ro: "me" }, { kana: "mo", ro: "mo" },
    { kana: "や", ro: "ya" }, { kana: "ゆ", ro: "yu" }, { kana: "よ", ro: "yo" },
    { kana: "ら", ro: "ra" }, { kana: "り", ro: "ri" }, { kana: "る", ro: "ru" }, { kana: "れ", ro: "re" }, { kana: "ろ", ro: "ro" },
    { kana: "わ", ro: "wa" }, { kana: "を", ro: "wo" }, { kana: "ん", ro: "n" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <LearningToolbar title="Tùy chọn hiển thị Bài học N5" />
      {/* Top Breadcrumb & Furigana switch */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/learn/n5"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#B9343F] transition-colors"
        >
          <ChevronLeft size={16} />
          Lộ trình N5
        </Link>
        <MockBadge label="BÀI HỌC TƯƠNG TÁC" />
      </div>

      {/* Lesson Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold uppercase bg-red-100 text-[#B9343F] px-2.5 py-0.5 rounded-full">
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "THEORY"
                ? "bg-[#B9343F] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Lý thuyết trọng tâm
          </button>
          <button
            onClick={() => setActiveTab("VOCAB")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "VOCAB"
                ? "bg-[#B9343F] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Từ vựng trong bài ({MOCK_VOCAB.length})
          </button>
          {isKanaLesson && (
            <button
              onClick={() => setActiveTab("KANA")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "KANA"
                  ? "bg-[#B9343F] text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bảng chữ cái Hiragana
            </button>
          )}
        </div>
      </div>

      {/* Tab: Theory & Grammar */}
      {activeTab === "THEORY" && (
        <div className="space-y-6">
          {/* Grammar Point 1 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2B4C7E] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Mẫu câu 01
              </span>
              <span className="text-xs text-gray-500">Khẳng định cơ bản</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              [ Danh từ 1 ] は [ Danh từ 2 ] です。(N1 wa N2 desu)
            </h2>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1 text-sm">
              <span className="font-bold text-amber-950 block">Ý nghĩa & Cách dùng:</span>
              <p className="text-amber-900 leading-relaxed">
                Biểu thị ý nghĩa: <strong>"Danh từ 1 là Danh từ 2"</strong>. Trợ từ <strong>は</strong> (đọc là <em>wa</em>, không đọc là <em>ha</em>) dùng để đánh dấu chủ ngữ/chủ đề được nói đến.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Câu ví dụ thực tế:
              </h3>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-gray-900">
                    <RubyText kanji="わたし" reading="" /> は{" "}
                    <RubyText kanji="学生" reading="がくせい" /> です。
                  </div>
                  <p className="text-xs text-gray-500 italic">Watashi wa gakusei desu.</p>
                  <p className="text-sm font-medium text-emerald-800">Nghĩa: Tôi là học sinh / sinh viên.</p>
                </div>
                <AudioButton textToSpeak="わたしは学生です" />
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-gray-900">
                    <RubyText kanji="田中" reading="たなか" /> さん は{" "}
                    <RubyText kanji="先生" reading="せんせい" /> です。
                  </div>
                  <p className="text-xs text-gray-500 italic">Tanaka-san wa sensei desu.</p>
                  <p className="text-sm font-medium text-emerald-800">Nghĩa: Anh Tanaka là giáo viên.</p>
                </div>
                <AudioButton textToSpeak="田中さんは先生です" />
              </div>
            </div>
          </div>

          {/* Grammar Point 2 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2B4C7E] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Mẫu câu 02
              </span>
              <span className="text-xs text-gray-500">Phủ định lịch sự</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              [ N1 ] は [ N2 ] ではありません / じゃありません。
            </h2>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1 text-sm">
              <span className="font-bold text-amber-950 block">Ý nghĩa & Cách dùng:</span>
              <p className="text-amber-900 leading-relaxed">
                Biểu thị ý nghĩa: <strong>"N1 không phải là N2"</strong>. Trong văn viết trang trọng ta dùng <em>ではありません (dewa arimasen)</em>, trong đàm thoại hàng ngày dùng <em>じゃありません (ja arimasen)</em>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-900">
                  <RubyText kanji="山田" reading="やまだ" /> さん は{" "}
                  <RubyText kanji="医者" reading="いしゃ" /> ではありません。
                </div>
                <p className="text-xs text-gray-500 italic">Yamada-san wa isha dewa arimasen.</p>
                <p className="text-sm font-medium text-emerald-800">Nghĩa: Anh Yamada không phải là bác sĩ.</p>
              </div>
              <AudioButton textToSpeak="山田さんは医者ではありません" />
            </div>
          </div>
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
                className="p-3 rounded-xl border border-gray-200 text-center bg-[#F7F7F4] flex flex-col items-center justify-center hover:border-red-300 transition-all"
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
            Làm bài trắc nghiệm 5 câu để kiểm tra khả năng ghi nhớ và ghi nhận hoàn thành bài học.
          </p>
        </div>

        <Link
          href="/practice"
          className="px-6 py-3.5 rounded-2xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs shadow-md flex items-center gap-2 whitespace-nowrap transition-all"
        >
          Luyện tập 5 câu hỏi bài này
          <ArrowRight size={16} />
        </Link>
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
