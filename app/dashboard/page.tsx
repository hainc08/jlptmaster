"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Layers } from "lucide-react";
import { LevelSelector } from "../components/ui/LevelSelector";
import { ProgressRing } from "../components/ui/ProgressRing";
import { StateView } from "../components/ui/StateView";
import { WeekBars } from "../components/ui/WeekBars";
import { useApi } from "../components/useApi";
import { useStoredValue } from "../components/stored-value";
import { meetsReference } from "../components/scoring";

type ActivitySummary = {
  todayMinutes: number;
  dailyGoalMinutes: number;
  streakDays: number;
  week: { day: string; minutes: number | null }[];
};
type Overview = {
  totalLessonsCount: number;
  completedLessonsCount: number;
  dueReviewsCount: number;
  nextLesson?: { id: string; slug: string; titleVi: string } | null;
  recentAttempts?: { id: string; examTitle: string; internalScore: number | null; submittedAt: string | null }[];
  activity?: ActivitySummary;
};
type Roadmap = { step: number; skill: string; percent: number; actionVi: string; href: string }[];

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const noop = () => () => {};

function greeting(hour: number): string {
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Frame 02 / 02D. Widgets without real data are not rendered (no placeholder numbers). */
export default function DashboardPage() {
  const hour = useSyncExternalStore(noop, () => new Date().getHours(), () => null);
  const email = useStoredValue("jlpt_auth_email");
  const name = email ? email.split("@")[0] : null;
  const api = useApi<{ data: Overview }>("/api/v1/progress/overview");
  const skills = useApi<{ data?: { roadmap?: Roadmap } }>("/api/v1/progress/skills");

  const title = hour === null ? "Xin chào" : greeting(hour);

  const header = (
    <div className="flex flex-col gap-1">
      <h1 className="text-[22px] font-bold">
        {title}
        {name ? `, ${name}` : ""}
      </h1>
    </div>
  );

  if (api.status !== "ok") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-4">
        {header}
        {api.status === "loading" ? (
          <StateView kind="loading" title="Đang tải trang chủ" />
        ) : (
          <StateView kind="error" title="Không tải được tiến độ học" body="Kiểm tra kết nối rồi thử lại." action={{ label: "Thử lại", onClick: api.retry }} />
        )}
      </div>
    );
  }

  const o = api.data.data;
  const a = o.activity;
  const latest = o.recentAttempts?.[0];
  const roadmap = skills.status === "ok" ? skills.data.data?.roadmap ?? [] : [];
  // future days are null, so today is the last day that has a value
  const todayIdx = a ? a.week.reduce((last, d, i) => (d.minutes !== null ? i : last), 0) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-4">
      {header}
      {a && (
        <p className="text-sm text-muted -mt-3">
          {a.todayMinutes >= a.dailyGoalMinutes
            ? "Bạn đã đạt mục tiêu hôm nay."
            : `Còn ${a.dailyGoalMinutes - a.todayMinutes} phút nữa là đạt mục tiêu hôm nay.`}
        </p>
      )}
      <LevelSelector />

      <div className="grid gap-4 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {a && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col items-center gap-2">
              <ProgressRing value={a.todayMinutes} max={a.dailyGoalMinutes} label={`${a.todayMinutes} trên ${a.dailyGoalMinutes} phút hôm nay`} size={88}>
                <b className="text-lg">{a.todayMinutes}</b>
              </ProgressRing>
              <p className="text-sm text-muted text-center">/{a.dailyGoalMinutes} phút hôm nay</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col items-center justify-center gap-1">
              <Flame size={28} aria-hidden="true" className="text-accent" />
              <b className="text-3xl">{a.streakDays}</b>
              <p className="text-sm text-muted">ngày liên tiếp</p>
            </div>
          </div>
        )}

        {o.nextLesson && (
          <section className="rounded-2xl border border-border bg-primary-container text-on-primary-container p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide">Tiếp tục học</p>
            <p className="text-lg font-bold">{o.nextLesson.titleVi}</p>
            <p className="text-sm">
              Đã hoàn thành {o.completedLessonsCount}/{o.totalLessonsCount} bài N5
            </p>
            <Link
              href={`/learn/n5/${o.nextLesson.slug}`}
              className="self-start min-h-12 px-5 inline-flex items-center gap-2 rounded-xl bg-primary text-white font-semibold text-sm"
            >
              <BookOpen size={18} aria-hidden="true" /> Học tiếp
            </Link>
          </section>
        )}

        {o.dueReviewsCount > 0 && (
          <Link href="/flashcards" className="rounded-2xl border border-border bg-surface p-4 flex items-center gap-3 hover:bg-surface-hover">
            <Layers size={24} aria-hidden="true" className="text-primary flex-none" />
            <span className="flex-1">
              <span className="font-semibold">
                Ôn tập <b>{o.dueReviewsCount}</b> từ
              </span>
              <span className="block text-sm text-muted">Thẻ nhớ đến hạn hôm nay</span>
            </span>
            <ArrowRight size={18} aria-hidden="true" className="text-muted" />
          </Link>
        )}

        {a && (
          <section className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
            <h2 className="font-bold">Tuần này</h2>
            <WeekBars days={a.week.map((d, i) => ({ label: DAY_LABELS[i] ?? d.day, minutes: d.minutes }))} todayIndex={todayIdx} />
          </section>
        )}

        <section className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
          <h2 className="font-bold">Thi thử gần nhất</h2>
          {latest && typeof latest.internalScore === "number" ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span>
                  {latest.examTitle} · {fmtDate(latest.submittedAt)}
                </span>
                <b>{`${latest.internalScore}/180`}</b>
              </div>
              <span
                className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${
                  meetsReference(latest.internalScore, 180) ? "bg-success-bg text-success-text" : "bg-warning-bg text-warning-text"
                }`}
              >
                {meetsReference(latest.internalScore, 180) ? "Có khả năng đạt · ước tính" : "Chưa đạt · ước tính"}
              </span>
              <Link href={`/results/${latest.id}`} className="min-h-12 rounded-xl border border-outline font-semibold text-sm grid place-items-center">
                Xem kết quả
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">Bạn chưa làm đề thi thử nào.</p>
              <Link href="/mock-exams" className="min-h-12 rounded-xl border border-outline font-semibold text-sm grid place-items-center">
                Làm đề N5 đầu tiên
              </Link>
            </>
          )}
        </section>

        <section id="roadmap" className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3 lg:col-span-2">
          <h2 className="font-bold">Lộ trình ôn tập cho bạn</h2>
          {roadmap.length === 0 ? (
            <p className="text-sm text-muted">Chưa có kỹ năng yếu nào được ghi nhận. Làm một bài thi thử để hệ thống đánh giá.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {roadmap.map((r) => (
                <li key={r.skill} className="rounded-xl bg-background p-3 flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {r.step}. {r.skill} · {r.percent}%
                    </span>
                    <span className="block text-xs text-muted">{r.actionVi}</span>
                  </span>
                  <Link href={r.href} className="min-h-12 px-3 inline-flex items-center text-sm font-semibold text-primary flex-none">
                    Ôn ngay
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
