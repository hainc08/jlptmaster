import { prisma } from "@/src/server/db";

export const DEFAULT_TZ = "Asia/Ho_Chi_Minh";

export type ActivitySummary = {
  todayMinutes: number;
  dailyGoalMinutes: number;
  streakDays: number;
  /** Monday → Sunday of the current local week; null = a day that has not come yet. */
  week: { day: string; minutes: number | null }[];
};

/** The calendar day (YYYY-MM-DD) of `at` in time zone `tz`. Never uses the server's local time. */
export function localDay(at: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

/** A YYYY-MM-DD string as a UTC-midnight Date (how Prisma stores @db.Date). */
const asDate = (day: string) => new Date(`${day}T00:00:00.000Z`);
const addDays = (day: string, n: number) => {
  const d = asDate(day);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Adds 1–5 minutes (clamped) to the user's row for the local day of `now`. */
export async function recordStudyMinutes(userId: string, minutes: number, now: Date, tz: string): Promise<void> {
  const add = Math.min(5, Math.max(1, Math.round(Number.isFinite(minutes) ? minutes : 1)));
  const day = asDate(localDay(now, tz));
  await prisma.studyActivity.upsert({
    where: { userId_day: { userId, day } },
    update: { minutes: { increment: add } },
    create: { userId, day, minutes: add },
  });
}

/**
 * Today's minutes, the streak and this week's bars. The streak counts consecutive local days with
 * minutes > 0 ending today, or ending yesterday when today has nothing yet.
 */
export async function getActivitySummary(
  userId: string,
  now: Date,
  tz: string,
  dailyGoalMinutes: number
): Promise<ActivitySummary> {
  const today = localDay(now, tz);
  const rows = await prisma.studyActivity.findMany({
    where: { userId, day: { lte: asDate(today) }, minutes: { gt: 0 } },
    orderBy: { day: "desc" },
    select: { day: true, minutes: true },
  });
  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r.minutes]));

  let streakDays = 0;
  let cursor = byDay.has(today) ? today : addDays(today, -1);
  while (byDay.has(cursor)) {
    streakDays++;
    cursor = addDays(cursor, -1);
  }

  const weekday = asDate(today).getUTCDay(); // 0 = Sunday
  const monday = addDays(today, -((weekday + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    return { day, minutes: day > today ? null : byDay.get(day) ?? 0 };
  });

  return { todayMinutes: byDay.get(today) ?? 0, dailyGoalMinutes, streakDays, week };
}
