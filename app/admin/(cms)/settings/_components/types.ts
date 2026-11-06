export type Settings = {
  general: { siteName: string; defaultLanguage: "vi" | "en" | "ja" };
  examRules: { timeLimitMin: number; retakeLimit: number; passThreshold: number };
  notifications: Record<"welcome" | "passwordReset" | "examResult" | "weeklyDigest" | "suspension" | "planExpiry", boolean>;
};

export const MODULES = ["dashboard", "members", "levels", "settings", "audit"] as const;
export type Mod = (typeof MODULES)[number];
export const ROLES = ["OWNER", "ADMIN", "EDITOR", "SUPPORT"] as const;
export type RoleKey = (typeof ROLES)[number];
export type Matrix = Record<RoleKey, Record<Mod, boolean>>;

export const MODULE_LABEL: Record<Mod, string> = { dashboard: "Dashboard", members: "Members", levels: "Levels", settings: "Settings", audit: "Audit Log" };

/** Fields of `next` that differ from `saved` (undefined when nothing changed). */
export function diffObject<T extends object>(saved: T, next: T): Partial<T> | undefined {
  const out: Partial<T> = {};
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (next[key] !== saved[key] && !(Number.isNaN(next[key]) && Number.isNaN(saved[key]))) out[key] = next[key];
  }
  return Object.keys(out).length ? out : undefined;
}

export function settingsPatch(saved: Settings, next: Settings) {
  const patch: Partial<{ [K in keyof Settings]: Partial<Settings[K]> }> = {};
  for (const section of Object.keys(saved) as (keyof Settings)[]) {
    const d = diffObject(saved[section], next[section]);
    if (d) (patch as Record<string, unknown>)[section] = d;
  }
  return Object.keys(patch).length ? patch : undefined;
}

export const sameMatrix = (a: Matrix, b: Matrix) => JSON.stringify(a) === JSON.stringify(b);

export interface RuleErrors { siteName?: string; timeLimitMin?: string; retakeLimit?: string }

export function validateSettings(s: Settings): RuleErrors {
  const e: RuleErrors = {};
  const name = s.general.siteName.trim();
  if (name.length < 1 || name.length > 60) e.siteName = "Enter a name of 1 to 60 characters";
  const { timeLimitMin: t, retakeLimit: r } = s.examRules;
  if (!Number.isInteger(t) || t < 10 || t > 240) e.timeLimitMin = "Enter a whole number from 10 to 240";
  if (!Number.isInteger(r) || r < 0 || r > 10) e.retakeLimit = "Enter a whole number from 0 to 10";
  return e;
}
