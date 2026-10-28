"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ArrowRight,
  Download,
} from "lucide-react";

interface CsvRowPreview {
  line: number;
  kanji: string;
  reading: string;
  meaningVi: string;
  pos: string;
  status: "VALID" | "ERROR";
  errorMsg?: string;
}

export default function CsvImportPage() {
  const [hasFile, setHasFile] = useState(true); // Pre-loaded with demo file
  const [isCommitted, setIsCommitted] = useState(false);

  const previewRows: CsvRowPreview[] = [
    {
      line: 1,
      kanji: "雨",
      reading: "あめ",
      meaningVi: "Cơn mưa",
      pos: "Danh từ",
      status: "VALID",
    },
    {
      line: 2,
      kanji: "行く",
      reading: "いく",
      meaningVi: "Đi (động từ nhóm 1)",
      pos: "Động từ",
      status: "VALID",
    },
    {
      line: 3,
      kanji: "大きい",
      reading: "", // Missing reading intentionally to demonstrate error reporting
      meaningVi: "To lớn",
      pos: "Tính từ",
      status: "ERROR",
      errorMsg: "Lỗi Zod schema: Cột 'reading' (phiên âm Hiragana) không được để trống.",
    },
    {
      line: 4,
      kanji: "食べる",
      reading: "たべる",
      meaningVi: "Ăn uống",
      pos: "Động từ",
      status: "VALID",
    },
  ];

  const validCount = previewRows.filter((r) => r.status === "VALID").length;
  const errorCount = previewRows.filter((r) => r.status === "ERROR").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft size={16} />
          Bảng điều khiển Admin
        </Link>
        <span className="text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
          Công cụ nhập CSV (Dry-Run Zod)
        </span>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Nhập Dữ Liệu Hàng Loạt Bằng CSV (Batch Ingestion)
        </h1>
        <p className="text-sm text-gray-600">
          Hệ thống chạy kiểm tra cú pháp Dry-Run bằng Zod schema trước khi ghi vào cơ sở dữ liệu. Bất kỳ lỗi cú pháp hoặc trùng lặp khóa nào đều được phát hiện sớm để tránh dữ liệu rác.
        </p>

        {/* Download sample CSV template */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => alert("Mô phỏng tải xuống file mẫu: n5-vocab-template.csv")}
            className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
          >
            <Download size={14} />
            Tải file CSV Mẫu Chuẩn (Từ vựng N5)
          </button>
        </div>
      </div>

      {/* Upload Dropzone Preview */}
      <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-gray-300 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <FileText size={24} />
        </div>
        <div>
          <span className="font-bold text-gray-900 text-sm block">
            Tệp đang nạp: <code className="text-indigo-600 font-mono">n5_vocab_batch_01.csv</code> (4 dòng)
          </span>
          <span className="text-xs text-gray-500">Đã kiểm định tự động theo chuẩn Zod validator</span>
        </div>
      </div>

      {/* Dry-run Validation Results Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Bảng Kết quả Kiểm định Sơ bộ (Dry-Run Preview)
            </h2>
            <p className="text-xs text-gray-500">
              Xem chi tiết từng dòng dữ liệu trước khi xác nhận lưu vào CSDL
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {validCount} dòng hợp lệ
            </span>
            <span className="text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
              {errorCount} dòng lỗi
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-[#F7F7F4] text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Dòng</th>
                <th className="px-4 py-3">Chữ Hán (Kanji)</th>
                <th className="px-4 py-3">Phiên âm (Reading)</th>
                <th className="px-4 py-3">Nghĩa tiếng Việt</th>
                <th className="px-4 py-3">Từ loại</th>
                <th className="px-4 py-3">Trạng thái kiểm tra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {previewRows.map((row) => (
                <tr
                  key={row.line}
                  className={`hover:bg-gray-50 transition-colors ${
                    row.status === "ERROR" ? "bg-red-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-bold text-gray-500">{row.line}</td>
                  <td className="px-4 py-3 font-bold font-japanese text-sm text-gray-900">{row.kanji}</td>
                  <td className="px-4 py-3 font-japanese font-medium">
                    {row.reading || <span className="text-red-500 italic">[Trống]</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{row.meaningVi}</td>
                  <td className="px-4 py-3">{row.pos}</td>
                  <td className="px-4 py-3">
                    {row.status === "VALID" ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        HỢP LỆ
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <XCircle size={12} />
                          LỖI DỮ LIỆU
                        </span>
                        <p className="text-[11px] text-red-700 font-medium">{row.errorMsg}</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Commit Button */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            *Chính sách an toàn: Bạn có thể chọn nhập {validCount} dòng hợp lệ hoặc hủy để sửa lại file CSV.
          </p>

          {!isCommitted ? (
            <button
              type="button"
              onClick={() => setIsCommitted(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
            >
              Xác nhận nhập {validCount} dòng hợp lệ vào CSDL
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 size={16} />
              Đã mô phỏng nạp thành công {validCount} dòng vào bảng vocabulary!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
