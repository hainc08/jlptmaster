"use client";

import React, { useState, useMemo } from "react";
import { MOCK_GRAMMAR } from "../fixtures/n5-curriculum";
import { MockBadge } from "../components/MockBadge";
import { AudioButton } from "../components/AudioButton";
import { LearningToolbar } from "../components/LearningToolbar";
import { Search, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function GrammarPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGrammar = useMemo(() => {
    return MOCK_GRAMMAR.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      return (
        !q ||
        item.pattern.toLowerCase().includes(q) ||
        item.meaningVi.toLowerCase().includes(q) ||
        item.formation.toLowerCase().includes(q)
      );
    });
  }, [searchTerm]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <LearningToolbar title="Tùy chọn hiển thị Sổ tay Ngữ pháp" />
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#2B4C7E] uppercase tracking-wider">
              Ngữ pháp N5 trọng tâm
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Sổ tay Ngữ pháp JLPT N5 ({MOCK_GRAMMAR.length} mẫu cơ bản)
            </h1>
            <p className="text-xs text-gray-500">
              Công thức cấu tạo, ý nghĩa tiếng Việt và ví dụ câu minh họa.
            </p>
          </div>
          <MockBadge label="DỮ LIỆU ĐÃ CHỨNG THỰC" />
        </div>

        {/* Search Input */}
        <div className="relative pt-2">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm mẫu ngữ pháp (ví dụ: wa, desu, kudasai, hãy làm)..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B4C7E] text-sm text-gray-900 transition-all"
          />
        </div>
      </div>

      {/* Grammar Cards */}
      <div className="space-y-4">
        {filteredGrammar.map((item, index) => (
          <div
            key={item.id}
            className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#2B4C7E] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full">
                  Mẫu số 0{index + 1}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {item.pattern}
                </h2>
                <p className="text-sm font-semibold text-emerald-800">{item.meaningVi}</p>
              </div>

              <Link
                href="/practice"
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-[#B9343F] text-xs font-semibold flex items-center gap-1 transition-colors self-end sm:self-auto"
              >
                Luyện tập câu hỏi chứa mẫu này
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F7F4] border border-gray-200 text-xs space-y-1">
              <span className="font-bold text-gray-700 block">Công thức cấu trúc:</span>
              <p className="font-mono text-gray-900">{item.formation}</p>
              <span className="font-bold text-gray-700 block pt-1">Sắc thái & Lưu ý:</span>
              <p className="text-gray-600 leading-relaxed">{item.nuanceVi}</p>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-start justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-gray-400 font-medium">Câu ví dụ:</span>
                <p className="text-sm font-japanese font-medium text-gray-900">{item.exampleJa}</p>
                <p className="text-xs text-gray-600 italic">{item.exampleVi}</p>
              </div>
              <AudioButton textToSpeak={item.exampleJa} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
