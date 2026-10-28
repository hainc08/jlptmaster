"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RubyText } from "./components/RubyText";
import { AudioButton } from "./components/AudioButton";
import {
  BookOpen,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Award,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  const [selectedKana, setSelectedKana] = useState<string>("あ");

  const kanaSample = [
    { char: "あ", romaji: "a", vi: "A" },
    { char: "い", romaji: "i", vi: "I" },
    { char: "う", romaji: "u", vi: "U" },
    { char: "え", romaji: "e", vi: "E" },
    { char: "お", romaji: "o", vi: "O" },
    { char: "か", romaji: "ka", vi: "Ka" },
    { char: "き", romaji: "ki", vi: "Ki" },
    { char: "く", romaji: "ku", vi: "Ku" },
    { char: "け", romaji: "ke", vi: "Ke" },
    { char: "こ", romaji: "ko", vi: "Ko" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-[#B9343F] text-xs font-semibold tracking-wide">
            <Sparkles size={14} />
            Lộ trình học JLPT N5 tinh gọn dành riêng cho người Việt
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Chinh phục <span className="text-[#B9343F]">JLPT N5</span> từ con số 0 với giải thích tiếng Việt chuẩn xác
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Học bảng chữ cái Kana, 800 từ vựng có phiên âm Furigana chuẩn, ngữ pháp có ví dụ thực tế, ôn tập ngắt quãng SRS và thi thử bấm giờ với đề thi mô phỏng chân thực.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-base shadow-lg shadow-red-900/10 flex items-center justify-center gap-2 transition-all"
            >
              Bắt đầu học miễn phí
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/mock-exams"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-semibold text-base border border-gray-300 shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              Thi thử đề N5 ngay
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-600" />
              100% Nội dung N5 miễn phí
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Có âm thanh phát âm người bản xứ
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Thuật toán lặp lại ngắt quãng (SRS)
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Kana Teaser */}
      <section className="bg-white border-y border-gray-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#B9343F] uppercase tracking-wider">
              Khởi đầu từ căn bản
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Khám phá Bảng chữ cái Hiragana tương tác
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Chạm vào bất kỳ chữ cái nào để nghe phát âm tiếng Nhật chuẩn và xem phiên âm Romaji.
            </p>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 max-w-4xl mx-auto">
            {kanaSample.map((k) => (
              <button
                key={k.char}
                onClick={() => setSelectedKana(k.char)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  selectedKana === k.char
                    ? "border-[#B9343F] bg-red-50 text-[#B9343F] shadow-sm scale-105"
                    : "border-gray-200 bg-[#F7F7F4] hover:bg-gray-100 text-gray-800"
                }`}
              >
                <span className="text-2xl font-bold font-japanese">{k.char}</span>
                <span className="text-[11px] font-medium text-gray-500 mt-1">{k.romaji}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-sm text-gray-700">
              Đang chọn: <strong className="font-japanese text-lg text-[#B9343F]">{selectedKana}</strong>
            </span>
            <AudioButton textToSpeak={selectedKana} />
          </div>

          <div className="text-center mt-6">
            <Link
              href="/learn/n5/bai-01-kana-nhap-mon"
              className="text-sm font-semibold text-[#B9343F] hover:underline inline-flex items-center gap-1"
            >
              Xem toàn bộ 46 chữ cái và bài tập luyện viết
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Curriculum Preview Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#B9343F] uppercase tracking-wider">
            Lộ trình học tập
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            5 Cấp độ JLPT theo chuẩn Quốc tế
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            MVP tập trung hoàn thiện 100% lộ trình N5. Các cấp độ N4–N1 đang được ban biên tập xây dựng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* N5 Active Card */}
          <div className="p-6 rounded-2xl bg-white border-2 border-[#B9343F] shadow-md flex flex-col justify-between relative overflow-hidden">
            <span className="absolute top-3 right-3 text-[10px] font-extrabold uppercase bg-red-100 text-[#B9343F] px-2 py-0.5 rounded-full">
              Sẵn sàng
            </span>
            <div>
              <span className="text-3xl font-extrabold text-[#B9343F]">N5</span>
              <h3 className="font-bold text-gray-900 mt-1">Nhập môn căn bản</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                800 từ vựng, 100 chữ Hán, 80 mẫu ngữ pháp và đề thi thử bấm giờ.
              </p>
            </div>
            <Link
              href="/learn/n5"
              className="mt-6 w-full py-2.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white text-xs font-bold text-center block transition-colors"
            >
              Vào học N5 ngay
            </Link>
          </div>

          {/* N4 to N1 Disabled Cards */}
          {[
            { level: "N4", title: "Sơ cấp mở rộng", desc: "1500 từ vựng, 300 Kanji, kính ngữ và thể bị động" },
            { level: "N3", title: "Trung cấp", desc: "Giao tiếp hàng ngày, đọc hiểu báo ngắn và đoạn văn" },
            { level: "N2", title: "Trung-Cao cấp", desc: "Thành ngữ, tin tức thời sự và thương mại" },
            { level: "N1", title: "Cao cấp chuyên sâu", desc: "Văn bản trừu tượng, luận thuyết và văn học cổ" },
          ].map((item) => (
            <div
              key={item.level}
              className="p-6 rounded-2xl bg-gray-50 border border-gray-200 opacity-75 flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl font-extrabold text-gray-400">{item.level}</span>
                <span className="block text-[10px] font-semibold text-gray-500 uppercase mt-1">
                  [ Sắp ra mắt ]
                </span>
                <h3 className="font-bold text-gray-700 mt-1">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
              </div>
              <button
                disabled
                className="mt-6 w-full py-2.5 rounded-xl bg-gray-200 text-gray-400 text-xs font-bold cursor-not-allowed"
              >
                Đang biên tập
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-white border-t border-gray-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-[#F7F7F4] border border-gray-200 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-[#B9343F] flex items-center justify-center font-bold">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Thẻ nhớ SRS 4 mức độ nhớ</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ứng dụng thuật toán Spaced Repetition phân bố lịch ôn tập khoa học (10 phút, 1 ngày, 3 ngày, 7 ngày) giúp kiến thức khắc sâu vào trí nhớ dài hạn.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F7F7F4] border border-gray-200 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-[#2B4C7E] flex items-center justify-center font-bold">
              <Award size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Thi thử bấm giờ bảo mật</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Mô phỏng chính xác áp lực thời gian của kỳ thi thật. Toàn bộ đáp án được giấu kín ở máy chủ và chỉ mở sau khi bạn hoàn thành nộp bài.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F7F7F4] border border-gray-200 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Giải thích tiếng Việt chuyên sâu</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Không đơn thuần chỉ là đáp án đúng/sai. Từng câu hỏi đều đi kèm phân tích ngữ pháp, dịch nghĩa tiếng Việt và mẹo nhận biết bẫy đề thi.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Disclaimer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8 text-xs border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-1">
              <span className="w-6 h-6 rounded bg-[#B9343F] text-white flex items-center justify-center text-xs">
                日
              </span>
              JLPT MASTER
            </div>
            <p className="text-gray-500 max-w-md">
              Nền tảng học và thi thử tiếng Nhật N5–N1 dành riêng cho người học Việt Nam.
            </p>
          </div>

          <div className="text-center md:text-right max-w-md space-y-1">
            <p className="text-gray-400 font-semibold">Tuyên bố miễn trừ trách nhiệm pháp lý:</p>
            <p className="text-gray-500">
              JLPT Master là nền tảng luyện thi độc lập, không trực thuộc hay được ủy quyền bởi Hiệp hội Hỗ trợ Giáo dục Quốc tế Nhật Bản (JEES) hoặc Quỹ Giao lưu Quốc tế Nhật Bản (The Japan Foundation). Điểm thi trên hệ thống là điểm ước tính nội bộ.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
