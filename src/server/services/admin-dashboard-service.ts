import { prisma } from "@/src/server/db";
import { LEVEL_CODES } from "@/src/server/services/admin-members-service";

// All calendar maths use Vietnam time (UTC+7, no DST) because that is the operators' timezone.
const VN_OFFSET_MS = 7 * 3_600_000;
const DAY_MS = 86_400_000;

const vnDate = (d: Date) => new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
/** UTC instant at which the given Vietnam calendar day (YYYY-MM-DD) starts. */
const vnDayStart = (ymd: string) => new Date(Date.parse(`${ymd}T00:00:00Z`) - VN_OFFSET_MS);

export interface DashboardData {
  kpis: { totalMembers: number; activeThisWeek: number; newThisMonth: number; examsTaken: number };
  activity30d: { date: string; activeMembers: number }[];
  membersByLevel: { level: string; count: number }[];
  recent: { id: string; kind: "audit" | "exam"; at: string; text: string }[];
}

export async function getDashboard(now: Date = new Date()): Promise<DashboardData> {
  const learner = { role: "STUDENT" as const };
  const todayVn = vnDate(now);
  const monthStart = vnDayStart(`${todayVn.slice(0, 7)}-01`);
  const windowStart = vnDayStart(vnDate(new Date(now.getTime() - 29 * DAY_MS)));
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [byLevel, noProfile, activeThisWeek, newThisMonth, examsTaken, attempts, lessons, reviews, audits, exams] = await Promise.all([
    prisma.userProfile.groupBy({ by: ["targetLevel"], where: { user: { ...learner, deletedAt: null } }, _count: { _all: true } }),
    prisma.user.count({ where: { ...learner, deletedAt: null, profile: null } }),
    prisma.user.count({ where: { ...learner, deletedAt: null, lastActiveAt: { gte: weekAgo, lte: now } } }),
    prisma.user.count({ where: { ...learner, deletedAt: null, createdAt: { gte: monthStart, lte: now } } }),
    prisma.examAttempt.count({ where: { status: "SUBMITTED", submittedAt: { gte: monthAgo, lte: now } } }),
    prisma.examAttempt.findMany({ where: { user: learner, startedAt: { gte: windowStart, lte: now } }, select: { userId: true, startedAt: true } }),
    prisma.lessonProgress.findMany({ where: { user: learner, completedAt: { gte: windowStart, lte: now } }, select: { userId: true, completedAt: true } }),
    prisma.reviewLog.findMany({
      where: { reviewCard: { user: learner }, reviewedAt: { gte: windowStart, lte: now } },
      select: { reviewedAt: true, reviewCard: { select: { userId: true } } },
    }),
    prisma.auditLog.findMany({ where: { createdAt: { lte: now } }, orderBy: { createdAt: "desc" }, take: 10, include: { actor: { select: { displayName: true, email: true } } } }),
    prisma.examAttempt.findMany({
      where: { status: "SUBMITTED", submittedAt: { not: null, lte: now } }, orderBy: { submittedAt: "desc" }, take: 10,
      include: { user: { select: { displayName: true, email: true } }, exam: { select: { title: true } } },
    }),
  ]);

  const counts = new Map<string, number>(byLevel.map((g) => [g.targetLevel, g._count._all]));
  counts.set("N5", (counts.get("N5") ?? 0) + noProfile); // accounts without a profile default to N5
  const membersByLevel = LEVEL_CODES.map((level) => ({ level, count: counts.get(level) ?? 0 }));
  const totalMembers = membersByLevel.reduce((n, l) => n + l.count, 0);

  const usersByDay = new Map<string, Set<string>>();
  const mark = (userId: string, at: Date | null) => {
    if (!at) return;
    const day = vnDate(at);
    if (!usersByDay.has(day)) usersByDay.set(day, new Set());
    usersByDay.get(day)!.add(userId);
  };
  attempts.forEach((a) => mark(a.userId, a.startedAt));
  lessons.forEach((l) => mark(l.userId, l.completedAt));
  reviews.forEach((r) => mark(r.reviewCard.userId, r.reviewedAt));
  const activity30d = Array.from({ length: 30 }, (_, i) => {
    const date = vnDate(new Date(windowStart.getTime() + i * DAY_MS + VN_OFFSET_MS / 2)); // mid-morning avoids any edge rounding
    return { date, activeMembers: usersByDay.get(date)?.size ?? 0 };
  });

  const recent = [
    ...audits.map((a) => ({ id: a.id, kind: "audit" as const, at: a.createdAt, text: `${a.actor.displayName ?? a.actor.email} · ${a.action}` })),
    ...exams.map((e) => {
      const pct = e.rawTotal ? Math.round(((e.rawCorrect ?? 0) / e.rawTotal) * 100) : null;
      return { id: e.id, kind: "exam" as const, at: e.submittedAt!, text: `${e.user.displayName ?? e.user.email} completed ${e.exam.title}${pct === null ? "" : ` — ${pct}%`}` };
    }),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10)
    .map((r) => ({ ...r, at: r.at.toISOString() }));

  return { kpis: { totalMembers, activeThisWeek, newThisMonth, examsTaken }, activity30d, membersByLevel, recent };
}
