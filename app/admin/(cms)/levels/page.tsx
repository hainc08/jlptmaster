"use client";

import { useState } from "react";
import { useCms } from "../_components/CmsContext";
import { Icon } from "../_components/Icon";
import { ErrorState, Skeleton } from "../_components/States";
import { StatusChip, levelChip } from "../_components/StatusChip";
import { useToast } from "../_components/Toast";
import { apiPost, errorMessage } from "../_lib/api";
import { formatNumber } from "../_lib/format";
import { t } from "../_lib/i18n";
import { useFetch } from "../_lib/useFetch";
import { LevelEditPanel, type Level } from "./_components/LevelEditPanel";

export default function LevelsPage() {
  const { lang } = useCms();
  const toast = useToast();
  const { data, error, reload } = useFetch<{ data: Level[] }>("/api/v1/admin/levels");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [editing, setEditing] = useState<string | null>(null);
  // Optimistic order, valid only for the data it was computed from (a reload discards it).
  const [override, setOverride] = useState<{ base: unknown; codes: string[] } | null>(null);

  const header = (
    <div className="page-head">
      <div><div className="crumbs">Home / {t(lang, "levels")}</div><h1 className="t-display">{t(lang, "levels")}</h1></div>
      <div className="actions">
        <div className="seg" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "cards"} onClick={() => setView("cards")}>Cards</button>
          <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
        </div>
      </div>
    </div>
  );

  if (error) return <div className="page">{header}<ErrorState error={error} onRetry={reload} /></div>;
  if (!data) return <div className="page">{header}<Skeleton rows={5} /></div>;

  const codes = override && override.base === data ? override.codes : null;
  const levels = codes ? [...data.data].sort((a, b) => codes.indexOf(a.code) - codes.indexOf(b.code)) : data.data;

  const move = async (index: number, delta: -1 | 1) => {
    const next = levels.map((l) => l.code);
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setOverride({ base: data, codes: next });
    try {
      await apiPost("/api/v1/admin/levels/reorder", { order: next });
      toast("Display order updated");
      reload();
    } catch (e) {
      setOverride(null);
      toast(errorMessage(e));
    }
  };

  const moveButtons = (l: Level, i: number) => (
    <>
      <button type="button" className="icon-btn" aria-label={`Move ${l.code} earlier`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="left" /></button>
      <button type="button" className="icon-btn" aria-label={`Move ${l.code} later`} disabled={i === levels.length - 1} onClick={() => move(i, 1)}><Icon name="right" /></button>
    </>
  );
  const editing_ = levels.find((l) => l.code === editing);

  return (
    <div className="page">
      {header}
      {view === "cards" ? (
        <div className="lvl-grid">
          {levels.map((l, i) => (
            <article key={l.code} className="card lvl-card">
              <div className="top">
                <div className={`lvl-badge jp ${l.status === "PUBLISHED" ? "" : "off"}`} aria-hidden="true">{l.code}</div>
                <div style={{ flex: 1 }}>
                  <h2 className="t-sub">{l.code} · {l.name}</h2>
                  <StatusChip kind={levelChip(l.status)} />
                </div>
                <span className="muted" title="Display order">#{i + 1}</span>
              </div>
              <p className="muted" style={{ minHeight: 40 }}>{l.description}</p>
              <div className="stats">
                <div><b>{formatNumber(l.lessons, lang)}</b><span>Lessons</span></div>
                <div><b>{formatNumber(l.exams, lang)}</b><span>Exams</span></div>
                <div><b>{formatNumber(l.enrolled, lang)}</b><span>{l.status === "PUBLISHED" ? "Enrolled" : "Waitlist"}</span></div>
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {moveButtons(l, i)}
                <span className="spacer" />
                <button type="button" className="btn tonal sm" onClick={() => setEditing(l.code)}><Icon name="edit" />Edit<span className="sr"> {l.code}</span></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="card">
          <div className="tbl-wrap" style={{ maxHeight: "none", borderTop: 0 }}>
            <table>
              <thead><tr><th scope="col">Order</th><th scope="col">Level</th><th scope="col">Status</th><th scope="col">Lessons</th><th scope="col">Exams</th><th scope="col">Enrolled / waitlist</th><th scope="col">Enabled</th><th><span className="sr">Edit</span></th></tr></thead>
              <tbody>
                {levels.map((l, i) => (
                  <tr key={l.code}>
                    <td style={{ whiteSpace: "nowrap" }}>{i + 1} {moveButtons(l, i)}</td>
                    <td><b>{l.code} · {l.name}</b></td>
                    <td><StatusChip kind={levelChip(l.status)} /></td>
                    <td>{formatNumber(l.lessons, lang)}</td><td>{formatNumber(l.exams, lang)}</td><td>{formatNumber(l.enrolled, lang)}</td>
                    <td>{l.enabled ? "Yes" : "No"}</td>
                    <td style={{ textAlign: "right" }}><button type="button" className="btn tonal sm" onClick={() => setEditing(l.code)}><Icon name="edit" />Edit<span className="sr"> {l.code}</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {editing_ && (
        <LevelEditPanel key={`${editing_.code}-${editing_.name}-${editing_.passScore}-${editing_.enabled}`} level={editing_} onClose={() => setEditing(null)}
          onSaved={(message) => { setEditing(null); toast(message); reload(); }} />
      )}
    </div>
  );
}
