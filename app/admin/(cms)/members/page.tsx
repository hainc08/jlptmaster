"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCms } from "../_components/CmsContext";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { Icon } from "../_components/Icon";
import { Pagination } from "../_components/Pagination";
import { EmptyState, ErrorState, Skeleton } from "../_components/States";
import { StatusChip, memberChip } from "../_components/StatusChip";
import { useToast } from "../_components/Toast";
import { apiPost, errorMessage } from "../_lib/api";
import { downloadFile } from "../_lib/download";
import { formatAgo, formatDate, initials } from "../_lib/format";
import { t } from "../_lib/i18n";
import { useFetch } from "../_lib/useFetch";
import { AddMemberPanel } from "./_components/AddMemberPanel";

interface Member {
  id: string;
  displayName: string;
  email: string;
  level: string;
  plan: "FREE" | "STANDARD" | "PREMIUM";
  status: "ACTIVE" | "SUSPENDED" | "PENDING" | "EXPIRED";
  joinedAt: string;
  lastActiveAt: string | null;
}
interface MemberPage { data: Member[]; page: number; perPage: number; total: number }

const PLAN_LABEL = { FREE: "Free", STANDARD: "Standard", PREMIUM: "Premium" } as const;
const STATUS_LABEL = { ACTIVE: "Active", SUSPENDED: "Suspended", PENDING: "Pending", EXPIRED: "Expired" } as const;
const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const AVATAR = [["#E3E1FF", "#1A1465"], ["#FFDAD3", "#5C1000"], ["#D3F0DC", "#0A3D20"], ["#FFE7B0", "#5A3A00"], ["#E4E2EC", "#2F2F38"]];
const FILTER_KEYS = ["q", "level", "status", "plan"] as const;

const avatarStyle = (id: string) => {
  const [bg, fg] = AVATAR[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR.length];
  return { background: bg, color: fg };
};

type Dialog = null | { kind: "suspend" } | { kind: "level" };

export default function MembersPage() {
  const { lang } = useCms();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const qs = params.toString();
  const { data, error, loading, reload } = useFetch<MemberPage>(`/api/v1/admin/members${qs ? `?${qs}` : ""}`);

  const [search, setSearch] = useState(params.get("q") ?? "");
  const [selection, setSelection] = useState<{ key: string; ids: string[] }>({ key: qs, ids: [] });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [newLevel, setNewLevel] = useState("N5");
  const [adding, setAdding] = useState(false);

  const selected = useMemo(() => (selection.key === qs ? selection.ids : []), [selection, qs]);
  const go = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    const s = next.toString();
    router.replace(`/admin/members${s ? `?${s}` : ""}`);
  };
  const setFilter = (key: string, value: string) => go((p) => { if (value) p.set(key, value); else p.delete(key); p.delete("page"); });

  // Debounce the search box into the URL (the URL is the single source of truth for the list).
  const urlQ = params.get("q") ?? "";
  useEffect(() => {
    if (search === urlQ) return;
    const timer = setTimeout(() => setFilter("q", search.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, urlQ]);

  const rows = data?.data ?? [];
  const perPage = data?.perPage ?? Number(params.get("perPage") ?? 10);
  const page = data?.page ?? Number(params.get("page") ?? 1);
  const activeFilters = FILTER_KEYS.filter((k) => params.get(k));
  const chipText = (k: (typeof FILTER_KEYS)[number]) => {
    const v = params.get(k)!;
    if (k === "q") return `Search: “${v}”`;
    if (k === "level") return `Level: ${v}`;
    if (k === "status") return `Status: ${STATUS_LABEL[v as keyof typeof STATUS_LABEL] ?? v}`;
    return `Plan: ${PLAN_LABEL[v as keyof typeof PLAN_LABEL] ?? v}`;
  };

  const toggle = (id: string) => setSelection({ key: qs, ids: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] });
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = () => setSelection({ key: qs, ids: allOnPage ? selected.filter((id) => !rows.some((r) => r.id === id)) : [...new Set([...selected, ...rows.map((r) => r.id)])] });

  const exportUrl = () => {
    const p = new URLSearchParams();
    for (const k of FILTER_KEYS) if (params.get(k)) p.set(k, params.get(k)!);
    return `/api/v1/admin/members/export${p.toString() ? `?${p}` : ""}`;
  };

  const runBulk = async (body: { action: "suspend" | "change-level"; level?: string }) => {
    setDialog(null);
    try {
      const r = await apiPost<{ updated: number; skipped: string[] }>("/api/v1/admin/members/bulk", { ids: selected, ...body });
      const noun = (n: number) => `${n} member${n === 1 ? "" : "s"}`;
      const done = body.action === "suspend" ? `${noun(r.updated)} suspended` : `Level set to ${body.level} for ${noun(r.updated)}`;
      toast(r.skipped.length ? `${done}, ${r.skipped.length} skipped` : done);
      setSelection({ key: qs, ids: [] });
      reload();
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  const header = (
    <div className="page-head">
      <div>
        <div className="crumbs">Home / {t(lang, "members")}</div>
        <h1 className="t-display">{t(lang, "members")}</h1>
      </div>
      <div className="actions">
        <button type="button" className="btn filled" onClick={() => setAdding(true)}><Icon name="add" />{t(lang, "addMember")}</button>
      </div>
    </div>
  );

  let body: React.ReactNode;
  if (error) body = <ErrorState error={error} onRetry={reload} />;
  else if (!data) body = <Skeleton rows={7} />;
  else if (rows.length === 0) {
    body = activeFilters.length ? (
      <EmptyState title="No members match these filters" hint="Try removing a filter or searching a different term." action={<button type="button" className="btn tonal" onClick={() => router.replace("/admin/members")}>Clear filters</button>} />
    ) : (
      <EmptyState title="No members yet" hint="Add your first learner to get started." action={<button type="button" className="btn filled" onClick={() => setAdding(true)}><Icon name="add" />{t(lang, "addMember")}</button>} />
    );
  } else {
    body = (
      <>
        <div className="tbl-wrap" aria-busy={loading} style={loading ? { opacity: 0.6 } : undefined}>
          <table>
            <thead>
              <tr>
                <th className="chk"><input type="checkbox" className="cb" aria-label="Select all on page" checked={allOnPage} onChange={toggleAll} /></th>
                <th scope="col">Member</th><th scope="col">Email</th><th scope="col">Level</th><th scope="col">Plan</th><th scope="col">Status</th><th scope="col">Joined</th><th scope="col">Last active</th><th><span className="sr">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className={selected.includes(m.id) ? "sel" : ""}>
                  <td className="chk"><input type="checkbox" className="cb" aria-label={`Select ${m.displayName}`} checked={selected.includes(m.id)} onChange={() => toggle(m.id)} /></td>
                  <td><div className="cell-user"><span className="avatar" style={avatarStyle(m.id)} aria-hidden="true">{initials(m.displayName)}</span><Link href={`/admin/members/${m.id}`} className="jp">{m.displayName}</Link></div></td>
                  <td className="muted">{m.email}</td>
                  <td><span className="chip lvl">{m.level}</span></td>
                  <td>{PLAN_LABEL[m.plan]}</td>
                  <td><StatusChip kind={memberChip(m.status)} /></td>
                  <td>{formatDate(m.joinedAt, lang)}</td>
                  <td className="muted">{m.lastActiveAt ? formatAgo(m.lastActiveAt, lang) : "Never"}</td>
                  <td><Link className="icon-btn" href={`/admin/members/${m.id}`} aria-label={`Open ${m.displayName}`}><Icon name="right" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} perPage={perPage} total={data.total} shown={rows.length} lang={lang}
          onPage={(p) => go((q) => { if (p > 1) q.set("page", String(p)); else q.delete("page"); })}
          onPerPage={(n) => go((q) => { q.set("perPage", String(n)); q.delete("page"); })} />
      </>
    );
  }

  return (
    <div className="page">
      {header}
      <section className="card">
        <div className="toolbar">
          <div className="search" style={{ margin: 0, maxWidth: 280 }}>
            <label className="sr" htmlFor="m-search">Search members</label>
            <Icon name="search" />
            <input id="m-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" />
          </div>
          <label className="sr" htmlFor="m-level">Level</label>
          <select id="m-level" className="sel" value={params.get("level") ?? ""} onChange={(e) => setFilter("level", e.target.value)}>
            <option value="">All levels</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <label className="sr" htmlFor="m-status">Status</label>
          <select id="m-status" className="sel" value={params.get("status") ?? ""} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="">All statuses</option>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className="sr" htmlFor="m-plan">Plan</label>
          <select id="m-plan" className="sel" value={params.get("plan") ?? ""} onChange={(e) => setFilter("plan", e.target.value)}>
            <option value="">All plans</option>{Object.entries(PLAN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {activeFilters.length > 0 && (
          <div style={{ padding: "0 16px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {activeFilters.map((k) => (
              <span key={k} className="fchip">{chipText(k)}
                <button type="button" aria-label={`Remove filter ${chipText(k)}`} onClick={() => { if (k === "q") setSearch(""); go((p) => { p.delete(k); p.delete("page"); }); }}><Icon name="close" /></button>
              </span>
            ))}
            {activeFilters.length > 1 && <button type="button" className="btn text sm" onClick={() => { setSearch(""); router.replace("/admin/members"); }}>Clear all</button>}
          </div>
        )}
        {selected.length > 0 && (
          <div className="bulk" role="region" aria-label="Bulk actions">
            <span className="count">{selected.length} selected</span>
            <button type="button" className="btn sm outline" onClick={() => setDialog({ kind: "suspend" })}><Icon name="block" />Suspend</button>
            <button type="button" className="btn sm outline" onClick={() => setDialog({ kind: "level" })}><Icon name="school" />Change level</button>
            <button type="button" className="btn sm outline" onClick={() => downloadFile(exportUrl())}><Icon name="download" />Export CSV</button>
            <span className="spacer" />
            <button type="button" className="btn sm text" style={{ color: "#fff" }} onClick={() => setSelection({ key: qs, ids: [] })}>Clear</button>
          </div>
        )}
        {body}
      </section>

      <ConfirmDialog open={dialog?.kind === "suspend"} danger title={`Suspend ${selected.length} member${selected.length === 1 ? "" : "s"}?`}
        body="They will be signed out and unable to take exams until reactivated." confirmLabel="Suspend members"
        onCancel={() => setDialog(null)} onConfirm={() => runBulk({ action: "suspend" })} />
      <ConfirmDialog open={dialog?.kind === "level"} title={`Change level for ${selected.length} member${selected.length === 1 ? "" : "s"}`}
        confirmLabel="Apply" onCancel={() => setDialog(null)} onConfirm={() => runBulk({ action: "change-level", level: newLevel })}>
        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="bulk-level">New level</label>
          <select id="bulk-level" className="sel" value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
        </div>
      </ConfirmDialog>
      <AddMemberPanel open={adding} onClose={() => setAdding(false)} onCreated={() => { setAdding(false); toast("Member added"); reload(); }} />
    </div>
  );
}
