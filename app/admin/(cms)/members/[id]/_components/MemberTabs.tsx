"use client";

import { useRef, useState } from "react";
import { EmptyState } from "../../../_components/States";
import { StatusChip, memberChip } from "../../../_components/StatusChip";
import { formatAgo, formatDate, formatNumber } from "../../../_lib/format";
import type { Lang } from "../../../_lib/i18n";

export interface MemberDetail {
  id: string;
  displayName: string;
  email: string;
  level: string;
  plan: "FREE" | "STANDARD" | "PREMIUM";
  status: "ACTIVE" | "SUSPENDED" | "PENDING" | "EXPIRED";
  joinedAt: string;
  lastActiveAt: string | null;
  progress: { level: string; totalLessons: number; completedLessons: number; published: boolean; percent: number }[];
  exams: { id: string; title: string; level: string; submittedAt: string | null; scorePercent: number | null }[];
}

const PLAN = { FREE: "Free", STANDARD: "Standard", PREMIUM: "Premium" } as const;
const TABS = ["Overview", "Progress by level", "Exam history", "Account and access"] as const;
type Tab = (typeof TABS)[number];
const slug = (t: string) => t.toLowerCase().replace(/\s+/g, "-");

export function MemberTabs({ m, lang }: { m: MemberDetail; lang: Lang }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i + TABS.length - 1) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next]);
    refs.current[TABS[next]]?.focus();
  };

  const scores = m.exams.map((x) => x.scorePercent).filter((x): x is number => x !== null);
  const avg = scores.length ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : "—";

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Member sections">
        {TABS.map((name, i) => (
          <button key={name} ref={(el) => { refs.current[name] = el; }} role="tab" type="button" id={`tab-${slug(name)}`} aria-selected={tab === name} aria-controls={`panel-${slug(name)}`} tabIndex={tab === name ? 0 : -1} onClick={() => setTab(name)} onKeyDown={(e) => onKeyDown(e, i)}>{name}</button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${slug(tab)}`} aria-labelledby={`tab-${slug(tab)}`}>
        {tab === "Overview" && (
          <>
            <div className="kpis">
              {[["Current level", m.level], ["Plan", PLAN[m.plan]], ["Exams taken", formatNumber(m.exams.length, lang)], ["Average score", avg]].map(([label, value]) => (
                <div key={label} className="card kpi"><div className="muted" style={{ fontWeight: 600 }}>{label}</div><div className="val" style={{ fontSize: 28 }}>{value}</div></div>
              ))}
            </div>
            <section className="card card-pad">
              <h2 className="t-sub" style={{ marginBottom: 12 }}>Profile</h2>
              <div className="dl"><div>Full name</div><div className="jp">{m.displayName}</div><div>Email</div><div>{m.email}</div><div>Joined</div><div>{formatDate(m.joinedAt, lang)}</div><div>Last active</div><div>{m.lastActiveAt ? formatAgo(m.lastActiveAt, lang) : "Never"}</div></div>
            </section>
          </>
        )}
        {tab === "Progress by level" && (
          <section className="card card-pad">
            <h2 className="t-sub" style={{ marginBottom: 8 }}>Progress by level</h2>
            {m.progress.map((p) => (
              <div key={p.level} className="lvl-prog">
                <span className="chip lvl">{p.level}</span>
                <div>
                  <div className="progress" role="progressbar" aria-label={`${p.level} progress`} aria-valuenow={p.percent} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${p.percent}%` }} /></div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{p.published ? `${p.completedLessons} / ${p.totalLessons} lessons` : "Content not yet published"}</div>
                </div>
                <b>{p.published ? `${p.percent}%` : "—"}</b>
              </div>
            ))}
          </section>
        )}
        {tab === "Exam history" && (
          m.exams.length === 0 ? <EmptyState title="No exams taken yet" hint="Submitted mock exams will be listed here." /> : (
            <section className="card">
              <div className="tbl-wrap" style={{ maxHeight: "none", borderTop: 0 }}>
                <table>
                  <thead><tr><th scope="col">Exam</th><th scope="col">Level</th><th scope="col">Submitted</th><th scope="col">Score</th></tr></thead>
                  <tbody>
                    {m.exams.map((e) => (
                      <tr key={e.id}><td>{e.title}</td><td><span className="chip lvl">{e.level}</span></td><td>{formatDate(e.submittedAt, lang)}</td><td><b>{e.scorePercent === null ? "—" : `${e.scorePercent}%`}</b></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )
        )}
        {tab === "Account and access" && (
          <section className="card card-pad">
            <h2 className="t-sub" style={{ marginBottom: 8 }}>Account and access</h2>
            <div className="dl">
              <div>Account status</div><div><StatusChip kind={memberChip(m.status)} /></div>
              <div>Plan</div><div>{PLAN[m.plan]}</div>
              <div>Target level</div><div>{m.level}</div>
              <div>Joined</div><div>{formatDate(m.joinedAt, lang)}</div>
              <div>Last active</div><div>{m.lastActiveAt ? formatAgo(m.lastActiveAt, lang) : "Never"}</div>
            </div>
            <p className="muted" style={{ marginTop: 16 }}>Use the actions above to suspend the account, change the level or sign the member out everywhere.</p>
          </section>
        )}
      </div>
    </>
  );
}
