"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface PracticeQuestion {
  id: string;
  prompt: string;
  skillTag: string;
  options: QuestionOption[];
}

export interface SubmissionResponse {
  isCorrect: boolean;
  correctOptionId: string;
  explanationVi: string;
}

export default function PracticeQuizPage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch("/api/v1/practice/questions");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Lỗi khi tải câu hỏi luyện tập`);
        }
        const json = await res.json();
        if (!ignore) {
          setQuestions(json.data || []);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể kết nối đến máy chủ MariaDB để lấy câu hỏi");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [reloadCount]);

  const currentQ = questions[currentIndex];
  const isSubmitted = !!submissionResult;
  const isFinished = isSubmitted && currentIndex === questions.length - 1;

  const handleSubmit = async () => {
    if (!selectedOptionId || !currentQ || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/practice/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          selectedOptionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Không thể gửi đáp án chấm điểm`);
      }

      const result: SubmissionResponse = await res.json();
      setSubmissionResult(result);

      if (result.isCorrect) {
        setScore((prev) => prev + 1);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi chấm điểm câu hỏi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setSubmissionResult(null);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setSubmissionResult(null);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B9343F]" />
        <p className="text-sm font-semibold text-gray-700">Đang tải câu hỏi luyện tập từ MariaDB...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-red-600" />
          <h2 className="text-base font-bold text-red-900">Không thể tải bộ câu hỏi</h2>
          <p className="text-xs text-red-700">{error}</p>
          <button
            onClick={() => setReloadCount((c) => c + 1)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-base font-semibold text-gray-700">Chưa có câu hỏi luyện tập khả dụng.</p>
        <Link href="/dashboard" className="text-xs text-[#B9343F] underline">
          Quay lại Bảng điều khiển
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#B9343F] transition-colors"
        >
          <ChevronLeft size={16} />
          Bảng điều khiển
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          CHẤM ĐIỂM SERVER MARIADB
        </span>
        <span className="text-xs font-bold text-gray-500">
          Câu {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#B9343F] transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Error alert if submit failed */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#B9343F] uppercase tracking-wider bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
            {currentQ.skillTag}
          </span>
          <span className="text-xs text-gray-400 font-medium">JLPT N5</span>
        </div>

        {/* Prompt */}
        <div className="space-y-2 py-2">
          <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">
            Đề bài:
          </span>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed font-japanese">
            {currentQ.prompt}
          </p>
        </div>

        {/* 4 Choices */}
        <div className="space-y-2.5">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOptionId === opt.id;
            let optionStyle = "border-gray-200 hover:border-gray-300 bg-[#F7F7F4]";

            if (isSubmitted) {
              if (opt.id === submissionResult?.correctOptionId) {
                optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold";
              } else if (isSelected) {
                optionStyle = "border-red-400 bg-red-50 text-red-950 line-through";
              } else {
                optionStyle = "border-gray-200 opacity-50";
              }
            } else if (isSelected) {
              optionStyle = "border-[#B9343F] bg-red-50/70 text-[#B9343F] font-bold shadow-sm";
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isSubmitted || isSubmitting}
                onClick={() => setSelectedOptionId(opt.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between touch-target ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-700 bg-white">
                    {idx + 1}
                  </span>
                  <span className="text-base font-medium">{opt.text}</span>
                </div>

                {isSubmitted && opt.id === submissionResult?.correctOptionId && (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                )}
                {isSubmitted && isSelected && !submissionResult?.isCorrect && (
                  <XCircle size={18} className="text-red-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        {!isSubmitted ? (
          <button
            type="button"
            disabled={!selectedOptionId || isSubmitting}
            onClick={handleSubmit}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              selectedOptionId && !isSubmitting
                ? "bg-[#B9343F] hover:bg-[#A02731] text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang chấm điểm...
              </>
            ) : (
              "Kiểm tra đáp án"
            )}
          </button>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Post-Submit Explanation Drawer */}
            <div
              className={`p-5 rounded-2xl border space-y-2 text-sm ${
                submissionResult?.isCorrect
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  : "bg-red-50/80 border-red-200 text-red-950"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-base">
                {submissionResult?.isCorrect ? (
                  <>
                    <CheckCircle2 size={20} className="text-emerald-700" />
                    <span>Chính xác! Làm rất tốt.</span>
                  </>
                ) : (
                  <>
                    <XCircle size={20} className="text-red-600" />
                    <span>Chưa chính xác! Hãy xem kỹ giải thích bên dưới:</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed text-xs sm:text-sm text-gray-800">
                {submissionResult?.explanationVi}
              </p>
            </div>

            {/* Next or Finish Button */}
            {!isFinished ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 rounded-2xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                Chuyển sang câu tiếp theo
                <ArrowRight size={16} />
              </button>
            ) : (
              <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center space-y-3">
                <span className="text-2xl font-extrabold text-[#B9343F] block">
                  Đã hoàn thành! {score} / {questions.length} câu đúng
                </span>
                <p className="text-xs text-gray-600">
                  Bạn đã hoàn thành phiên luyện tập với đề thi được chấm thực tế trên MariaDB.
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    Làm lại từ đầu
                  </button>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 rounded-xl bg-[#B9343F] text-white text-xs font-semibold hover:bg-[#A02731]"
                  >
                    Về Bảng điều khiển
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
