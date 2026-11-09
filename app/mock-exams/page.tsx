"use client";

import React, { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Clock, FileText, Info, Lock, Trophy } from "lucide-react";
import { LevelSelector } from "../components/ui/LevelSelector";
import { StateView } from "../components/ui/StateView";
import { useApi } from "../components/useApi";
import { useT } from "../components/i18n";
import { SCORE_DISCLAIMER } from "../components/scoring";


interface ExamSummary {
  id: string;
  title: string;
  totalMinutes: number;
  totalQuestions: number;
  bestInternalScore?: number | null;
  attemptCount?: number;
}

/** Frame 05 / 05D: N5 mock exams; N4–N1 are one locked card. */
function Lobby() {
  const t = useT();
  const router = useRouter();
  const level = (useSearchParams().get("level") ?? "N5").toUpperCase();
  const locked = level !== "N5";
  const api = useApi<{ data?: ExamSummary[] }>(locked ? null : "/api/v1/exams?level=N5");
  const [startingId, setStartingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const startExam = useCallback(
    async (examId: string) => {
      setStartingId(examId);
      setMessage(null);
      try {
        const res = await fetch(`/api/v1/exams/${examId}/start`, { method: "POST" });
        if (res.status === 401) {
          router.push(`/login?redirect=${encodeURIComponent("/mock-exams")}`);
          return;
        }
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.data?.id) {
          setMessage(body?.error?.message || (res.status === 423 ? "Bộ đề đang bị khóa." : "Không thể bắt đầu bài thi."));
          return;
        }
        router.push(`/mock-exams/${body.data.id}`);
      } catch {
        setMessage("Lỗi kết nối khi bắt đầu bài thi.");
      } finally {
        setStartingId(null);
      }
    },
    [router]
  );

  const lockedCard = (
    <div className="rounded-2xl border-2 border-dashed border-border p-4 flex items-center gap-3 text-locked">
      <Lock size={20} aria-hidden="true" className="flex-none" />
      <div>
        <p className="font-semibold">{locked ? `${level} · Sắp ra mắt` : "N4–N1 · Sắp ra mắt"}</p>
        <p className="text-sm">Đề thi thử các cấp độ khác đang được biên soạn.</p>
      </div>
    </div>
  );

  const exams = api.status === "ok" ? api.data.data ?? [] : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-4">
      <h1 className="text-[22px] font-bold">{t("test.title")}</h1>
      <LevelSelector />
      <p className="flex items-start gap-2 rounded-xl bg-warning-bg text-warning-text p-3 text-sm">
        <Info size={18} aria-hidden="true" className="flex-none mt-0.5" />
        <span>
          <span>{SCORE_DISCLAIMER}</span> <span>Đáp án và lời giải chỉ hiển thị sau khi nộp bài.</span>
        </span>
      </p>

      {message && (
        <div role="alert" className="rounded-xl bg-danger-bg text-danger-text p-3 text-sm">
          {message}
        </div>
      )}

      {locked ? (
        lockedCard
      ) : api.status === "error" ? (
        <StateView kind="error" title="Không tải được danh sách đề" body="Kiểm tra kết nối rồi thử lại." action={{ label: "Thử lại", onClick: api.retry }} />
      ) : api.status === "loading" ? (
        <StateView kind="loading" title="Đang tải danh sách đề" />
      ) : (
        <>
          {exams.length === 0 ? (
            <StateView kind="empty" title="Hiện chưa có đề N5 nào đang mở" />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {exams.map((ex) => {
                const again = (ex.attemptCount ?? 0) > 0;
                return (
                  <li key={ex.id} className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
                    <h2 className="font-bold text-lg">{ex.title}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="inline-flex items-center gap-1"><Clock size={16} aria-hidden="true" /> {ex.totalMinutes} phút</span>
                      <span className="inline-flex items-center gap-1"><FileText size={16} aria-hidden="true" /> {ex.totalQuestions} câu</span>
                      <span className="inline-flex items-center gap-1">
                        <Trophy size={16} aria-hidden="true" /> Cao nhất:{" "}
                        {typeof ex.bestInternalScore === "number" ? `${ex.bestInternalScore}/180` : "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={startingId === ex.id}
                      onClick={() => startExam(ex.id)}
                      className="min-h-12 rounded-xl bg-primary text-white font-semibold text-sm inline-flex items-center justify-center gap-1 disabled:opacity-60"
                    >
                      {startingId === ex.id ? "Đang khởi tạo…" : again ? "Làm lại" : "Bắt đầu"}
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {lockedCard}
        </>
      )}
    </div>
  );
}

export default function MockExamsCatalogPage() {
  return (
    <Suspense fallback={null}>
      <Lobby />
    </Suspense>
  );
}
