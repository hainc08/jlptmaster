"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MockBadge } from "../components/MockBadge";
import {
  Flame,
  BookOpen,
  Layers,
  Award,
  Target,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const [userName, setUserName] = useState("Học viên");
  const [dueSrsCount, setDueSrsCount] = useState(14);

  useEffect(() => {
    // Read from localStorage if set in prototype
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jlpt_user_profile");
      if (saved) {
        setUserName("Minh");
      }
      const srsReviewed = localStorage.getItem("jlpt_srs_reviewed_today");
      if (srsReviewed === "true") {
        setDueSrsCount(0);
      }
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Greeting & Streak */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Xin chào, {userName}! 👋
            </h1>
            <MockBadge label="DỮ LIỆU THỰC MÔ PHỎNG" />
          </div>
          <p className="text-sm text-gray-600">
            Hôm nay bạn có mục tiêu hoàn thành 30 phút học và ôn 14 thẻ nhớ SRS.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl">
          <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
            <Flame size={22} className="animate-pulse" />
          </span>
          <div>
            <span className="text-xs text-amber-800 font-semibold block uppercase tracking-wider">
              Chuỗi học tập
            </span>
            <span className="text-xl font-extrabold text-amber-900 leading-none">
              5 ngày liên tục
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
                Bài học tiếp theo
              </span>
              <span className="text-xs text-gray-500 font-medium">Lộ trình N5</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
              Bài 03: Khẳng định, Phủ định với Trợ từ は và です
            </h2>
            <p className="text-sm text-gray-600">
              Bạn đang học dở phần ví dụ ngữ pháp. Hoàn thành 4 cấu trúc để mở khóa bài luyện tập.
            </p>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span>Tiến độ bài học</span>
                <span>35%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#B9343F] rounded-full transition-all duration-500 w-[35%]" />
              </div>
            </div>
          </div>

          <Link
            href="/learn/n5/bai-03-danh-tu-va-tro-tu-wa-desu"
            className="w-full py-3.5 rounded-2xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            Tiếp tục học ngay
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
                <span className="text-gray-500 block">Từ vựng đến hạn:</span>
                <span className="font-bold text-gray-900 text-sm">8 từ</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 block">Ngữ pháp đến hạn:</span>
                <span className="font-bold text-gray-900 text-sm">6 mẫu</span>
              </div>
            </div>
          </div>

          <Link
            href="/flashcards"
            className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
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

      {/* Progress Breakdown & Recent Mock Exam */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* N5 Mastery Progress */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tiến độ tích lũy kiến thức N5</h3>
              <p className="text-xs text-gray-500">Mục tiêu đạt 100% trước kỳ thi JLPT</p>
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
                <span className="text-2xl font-extrabold text-gray-900">180</span>
                <span className="text-xs text-gray-500">/ 800 từ</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[22%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs text-gray-500 font-medium">Chữ Hán (Kanji)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-gray-900">45</span>
                <span className="text-xs text-gray-500">/ 100 chữ</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-[45%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs text-gray-500 font-medium">Ngữ pháp</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-gray-900">30</span>
                <span className="text-xs text-gray-500">/ 80 mẫu</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-[37%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Mock Exam Result Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
              <Award size={12} />
              Đề thi thử gần nhất
            </span>
            <h3 className="text-lg font-bold text-gray-900">Đề N5 số 01 (Mô phỏng)</h3>
            <p className="text-xs text-gray-500">Hoàn thành hôm qua lúc 21:15</p>

            <div className="py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#B9343F]">142</span>
                <span className="text-sm font-semibold text-gray-500">/ 180 điểm</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                Kết quả: Đạt ước tính (Pass)
              </span>
            </div>
          </div>

          <Link
            href="/results/att-01"
            className="w-full py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs text-center block transition-colors"
          >
            Xem chẩn đoán lỗi sai & điểm yếu
          </Link>
        </div>
      </div>
    </div>
  );
}
