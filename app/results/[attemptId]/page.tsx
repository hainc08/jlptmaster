"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_EXAM_N5_01 } from "../../fixtures/mock-exam-data";
import { MockBadge } from "../../components/MockBadge";
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function ExamResultsContent() {
  const params = useParams();
  const attemptId = (params?.attemptId as string) || "att-01";
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>("q-01");

  const scoreData = {
    totalScore: 142,
    maxScore: 180,
    statusText: "ĐẠT ƯỚC TÍNH (PASS)",
    sections: [
      { name: "Kiến thức ngôn ngữ (Từ vựng & Kanji)", score: 48, max: 60, pct: 80 },
      { name: "Ngữ pháp & Đọc hiểu", score: 52, max: 60, pct: 86 },
      { name: "Nghe hiểu", score: 42, max: 60, pct: 70 },
    ],
    weakSkills: [
      { tag: "Trợ từ De vs Ni", accuracy: "40%", lessonLink: "/learn/n5/bai-05-dong-tu-chuyen-dong-va-thoi-gian", title: "Bài 05: Động từ chuyển động & Thời gian" },
      { tag: "Kính ngữ căn bản", accuracy: "50%", lessonLink: "/learn/n5/bai-03-danh-tu-va-tro-tu-wa-desu", title: "Bài 03: Khẳng định & Phủ định" },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm text-center space-y-4">
        <MockBadge label="KẾT QUẢ ĐÃ CHẤM GIAO DỊCH" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Báo cáo Kết quả Bài thi thử N5 (Số 01)
        </h1>
        <p className="text-xs text-gray-500">Mã lượt thi: {attemptId} • Đã hoàn tất và lưu trữ vĩnh viễn</p>

        {/* Circular Mock Score Display */}
        <div className="my-6 inline-flex flex-col items-center justify-center p-8 rounded-full bg-red-50 border-4 border-[#B9343F] w-48 h-48 mx-auto shadow-inner">
          <span className="text-4xl sm:text-5xl font-extrabold text-[#B9343F]">
            {scoreData.totalScore}
          </span>
          <span className="text-xs font-bold text-gray-500 uppercase mt-0.5">/ {scoreData.maxScore} điểm</span>
          <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full mt-2">
            {scoreData.statusText}
          </span>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 max-w-xl mx-auto text-left flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Tuyên bố minh bạch:</strong> Điểm số 142/180 là điểm ước tính theo chuẩn đánh giá nội bộ của JLPT Master. Đây là công cụ hỗ trợ người học đo lường năng lực, không phải chứng chỉ chính thức của JEES hay Quỹ Giao lưu Quốc tế Nhật Bản.
          </p>
        </div>
      </div>

      {/* Section Scores Breakdown */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Điểm chi tiết theo từng phần thi</h2>
        <div className="space-y-4">
          {scoreData.sections.map((sec) => (
            <div key={sec.name} className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-semibold text-gray-800">
                <span>{sec.name}</span>
                <span className="font-bold text-[#B9343F]">
                  {sec.score} / {sec.max} điểm ({sec.pct}%)
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${sec.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Points Diagnosis (Chẩn đoán điểm yếu) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-[#B9343F] flex items-center justify-center font-bold">
            !
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Chẩn đoán kỹ năng cần cải thiện (Điểm yếu)
            </h2>
            <p className="text-xs text-gray-500">
              Dựa trên các câu trả lời sai trong bài thi vừa hoàn thành
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {scoreData.weakSkills.map((w) => (
            <div
              key={w.tag}
              className="p-4 rounded-2xl bg-red-50/60 border border-red-200 flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-red-200 text-red-900 px-2 py-0.5 rounded-full">
                  Độ chính xác: {w.accuracy}
                </span>
                <h3 className="font-bold text-gray-900 text-base mt-2">{w.tag}</h3>
                <p className="text-xs text-gray-600 mt-1">Cần ôn lại cấu trúc ngữ pháp trong bài học liên quan.</p>
              </div>

              <Link
                href={w.lessonLink}
                className="text-xs font-bold text-[#B9343F] hover:underline flex items-center gap-1 self-start"
              >
                Ôn lại: {w.title}
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Item-by-item Explanation Review Accordion */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Xem lại từng câu hỏi & Phân tích giải thích chi tiết
        </h2>
        <p className="text-xs text-gray-500">
          Toàn bộ đáp án chính xác và lời giải chi tiết tiếng Việt đã được mở khóa.
        </p>

        <div className="space-y-3 pt-2">
          {MOCK_EXAM_N5_01.map((q) => {
            const isExpanded = expandedQuestionId === q.id;
            return (
              <div
                key={q.id}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                  className="w-full p-4 text-left bg-[#F7F7F4] hover:bg-gray-100 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {q.questionNumber}
                    </span>
                    <span className="font-japanese font-bold">{q.prompt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">
                      {q.skillTag}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 bg-white border-t border-gray-200 space-y-3 text-xs sm:text-sm animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <span className="font-bold text-gray-500 text-xs block uppercase">
                        Các lựa chọn:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                              opt.id === q.correctOptionId
                                ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold"
                                : "border-gray-200 text-gray-700 bg-gray-50"
                            }`}
                          >
                            <span>{opt.text}</span>
                            {opt.id === q.correctOptionId && (
                              <span className="text-[10px] text-emerald-700 font-bold uppercase">
                                [ Đáp án đúng ]
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                      <span className="font-bold block text-xs uppercase text-[#2B4C7E]">
                        Giải thích chi tiết tiếng Việt:
                      </span>
                      <p className="leading-relaxed text-xs sm:text-sm text-gray-800">
                        {q.explanationVi}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href="/mock-exams"
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw size={16} />
          Làm đề thi thử khác
        </Link>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs text-center transition-all"
        >
          Quay lại Bảng điều khiển
        </Link>
      </div>
    </div>
  );
}

export default function ExamResultsPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-12 text-center text-sm text-gray-500">Đang tổng hợp kết quả...</div>}>
      <ExamResultsContent />
    </Suspense>
  );
}
