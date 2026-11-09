"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { ProgressRing } from "../../components/ui/ProgressRing";
import { StateView } from "../../components/ui/StateView";
import { useApi } from "../../components/useApi";
import { useT } from "../../components/i18n";
import { REFERENCE_MARK, REFERENCE_MAX, SCORE_DISCLAIMER, meetsReference } from "../../components/scoring";

type ItemReview = {
  questionId: string;
  questionNumber: number;
  prompt: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  explanationVi?: string;
  options: { id: string; text: string }[];
};
type SkillStat = { skill: string; correct: number; total: number; percent: number };
type WeakSkill = SkillStat & { recommendationVi: string; remedialHref: string };
type Result = {
  attemptId: string;
  examTitle?: string;
  rawCorrect?: number;
  rawTotal?: number;
  internalScore: number;
  maxScore: number;
  disclaimerVi?: string;
  skillBreakdown?: SkillStat[];
  weakSkills?: WeakSkill[];
  itemReviews?: ItemReview[];
};

/** Frame 07: estimated score, reference mark, skills, and the questions to review. */
export default function ExamResultsPage() {
  const t = useT();
  const params = useParams();
  const attemptId = String(params?.attemptId ?? "");
  const api = useApi<{ data: Result }>(attemptId ? `/api/v1/attempts/${encodeURIComponent(attemptId)}/result` : null);
  const [showAll, setShowAll] = useState(false);

  if (api.status === "loading") {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <StateView kind="loading" title="Đang tải kết quả" />
      </div>
    );
  }
  if (api.status === "error") {
    const title =
      api.httpStatus === 409 ? "Bài thi chưa nộp nên chưa có kết quả" : api.httpStatus === 403 ? "Kết quả này không thuộc tài khoản của bạn" : "Không tải được kết quả";
    return (
      <div className="max-w-3xl mx-auto p-4">
        <StateView kind="error" title={title} action={api.httpStatus === 409 || api.httpStatus === 403 ? { label: "Về danh sách đề", href: "/mock-exams" } : { label: "Thử lại", onClick: api.retry }} />
      </div>
    );
  }

  const r = api.data.data;
  const max = r.maxScore || REFERENCE_MAX;
  const meets = meetsReference(r.internalScore, max);
  const wrong = (r.itemReviews ?? []).filter((i) => !i.isCorrect);
  const visible = showAll ? wrong : wrong.slice(0, 3);
  const optText = (i: ItemReview, id: string | null) => (id ? i.options.find((o) => o.id === id)?.text ?? "—" : "Chưa trả lời");

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-4">
      <h1 className="text-[22px] font-bold">{t("result.title")}</h1>
      {r.examTitle && <p className="text-sm text-muted -mt-3">{r.examTitle}</p>}

      <section className="rounded-2xl border border-border bg-surface p-5 flex items-center gap-5">
        <ProgressRing value={r.internalScore} max={max} label={`Điểm ước tính ${r.internalScore} trên ${max}`} size={112}>
          <span className="flex flex-col leading-tight">
            <b className="text-2xl">{r.internalScore}</b>
            <span className="text-xs text-muted">/{max}</span>
          </span>
        </ProgressRing>
        <div className="flex flex-col gap-2 min-w-0">
          <p className="font-bold">Điểm ước tính</p>
          <span
            className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${
              meets ? "bg-success-bg text-success-text" : "bg-warning-bg text-warning-text"
            }`}
          >
            {meets ? "Có khả năng đạt · ước tính" : "Chưa đạt · ước tính"}
          </span>
          <p className="text-sm text-muted">
            Mốc tham khảo: {REFERENCE_MARK}/{REFERENCE_MAX}
          </p>
          {typeof r.rawCorrect === "number" && typeof r.rawTotal === "number" && (
            <p className="text-sm text-muted">
              Đúng {r.rawCorrect}/{r.rawTotal} câu
            </p>
          )}
        </div>
      </section>
      <p className="rounded-xl bg-warning-bg text-warning-text p-3 text-sm">{SCORE_DISCLAIMER}</p>

      {(r.skillBreakdown?.length ?? 0) > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
          <h2 className="font-bold">Điểm theo kỹ năng</h2>
          <ul className="flex flex-col gap-3">
            {r.skillBreakdown!.map((s) => (
              <li key={s.skill} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{s.skill}</span>
                  <span className="text-muted">{`${s.correct}/${s.total} · ${s.percent}%`}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-hover overflow-hidden" aria-hidden="true">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, s.percent))}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(r.weakSkills?.length ?? 0) > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
          <h2 className="font-bold">Kỹ năng cần cải thiện</h2>
          <ul className="flex flex-col gap-2">
            {r.weakSkills!.map((w) => (
              <li key={w.skill} className="rounded-xl bg-background p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">
                    {w.skill} · {w.percent}%
                  </p>
                  <p className="text-xs text-muted">{w.recommendationVi}</p>
                </div>
                <Link href={w.remedialHref} className="min-h-12 px-3 inline-flex items-center gap-1 text-sm font-semibold text-primary flex-none">
                  Ôn ngay <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
        <h2 className="font-bold">Câu sai cần xem lại</h2>
        {wrong.length === 0 ? (
          <p className="text-sm text-success-text flex items-center gap-2">
            <CheckCircle2 size={18} aria-hidden="true" /> Bạn không sai câu nào
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {visible.map((i) => (
                <li key={i.questionId} data-testid="wrong-item" className="rounded-xl bg-background p-3 flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-muted">Câu {i.questionNumber}</p>
                  <p className="font-japanese font-semibold">{i.prompt}</p>
                  <p className="text-sm text-danger-text flex items-center gap-1.5">
                    <XCircle size={16} aria-hidden="true" className="flex-none" />
                    <span>Bạn chọn: <span className="font-japanese">{optText(i, i.selectedOptionId)}</span></span>
                  </p>
                  <p className="text-sm text-success-text flex items-center gap-1.5">
                    <CheckCircle2 size={16} aria-hidden="true" className="flex-none" />
                    <span>Đáp án đúng: <span className="font-japanese">{optText(i, i.correctOptionId)}</span></span>
                  </p>
                  {i.explanationVi && <p className="text-sm text-muted">{i.explanationVi}</p>}
                </li>
              ))}
            </ul>
            {!showAll && wrong.length > 3 && (
              <button type="button" onClick={() => setShowAll(true)} className="min-h-12 rounded-xl border border-outline font-semibold text-sm">
                Xem tất cả {wrong.length} câu
              </button>
            )}
          </>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/mock-exams" className="min-h-12 rounded-xl border border-outline font-semibold text-sm grid place-items-center">
          Về danh sách đề
        </Link>
        <Link href="/dashboard" className="min-h-12 rounded-xl bg-primary text-white font-semibold text-sm grid place-items-center">
          Về trang chủ
        </Link>
      </div>

      {r.disclaimerVi && <p className="text-[11px] text-muted leading-relaxed">{r.disclaimerVi}</p>}
    </div>
  );
}
