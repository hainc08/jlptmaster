"use client";

import React, { useCallback, useRef, useState } from "react";
import { useApi } from "../../../components/useApi";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, X } from "lucide-react";
import { RubyText } from "../../../components/RubyText";
import { AudioButton } from "../../../components/AudioButton";
import { FuriganaSwitch } from "../../../components/shell/TopBar";
import { StateView } from "../../../components/ui/StateView";

type Vocab = {
  contentItemId: string;
  surface: string;
  reading: string;
  meaningVi: string;
  pos: string;
  exampleJa: string;
  exampleVi: string;
};
type LessonData = {
  id: string;
  slug: string;
  titleVi: string;
  position: number;
  completionStatus?: string;
  contentItems?: { kind: string; vocabulary?: Vocab | null }[];
};

const KANA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split("");

/** Frame 04: one vocabulary card at a time. Finishing the last card records completion once. */
export default function LessonDetailPage() {
  const params = useParams();
  const slug = String(params?.lessonSlug ?? "");
  const router = useRouter();
  const api = useApi<{ data: LessonData }>(slug ? `/api/v1/lessons/${encodeURIComponent(slug)}` : null);
  const lesson = api.status === "ok" ? api.data.data : null;
  const failed = api.status === "error";
  const load = api.retry;
  const [index, setIndex] = useState(0);
  const [known, setKnown] = useState(0);
  const [review, setReview] = useState(0);
  const [completedNow, setCompleted] = useState(false);
  const completed = completedNow || lesson?.completionStatus === "COMPLETED";
  const [saveError, setSaveError] = useState(false);
  const completing = useRef(false);

  const complete = useCallback(async () => {
    if (completing.current) return;
    completing.current = true;
    setSaveError(false);
    try {
      const res = await fetch(`/api/v1/lessons/${encodeURIComponent(slug)}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.status === 401) {
        completing.current = false;
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setCompleted(true);
    } catch {
      setSaveError(true);
      completing.current = false;
    }
  }, [slug, router]);

  const cards = (lesson?.contentItems ?? []).flatMap((c) => (c.kind === "VOCAB" && c.vocabulary ? [c.vocabulary] : []));
  const total = cards.length;
  const finished = total > 0 && index >= total;

  const next = (wasKnown: boolean) => {
    if (finished) return;
    if (wasKnown) setKnown((k) => k + 1);
    else setReview((r) => r + 1);
    const n = index + 1;
    setIndex(n);
    if (n >= total) void complete();
  };

  const card = cards[Math.min(index, total - 1)];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 h-16 flex items-center gap-2 pl-1 pr-2 bg-surface border-b border-border">
        <Link href="/learn/n5" aria-label="Thoát bài học" className="grid place-items-center w-12 h-12 rounded-full text-muted hover:bg-surface-hover">
          <X size={22} aria-hidden="true" />
        </Link>
        <h1 className="flex-1 min-w-0 truncate font-bold">{lesson?.titleVi ?? "Bài học"}</h1>
        <FuriganaSwitch />
      </header>

      <div className="flex-1 w-full max-w-xl mx-auto px-4 py-4 flex flex-col gap-4">
        {failed ? (
          <StateView kind="error" title="Không tải được bài học" action={{ label: "Thử lại", onClick: load }} />
        ) : !lesson ? (
          <StateView kind="loading" title="Đang tải bài học" />
        ) : total === 0 ? (
          <>
            {slug.includes("kana") && (
              <section className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
                <h2 className="font-bold">Bảng chữ cái Hiragana cơ bản</h2>
                <div className="grid grid-cols-5 gap-2">
                  {KANA.map((k) => (
                    <div key={k} className="rounded-xl border border-border bg-background p-2 flex flex-col items-center gap-1">
                      <span className="text-2xl font-bold font-japanese">{k}</span>
                      <AudioButton textToSpeak={k} size={14} className="p-1" />
                    </div>
                  ))}
                </div>
              </section>
            )}
            {!slug.includes("kana") && (
              <StateView kind="empty" title="Bài này chưa có thẻ từ vựng" body="Nội dung đang được biên soạn." />
            )}
            <CompleteButton completed={completed} onClick={complete} />
          </>
        ) : finished ? (
          <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col items-center text-center gap-3">
            <CheckCircle2 size={40} className="text-success-text" aria-hidden="true" />
            <p className="font-bold text-lg">{completed ? "Đã hoàn thành bài học" : "Đang lưu tiến độ…"}</p>
            <p className="text-sm text-muted">
              Đã thuộc {known} · Cần ôn {review}
            </p>
            {saveError && (
              <div role="alert" className="text-sm text-danger-text">
                Chưa lưu được tiến độ.{" "}
                <button type="button" className="underline font-semibold min-h-12" onClick={complete}>
                  Thử lại
                </button>
              </div>
            )}
            <Link href="/learn/n5" className="min-h-12 px-5 inline-flex items-center rounded-xl bg-primary text-white font-semibold text-sm">
              Về lộ trình N5
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">
                  Thẻ {index + 1} / {total}
                </span>
                <span className="text-muted">
                  Đã thuộc <b className="text-success-text">{known}</b> · Cần ôn <b className="text-accent">{review}</b>
                </span>
              </div>
              <div aria-hidden="true" className="flex gap-1">
                {cards.map((c, i) => (
                  <span key={c.contentItemId} className={`h-1.5 flex-1 rounded-full ${i < index ? "bg-primary" : i === index ? "bg-accent" : "bg-border"}`} />
                ))}
              </div>
            </div>

            <article className="rounded-2xl border border-border bg-surface p-5 flex flex-col items-center gap-3 text-center">
              <div className="self-stretch flex justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container">{card.pos}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-hover text-muted">N5</span>
              </div>
              <p className="text-5xl font-bold py-2">
                <RubyText kanji={card.surface} reading={card.reading} />
              </p>
              <p className="font-japanese text-muted">{card.reading}</p>
              <AudioButton textToSpeak={card.surface} />
              <p className="text-xl font-bold text-foreground">{card.meaningVi}</p>
              {card.exampleJa && (
                <div className="self-stretch rounded-xl bg-background p-3 text-left">
                  <p className="font-japanese">{card.exampleJa}</p>
                  <p className="text-sm text-muted">{card.exampleVi}</p>
                </div>
              )}
            </article>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => next(false)} className="min-h-12 rounded-xl border border-outline font-semibold inline-flex items-center justify-center gap-2">
                <RotateCcw size={18} aria-hidden="true" />
                Ôn lại
              </button>
              <button type="button" onClick={() => next(true)} className="min-h-12 rounded-xl bg-primary text-white font-semibold inline-flex items-center justify-center gap-2">
                <CheckCircle2 size={18} aria-hidden="true" />
                Đã thuộc
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CompleteButton({ completed, onClick }: { completed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={completed}
      onClick={onClick}
      className={`min-h-12 rounded-xl font-semibold inline-flex items-center justify-center gap-2 ${
        completed ? "bg-success-bg text-success-text" : "bg-primary text-white"
      }`}
    >
      <CheckCircle2 size={18} aria-hidden="true" />
      {completed ? "Đã hoàn thành bài học" : "Đánh dấu hoàn thành"}
    </button>
  );
}
