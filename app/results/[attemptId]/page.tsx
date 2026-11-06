"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface SectionBreakdown {
  sectionId?: string;
  name?: string;
  titleVi?: string;
  score: number;
  max?: number;
  maxScore?: number;
  pct?: number;
}

interface ItemReview {
  questionId: string;
  questionNumber: number;
  prompt: string;
  selectedOptionId?: string;
  correctOptionId: string;
  isCorrect: boolean;
  options: { id: string; text: string }[];
  explanationVi: string;
  skillTag?: string;
}

interface SkillStat {
  skill: string;
  correct: number;
  total: number;
  percent: number;
}

interface WeakSkill extends SkillStat {
  recommendationVi: string;
  remedialHref: string;
}

function ExamResultsContent() {
  const params = useParams();
  const attemptId = (params?.attemptId as string) || "att-01";
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchResult() {
      try {
        const res = await fetch(`/api/v1/attempts/${attemptId}/result`);
        const body = await res.json();
        if (res.ok && body.data && isMounted) {
          setResultData(body.data);
          if (body.data.itemReviews && body.data.itemReviews.length > 0) {
            setExpandedQuestionId(body.data.itemReviews[0].questionId);
          }
        }
      } catch {
        // leave resultData null -> error state is rendered
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchResult();
    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
        <Loader2 size={18} className="animate-spin text-[#B9343F]" />
        <span>Đang tổng hợp điểm số và phân tích kết quả bài thi...</span>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-3">
        <p className="text-sm text-gray-700">
          Không tải được kết quả. Bài thi có thể chưa được nộp, hoặc bạn chưa đăng nhập đúng tài khoản đã làm bài.
        </p>
        <Link href="/mock-exams" className="text-sm font-bold text-[#B9343F] hover:underline">
          Quay lại danh sách đề thi
        </Link>
      </div>
    );
  }

  const totalScore = resultData?.internalScore ?? 0;
  const maxScore = resultData?.maxScore ?? 180;
  const isPass = resultData?.isPassEstimate ?? totalScore >= 90;
  const statusText = isPass ? "ĐẠT ƯỚC TÍNH (PASS)" : "CHƯA ĐẠT (NOT PASS)";

  const rawSections: SectionBreakdown[] = resultData?.sections || [];
  const sections = rawSections.map((sec) => {
    const name = sec.titleVi || sec.name || "Phần thi";
    const max = sec.maxScore || sec.max || 60;
    const score = sec.score || 0;
    const pct = sec.pct ?? Math.round((score / max) * 100);
    return { name, score, max, pct };
  });

  const disclaimer =
    resultData?.disclaimerVi ||
    "JLPT Master là nền tảng luyện thi độc lập, không trực thuộc hay được ủy quyền bởi Hiệp hội Hỗ trợ Giáo dục Quốc tế Nhật Bản (JEES) hoặc Quỹ Giao lưu Quốc tế Nhật Bản (The Japan Foundation). Điểm số trên là điểm quy đổi mô phỏng nội bộ (0–180).";

  const itemReviews: ItemReview[] = resultData?.itemReviews || [];

  const weakSkills: WeakSkill[] = resultData?.weakSkills ?? [];
  const skillBreakdown: SkillStat[] = resultData?.skillBreakdown ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          Kết quả chấm tự động từ máy chủ
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {resultData?.examTitle || "Báo cáo Kết quả Bài thi thử N5"}
        </h1>
        <p className="text-xs text-gray-500">Mã lượt thi: {attemptId} • Đã hoàn tất và lưu trữ vào MariaDB</p>

        {/* Circular Score Display */}
        <div className="my-6 inline-flex flex-col items-center justify-center p-8 rounded-full bg-red-50 border-4 border-[#B9343F] w-48 h-48 mx-auto shadow-inner">
          <span className="text-4xl sm:text-5xl font-extrabold text-[#B9343F]">
            {totalScore}
          </span>
          <span className="text-xs font-bold text-gray-500 uppercase mt-0.5">/ {maxScore} điểm</span>
          <span
            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full mt-2 ${
              isPass
                ? "text-emerald-800 bg-emerald-100"
                : "text-amber-800 bg-amber-100"
            }`}
          >
            {statusText}
          </span>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 max-w-xl mx-auto text-left flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Tuyên bố minh bạch:</strong> {disclaimer}
          </p>
        </div>
      </div>

      {/* Section Scores Breakdown */}
      {sections.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Điểm chi tiết theo từng phần thi</h2>
          <div className="space-y-4">
            {sections.map((sec) => (
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
                    style={{ width: `${Math.min(100, Math.max(0, sec.pct))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill breakdown (computed from real answers) */}
      {skillBreakdown.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Kết quả theo từng kỹ năng</h2>
          <div className="space-y-3">
            {skillBreakdown.map((r) => (
              <div key={r.skill} className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm font-semibold text-gray-800">
                  <span>{r.skill}</span>
                  <span className={r.percent < 70 ? "text-[#B9343F]" : "text-emerald-700"}>
                    {r.correct}/{r.total} câu ({r.percent}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${r.percent < 70 ? "bg-[#B9343F]" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, Math.max(0, r.percent))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Points Diagnosis */}
      {weakSkills.length > 0 && (
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
            {weakSkills.map((w) => (
              <div
                key={w.skill}
                className="p-4 rounded-2xl bg-red-50/60 border border-red-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase bg-red-200 text-red-900 px-2 py-0.5 rounded-full">
                    Đúng {w.correct}/{w.total} câu • {w.percent}%
                  </span>
                  <h3 className="font-bold text-gray-900 text-base mt-2">{w.skill}</h3>
                  <p className="text-xs text-gray-600 mt-1">{w.recommendationVi}</p>
                </div>

                <Link
                  href={w.remedialHref}
                  className="text-xs font-bold text-[#B9343F] hover:underline flex items-center gap-1 self-start"
                >
                  Bắt đầu ôn tập
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item-by-item Review */}
      {itemReviews.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">
            Xem lại từng câu hỏi & Phân tích giải thích chi tiết
          </h2>
          <p className="text-xs text-gray-500">
            Toàn bộ đáp án chính xác và lời giải chi tiết tiếng Việt đã được máy chủ gửi về.
          </p>

          <div className="space-y-3 pt-2">
            {itemReviews.map((q) => {
              const isExpanded = expandedQuestionId === q.questionId;
              return (
                <div
                  key={q.questionId}
                  className="border border-gray-200 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.questionId)}
                    className="w-full p-4 text-left bg-[#F7F7F4] hover:bg-gray-100 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-gray-900 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          q.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {q.questionNumber}
                      </span>
                      <span className="font-japanese font-bold">{q.prompt}</span>
                      {q.isCorrect ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-red-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {q.skillTag && (
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">
                          {q.skillTag}
                        </span>
                      )}
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
                          {q.options?.map((opt) => {
                            const isCorrectOpt = opt.id === q.correctOptionId;
                            const isUserSelected = opt.id === q.selectedOptionId;

                            let optStyle = "border-gray-200 text-gray-700 bg-gray-50";
                            if (isCorrectOpt) {
                              optStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold";
                            } else if (isUserSelected && !isCorrectOpt) {
                              optStyle = "border-red-300 bg-red-50 text-red-950";
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${optStyle}`}
                              >
                                <span>{opt.text}</span>
                                {isCorrectOpt && (
                                  <span className="text-[10px] text-emerald-700 font-bold uppercase">
                                    [ Đáp án đúng ]
                                  </span>
                                )}
                                {isUserSelected && !isCorrectOpt && (
                                  <span className="text-[10px] text-red-600 font-bold uppercase">
                                    [ Bạn đã chọn ]
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {q.explanationVi && (
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                          <span className="font-bold block text-xs uppercase text-[#2B4C7E]">
                            Giải thích chi tiết tiếng Việt:
                          </span>
                          <p className="leading-relaxed text-xs sm:text-sm text-gray-800">
                            {q.explanationVi}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href="/mock-exams"
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw size={16} />
          Làm đề thi thử khác
        </Link>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs text-center transition-all cursor-pointer"
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
