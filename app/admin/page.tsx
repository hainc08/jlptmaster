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

  const [contentItems, setContentItems] = useState([
    {
      id: "cnt-01",
      title: "Bài 01: Nhập môn Chữ cái Hiragana & Phát âm",
      kind: "BÀI HỌC",
      version: "v1.2",
      status: "PUBLISHED",
      updatedAt: "2026-10-27",
    },
    {
      id: "cnt-02",
      title: "Cấu trúc V-てください (Yêu cầu lịch sự)",
      kind: "NGỮ PHÁP",
      version: "v1.0",
      status: "PUBLISHED",
      updatedAt: "2026-10-26",
    },
    {
      id: "cnt-03",
      title: "Bộ câu hỏi Trợ từ De vs Ni (20 câu)",
      kind: "CÂU HỎI",
      version: "v0.5",
      status: "IN_REVIEW",
      updatedAt: "2026-10-27",
    },
    {
      id: "cnt-04",
      title: "Đề thi thử JLPT N5 — Số 02 (Đề nâng cao)",
      kind: "ĐỀ THI",
      version: "v0.8",
      status: "IN_REVIEW",
      updatedAt: "2026-10-28",
    },
    {
      id: "cnt-05",
      title: "Bài đọc hiểu: Một ngày tại Tokyo",
      kind: "ĐỌC HIỂU",
      version: "v0.2",
      status: "DRAFT",
      updatedAt: "2026-10-28",
    },
  ]);

  const filteredItems = contentItems.filter((item) => {
    if (filterStatus === "ALL") return true;
    return item.status === filterStatus;
  });

  const handlePublish = (id: string) => {
    setContentItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "PUBLISHED" } : item))
    );
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

          <button
            type="button"
            onClick={() => alert("Mô phỏng: Mở modal soạn thảo bài học mới")}
            className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} />
            Tạo bài học mới
          </button>
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
            <h2 className="text-lg font-bold text-gray-900">Danh sách nội dung học liệu N5</h2>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-[#F7F7F4] text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Tiêu đề học liệu</th>
                <th className="px-6 py-4">Phân loại</th>
                <th className="px-6 py-4">Phiên bản</th>
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
                    <td className="px-6 py-4 font-mono text-gray-500">{item.version}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${badgeStyle}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {item.status === "IN_REVIEW" && (
                        <button
                          type="button"
                          onClick={() => handlePublish(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                        >
                          Phê duyệt xuất bản
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => alert(`Xem chi tiết mã: ${item.id}`)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs"
                      >
                        Xem
                      </button>
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
