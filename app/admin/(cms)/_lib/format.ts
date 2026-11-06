import type { Lang } from "./i18n";

const LOCALE: Record<Lang, string> = { vi: "vi-VN", en: "en-US", ja: "ja-JP" };

export const formatNumber = (n: number, lang: Lang) => new Intl.NumberFormat(LOCALE[lang]).format(n);

/** Operators work in Vietnam time regardless of the browser's timezone. */
export function formatDateTime(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
}

export function formatDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
}

/** "just now", "5 minutes ago", … in the operator's language. */
export function formatAgo(iso: string | null | undefined, lang: Lang, now = Date.now()): string {
  if (!iso) return "—";
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang], { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 86_400 * 30) return rtf.format(Math.round(seconds / 86_400), "day");
  return rtf.format(Math.round(seconds / (86_400 * 30)), "month");
}

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();
};
