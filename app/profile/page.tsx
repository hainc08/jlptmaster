"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useApi } from "../components/useApi";
import { useStoredValue } from "../components/stored-value";
import { useFurigana } from "../components/RubyText";
import { useLocale, useT, type Locale } from "../components/i18n";
import { StateView } from "../components/ui/StateView";
import { meetsReference } from "../components/scoring";

type HistoryItem = {
  id: string;
  examTitle: string;
  internalScore: number | null;
  maxScore: number;
  submittedAt: string | null;
  durationSeconds: number | null;
};
type Profile = { targetLevel: string; dailyGoalMinutes: number; furiganaDefault: boolean; uiLanguage: Locale };
type Overview = { totalReviewsCount?: number; activity?: { streakDays: number } };

const GOALS = [5, 10, 15, 20];

const ddmmyyyy = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

async function patchProfile(body: Partial<Profile>) {
  const res = await fetch("/api/v1/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(String(res.status));
}

/** Frame 09: account, stats, mock-test history and settings. */
export default function ProfilePage() {
  const t = useT();
  const router = useRouter();
  const me = useApi<{ data: { user: { email: string } } }>("/api/v1/auth/me");
  const hint = useStoredValue("jlpt_auth_email");
  const email = (me.status === "ok" ? me.data?.data?.user?.email : undefined) ?? hint;
  const name = email ? email.split("@")[0] : "Học viên";
  const initials = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "HV";

  const history = useApi<{ data: HistoryItem[] }>("/api/v1/attempts?limit=50");
  const overview = useApi<{ data: Overview }>("/api/v1/progress/overview");
  const profile = useApi<{ data: Profile }>("/api/v1/profile");

  const { showFurigana, setFurigana } = useFurigana();
  const { locale, setLocale } = useLocale();
  const [goalOverride, setGoal] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);

  const goal = goalOverride ?? (profile.status === "ok" ? profile.data.data.dailyGoalMinutes : null);
  const goalOptions = goal !== null && !GOALS.includes(goal) ? [...GOALS, goal].sort((a, b) => a - b) : GOALS;

  const save = (body: Partial<Profile>) => {
    setSaveError(false);
    patchProfile(body).catch(() => setSaveError(true));
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {}
    try {
      localStorage.removeItem("jlpt_auth_email");
      localStorage.removeItem("jlpt_auth_role");
      localStorage.removeItem("jlpt_auth_user_id");
    } catch {}
    router.push("/login");
  };

  const stats = [
    { label: "ngày liên tiếp", value: overview.status === "ok" ? overview.data.data.activity?.streakDays : undefined },
    { label: "Thẻ đã học", value: overview.status === "ok" ? overview.data.data.totalReviewsCount : undefined },
    { label: "Lần thi thử", value: history.status === "ok" ? history.data.data.length : undefined, capped: history.status === "ok" && history.data.data.length >= 50 },
  ];

  const seg = (selected: boolean) =>
    `min-h-12 px-3 rounded-xl border text-sm font-semibold ${
      selected ? "border-primary bg-primary-container text-on-primary-container" : "border-border bg-surface"
    }`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-4">
      <h1 className="sr-only">{t("profile.title")}</h1>
      <section className="rounded-2xl border border-border bg-surface p-4 flex items-center gap-4">
        <span aria-hidden="true" className="grid place-items-center w-14 h-14 rounded-full bg-primary text-white font-bold text-lg flex-none">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="font-bold text-lg truncate">{name}</p>
          {email && <p className="text-sm text-muted truncate">{email}</p>}
          <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container">Đang học N5</span>
        </div>
      </section>

      <section aria-label="Thống kê" className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface p-3 text-center">
            <p className="text-2xl font-bold">{typeof s.value === "number" ? `${s.value}${"capped" in s && s.capped ? "+" : ""}` : "—"}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-bold">{t("profile.history")}</h2>
        {history.status === "loading" ? (
          <StateView kind="loading" title="Đang tải lịch sử thi" />
        ) : history.status === "error" ? (
          <StateView kind="error" title="Không tải được lịch sử thi" action={{ label: "Thử lại", onClick: history.retry }} />
        ) : history.data.data.length === 0 ? (
          <StateView kind="empty" title="Bạn chưa làm đề thi thử nào" action={{ label: "Làm đề N5 đầu tiên", href: "/mock-exams" }} />
        ) : (
          <ul aria-label="Lịch sử thi thử" className="rounded-2xl border border-border bg-surface divide-y divide-border">
            {history.data.data.map((h) => {
              const score = h.internalScore ?? 0;
              const meets = meetsReference(score, h.maxScore);
              return (
                <li key={h.id}>
                  <Link href={`/results/${h.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-hover">
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{h.examTitle}</span>
                      <span className="block text-xs text-muted">
                        {ddmmyyyy(h.submittedAt)}
                        {h.durationSeconds !== null ? ` · ${Math.round(h.durationSeconds / 60)} phút` : ""}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1 flex-none">
                      <b>{`${score}/${h.maxScore}`}</b>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meets ? "bg-success-bg text-success-text" : "bg-warning-bg text-warning-text"}`}>
                        {meets ? "Có khả năng đạt · ước tính" : "Chưa đạt · ước tính"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-4">
        <h2 className="font-bold">{t("profile.settings")}</h2>
        {saveError && (
          <p role="alert" className="text-sm text-danger-text">
            Chưa lưu được cài đặt. Vui lòng thử lại.
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <span id="furi-label" className="text-sm font-semibold">Furigana mặc định</span>
          <button
            type="button"
            role="switch"
            aria-checked={showFurigana}
            aria-labelledby="furi-label"
            onClick={() => {
              const next = !showFurigana;
              setFurigana(next);
              save({ furiganaDefault: next });
            }}
            className={`relative w-14 h-8 rounded-full flex-none ${showFurigana ? "bg-primary" : "bg-outline"}`}
          >
            <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${showFurigana ? "left-7" : "left-1"}`} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span id="lang-label" className="text-sm font-semibold">Ngôn ngữ giao diện</span>
          <div role="radiogroup" aria-labelledby="lang-label" className="grid grid-cols-2 gap-2">
            {([
              ["vi", "Tiếng Việt"],
              ["en", "English"],
            ] as [Locale, string][]).map(([l, label]) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={locale === l}
                onClick={() => {
                  setLocale(l);
                  save({ uiLanguage: l });
                }}
                className={seg(locale === l)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span id="goal-label" className="text-sm font-semibold">Mục tiêu mỗi ngày</span>
          <div role="radiogroup" aria-labelledby="goal-label" className="flex flex-wrap gap-2">
            {goalOptions.map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={goal === g}
                onClick={() => {
                  setGoal(g);
                  save({ dailyGoalMinutes: g });
                }}
                className={seg(goal === g)}
              >
                {g} phút
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="min-h-12 rounded-xl border border-outline font-semibold text-sm inline-flex items-center justify-center gap-2 text-danger-text"
        >
          <LogOut size={18} aria-hidden="true" />
          {t("profile.logout")}
        </button>
      </section>

      <p className="text-[11px] text-muted leading-relaxed">
        JLPT Master là nền tảng luyện thi độc lập, không trực thuộc hay được ủy quyền bởi Hiệp hội Hỗ trợ Giáo dục Quốc tế Nhật
        Bản (JEES) hoặc Quỹ Giao lưu Quốc tế Nhật Bản. Điểm hiển thị là điểm ước tính nội bộ.
      </p>
    </div>
  );
}
