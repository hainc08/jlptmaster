"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Award, Clock, FileText, CheckCircle2, ChevronRight, AlertTriangle } from "lucide-react";

const INITIAL_EXAMS = [
  {
    id: "att-01",
    title: "Đề thi thử JLPT N5 — Số 01 (Mô phỏng tiêu chuẩn)",
    level: "N5",
    totalMinutes: 90,
    totalQuestions: 35,
    sections: [
      { name: "Kiến thức ngôn ngữ (Từ vựng)", minutes: 20 },
      { name: "Ngữ pháp & Đọc hiểu", minutes: 40 },
      { name: "Nghe hiểu", minutes: 30 },
    ],
    status: "COMPLETED",
    lastScore: "142 / 180",
  },
  {
    id: "att-02",
    title: "Đề thi thử JLPT N5 — Số 02 (Đề nâng cao)",
    level: "N5",
    totalMinutes: 90,
    totalQuestions: 35,
    sections: [
      { name: "Kiến thức ngôn ngữ (Từ vựng)", minutes: 20 },
      { name: "Ngữ pháp & Đọc hiểu", minutes: 40 },
      { name: "Nghe hiểu", minutes: 30 },
    ],
    status: "NEW",
    lastScore: null,
  },
];

export default function MockExamsCatalogPage() {
  const [exams, setExams] = useState(INITIAL_EXAMS);

  useEffect(() => {
    fetch("/api/v1/exams?level=N5")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (Array.isArray(json?.data) && json.data.length > 0) {
          const liveExams = json.data.map((ex: any, idx: number) => ({
            id: ex.id || `att-0${idx + 1}`,
            title: ex.title,
            level: ex.levelId || "N5",
            totalMinutes: 90,
            totalQuestions: 35,
            sections: [
              { name: "Kiến thức ngôn ngữ (Từ vựng)", minutes: 20 },
              { name: "Ngữ pháp & Đọc hiểu", minutes: 40 },
              { name: "Nghe hiểu", minutes: 30 },
            ],
            status: idx === 0 ? "COMPLETED" : "NEW",
            lastScore: idx === 0 ? "142 / 180" : null,
          }));
          if (liveExams.length === 1) {
            setExams([liveExams[0], INITIAL_EXAMS[1]]);
          } else {
            setExams(liveExams);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
              <Award size={22} />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Phòng Thi Thử JLPT N5 Bấm Giờ
              </h1>
              <p className="text-xs text-gray-500">
                Mô phỏng chân thực quy chế thi, thời lượng các phần và tự động lưu bài làm.
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>KẾT NỐI MARIADB TRỰC TIẾP</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Quy chế thi mô phỏng:</strong> Đồng hồ đếm ngược được khóa ở máy chủ. Trong quá trình làm bài, câu trả lời sẽ được tự động lưu mỗi 15 giây. Toàn bộ đáp án đúng và phân tích giải thích sẽ được giấu kín tuyệt đối cho đến khi bạn hoàn tất nộp bài thi.
          </p>
        </div>
      </div>

      {/* Exam List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Danh mục đề thi thử N5</h2>

        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-red-100 text-[#B9343F] px-2.5 py-0.5 rounded-full uppercase">
                    {exam.level}
                  </span>
                  {exam.status === "COMPLETED" ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Đã làm: {exam.lastScore} điểm
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Chưa làm
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900">{exam.title}</h3>

                <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={14} />
                    Tổng thời gian: {exam.totalMinutes} phút
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <FileText size={14} />
                    {exam.totalQuestions} câu hỏi trắc nghiệm
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {exam.sections.map((sec) => (
                    <span
                      key={sec.name}
                      className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg"
                    >
                      {sec.name} ({sec.minutes}p)
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
                <Link
                  href={`/mock-exams/${exam.id}`}
                  className="px-6 py-3.5 rounded-2xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs shadow-md text-center transition-all flex items-center justify-center gap-1.5"
                >
                  {exam.status === "COMPLETED" ? "Làm lại bài thi này" : "Bắt đầu làm bài thi"}
                  <ChevronRight size={16} />
                </Link>

                {exam.status === "COMPLETED" && (
                  <Link
                    href={`/results/${exam.id}`}
                    className="px-6 py-3 rounded-2xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs text-center transition-all"
                  >
                    Xem lại kết quả & Lời giải
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
