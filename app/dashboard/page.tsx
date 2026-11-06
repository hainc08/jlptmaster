"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  BookOpen,
  Layers,
  Award,
  ArrowRight,
  CheckCircle2,
  FileQuestion,
  Loader2,
} from "lucide-react";

interface ProgressOverviewData {
  totalLessonsCount: number;
  completedLessonsCount: number;
  dueReviewsCount: number;
  totalReviewsCount: number;
  vocabCount?: number;
  kanjiCount?: number;
  grammarCount?: number;
  currentStreak?: number;
  nextLesson?: {
    id: string;
    slug: string;
    titleVi: string;
    levelId: string;
  };
  latestScore?: number | null;
  recentAttempts?: {
    id: string;
    examTitle: string;
    internalScore: number | null;
    submittedAt: string | null;
  }[];
}

export default function DashboardPage() {
  const [userName, setUserName] = useState("Học viên");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressOverviewData | null>(null);
  const [goal, setGoal] = useState<{ targetLevel: string; dailyGoalMinutes: number; onboarded: boolean } | null>(null);
  const [roadmap, setRoadmap] = useState<
    { step: number; skill: string; percent: number; actionVi: string; href: string }[] | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    if (typeof window !== "undefined") {
      const email = localStorage.getItem("jlpt_auth_email");
      if (email) {
        setUserName(email.split("@")[0]);
      }
    }

    fetch("/api/v1/progress/overview")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data && isMounted) {
          setProgress(json.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    fetch("/api/v1/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data && isMounted) setGoal(json.data);
      })
      .catch(() => {});

    fetch("/api/v1/progress/skills")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data && isMounted) setRoadmap(json.data.roadmap ?? []);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const streak = progress?.currentStreak ?? 0;
  const dueSrsCount = progress?.dueReviewsCount ?? 0;
  const completedLessons = progress?.completedLessonsCount ?? 0;
  const totalLessons = progress?.totalLessonsCount ?? 10;
  const lessonPct = Math.round((completedLessons / (totalLessons || 1)) * 100);

  const vocabTotal = progress?.vocabCount ?? 80;
  const kanjiTotal = progress?.kanjiCount ?? 40;
  const grammarTotal = progress?.grammarCount ?? 30;

  const latestAttempt = progress?.recentAttempts && progress.recentAttempts.length > 0
    ? progress.recentAttempts[0]
    : null;

  const nextLessonTitle = progress?.nextLesson?.titleVi || "Bài 01: Bảng chữ cái Hiragana & Phát âm";
  const nextLessonSlug = progress?.nextLesson?.slug || "bai-01-kana-nhap-mon";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Greeting & Streak */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Xin chào, {userName}! 👋
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            {dueSrsCount > 0
              ? `Hôm nay bạn có ${dueSrsCount} thẻ nhớ SRS cần ôn tập để không quên.`
              : "Hôm nay bạn chưa có lịch thẻ nhớ cần ôn. Hãy học tiếp bài mới nhé!"}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl">
          <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
            <Flame size={22} className={streak > 0 ? "animate-pulse" : ""} />
          </span>
          <div>
            <span className="text-xs text-amber-800 font-semibold block uppercase tracking-wider">
              Chuỗi học tập
            </span>
            <span className="text-xl font-extrabold text-amber-900 leading-none">
              {streak > 0 ? `${streak} ngày liên tục` : "Bắt đầu ngày 1"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Lesson Resume Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B9343F] uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full border border-red-100">
                <BookOpen size={14} />
                Lộ trình học tập
              </span>
              <span className="text-xs text-gray-500 font-medium">Lộ trình N5</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
              {nextLessonTitle}
            </h2>
            <p className="text-sm text-gray-600">
              {completedLessons > 0
                ? `Bạn đã hoàn thành ${completedLessons}/${totalLessons} bài học. Tiếp tục học để mở rộng vốn ngữ pháp.`
                : "Bắt đầu bài học đầu tiên trong lộ trình chuẩn JLPT N5 để tích lũy kiến thức."}
            </p>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span>Tiến độ toàn khóa</span>
                <span>{lessonPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B9343F] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, lessonPct))}%` }}
                />
              </div>
            </div>
          </div>

          <Link
            href={`/learn/n5/${nextLessonSlug}`}
            className="w-full py-3.5 rounded-2xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {completedLessons > 0 ? "Tiếp tục học bài mới" : "Bắt đầu học ngay"}
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* SRS Flashcards Due Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2B4C7E] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Layers size={14} />
                Thẻ nhớ Spaced Repetition
              </span>
              <span className="text-xs text-gray-500 font-medium">Hàng đợi hôm nay</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#2B4C7E]">
                {dueSrsCount}
              </span>
              <span className="text-base text-gray-700 font-semibold">
                thẻ cần ôn tập để không quên
              </span>
            </div>

            <p className="text-sm text-gray-600">
              Các thẻ từ vựng và ngữ pháp đã đến chu kỳ lặp lại theo thuật toán ghi nhớ 4 mức độ.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 block">Thẻ đến hạn:</span>
                <span className="font-bold text-gray-900 text-sm">{dueSrsCount} thẻ</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 block">Tổng thẻ sở hữu:</span>
                <span className="font-bold text-gray-900 text-sm">{progress?.totalReviewsCount ?? 0} thẻ</span>
              </div>
            </div>
          </div>

          <Link
            href="/flashcards"
            className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              dueSrsCount > 0
                ? "bg-[#2B4C7E] hover:bg-[#1E365B] text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {dueSrsCount > 0 ? (
              <>
                Bắt đầu phiên ôn tập SRS ({dueSrsCount} thẻ)
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Đã hoàn thành ôn tập hôm nay!
              </>
            )}
          </Link>
        </div>
      </div>

      {goal && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-gray-700">
            Mục tiêu của bạn: <strong>JLPT {goal.targetLevel}</strong> • <strong>{goal.dailyGoalMinutes} phút/ngày</strong>
          </span>
          <Link href="/onboarding" className="text-xs font-bold text-[#B9343F] hover:underline">
            {goal.onboarded ? "Đổi mục tiêu" : "Thiết lập mục tiêu"}
          </Link>
        </div>
      )}

      {/* Personalised roadmap from weak skills in real mock exams */}
      <div id="roadmap" className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 scroll-mt-24">
        <h2 className="text-lg font-bold text-gray-900">Lộ trình ôn tập cho bạn</h2>
        {roadmap === null ? (
          <p className="text-sm text-gray-500">Đang phân tích kết quả thi...</p>
        ) : roadmap.length === 0 ? (
          <p className="text-sm text-gray-600">
            Chưa có mục yếu nào được ghi nhận. Làm một bài thi thử để hệ thống đánh giá kỹ năng của bạn.
          </p>
        ) : (
          <ol className="space-y-2">
            {roadmap.map((r) => (
              <li key={r.skill} className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-red-50/60 border border-red-200">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {r.step}. {r.skill} <span className="text-[#B9343F]">({r.percent}%)</span>
                  </p>
                  <p className="text-xs text-gray-600">{r.actionVi}</p>
                </div>
                <Link href={r.href} className="text-xs font-bold text-[#B9343F] hover:underline whitespace-nowrap">
                  Ôn ngay
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Progress Breakdown & Recent Mock Exam */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* N5 Mastery Progress */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Kho dữ liệu học liệu N5 (MariaDB)</h3>
              <p className="text-xs text-gray-500">Toàn bộ kho câu hỏi, từ vựng và ngữ pháp đã kiểm duyệt</p>
            </div>
            <Link
              href="/learn/n5"
              className="text-xs font-semibold text-[#B9343F] hover:underline"
            >
              Xem toàn bộ lộ trình
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs text-gray-500 font-medium">Từ vựng N5</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-gray-900">{vocabTotal}</span>
                <span className="text-xs text-gray-500">mục đã duyệt</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs text-gray-500 font-medium">Chữ Hán (Kanji)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-gray-900">{kanjiTotal}</span>
                <span className="text-xs text-gray-500">chữ chuẩn N5</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-full" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs text-gray-500 font-medium">Ngữ pháp</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-gray-900">{grammarTotal}</span>
                <span className="text-xs text-gray-500">mẫu câu</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Mock Exam Result Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
          {latestAttempt ? (
            <>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                  <Award size={12} />
                  Đề thi thử gần nhất
                </span>
                <h3 className="text-lg font-bold text-gray-900">{latestAttempt.examTitle}</h3>
                <p className="text-xs text-gray-500">
                  {latestAttempt.submittedAt
                    ? new Date(latestAttempt.submittedAt).toLocaleDateString("vi-VN")
                    : "Đã hoàn thành"}
                </p>

                <div className="py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#B9343F]">
                      {latestAttempt.internalScore ?? 0}
                    </span>
                    <span className="text-sm font-semibold text-gray-500">/ 180 điểm</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                    {((latestAttempt.internalScore ?? 0) >= 90)
                      ? "Kết quả: Đạt ước tính (Pass)"
                      : "Kết quả: Chưa đạt (Not Pass)"}
                  </span>
                </div>
              </div>

              <Link
                href={`/results/${latestAttempt.id}`}
                className="w-full py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs text-center block transition-colors cursor-pointer"
              >
                Xem chẩn đoán lỗi sai & điểm yếu
              </Link>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full uppercase">
                  <FileQuestion size={12} />
                  Đề thi thử JLPT
                </span>
                <h3 className="text-lg font-bold text-gray-900">Chưa có bài thi nào</h3>
                <p className="text-xs text-gray-500">
                  Làm đề thi thử bấm giờ để kiểm tra năng lực và nhận chẩn đoán điểm yếu chi tiết.
                </p>
              </div>

              <Link
                href="/mock-exams"
                className="w-full py-2.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white font-semibold text-xs text-center block transition-colors cursor-pointer shadow-sm"
              >
                Làm đề thi thử ngay
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
