"use client";

import React, { useState } from "react";
import { useApi } from "../../components/useApi";
import Link from "next/link";
import { BookMarked, ChevronRight, FileText, Layers, Target } from "lucide-react";
import { LevelSelector } from "../../components/ui/LevelSelector";
import { StateView } from "../../components/ui/StateView";
import { useT } from "../../components/i18n";

export type LessonSummary = {
  id: string;
  slug: string;
  titleVi: string;
  position: number;
  minutesEstimate?: number;
  progressStatus?: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
};

const STATUS_CHIP: Record<NonNullable<LessonSummary["progressStatus"]>, { label: string; cls: string }> = {
  COMPLETED: { label: "Hoàn thành", cls: "bg-success-bg text-success-text" },
  IN_PROGRESS: { label: "Đang học", cls: "bg-primary-container text-on-primary-container" },
  NOT_STARTED: { label: "Chưa học", cls: "bg-surface-hover text-muted" },
};

const TOOLS = [
  { href: "/vocabulary", label: "Sổ tay từ vựng", icon: BookMarked },
  { href: "/grammar", label: "Ngữ pháp", icon: FileText },
  { href: "/flashcards", label: "Thẻ nhớ SRS", icon: Layers },
  { href: "/practice", label: "Luyện tập", icon: Target },
];

type Tab = "vocab" | "grammar" | "reading";

/** Frame 03: N5 path. Units come from the courses API; status chips appear only when the API sends them. */
export default function N5CoursePage() {
  const t = useT();
  const api = useApi<{ data?: { lessons?: LessonSummary[] }[] }>("/api/v1/courses?level=N5");
  const [tab, setTab] = useState<Tab>("vocab");
  const failed = api.status === "error";
  const lessons =
    api.status === "ok"
      ? (api.data.data ?? []).flatMap((c) => c.lessons ?? []).sort((a, b) => a.position - b.position)
      : null;
  const load = api.retry;

  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`relative flex-1 h-12 font-semibold text-sm ${
        tab === id
          ? "text-primary after:absolute after:left-4 after:right-4 after:bottom-0 after:h-[3px] after:rounded-t after:bg-primary"
          : "text-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 pb-6 flex flex-col gap-4">
      <div role="tablist" aria-label="Nội dung" className="flex -mx-4 px-2 bg-surface border-b border-border">
        {tabBtn("vocab", t("learn.tab.vocab"))}
        {tabBtn("grammar", t("learn.tab.grammar"))}
        {tabBtn("reading", t("learn.tab.reading"))}
      </div>

      <h1 className="text-[22px] font-bold text-foreground">{t("learn.title")}</h1>
      <LevelSelector />

      {tab === "vocab" &&
        (failed ? (
          <StateView kind="error" title="Không tải được lộ trình" body="Kiểm tra kết nối rồi thử lại." action={{ label: "Thử lại", onClick: load }} />
        ) : lessons === null ? (
          <StateView kind="loading" title="Đang tải lộ trình" />
        ) : lessons.length === 0 ? (
          <StateView kind="empty" title="Chưa có bài học N5 nào được xuất bản" />
        ) : (
          <ul aria-label="Danh sách bài học" className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
            {lessons.map((l) => {
              const chip = l.progressStatus ? STATUS_CHIP[l.progressStatus] : null;
              const done = l.progressStatus === "COMPLETED";
              return (
                <li key={l.id}>
                  <Link
                    href={`/learn/n5/${l.slug}`}
                    className={`flex items-center gap-3 px-4 py-3 min-h-16 hover:bg-surface-hover ${
                      l.progressStatus === "IN_PROGRESS" ? "bg-primary-container/40" : ""
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`grid place-items-center w-10 h-10 rounded-full flex-none font-bold text-sm ${
                        done ? "bg-success-bg text-success-text" : "bg-primary-container text-on-primary-container"
                      }`}
                    >
                      {done ? "✓" : l.position}
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="font-semibold text-foreground">{l.titleVi}</span>
                      {l.minutesEstimate ? <span className="text-xs text-muted">{l.minutesEstimate} phút</span> : null}
                    </span>
                    {chip && <span className={`flex-none text-xs font-semibold px-2.5 py-1 rounded-full ${chip.cls}`}>{chip.label}</span>}
                    <ChevronRight size={18} aria-hidden="true" className="text-muted flex-none" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}

      {tab === "grammar" && (
        <StateView
          kind="empty"
          title="Ngữ pháp N5"
          body="Xem các mẫu câu N5 kèm cách chia và ví dụ trong sổ tay ngữ pháp."
          action={{ label: "Mở sổ tay ngữ pháp", href: "/grammar" }}
        />
      )}
      {tab === "reading" && (
        <StateView
          kind="empty"
          title="Đọc hiểu N5"
          body="Luyện các câu hỏi đọc hiểu có giải thích trong phần luyện tập."
          action={{ label: "Luyện đọc hiểu", href: "/practice" }}
        />
      )}

      <section aria-labelledby="tools-h" className="flex flex-col gap-2">
        <h2 id="tools-h" className="font-bold text-foreground">{t("learn.tools")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TOOLS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="min-h-14 flex items-center gap-2 px-3 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground hover:bg-surface-hover"
            >
              <Icon size={18} aria-hidden="true" className="text-primary flex-none" />
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
