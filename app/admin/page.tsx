"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Layers,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Archive,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  interface ContentRow {
    id: string;
    title: string;
    kind: string;
    slug: string;
    status: string;
  }

  const KIND_LABEL: Record<string, string> = { VOCAB: "TỪ VỰNG", KANJI: "CHỮ HÁN", GRAMMAR: "NGỮ PHÁP" };

  const [contentItems, setContentItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadContent = async () => {
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/content");
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Bạn không có quyền quản trị."
            : "Không tải được danh sách nội dung."
        );
      }
      const json = await res.json();
      setContentItems(
        (json.data ?? []).map((it: any): ContentRow => {
          const title =
            it.vocabulary
              ? `${it.vocabulary.surface}（${it.vocabulary.reading}）— ${it.vocabulary.meaningVi}`
              : it.grammar
              ? `${it.grammar.pattern} — ${it.grammar.meaningVi}`
              : it.kanji
              ? `${it.kanji.character}`
              : it.slug;
          return { id: it.id, title, kind: KIND_LABEL[it.kind] ?? it.kind, slug: it.slug, status: it.status };
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = contentItems.filter((item) => {
    if (filterStatus === "ALL") return true;
    return item.status === filterStatus;
  });

  const changeStatus = async (id: string, status: "PUBLISHED" | "ARCHIVED") => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/content/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Không đổi được trạng thái nội dung.");
      await loadContent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
              <Shield size={22} />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Không Gian Quản Trị & Biên Tập Nội Dung (CMS)
              </h1>
              <p className="text-xs text-gray-500">
                Tài khoản: <strong>admin@jlptmaster.vn</strong> (Quyền hạn: ADMIN)
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            Hệ thống Quản trị CMS
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/admin/content/import"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Upload size={14} />
            Nhập dữ liệu hàng loạt từ CSV
          </Link>

          <Link
            href="/admin/exams"
            className="px-4 py-2.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FileText size={14} />
            Quản lý bộ đề thi thử
          </Link>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs text-gray-500 font-medium">Tổng mục nội dung</span>
          <span className="text-2xl font-extrabold text-gray-900 block">{contentItems.length}</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs text-emerald-700 font-medium">Đã xuất bản (Live)</span>
          <span className="text-2xl font-extrabold text-emerald-800 block">
            {contentItems.filter((i) => i.status === "PUBLISHED").length}
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs text-amber-700 font-medium">Chờ duyệt (In Review)</span>
          <span className="text-2xl font-extrabold text-amber-800 block">
            {contentItems.filter((i) => i.status === "IN_REVIEW").length}
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs text-gray-500 font-medium">Bản nháp (Draft)</span>
          <span className="text-2xl font-extrabold text-gray-700 block">
            {contentItems.filter((i) => i.status === "DRAFT").length}
          </span>
        </div>
      </div>

      {/* Content Management Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Danh sách nội dung học liệu</h2>
            <p className="text-xs text-gray-500">
              Quy trình biên tập: DRAFT → IN_REVIEW → PUBLISHED → ARCHIVED
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "PUBLISHED", "IN_REVIEW", "DRAFT"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === st
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {st === "ALL" ? "Tất cả" : st}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div role="alert" className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}
        {loading && <p className="p-6 text-sm text-gray-500">Đang tải nội dung...</p>}
        {!loading && !error && filteredItems.length === 0 && (
          <p className="p-6 text-sm text-gray-500">Không có mục nội dung nào.</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-[#F7F7F4] text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Tiêu đề học liệu</th>
                <th className="px-6 py-4">Phân loại</th>
                <th className="px-6 py-4">Mã (slug)</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                let badgeStyle = "bg-gray-100 text-gray-600";
                if (item.status === "PUBLISHED") badgeStyle = "bg-emerald-100 text-emerald-800";
                if (item.status === "IN_REVIEW") badgeStyle = "bg-amber-100 text-amber-800 animate-pulse";
                if (item.status === "DRAFT") badgeStyle = "bg-gray-100 text-gray-700";

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 text-sm">{item.title}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {item.kind}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500">{item.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${badgeStyle}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {(item.status === "IN_REVIEW" || item.status === "DRAFT" || item.status === "ARCHIVED") && (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => changeStatus(item.id, "PUBLISHED")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs transition-colors shadow-sm"
                        >
                          Phê duyệt xuất bản
                        </button>
                      )}
                      {item.status === "PUBLISHED" && (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => changeStatus(item.id, "ARCHIVED")}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-60 text-gray-700 font-semibold text-xs"
                        >
                          Gỡ xuất bản
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
