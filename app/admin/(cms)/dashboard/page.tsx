"use client";

import Link from "next/link";
import { useCms } from "../_components/CmsContext";
import { BarChart, LineChart } from "../_components/Charts";
import { EmptyState, ErrorState, Skeleton } from "../_components/States";
import { Icon, type IconName } from "../_components/Icon";
import { formatAgo, formatNumber } from "../_lib/format";
import { t } from "../_lib/i18n";
import { useFetch } from "../_lib/useFetch";

interface Dashboard {
  kpis: { totalMembers: number; activeThisWeek: number; newThisMonth: number; examsTaken: number };
  activity30d: { date: string; activeMembers: number }[];
  membersByLevel: { level: string; count: number }[];
  recent: { id: string; kind: "audit" | "exam"; at: string; text: string }[];
}

export default function DashboardPage() {
  const { lang, allowed } = useCms();
  const { data, error, loading, reload } = useFetch<{ data: Dashboard }>("/api/v1/admin/dashboard");

  const header = (
    <div className="page-head">
      <div>
        <div className="crumbs">Home / {t(lang, "dashboard")}</div>
        <h1 className="t-display">{t(lang, "dashboard")}</h1>
      </div>
    </div>
  );

  if (error) return <div className="page">{header}<ErrorState error={error} onRetry={reload} /></div>;
  if (!data) return <div className="page">{header}<Skeleton rows={4} /></div>;

  const d = data.data;
  const kpis: { icon: IconName; label: string; value: number }[] = [
    { icon: "group", label: "Total members", value: d.kpis.totalMembers },
    { icon: "trend", label: "Active this week", value: d.kpis.activeThisWeek },
    { icon: "person_add", label: "New this month", value: d.kpis.newThisMonth },
    { icon: "quiz", label: "Exams taken", value: d.kpis.examsTaken },
  ];

  return (
    <div className="page" aria-busy={loading}>
      {header}
      <div className="kpis">
        {kpis.map((k) => (
          <div key={k.label} className="card kpi">
            <div className="row"><span className="ic"><Icon name={k.icon} /></span>{k.label}</div>
            <div className="val">{formatNumber(k.value, lang)}</div>
          </div>
        ))}
      </div>
      <div className="charts">
        <section className="card chart-card">
          <h2 className="t-sub">Daily active members</h2>
          <p className="muted" style={{ marginBottom: 12 }}>Last 30 days</p>
          <LineChart data={d.activity30d} lang={lang} />
        </section>
        <section className="card chart-card">
          <h2 className="t-sub">Members by level</h2>
          <p className="muted" style={{ marginBottom: 12 }}>Target level · N4–N1 are waitlists</p>
          <BarChart data={d.membersByLevel} lang={lang} />
        </section>
      </div>
      <section className="card">
        <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center" }}>
          <h2 className="t-sub">Recent activity</h2>
          {allowed.includes("audit") && <Link className="btn text" style={{ marginLeft: "auto", textDecoration: "none" }} href="/admin/audit">View audit log</Link>}
        </div>
        {d.recent.length === 0 ? (
          <EmptyState title="No recent activity" hint="Actions taken in the CMS and exams submitted by learners appear here." />
        ) : (
          <ul className="act">
            {d.recent.map((r) => (
              <li key={r.id}>
                <span className="dot"><Icon name={r.kind === "exam" ? "quiz" : "edit"} /></span>
                <span>{r.text}</span>
                <time dateTime={r.at}>{formatAgo(r.at, lang)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
