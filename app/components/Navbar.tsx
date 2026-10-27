"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFurigana } from "./RubyText";
import { BookOpen, Layers, CheckCircle2, Award, Shield, Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { showFurigana, toggleFurigana } = useFurigana();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If in active mock exam attempt, simplify header to avoid distraction
  const isExamAttempt = pathname.startsWith("/mock-exams/") && pathname !== "/mock-exams";

  if (isExamAttempt) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#B9343F] text-white font-bold flex items-center justify-center text-sm shadow-sm">
              日
            </span>
            <span className="font-bold text-gray-900 tracking-tight text-lg">
              JLPT MASTER <span className="text-xs text-red-600 font-semibold uppercase tracking-wider ml-1">Phòng thi N5</span>
            </span>
          </div>
          <button
            onClick={toggleFurigana}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
              showFurigana
                ? "bg-red-50 text-[#B9343F] border-red-200"
                : "bg-gray-100 text-gray-600 border-gray-300"
            }`}
          >
            振 Furigana: {showFurigana ? "BẬT" : "TẮT"}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-[#B9343F] text-white font-bold flex items-center justify-center text-base shadow-sm group-hover:bg-[#A02731] transition-colors">
              日
            </span>
            <div>
              <span className="font-extrabold text-gray-900 tracking-tight text-lg block leading-none">
                JLPT MASTER
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                Luyện thi tiếng Nhật N5–N1
              </span>
            </div>
          </Link>
          <span className="hidden md:inline-flex items-center text-[11px] font-semibold bg-red-100 text-[#B9343F] px-2 py-0.5 rounded-full ml-1">
            N5 Sẵn sàng
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700">
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-lg transition-colors ${
              pathname === "/dashboard" ? "bg-red-50 text-[#B9343F] font-semibold" : "hover:bg-gray-100"
            }`}
          >
            Bảng điều khiển
          </Link>
          <Link
            href="/learn/n5"
            className={`px-3 py-2 rounded-lg transition-colors ${
              pathname.startsWith("/learn") ? "bg-red-50 text-[#B9343F] font-semibold" : "hover:bg-gray-100"
            }`}
          >
            Khóa học N5
          </Link>
          <Link
            href="/vocabulary"
            className={`px-3 py-2 rounded-lg transition-colors ${
              pathname === "/vocabulary" ? "bg-red-50 text-[#B9343F] font-semibold" : "hover:bg-gray-100"
            }`}
          >
            Từ vựng
          </Link>
          <Link
            href="/grammar"
            className={`px-3 py-2 rounded-lg transition-colors ${
              pathname === "/grammar" ? "bg-red-50 text-[#B9343F] font-semibold" : "hover:bg-gray-100"
            }`}
          >
            Ngữ pháp
          </Link>
          <Link
            href="/flashcards"
            className={`px-3 py-2 rounded-lg transition-colors ${
              pathname === "/flashcards" ? "bg-red-50 text-[#B9343F] font-semibold" : "hover:bg-gray-100"
            }`}
          >
            Thẻ nhớ SRS
          </Link>
          <Link
            href="/mock-exams"
            className={`px-3 py-2 rounded-lg transition-colors ${
              pathname === "/mock-exams" ? "bg-red-50 text-[#B9343F] font-semibold" : "hover:bg-gray-100"
            }`}
          >
            Thi thử N5
          </Link>
          <Link
            href="/admin"
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
              pathname.startsWith("/admin") ? "bg-indigo-50 text-indigo-700 font-semibold" : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <Shield size={14} />
            Admin
          </Link>
        </nav>

        {/* Action Controls & Furigana Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleFurigana}
            aria-label="Bật hoặc tắt phiên âm Furigana"
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
              showFurigana
                ? "bg-red-50 text-[#B9343F] border-red-200 shadow-sm"
                : "bg-gray-100 text-gray-500 border-gray-300"
            }`}
          >
            <span className="font-bold">振</span>
            <span className="hidden sm:inline">Furigana:</span>
            <span>{showFurigana ? "BẬT" : "TẮT"}</span>
          </button>

          <Link
            href="/login"
            className="text-xs font-semibold text-gray-700 hover:text-[#B9343F] px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
          >
            Đăng nhập
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Bảng điều khiển
          </Link>
          <Link
            href="/learn/n5"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Khóa học N5
          </Link>
          <Link
            href="/vocabulary"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Sổ tay từ vựng
          </Link>
          <Link
            href="/grammar"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Sổ tay ngữ pháp
          </Link>
          <Link
            href="/flashcards"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Ôn tập Thẻ nhớ (SRS)
          </Link>
          <Link
            href="/practice"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Luyện tập câu hỏi
          </Link>
          <Link
            href="/mock-exams"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Thi thử N5
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50"
          >
            Quản trị viên (CMS)
          </Link>
        </div>
      )}
    </header>
  );
}
