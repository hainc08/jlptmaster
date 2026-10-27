"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MockBadge } from "../components/MockBadge";
import { Check, Clock, Sparkles, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [dailyMinutes, setDailyMinutes] = useState(30);

  const handleComplete = () => {
    // In prototype, save preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "jlpt_user_profile",
        JSON.stringify({
          targetLevel: selectedLevel,
          dailyMinutes: dailyMinutes,
          onboardedAt: new Date().toISOString(),
        })
      );
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-10 space-y-8">
        <div className="text-center space-y-2">
          <MockBadge label="THIẾT LẬP HỒ SƠ HỌC VIÊN — BƯỚC 1/1" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Thiết lập lộ trình học tiếng Nhật của bạn
          </h1>
          <p className="text-sm text-gray-600">
            Hãy cho chúng tôi biết mục tiêu của bạn để JLPT Master tối ưu lịch nhắc nhở ôn tập SRS hàng ngày.
          </p>
        </div>

        {/* Level Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
            1. Chọn trình độ mục tiêu:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedLevel("N5")}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                selectedLevel === "N5"
                  ? "border-[#B9343F] bg-red-50/70 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-[#B9343F]">JLPT N5</span>
                <span className="w-5 h-5 rounded-full bg-[#B9343F] text-white flex items-center justify-center text-xs">
                  <Check size={12} strokeWidth={3} />
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-900 mt-1">Nhập môn căn bản</p>
              <p className="text-[11px] text-gray-500 mt-0.5">800 từ vựng, 100 chữ Hán, Hiragana & Katakana</p>
            </button>

            {[
              { level: "N4", title: "Sơ cấp mở rộng" },
              { level: "N3", title: "Trung cấp" },
              { level: "N2 / N1", title: "Trung & Cao cấp" },
            ].map((lvl) => (
              <div
                key={lvl.level}
                className="p-4 rounded-2xl border border-gray-200 bg-gray-50 opacity-60 text-left cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-400">{lvl.level}</span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Sắp ra mắt
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-500 mt-1">{lvl.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Đang được ban biên tập xây dựng</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Goal Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
            2. Thời gian bạn dành học mỗi ngày:
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDailyMinutes(mins)}
                className={`py-3 px-2 rounded-xl border-2 text-center transition-all ${
                  dailyMinutes === mins
                    ? "border-[#B9343F] bg-red-50 text-[#B9343F] font-bold shadow-sm"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
                }`}
              >
                <span className="text-base block">{mins}</span>
                <span className="text-[10px] text-gray-500 block">phút/ngày</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1 mt-1">
            <Clock size={12} />
            Khuyên dùng 30 phút mỗi ngày để hoàn thành khóa N5 trong 60 ngày.
          </p>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleComplete}
          className="w-full py-4 rounded-2xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-base shadow-lg shadow-red-900/10 flex items-center justify-center gap-2 transition-all"
        >
          Hoàn tất thiết lập & Vào Bảng điều khiển
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
