"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { MOCK_EXAM_N5_01, ExamQuestion } from "../../fixtures/mock-exam-data";
import { RubyText } from "../../components/RubyText";
import { AudioButton } from "../../components/AudioButton";
import { MockBadge } from "../../components/MockBadge";
import {
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  HelpCircle,
  Menu,
} from "lucide-react";

function ExamRoomContent() {
  const params = useParams();
  const router = useRouter();
  const attemptId = (params?.attemptId as string) || "att-01";

  // Mock a 35-question set based on MOCK_EXAM_N5_01
  const questions: ExamQuestion[] = Array.from({ length: 35 }, (_, idx) => {
    const base = MOCK_EXAM_N5_01[idx % MOCK_EXAM_N5_01.length];
    return {
      ...base,
      id: `q-exam-${idx + 1}`,
      questionNumber: idx + 1,
    };
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes (1200 seconds)
  const [lastSavedText, setLastSavedText] = useState("Vừa khởi tạo bài thi");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const currentQ = questions[currentIndex];

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Debounced autosave simulation
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSavedText(`Đã lưu tự động lúc ${timeStr}`);
      if (typeof window !== "undefined") {
        localStorage.setItem(`jlpt_exam_answers_${attemptId}`, JSON.stringify(answers));
      }
    }
  }, [answers]);

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  const handleFinalSubmit = () => {
    // Record submission
    if (typeof window !== "undefined") {
      localStorage.setItem(`jlpt_exam_finished_${attemptId}`, "true");
    }
    router.push(`/results/${attemptId}`);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Exam Header Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white bg-[#B9343F] px-2.5 py-0.5 rounded-full uppercase">
              JLPT N5
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              Phần 1: Kiến thức ngôn ngữ (Từ vựng - 20 phút)
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Save size={13} className="text-emerald-600" />
            <span>{lastSavedText}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Synchronized Timer */}
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-2xl text-red-900">
            <Clock size={18} className="text-[#B9343F] animate-pulse" />
            <div>
              <span className="text-[10px] text-red-700 font-bold block uppercase leading-none">
                Thời gian còn lại
              </span>
              <span className="text-xl font-mono font-extrabold text-[#B9343F]">
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
          >
            Nộp bài thi
          </button>
        </div>
      </div>

      {/* Main Grid: Question Sheet & Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Question Sheet */}
        <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 flex flex-col justify-between min-h-[460px]">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Câu hỏi {currentQ.questionNumber} / {questions.length}
              </span>
              <span className="text-xs text-[#2B4C7E] font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">
                {currentQ.skillTag}
              </span>
            </div>

            {/* Prompt */}
            <div className="space-y-3">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed font-japanese">
                {currentQ.prompt}
              </p>
              {currentQ.audioKey && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 w-fit">
                  <AudioButton textToSpeak="田中先生はとても優しいです" size={20} />
                  <span className="text-xs text-gray-600 font-medium">Nghe lại đoạn băng câu hỏi</span>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = answers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between touch-target ${
                      isSelected
                        ? "border-[#B9343F] bg-red-50/70 text-[#B9343F] font-bold shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-[#F7F7F4]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold bg-white text-gray-700">
                        {idx + 1}
                      </span>
                      <span className="text-base font-medium">{opt.text}</span>
                    </div>

                    {isSelected && <CheckCircle2 size={18} className="text-[#B9343F]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Question Controls */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-5">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentIndex === 0
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-300 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <ChevronLeft size={16} />
              Câu trước
            </button>

            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              Đã làm: {answeredCount} / {questions.length} câu
            </span>

            <button
              type="button"
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentIndex === questions.length - 1
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-300 hover:bg-gray-50 text-gray-700"
              }`}
            >
              Câu tiếp theo
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Question Palette Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Bảng câu hỏi (Palette)</h3>
            <span className="text-xs font-bold text-[#B9343F]">
              {answeredCount}/{questions.length}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = currentIndex === idx;

              let btnStyle = "bg-gray-100 text-gray-600 hover:bg-gray-200";
              if (isCurrent) {
                btnStyle = "ring-2 ring-[#B9343F] bg-red-100 text-[#B9343F] font-bold";
              } else if (isAnswered) {
                btnStyle = "bg-emerald-600 text-white font-semibold";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`py-2 rounded-xl text-xs transition-all flex items-center justify-center ${btnStyle}`}
                >
                  {q.questionNumber}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600" />
              <span>Đã trả lời ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-300" />
              <span>Chưa làm ({questions.length - answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-red-100 border-2 border-[#B9343F]" />
              <span>Đang chọn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                Xác nhận nộp bài thi?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Bạn đã hoàn thành <strong>{answeredCount}</strong> trên tổng số{" "}
                <strong>{questions.length}</strong> câu hỏi.
                {questions.length - answeredCount > 0 && (
                  <span className="block text-red-600 font-semibold mt-1">
                    Còn {questions.length - answeredCount} câu hỏi bạn chưa chọn đáp án!
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-3 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs shadow-md transition-colors"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimedExamRoomPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-sm text-gray-500">Đang khởi tạo phòng thi...</div>}>
      <ExamRoomContent />
    </Suspense>
  );
}
