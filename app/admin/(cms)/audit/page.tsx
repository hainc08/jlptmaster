"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { useCms } from "../_components/CmsContext";
import { Icon } from "../_components/Icon";
import { Pagination } from "../_components/Pagination";
import { EmptyState, ErrorState, Skeleton } from "../_components/States";
import { formatDateTime } from "../_lib/format";
import { ROLE_LABEL, t } from "../_lib/i18n";
import { useFetch } from "../_lib/useFetch";

interface AuditRow {
  id: string;
  actor: { id: string; displayName: string; role: string };
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  ip: string | null;
  before: unknown;
  after: unknown;
}
interface AuditPage { data: AuditRow[]; total: number; page: number; perPage: number }

const MODULES = ["member", "level", "settings"];
const pretty = (v: unknown) => (v === null || v === undefined ? "—" : JSON.stringify(v, null, 2));

export default function AuditPage() {
  const { lang } = useCms();
  const router = useRouter();
  const params = useSearchParams();
  const qs = params.toString();
  const { data, error, loading, reload } = useFetch<AuditPage>(`/api/v1/admin/audit${qs ? `?${qs}` : ""}`);
  const [open, setOpen] = useState<string[]>([]);

  const go = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    const s = next.toString();
    router.replace(`/admin/audit${s ? `?${s}` : ""}`);
  };
  const setFilter = (key: string, value: string) => go((p) => { if (value) p.set(key, value); else p.delete(key); p.delete("page"); });

  const rows = data?.data ?? [];
  const actors = new Map<string, string>();
  for (const r of rows) actors.set(r.actor.id, r.actor.displayName);
  const selectedActor = params.get("actor");
  if (selectedActor && !actors.has(selectedActor)) actors.set(selectedActor, selectedActor);

  let body: React.ReactNode;
  if (error) body = <ErrorState error={error} onRetry={reload} />;
  else if (!data) body = <Skeleton rows={6} />;
  else if (rows.length === 0) body = <EmptyState title="No audit entries match" hint="Try a wider date range or a different filter." />;
  else {
    body = (
      <>
        <div className="tbl-wrap" aria-busy={loading} style={loading ? { opacity: 0.6 } : undefined}>
          <table>
            <thead><tr><th style={{ width: 48 }}><span className="sr">Details</span></th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Target</th><th scope="col">Timestamp</th><th scope="col">IP</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const expanded = open.includes(r.id);
                return (
                  <Fragment key={r.id}>
                    <tr>
                      <td>
                        <button type="button" className="icon-btn exp" aria-expanded={expanded} aria-label={expanded ? "Hide changes" : "Show changes"} onClick={() => setOpen((o) => (expanded ? o.filter((x) => x !== r.id) : [...o, r.id]))}><Icon name="down" /></button>
                      </td>
                      <td><b>{r.actor.displayName}</b><div className="muted" style={{ fontSize: 12 }}>{ROLE_LABEL[r.actor.role] ?? r.actor.role}</div></td>
                      <td><span className="act-chip">{r.action}</span></td>
                      <td>{r.entityType} {r.entityId}</td>
                      <td>{formatDateTime(r.createdAt, lang)}</td>
                      <td className="muted">{r.ip ?? "—"}</td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, height: "auto" }}>
                          <div className="diff">
                            <section className="b" role="region" aria-label="Before"><div className="t-label" style={{ marginBottom: 6 }}>Before</div><pre>{pretty(r.before)}</pre></section>
                            <section className="a" role="region" aria-label="After"><div className="t-label" style={{ marginBottom: 6 }}>After</div><pre>{pretty(r.after)}</pre></section>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={data.page} perPage={data.perPage} total={data.total} shown={rows.length} lang={lang}
          onPage={(p) => go((q) => { if (p > 1) q.set("page", String(p)); else q.delete("page"); })}
          onPerPage={(n) => go((q) => { q.set("perPage", String(n)); q.delete("page"); })} />
      </>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div><div className="crumbs">Home / {t(lang, "audit")}</div><h1 className="t-display">{t(lang, "audit")}</h1></div>
      </div>
      <section className="card">
        <div className="toolbar">
          <label className="sr" htmlFor="au-actor">Actor</label>
          <select id="au-actor" className="sel" value={selectedActor ?? ""} onChange={(e) => setFilter("actor", e.target.value)}>
            <option value="">All actors</option>
            {[...actors].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <label className="sr" htmlFor="au-module">Module</label>
          <select id="au-module" className="sel" value={params.get("module") ?? ""} onChange={(e) => setFilter("module", e.target.value)}>
            <option value="">All modules</option>
            {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <label className="sr" htmlFor="au-range">Date range</label>
          <select id="au-range" className="sel" value={params.get("range") ?? ""} onChange={(e) => setFilter("range", e.target.value)}>
            <option value="">Any time</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option>
          </select>
        </div>
        {body}
      </section>
    </div>
  );
}
