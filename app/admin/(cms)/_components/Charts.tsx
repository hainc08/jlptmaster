import { formatNumber } from "../_lib/format";
import type { Lang } from "../_lib/i18n";

/** Rounds up to 1, 2, 5 × 10^n so axis ticks are readable. */
function niceMax(value: number): number {
  if (value <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  for (const step of [1, 2, 5, 10]) if (value <= step * pow) return step * pow;
  return 10 * pow;
}

const dm = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;

export function LineChart({ data, lang }: { data: { date: string; activeMembers: number }[]; lang: Lang }) {
  const W = 640, H = 240, p = { l: 44, r: 12, t: 12, b: 28 };
  const max = niceMax(Math.max(...data.map((d) => d.activeMembers), 1));
  const x = (i: number) => p.l + (i * (W - p.l - p.r)) / Math.max(data.length - 1, 1);
  const y = (v: number) => p.t + (1 - v / max) * (H - p.t - p.b);
  const pts = data.map((d, i) => `${x(i)},${y(d.activeMembers)}`).join(" ");
  // De-duplicated: with tiny counts (max 1–3) several fractions round to the same value.
  const ticks = [...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f)))];
  const labelAt = [0, 7, 14, 21, data.length - 1].filter((i, k, a) => i >= 0 && a.indexOf(i) === k);
  const last = data[data.length - 1];
  const label = `Daily active members over the last ${data.length} days${last ? `, ${formatNumber(last.activeMembers, lang)} on ${dm(last.date)}` : ""}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <title>{label}</title>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={p.l} x2={W - p.r} y1={y(v)} y2={y(v)} stroke="#E4E2EC" />
          <text x={p.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#46464F">{formatNumber(v, lang)}</text>
        </g>
      ))}
      {labelAt.map((i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#46464F">{dm(data[i].date)}</text>
      ))}
      {data.length > 1 && (
        <>
          <polygon points={`${x(0)},${y(0)} ${pts} ${x(data.length - 1)},${y(0)}`} fill="#3730A3" opacity=".10" />
          <polyline points={pts} fill="none" stroke="#3730A3" strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}
      {last && <circle cx={x(data.length - 1)} cy={y(last.activeMembers)} r="5" fill="#C0331B" stroke="#fff" strokeWidth="2" />}
    </svg>
  );
}

export function BarChart({ data, lang }: { data: { level: string; count: number }[]; lang: Lang }) {
  const W = 420, H = 240, p = { l: 12, r: 12, t: 24, b: 28 };
  const max = niceMax(Math.max(...data.map((d) => d.count), 1));
  const bw = 44;
  const gap = (W - p.l - p.r - bw * data.length) / data.length;
  const label = `Members by level: ${data.map((d) => `${d.level} ${formatNumber(d.count, lang)}`).join("; ")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <title>{label}</title>
      <line x1={p.l} x2={W - p.r} y1={H - p.b} y2={H - p.b} stroke="#CAC9D4" />
      {data.map((d, i) => {
        const h = (d.count / max) * (H - p.t - p.b);
        const bx = p.l + gap / 2 + i * (bw + gap);
        const by = H - p.b - h;
        return (
          <g key={d.level}>
            <rect x={bx} y={by} width={bw} height={h} rx="6" fill={i === 0 ? "#3730A3" : "#7C77CC"} />
            <text x={bx + bw / 2} y={by - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill="#1B1B22">{formatNumber(d.count, lang)}</text>
            <text x={bx + bw / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="#46464F">{d.level}</text>
          </g>
        );
      })}
    </svg>
  );
}
