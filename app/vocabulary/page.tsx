"use client";

import React, { useState, useEffect } from "react";
import { RubyText } from "../components/RubyText";
import { AudioButton } from "../components/AudioButton";
import { Search, AlertCircle, RefreshCw } from "lucide-react";

export interface VocabEntity {
  id: string;
  surface: string;
  reading: string;
  romaji: string;
  pos: string;
  meaningVi: string;
  exampleJa?: string | null;
  exampleVi?: string | null;
}

export default function VocabularyPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPos, setSelectedPos] = useState<string>("ALL");
  const [vocabList, setVocabList] = useState<VocabEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
          params.set("q", searchTerm.trim());
        }
        if (selectedPos && selectedPos !== "ALL") {
          params.set("pos", selectedPos);
        }
        const queryString = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`/api/v1/vocabulary${queryString}`);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Lỗi khi tải dữ liệu từ vựng`);
        }

        const json = await res.json();
        if (!ignore) {
          setVocabList(json.data || []);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Lỗi khi tải dữ liệu từ vựng từ máy chủ MariaDB");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [searchTerm, selectedPos, reloadCount]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#B9343F] uppercase tracking-wider">
              Kho từ vựng N5
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Sổ tay Từ vựng JLPT N5 ({vocabList.length} từ)
            </h1>
            <p className="text-xs text-gray-500">
              Tra cứu nhanh theo chữ Hán, Hiragana, Romaji hoặc nghĩa tiếng Việt được đồng bộ trực tiếp từ MariaDB.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              MARIADB API LIVE
            </span>
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm từ vựng (ví dụ: sensei, 先生, giáo viên, gakusei)..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B9343F] text-sm text-gray-900 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "Danh từ", "Động từ"].map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setSelectedPos(pos)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedPos === pos
                    ? "bg-[#B9343F] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {pos === "ALL" ? "Tất cả từ loại" : pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-red-800 text-sm">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setReloadCount((c) => c + 1)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw size={14} />
            Thử lại
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-gray-200 animate-pulse space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-10 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Vocabulary List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vocabList.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-red-200 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      <RubyText kanji={item.surface} reading={item.reading} />
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500 uppercase bg-gray-100 px-2 py-0.5 rounded">
                      {item.pos}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 italic block">{item.romaji}</span>
                  <p className="text-sm font-bold text-emerald-800 pt-0.5">{item.meaningVi}</p>
                </div>

                <AudioButton textToSpeak={item.surface} />
              </div>

              {(item.exampleJa || item.exampleVi) && (
                <div className="pt-2 border-t border-gray-100 text-xs space-y-1">
                  <span className="text-gray-400 font-medium block">Ví dụ:</span>
                  {item.exampleJa && (
                    <p className="text-gray-800 font-japanese font-medium">{item.exampleJa}</p>
                  )}
                  {item.exampleVi && <p className="text-gray-600 italic">{item.exampleVi}</p>}
                </div>
              )}
            </div>
          ))}

          {vocabList.length === 0 && (
            <div className="col-span-2 p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-2">
              <p className="text-base font-semibold text-gray-700">
                Không tìm thấy từ vựng nào khớp với từ khóa &ldquo;{searchTerm}&rdquo;.
              </p>
              <p className="text-xs text-gray-500">
                Hãy thử tìm bằng Romaji (ví dụ: sensei) hoặc nghĩa tiếng Việt (ví dụ: sách, học sinh).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
