"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Upload, CheckCircle2, XCircle, ChevronLeft, Download, Loader2 } from "lucide-react";

const HEADERS = ["surface", "reading", "romaji", "pos", "meaningVi"] as const;
const TEMPLATE_CSV =
  "﻿" +
  HEADERS.join(",") +
  "\n" +
  "雨,あめ,ame,Danh từ,Cơn mưa\n" +
  "行く,いく,iku,Động từ,Đi\n";

type CsvRow = Record<(typeof HEADERS)[number], string>;

interface PreviewRow {
  line: number;
  status: "VALID" | "ERROR";
  data: CsvRow | null;
  error?: string;
}

interface Preview {
  totalRows: number;
  isValid: boolean;
  validCount: number;
  errorCount: number;
  previewRows: PreviewRow[];
}

// Minimal RFC-4180 style parser (quoted fields, escaped quotes, CRLF, BOM).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

export default function CsvImportPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insertedCount, setInsertedCount] = useState<number | null>(null);

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "n5-vocab-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File | undefined) => {
    setError(null);
    setPreview(null);
    setInsertedCount(null);
    setRows([]);
    if (!file) return;
    setFileName(file.name);
    setBusy(true);
    try {
      const table = parseCsv(await file.text());
      const [header, ...body] = table;
      const missing = HEADERS.filter((h) => !header?.map((x) => x.trim()).includes(h));
      if (missing.length > 0) {
        throw new Error(`Tệp CSV thiếu cột: ${missing.join(", ")}. Hãy tải file mẫu để dùng đúng định dạng.`);
      }
      const idx = Object.fromEntries(HEADERS.map((h) => [h, header.map((x) => x.trim()).indexOf(h)]));
      const parsed = body.map(
        (r) => Object.fromEntries(HEADERS.map((h) => [h, (r[idx[h]] ?? "").trim()])) as CsvRow
      );
      if (parsed.length === 0) throw new Error("Tệp CSV không có dòng dữ liệu nào.");
      setRows(parsed);

      const res = await fetch("/api/v1/admin/content/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed }),
      });
      if (!res.ok) {
        throw new Error(res.status === 401 || res.status === 403 ? "Bạn không có quyền quản trị." : "Không kiểm tra được tệp CSV.");
      }
      setPreview((await res.json()).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/content/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message || "Nhập dữ liệu thất bại.");
      setInsertedCount(body.data.insertedCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700 hover:underline">
        <ChevronLeft size={16} /> Về trang quản trị
      </Link>

      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <h1 className="text-2xl font-extrabold text-gray-900">Nhập từ vựng hàng loạt từ CSV</h1>
        <p className="text-sm text-gray-600">
          Cột bắt buộc: <code>{HEADERS.join(", ")}</code>. Hệ thống kiểm tra toàn bộ tệp trước; nếu có dòng lỗi thì
          không ghi dòng nào (giao dịch nguyên tử).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadTemplate}
            className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} /> Tải file CSV mẫu
          </button>
          <label className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer">
            <Upload size={14} /> Chọn tệp CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label="Chọn tệp CSV"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {fileName && <span className="text-xs text-gray-600">{fileName}</span>}
          {busy && <Loader2 size={16} className="animate-spin text-indigo-600" />}
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {insertedCount !== null && (
        <div role="status" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-2">
          <CheckCircle2 size={18} /> Đã nhập {insertedCount} từ vựng vào cơ sở dữ liệu.
        </div>
      )}

      {preview && insertedCount === null && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-800">
              <strong>{preview.validCount}</strong> dòng hợp lệ •{" "}
              <strong className={preview.errorCount > 0 ? "text-red-700" : ""}>{preview.errorCount}</strong> dòng lỗi
            </p>
            <button
              type="button"
              disabled={!preview.isValid || busy}
              onClick={commit}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs cursor-pointer"
            >
              Nhập {preview.validCount} dòng vào CSDL
            </button>
          </div>
          {!preview.isValid && (
            <p className="px-5 pt-3 text-xs text-red-700">Hãy sửa các dòng lỗi trong tệp CSV rồi chọn lại tệp.</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-[#F7F7F4] text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Dòng</th>
                  <th className="px-4 py-3">Chữ</th>
                  <th className="px-4 py-3">Cách đọc</th>
                  <th className="px-4 py-3">Nghĩa</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.previewRows.map((r) => {
                  const src = rows[r.line - 1];
                  return (
                    <tr key={r.line} className={r.status === "ERROR" ? "bg-red-50/50" : ""}>
                      <td className="px-4 py-3">{r.line}</td>
                      <td className="px-4 py-3 font-bold">{src?.surface}</td>
                      <td className="px-4 py-3">{src?.reading}</td>
                      <td className="px-4 py-3">{src?.meaningVi}</td>
                      <td className="px-4 py-3">
                        {r.status === "VALID" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 size={14} /> Hợp lệ
                          </span>
                        ) : (
                          <span className="inline-flex items-start gap-1 text-red-700 font-semibold">
                            <XCircle size={14} className="mt-0.5 shrink-0" /> {r.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
