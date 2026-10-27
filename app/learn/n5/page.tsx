"use client";

import React from "react";
import Link from "next/link";
import { MOCK_LESSONS } from "../../fixtures/n5-curriculum";
import { MockBadge } from "../../components/MockBadge";
import { BookOpen, CheckCircle2, Clock, PlayCircle, Sparkles, ChevronRight } from "lucide-react";

export default function N5CoursePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-2xl bg-[#B9343F] text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
              N5
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Khóa học JLPT N5 Toàn diện
              </h1>
              <p className="text-xs text-gray-500">
                Từ bảng chữ cái đến tự tin thi đỗ kỳ thi JLPT N5
              </p>
            </div>
          </div>
          <MockBadge label="DỮ LIỆU ĐÃ CHỨNG THỰC" />
        </div>

        <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
          Lộ trình được thiết kế theo cấu trúc bài giảng trực quan: lý thuyết ngữ pháp trọng tâm, từ vựng theo chủ đề có phiên âm Furigana chuẩn và câu hỏi trắc nghiệm củng cố ngay sau bài học.
        </p>

        <div className="flex flex-wrap gap-4 pt-2 text-xs text-gray-600">
          <span className="flex items-center gap-1 font-semibold text-gray-800">
            <BookOpen size={15} className="text-[#B9343F]" />
            5 bài học cốt lõi (MVP)
          </span>
          <span className="flex items-center gap-1 font-semibold text-gray-800">
            <Clock size={15} className="text-[#2B4C7E]" />
            ~3 giờ học lý thuyết & thực hành
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <CheckCircle2 size={15} />
            Đã hoàn thành: 2 / 5 bài (40%)
          </span>
        </div>
      </div>

      {/* Kana Beginner Special Card */}
      <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-extrabold text-[#B9343F] uppercase tracking-wider bg-red-100 px-2.5 py-0.5 rounded-full">
            Khởi đầu quan trọng
          </span>
          <h2 className="text-xl font-bold text-gray-900">
            Bài 01: Nhập môn Chữ cái Hiragana & Katakana
          </h2>
          <p className="text-sm text-gray-600 max-w-xl">
            Nếu bạn là người mới bắt đầu, hãy nắm vững 46 chữ cái cơ bản và cách ghép âm trước khi bước vào ngữ pháp.
          </p>
        </div>
        <Link
          href="/learn/n5/bai-01-kana-nhap-mon"
          className="px-6 py-3 rounded-2xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all whitespace-nowrap"
        >
          Học bảng Kana
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Lesson Timeline Roadmap */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          Danh sách bài học trong lộ trình N5
        </h2>

        <div className="space-y-3">
          {MOCK_LESSONS.map((lesson, idx) => (
            <Link
              key={lesson.id}
              href={`/learn/n5/${lesson.slug}`}
              className="block p-5 sm:p-6 rounded-2xl bg-white border border-gray-200 hover:border-red-300 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <span
                    className={`w-9 h-9 rounded-xl font-extrabold text-sm flex items-center justify-center shrink-0 ${
                      lesson.isCompleted
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-700 group-hover:bg-red-50 group-hover:text-[#B9343F]"
                    }`}
                  >
                    {lesson.isCompleted ? <CheckCircle2 size={18} /> : `0${lesson.order}`}
                  </span>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-[#B9343F] transition-colors">
                        {lesson.titleVi}
                      </h3>
                      {lesson.isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Đã hoàn thành
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-1">{lesson.descriptionVi}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-0.5">
                      <span>{lesson.vocabCount} từ vựng</span>
                      <span>•</span>
                      <span>{lesson.grammarCount} mẫu ngữ pháp</span>
                      <span>•</span>
                      <span>{lesson.estimatedMinutes} phút</span>
                    </div>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <span className="text-xs font-semibold text-[#B9343F] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    {lesson.isCompleted ? "Ôn lại bài" : "Bắt đầu học"}
                    <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
