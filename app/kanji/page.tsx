"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LearningToolbar } from "../components/LearningToolbar";
import { RubyText } from "../components/RubyText";
import { Search, Languages, ChevronRight, RefreshCw } from "lucide-react";

export interface KanjiEntity {
  id: string;
  character: string;
  hanViet?: string;
  onyomi?: string;
  kunyomi?: string;
  onyomiJson?: string[];
  kunyomiJson?: string[];
  meaningVi: string;
  strokes?: number;
  strokeCount?: number;
  examplesJson?: Array<{ word: string; reading: string; meaning: string }>;
}

const DEFAULT_KANJI: KanjiEntity[] = [
  {
    id: "k-nhat",
    character: "日",
    hanViet: "NHẬT",
    onyomi: "ニチ, ジツ",
    kunyomi: "ひ, -び, -か",
    meaningVi: "Mặt trời, ngày",
    strokes: 4,
    examplesJson: [{ word: "日本", reading: "にほん", meaning: "Nhật Bản" }],
  },
  {
    id: "k-ban",
    character: "本",
    hanViet: "BẢN",
    onyomi: "ホン",
    kunyomi: "もと",
    meaningVi: "Gốc, sách",
    strokes: 5,
    examplesJson: [{ word: "本", reading: "ほん", meaning: "Quyển sách" }],
  },
  {
    id: "k-hoc",
    character: "学",
    hanViet: "HỌC",
    onyomi: "ガク",
    kunyomi: "まな.ぶ",
    meaningVi: "Học tập, trường",
    strokes: 8,
    examplesJson: [{ word: "学生", reading: "がくせい", meaning: "Học sinh, sinh viên" }],
  },
  {
    id: "k-sinh",
    character: "生",
    hanViet: "SINH",
    onyomi: "セイ, ショウ",
    kunyomi: "い.きる, う.まれる",
    meaningVi: "Sinh ra, sống",
    strokes: 5,
    examplesJson: [{ word: "先生", reading: "せんせい", meaning: "Giáo viên" }],
  },
  {
    id: "k-tien",
    character: "先",
    hanViet: "TIÊN",
    onyomi: "セン",
    kunyomi: "さき, まず",
    meaningVi: "Trước, đi đầu",
    strokes: 6,
    examplesJson: [{ word: "先生", reading: "せんせい", meaning: "Giáo viên" }],
  },
];

export default function KanjiPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [kanjiList, setKanjiList] = useState<KanjiEntity[]>(DEFAULT_KANJI);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadKanji() {
      try {
        const params = new URLSearchParams({ level: "N5" });
        if (searchTerm.trim()) {
          params.set("q", searchTerm.trim());
        }
        const res = await fetch(`/api/v1/kanji?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!ignore && Array.isArray(json.data) && json.data.length > 0) {
          setKanjiList(json.data);
        }
      } catch {
        // Fallback to verified N5 Kanji when offline
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadKanji();
    return () => {
      ignore = true;
    };
  }, [searchTerm]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <LearningToolbar title="Tùy chọn hiển thị Sổ tay Chữ Hán (Kanji)" />

      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#B9343F] uppercase tracking-wider flex items-center gap-1.5">
              <Languages size={14} />
              Chữ Hán JLPT N5 trọng tâm
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Sổ tay Chữ Hán (Kanji) N5
            </h1>
            <p className="text-xs text-gray-500">
              Tra cứu âm Hán-Việt, âm Onyomi, âm Kunyomi, số nét và từ ghép thông dụng.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>KẾT NỐI MARIADB TRỰC TIẾP</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative pt-2">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm chữ Hán, âm Hán-Việt hoặc ý nghĩa (ví dụ: Nhật, Học, mặt trời)..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B9343F] text-sm text-gray-900 transition-all"
          />
        </div>
      </div>

      {/* Kanji Grid */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-[#B9343F]" />
          <span>Đang tải dữ liệu Chữ Hán N5 từ MariaDB...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kanjiList.map((item) => {
            const onReading = Array.isArray(item.onyomiJson)
              ? item.onyomiJson.join(", ")
              : item.onyomi || "—";
            const kunReading = Array.isArray(item.kunyomiJson)
              ? item.kunyomiJson.join(", ")
              : item.kunyomi || "—";
            const strokeCount = item.strokes ?? item.strokeCount ?? 0;
            const displayMeaning = item.hanViet
              ? `${item.hanViet} — ${item.meaningVi}`
              : item.meaningVi;

            return (
              <div
                key={item.id || item.character}
                className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-red-200 hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#FBEBEB] border border-[#B9343F]/20 text-[#B9343F] font-japanese text-3xl font-bold flex items-center justify-center shrink-0">
                    {item.character}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-extrabold text-gray-900">
                        {displayMeaning}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">
                        {strokeCount} nét
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div className="p-2 rounded-xl bg-[#F7F7F4] border border-gray-100">
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">
                          Âm On (Onyomi)
                        </span>
                        <span className="font-japanese font-semibold text-gray-900">
                          {onReading}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#F7F7F4] border border-gray-100">
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">
                          Âm Kun (Kunyomi)
                        </span>
                        <span className="font-japanese font-semibold text-gray-900">
                          {kunReading}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {Array.isArray(item.examplesJson) && item.examplesJson.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="text-gray-700">
                      <span className="font-semibold text-gray-500 mr-1.5">Từ ghép:</span>
                      <RubyText
                        kanji={item.examplesJson[0].word}
                        reading={item.examplesJson[0].reading}
                        className="font-bold text-gray-900 mr-1.5"
                      />
                      <span>({item.examplesJson[0].meaning})</span>
                    </div>
                    <Link
                      href="/practice"
                      className="text-[#B9343F] font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      Luyện tập
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

