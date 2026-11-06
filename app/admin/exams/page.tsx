"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Unlock, Loader2, Shield, ChevronDown, ChevronUp } from "lucide-react";

interface AdminExam {
  id: string;
  levelId: string;
  title: string;
  status: string;
  isLocked: boolean;
  totalMinutes: number;
  totalQuestions: number;
  attemptCount: number;
}

interface AdminAttempt {
  id: string;
  userEmail: string;
  status: string;
  submittedAt: string | null;
  rawCorrect: number | null;
  rawTotal: number | null;
  internalScore: number | null;
}

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Đang mở",
  ARCHIVED: "Đã khóa",
  DRAFT: "Bản nháp",
  IN_REVIEW: "Chờ duyệt",
};

export default function AdminExamsPage() {
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<string, AdminAttempt[]>>({});
  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/exams");
      if (!res.ok) {
        throw new Error(res.status === 401 || res.status === 403 ? "Bạn không có quyền quản trị." : "Không tải được danh sách bộ đề.");
      }
      setExams((await res.json()).data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLock = async (exam: AdminExam) => {
    setBusyId(exam.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/exams/${exam.id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: !exam.isLocked }),
      });
      if (!res.ok) throw new Error("Không đổi được trạng thái khóa/mở.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusyId(null);
    }
  };

  const loadAttempts = async (examId: string) => {
    if (openId === examId) {
      setOpenId(null);
      return;
    }
    setOpenId(examId);
    const res = await fetch(`/api/v1/admin/exams/${examId}/attempts`);
    if (res.ok) {
      const data: AdminAttempt[] = (await res.json()).data ?? [];
      setAttempts((prev) => ({ ...prev, [examId]: data }));
    } else {
      setError("Không tải được danh sách lượt thi.");
    }
  };

  const regrade = async (examId: string, attemptId: string, override: boolean) => {
    setBusyId(attemptId);
    setError(null);
    try {
      const body: Record<string, unknown> = { reason: override ? "Admin chỉnh điểm thủ công" : "Admin chấm lại tự động" };
      if (override) {
        const n = Number(scoreDraft[attemptId]);
        if (!Number.isInteger(n) || n < 0 || n > 180) {
          setError("Điểm phải là số nguyên từ 0 đến 180.");
          return;
        }
        body.internalScore = n;
      }
      const res = await fetch(`/api/v1/admin/attempts/${attemptId}/regrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Chấm lại không thành công.");
      const r = await fetch(`/api/v1/admin/exams/${examId}/attempts`);
      if (r.ok) {
        const data: AdminAttempt[] = (await r.json()).data ?? [];
        setAttempts((prev) => ({ ...prev, [examId]: data }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
            <Shield size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Quản lý bộ đề thi thử</h1>
            <p className="text-xs text-gray-500">Khóa/mở bộ đề, xem lượt thi và chấm lại điểm.</p>
          </div>
        </div>
        <Link href="/admin" className="text-sm font-bold text-indigo-700 hover:underline">
          ← Về trang quản trị nội dung
        </Link>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin" /> Đang tải...
        </div>
      ) : exams.length === 0 ? (
        <div className="p-10 text-center text-sm text-gray-600 bg-white rounded-3xl border border-dashed border-gray-300">
          Chưa có bộ đề nào.
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((ex) => (
            <div key={ex.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white bg-[#B9343F] px-2 py-0.5 rounded-full">{ex.levelId}</span>
                    <h2 className="font-bold text-gray-900">{ex.title}</h2>
                  </div>
                  <p className="text-xs text-gray-600">
                    {ex.totalQuestions} câu • {ex.totalMinutes} phút • {ex.attemptCount} lượt thi •{" "}
                    <strong className={ex.isLocked ? "text-red-700" : "text-emerald-700"}>
                      {STATUS_LABEL[ex.status] ?? ex.status}
                    </strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadAttempts(ex.id)}
                    className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    Lượt thi {openId === ex.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === ex.id}
                    onClick={() => toggleLock(ex)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer ${
                      ex.isLocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {ex.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                    {ex.isLocked ? "Mở khóa đề" : "Khóa đề"}
                  </button>
                </div>
              </div>

              {openId === ex.id && (
                <div className="border-t border-gray-100 p-4 overflow-x-auto">
                  {(attempts[ex.id] ?? []).length === 0 ? (
                    <p className="text-xs text-gray-500">Chưa có lượt thi nào.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-2 pr-3">Thí sinh</th>
                          <th className="pr-3">Trạng thái</th>
                          <th className="pr-3">Đúng/Tổng</th>
                          <th className="pr-3">Điểm (0–180)</th>
                          <th>Chấm điểm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts[ex.id].map((a) => (
                          <tr key={a.id} className="border-t border-gray-100">
                            <td className="py-2 pr-3">{a.userEmail}</td>
                            <td className="pr-3">{a.status}</td>
                            <td className="pr-3">
                              {a.rawCorrect ?? "–"}/{a.rawTotal ?? "–"}
                            </td>
                            <td className="pr-3 font-bold">{a.internalScore ?? "–"}</td>
                            <td>
                              {a.status === "IN_PROGRESS" ? (
                                <span className="text-gray-400">Đang làm bài</span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={busyId === a.id}
                                    onClick={() => regrade(ex.id, a.id, false)}
                                    className="px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
                                  >
                                    Chấm lại
                                  </button>
                                  <input
                                    aria-label="Điểm thủ công"
                                    inputMode="numeric"
                                    placeholder="0–180"
                                    value={scoreDraft[a.id] ?? ""}
                                    onChange={(e) => setScoreDraft((p) => ({ ...p, [a.id]: e.target.value }))}
                                    className="w-16 px-2 py-1 rounded-lg border border-gray-300"
                                  />
                                  <button
                                    type="button"
                                    disabled={busyId === a.id}
                                    onClick={() => regrade(ex.id, a.id, true)}
                                    className="px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                                  >
                                    Đặt điểm
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
