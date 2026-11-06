"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Flag, Loader2, X } from "lucide-react";
import { ListeningPlayer } from "../../components/ListeningPlayer";
import { FuriganaSwitch } from "../../components/shell/TopBar";
import { StateView } from "../../components/ui/StateView";
import { useApi } from "../../components/useApi";

type Question = {
  id: string;
  prompt: string;
  sectionTitleVi?: string;
  context?: { id: string; kind: "READING" | "LISTENING"; text: string };
  options: { id: string; text: string }[];
};
type Attempt = {
  id: string;
  title?: string;
  status: string;
  remainingSeconds: number;
  questions: Question[];
  answers?: Record<string, string>;
};

const flagKey = (id: string) => `jlpt.flags.${id}`;

function readFlags(attemptId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(window.sessionStorage.getItem(flagKey(attemptId)) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function fmt(sec: number) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(r).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Frames 06 / 06b / 06D: timed exam with flags, a question navigator and a guarded submit. */
export default function TimedExamRoomPage() {
  const params = useParams();
  const attemptId = String(params?.attemptId ?? "");
  const api = useApi<{ data: Attempt }>(attemptId ? `/api/v1/attempts/${encodeURIComponent(attemptId)}` : null);

  if (api.status === "loading") {
    return (
      <div className="max-w-xl mx-auto p-4">
        <StateView kind="loading" title="Đang tải đề thi" />
      </div>
    );
  }
  if (api.status === "error" || !api.data.data?.questions?.length) {
    const msg =
      api.httpStatus === 401
        ? "Bạn cần đăng nhập để vào phòng thi."
        : api.httpStatus === 403
        ? "Lượt thi này không thuộc về tài khoản của bạn."
        : api.status === "ok"
        ? "Lượt thi này không có câu hỏi."
        : "Không tải được đề thi.";
    return (
      <div className="max-w-xl mx-auto p-4">
        <StateView kind="error" title={msg} action={{ label: "Về danh sách đề", href: "/mock-exams" }} />
      </div>
    );
  }
  return <ExamRoom key={attemptId} attempt={api.data.data} attemptId={attemptId} />;
}

function ExamRoom({ attempt, attemptId }: { attempt: Attempt; attemptId: string }) {
  const router = useRouter();
  const questions = attempt.questions;
  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(attempt.answers ?? {});
  const [flags, setFlags] = useState<string[]>(() => readFlags(attemptId));
  const [deadline] = useState(() => Date.now() + Math.max(0, attempt.remainingSeconds) * 1000);
  const [timeLeft, setTimeLeft] = useState(Math.max(0, attempt.remainingSeconds));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveText, setSaveText] = useState("");
  const finished = useRef(false);
  const dirty = useRef(false);

  const finishOnce = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    setSubmitting(true);
    setDialogOpen(false);
    try {
      await fetch(`/api/v1/attempts/${encodeURIComponent(attemptId)}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
    } catch {
      // the server also closes expired attempts; the result page shows what was saved
    }
    try {
      window.sessionStorage.removeItem(flagKey(attemptId));
    } catch {}
    router.push(`/results/${attemptId}`);
  }, [answers, attemptId, router]);

  const finishRef = useRef(finishOnce);
  useEffect(() => {
    finishRef.current = finishOnce;
  }, [finishOnce]);

  // Countdown from a fixed deadline so a slow tab never drifts.
  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) void finishRef.current();
    };
    const id = window.setInterval(tick, 1000);
    if (deadline <= Date.now()) window.setTimeout(tick, 0);
    return () => window.clearInterval(id);
  }, [deadline]);

  // Debounced autosave of answers.
  useEffect(() => {
    if (!dirty.current) return;
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/attempts/${encodeURIComponent(attemptId)}/answers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        const time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setSaveText(res.ok ? `Đã lưu tự động lúc ${time}` : "Chưa lưu được — kiểm tra kết nối mạng");
      } catch {
        setSaveText("Chưa lưu được — kiểm tra kết nối mạng");
      }
    }, 600);
    return () => window.clearTimeout(id);
  }, [answers, attemptId]);

  const q = questions[index];
  const answered = questions.filter((x) => answers[x.id]).length;
  const flagged = flags.length;

  const choose = (optionId: string) => {
    if (finished.current) return;
    dirty.current = true;
    setAnswers((a) => ({ ...a, [q.id]: optionId }));
  };

  const toggleFlag = () => {
    setFlags((f) => {
      const next = f.includes(q.id) ? f.filter((x) => x !== q.id) : [...f, q.id];
      try {
        window.sessionStorage.setItem(flagKey(attemptId), JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isFlagged = flags.includes(q.id);
  const low = timeLeft <= 300;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 h-16 flex items-center gap-2 pl-1 pr-2 bg-surface border-b border-border">
        <Link href="/mock-exams" aria-label="Thoát phòng thi" className="grid place-items-center w-12 h-12 rounded-full text-muted hover:bg-surface-hover flex-none">
          <X size={22} aria-hidden="true" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{attempt.title ?? "Thi thử N5"}</p>
          <p className="text-xs text-muted">
            Câu {index + 1}/{total}
          </p>
        </div>
        <span
          role="timer"
          aria-label="Thời gian còn lại"
          className={`font-mono font-bold text-sm px-2.5 py-1.5 rounded-lg flex-none ${low ? "bg-accent-container text-danger-text" : "bg-surface-hover text-foreground"}`}
        >
          {fmt(timeLeft)}
        </span>
        <button
          type="button"
          disabled={submitting}
          onClick={() => setDialogOpen(true)}
          className="min-h-12 px-3 rounded-xl bg-primary text-white font-semibold text-sm flex-none disabled:opacity-60"
        >
          Nộp bài
        </button>
      </header>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-4 grid gap-4 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-muted truncate">{q.sectionTitleVi}</span>
            <div className="hidden sm:block"><FuriganaSwitch /></div>
          </div>
          {q.context?.kind === "READING" && (
            <div className="rounded-2xl border border-border bg-surface p-4 font-japanese leading-loose">{q.context.text}</div>
          )}
          {q.context?.kind === "LISTENING" && <ListeningPlayer trackId={q.context.id} text={q.context.text} />}
          <p className="text-xl font-bold font-japanese leading-relaxed">{q.prompt}</p>
          <div role="radiogroup" aria-label={`Đáp án câu ${index + 1}`} className="flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const sel = answers[q.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => choose(opt.id)}
                  className={`min-h-14 w-full flex items-center gap-3 px-4 rounded-xl border-2 text-left ${
                    sel ? "border-primary bg-primary-container text-on-primary-container font-semibold" : "border-border bg-surface"
                  }`}
                >
                  <span className={`grid place-items-center w-7 h-7 rounded-full text-xs font-bold flex-none ${sel ? "bg-primary text-white" : "border border-outline"}`}>
                    {i + 1}
                  </span>
                  <span className="font-japanese">{opt.text}</span>
                </button>
              );
            })}
          </div>
          {saveText && <p className="text-xs text-muted" aria-live="polite">{saveText}</p>}

          <div className="grid grid-cols-3 gap-2 mt-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="min-h-12 rounded-xl border border-outline font-semibold text-sm inline-flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft size={18} aria-hidden="true" /> Trước
            </button>
            <button
              type="button"
              aria-pressed={isFlagged}
              onClick={toggleFlag}
              className={`min-h-12 rounded-xl border font-semibold text-sm inline-flex items-center justify-center gap-1 ${
                isFlagged ? "border-accent bg-accent-container text-danger-text" : "border-outline"
              }`}
            >
              <Flag size={16} aria-hidden="true" /> Đánh dấu
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              className="min-h-12 rounded-xl border border-outline font-semibold text-sm inline-flex items-center justify-center gap-1 disabled:opacity-40"
            >
              Tiếp <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </article>

        <aside aria-label="Bảng câu hỏi" className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">Bảng câu hỏi</span>
            <span className="text-muted">
              {answered}/{total}
            </span>
          </div>
          <div className="grid grid-cols-5 lg:grid-cols-8 gap-2">
            {questions.map((x, i) => {
              const a = !!answers[x.id];
              const f = flags.includes(x.id);
              const cur = i === index;
              const label = `Câu ${i + 1}${a ? ", đã trả lời" : ""}${f ? ", đã đánh dấu" : ""}`;
              return (
                <button
                  key={x.id}
                  type="button"
                  aria-label={label}
                  aria-current={cur ? "step" : undefined}
                  onClick={() => setIndex(i)}
                  className={`relative h-11 lg:h-8 rounded-lg text-xs font-semibold ${
                    a ? "bg-primary text-white" : "bg-surface-hover text-foreground"
                  } ${cur ? "ring-2 ring-accent ring-offset-1" : ""}`}
                >
                  {i + 1}
                  {f && <span aria-hidden="true" className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary" />Đã trả lời ({answered})</li>
            <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-surface-hover border border-border" />Chưa trả lời ({total - answered})</li>
            <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" />Đánh dấu ({flagged})</li>
          </ul>
        </aside>
      </div>

      {dialogOpen && (
        <SubmitDialog
          answered={answered}
          unanswered={total - answered}
          flagged={flagged}
          submitting={submitting}
          onCancel={() => setDialogOpen(false)}
          onSubmit={() => void finishOnce()}
        />
      )}
      {submitting && !dialogOpen && (
        <div role="status" className="fixed inset-x-0 bottom-4 mx-auto w-fit px-4 py-2 rounded-full bg-foreground text-white text-sm flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Đang nộp bài…
        </div>
      )}
    </div>
  );
}

function SubmitDialog({
  answered,
  unanswered,
  flagged,
  submitting,
  onCancel,
  onSubmit,
}: {
  answered: number;
  unanswered: number;
  flagged: number;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const keepRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    keepRef.current?.focus();
  }, []);
  const stat = (id: string, n: number, label: string, cls: string) => (
    <div className={`rounded-xl p-3 text-center ${cls}`}>
      <p data-testid={id} className="text-2xl font-bold">{n}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        className="w-full max-w-md rounded-3xl bg-surface p-5 flex flex-col gap-4"
      >
        <h2 id="submit-title" className="text-lg font-bold">Nộp bài thi?</h2>
        <div className="grid grid-cols-3 gap-2">
          {stat("count-answered", answered, "Đã trả lời", "bg-primary-container text-on-primary-container")}
          {stat("count-unanswered", unanswered, "Chưa trả lời", "bg-surface-hover text-foreground")}
          {stat("count-flagged", flagged, "Đánh dấu", "bg-accent-container text-danger-text")}
        </div>
        {unanswered > 0 && <p className="text-sm text-danger-text">Còn {unanswered} câu bạn chưa chọn đáp án.</p>}
        <div className="grid grid-cols-2 gap-2">
          <button ref={keepRef} type="button" onClick={onCancel} className="min-h-12 rounded-xl border border-outline font-semibold text-sm">
            Tiếp tục làm bài
          </button>
          <button type="button" disabled={submitting} onClick={onSubmit} className="min-h-12 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-60">
            Nộp bài
          </button>
        </div>
      </div>
    </div>
  );
}
