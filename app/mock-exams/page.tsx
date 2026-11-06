"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Award, Clock, FileText, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

interface ExamSummary {
  id: string;
  levelId: string;
  title: string;
  totalMinutes: number;
  totalQuestions: number;
  sections: { id: string; sectionType: string; durationSeconds: number; questionCount: number }[];
}

export default function MockExamsCatalogPage() {
  const router = useRouter();
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("N5");
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMessage(null);
    fetch(`/api/v1/exams?level=${level}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("fetch failed"))))
      .then((json) => {
        if (alive) setExams(Array.isArray(json?.data) ? json.data : []);
      })
      .catch(() => {
        if (alive) {
          setExams([]);
          setMessage("Không tải được danh sách đề thi. Vui lòng thử lại sau.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [level]);

  const startExam = useCallback(
    async (examId: string) => {
      setStartingId(examId);
      setMessage(null);
      try {
        const res = await fetch(`/api/v1/exams/${examId}/start`, { method: "POST" });
        if (res.status === 401) {
          router.push(`/login?redirect=${encodeURIComponent("/mock-exams")}`);
          return;
        }
        const body = await res.json().catch(() => ({}));
        if (res.status === 423) {
          setMessage(body?.error?.message || "Bộ đề đang bị khóa.");
          return;
        }
        if (!res.ok || !body?.data?.id) {
          setMessage(body?.error?.message || "Không thể bắt đầu bài thi.");
          return;
        }
        router.push(`/mock-exams/${body.data.id}`);
      } catch {
        setMessage("Lỗi kết nối khi bắt đầu bài thi.");
      } finally {
        setStartingId(null);
      }
    },
    [router]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Award size={22} />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Phòng Thi Thử JLPT {level} Bấm Giờ
            </h1>
            <p className="text-xs text-gray-500">
              Mô phỏng quy chế thi, đồng hồ tính ở máy chủ, tự động lưu bài làm.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Quy chế thi mô phỏng:</strong> Đáp án đúng và lời giải chỉ hiển thị sau khi bạn nộp bài. Điểm
            là điểm quy đổi nội bộ (0–180), không phải điểm JLPT chính thức.
          </p>
        </div>

        <div role="tablist" aria-label="Chọn cấp độ" className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={level === l}
              onClick={() => setLevel(l)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors cursor-pointer ${
                level === l
                  ? "bg-[#B9343F] text-white border-[#B9343F]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800">
          {message}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin text-[#B9343F]" />
          <span>Đang tải danh sách đề thi...</span>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-300 text-center text-sm text-gray-600">
          Hiện chưa có bộ đề nào đang mở cho cấp độ {level}.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exams.map((ex) => (
            <div
              key={ex.id}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">{ex.title}</h2>
                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} /> {ex.totalMinutes} phút
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText size={14} /> {ex.totalQuestions} câu
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={startingId === ex.id}
                onClick={() => startExam(ex.id)}
                className="px-5 py-2.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] disabled:opacity-60 text-white font-bold text-sm shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                {startingId === ex.id ? "Đang khởi tạo..." : "Bắt đầu thi"}
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
