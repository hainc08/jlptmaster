import { z } from "zod";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/src/server/db";
import type { SessionPayload } from "@/src/server/services/auth-service";
import { recordAudit } from "@/src/server/services/audit-service";
import { AdminError } from "@/src/server/services/admin-errors";

export const LEVEL_CODES = ["N5", "N4", "N3", "N2", "N1"] as const;
export type MemberStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | "EXPIRED";
type Plan = "FREE" | "STANDARD" | "PREMIUM";

const blank = (v: unknown) => (v === "" || v === null ? undefined : v);
const clamp = (min: number, max: number, fallback: number) => (v: unknown) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
};

export const MemberQuerySchema = z.object({
  q: z.preprocess(blank, z.string().optional()).transform((v) => v?.slice(0, 100)),
  level: z.preprocess(blank, z.enum(LEVEL_CODES).optional()),
  status: z.preprocess(blank, z.enum(["ACTIVE", "SUSPENDED", "PENDING", "EXPIRED"]).optional()),
  plan: z.preprocess(blank, z.enum(["FREE", "STANDARD", "PREMIUM"]).optional()),
  page: z.preprocess(blank, z.unknown()).transform(clamp(1, 1_000_000, 1)),
  perPage: z.preprocess(blank, z.unknown()).transform(clamp(1, 100, 10)),
});
export interface MemberQuery {
  q?: string;
  level?: string;
  status?: MemberStatus;
  plan?: Plan;
  page: number;
  perPage: number;
}

/** Throws ZodError (→ 400) on an unknown level/status/plan; clamps page, perPage and q length. */
export function parseMemberQuery(sp: URLSearchParams): MemberQuery {
  return MemberQuerySchema.parse(Object.fromEntries(sp.entries())) as MemberQuery;
}

export interface MemberRow {
  id: string;
  displayName: string;
  email: string;
  level: string;
  plan: Plan;
  status: MemberStatus;
  joinedAt: string;
  lastActiveAt: string | null;
}

type UserWithProfile = Prisma.UserGetPayload<{ include: { profile: true } }>;

function derivedStatus(u: Pick<UserWithProfile, "status" | "plan" | "planExpiresAt">): MemberStatus {
  if (u.status === "SUSPENDED") return "SUSPENDED";
  if (u.status === "PENDING_VERIFICATION") return "PENDING";
  if (u.plan !== "FREE" && u.planExpiresAt && u.planExpiresAt < new Date()) return "EXPIRED";
  return "ACTIVE";
}

const toRow = (u: UserWithProfile): MemberRow => ({
  id: u.id,
  displayName: u.displayName ?? u.email.split("@")[0],
  email: u.email,
  level: u.profile?.targetLevel ?? "N5",
  plan: u.plan,
  status: derivedStatus(u),
  joinedAt: u.createdAt.toISOString(),
  lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
});

/** LIKE wildcards in user text must match literally (Prisma passes `contains` through to LIKE). */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function buildWhere(q: Partial<MemberQuery>): Prisma.UserWhereInput {
  const now = new Date();
  const and: Prisma.UserWhereInput[] = [{ role: "STUDENT", deletedAt: null }];
  if (q.q) {
    const t = escapeLike(q.q.slice(0, 100));
    and.push({ OR: [{ displayName: { contains: t } }, { email: { contains: t } }] });
  }
  if (q.level) and.push({ profile: { is: { targetLevel: q.level } } });
  if (q.plan) and.push({ plan: q.plan });
  if (q.status === "SUSPENDED") and.push({ status: "SUSPENDED" });
  if (q.status === "PENDING") and.push({ status: "PENDING_VERIFICATION" });
  if (q.status === "EXPIRED") and.push({ status: "ACTIVE", plan: { not: "FREE" }, planExpiresAt: { lt: now } });
  if (q.status === "ACTIVE") {
    // explicit OR (not NOT(...)): SQL three-valued logic would drop rows whose planExpiresAt is NULL
    and.push({ status: "ACTIVE", OR: [{ plan: "FREE" }, { planExpiresAt: null }, { planExpiresAt: { gte: now } }] });
  }
  return { AND: and };
}

export async function listMembers(q: MemberQuery) {
  const perPage = clamp(1, 100, 10)(q.perPage);
  const page = clamp(1, 1_000_000, 1)(q.page);
  const where = buildWhere(q);
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);
  return { data: rows.map(toRow), page, perPage, total };
}

export async function getMember(id: string) {
  const u = await prisma.user.findFirst({ where: { id, role: "STUDENT", deletedAt: null }, include: { profile: true } });
  if (!u) throw new AdminError(404, "NOT_FOUND", "Không tìm thấy thành viên");
  const progress = await Promise.all(
    LEVEL_CODES.map(async (level) => {
      const [totalLessons, completedLessons] = await Promise.all([
        prisma.lesson.count({ where: { status: "PUBLISHED", course: { levelId: level, status: "PUBLISHED" } } }),
        prisma.lessonProgress.count({ where: { userId: id, status: "COMPLETED", lesson: { course: { levelId: level } } } }),
      ]);
      return {
        level,
        totalLessons,
        completedLessons,
        published: totalLessons > 0,
        percent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
      };
    }),
  );
  const attempts = await prisma.examAttempt.findMany({
    where: { userId: id, status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
    take: 20,
    include: { exam: { select: { title: true, levelId: true } } },
  });
  const exams = attempts.map((a) => ({
    id: a.id,
    title: a.exam.title,
    level: a.exam.levelId,
    submittedAt: a.submittedAt?.toISOString() ?? null,
    scorePercent: a.rawTotal ? Math.round(((a.rawCorrect ?? 0) / a.rawTotal) * 100) : null,
  }));
  return { ...toRow(u), progress, exams };
}

// ---------------------------------------------------------------- mutations

const MAX_NAME = 120;
const normEmail = (e: string) => e.trim().toLowerCase();

async function assertLevel(level: string) {
  if (!(await prisma.jlptLevel.findUnique({ where: { id: String(level) } }))) {
    throw new AdminError(400, "INVALID_LEVEL", `Cấp độ "${level}" không tồn tại`);
  }
}

async function loadTarget(id: string) {
  const u = await prisma.user.findFirst({ where: { id, deletedAt: null }, include: { profile: true } });
  if (!u) throw new AdminError(404, "NOT_FOUND", "Không tìm thấy thành viên");
  return u;
}

/** Nobody manages themselves; staff accounts are managed by an OWNER only. */
function assertMayModify(actor: SessionPayload, target: { id: string; role: Role }) {
  if (actor.userId === target.id) {
    throw new AdminError(409, "CANNOT_MODIFY_SELF", "Bạn không thể thực hiện thao tác này với chính mình");
  }
  if (target.role !== "STUDENT" && actor.role !== "OWNER") {
    throw new AdminError(403, "FORBIDDEN", "Chỉ OWNER được quản lý tài khoản nhân sự");
  }
}

export async function createMember(
  actor: SessionPayload,
  input: { displayName: string; email: string; level: string; plan: Plan },
  ip?: string | null,
): Promise<MemberRow> {
  await assertLevel(input.level);
  const email = normEmail(input.email);
  if (await prisma.user.findUnique({ where: { email } })) throw new AdminError(409, "EMAIL_TAKEN", "Email đã tồn tại");
  const u = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        displayName: input.displayName.trim().slice(0, MAX_NAME),
        role: "STUDENT",
        status: "ACTIVE",
        plan: input.plan,
        profile: { create: { targetLevel: input.level } },
      },
      include: { profile: true },
    });
    await recordAudit(
      { actorId: actor.userId, action: "member.create", entityType: "member", entityId: created.id, after: { level: input.level, plan: input.plan }, ip },
      tx,
    );
    return created;
  });
  return toRow(u);
}

export async function updateMember(
  actor: SessionPayload,
  id: string,
  patch: { displayName?: string; email?: string },
  ip?: string | null,
): Promise<MemberRow> {
  const target = await loadTarget(id);
  assertMayModify(actor, target);
  const data: { displayName?: string; email?: string } = {};
  if (patch.displayName !== undefined) data.displayName = patch.displayName.trim().slice(0, MAX_NAME);
  if (patch.email !== undefined) {
    const email = normEmail(patch.email);
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash && clash.id !== id) throw new AdminError(409, "EMAIL_TAKEN", "Email đã tồn tại");
    data.email = email;
  }
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({ where: { id }, data, include: { profile: true } });
    await recordAudit(
      {
        actorId: actor.userId, action: "member.update", entityType: "member", entityId: id, ip,
        before: { displayName: target.displayName, email: target.email },
        after: { displayName: u.displayName, email: u.email },
      },
      tx,
    );
    return u;
  });
  return toRow(updated);
}

export async function suspendMember(actor: SessionPayload, id: string, ip?: string | null): Promise<void> {
  const target = await loadTarget(id);
  assertMayModify(actor, target);
  if (target.status === "SUSPENDED") return;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { status: "SUSPENDED" } });
    await tx.authSession.deleteMany({ where: { userId: id } });
    await recordAudit(
      { actorId: actor.userId, action: "member.suspend", entityType: "member", entityId: id, before: { status: target.status }, after: { status: "SUSPENDED" }, ip },
      tx,
    );
  });
}

export async function reactivateMember(actor: SessionPayload, id: string, ip?: string | null): Promise<void> {
  const target = await loadTarget(id);
  assertMayModify(actor, target);
  if (target.status !== "SUSPENDED") return;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { status: "ACTIVE" } });
    await recordAudit(
      { actorId: actor.userId, action: "member.reactivate", entityType: "member", entityId: id, before: { status: "SUSPENDED" }, after: { status: "ACTIVE" }, ip },
      tx,
    );
  });
}

export async function changeLevel(actor: SessionPayload, id: string, level: string, ip?: string | null): Promise<void> {
  await assertLevel(level);
  const target = await loadTarget(id);
  assertMayModify(actor, target);
  const before = target.profile?.targetLevel ?? "N5";
  await prisma.$transaction(async (tx) => {
    await tx.userProfile.upsert({ where: { userId: id }, update: { targetLevel: level }, create: { userId: id, targetLevel: level } });
    await recordAudit(
      { actorId: actor.userId, action: "member.change_level", entityType: "member", entityId: id, before: { level: before }, after: { level }, ip },
      tx,
    );
  });
}

/**
 * The platform has no email delivery or reset-token flow yet, so this revokes every session
 * (forcing a fresh sign-in) and reports honestly that no email was sent.
 */
export async function resetPassword(
  actor: SessionPayload,
  id: string,
  ip?: string | null,
): Promise<{ sessionsRevoked: number; emailSent: false }> {
  const target = await loadTarget(id);
  assertMayModify(actor, target);
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.authSession.deleteMany({ where: { userId: id } });
    await recordAudit(
      { actorId: actor.userId, action: "member.reset_password", entityType: "member", entityId: id, after: { sessionsRevoked: count, emailSent: false }, ip },
      tx,
    );
    return { sessionsRevoked: count, emailSent: false as const };
  });
}

/** Anonymizes the account; exam attempts are kept (FK is RESTRICT and history must not be rewritten). */
export async function deleteMember(actor: SessionPayload, id: string, ip?: string | null): Promise<void> {
  const target = await loadTarget(id);
  assertMayModify(actor, target);
  await prisma.$transaction(async (tx) => {
    await tx.authSession.deleteMany({ where: { userId: id } });
    await tx.userProfile.deleteMany({ where: { userId: id } });
    await tx.user.update({
      where: { id },
      data: { email: `deleted+${id}@invalid`, passwordHash: null, displayName: null, status: "SUSPENDED", deletedAt: new Date() },
    });
    await recordAudit(
      { actorId: actor.userId, action: "member.delete", entityType: "member", entityId: id, before: { status: target.status }, after: { deleted: true }, ip },
      tx,
    );
  });
}

export async function bulkAction(
  actor: SessionPayload,
  input: { ids: string[]; action: "suspend" | "change-level"; level?: string },
  ip?: string | null,
): Promise<{ updated: number; skipped: string[] }> {
  if (input.action === "change-level") await assertLevel(input.level ?? "");
  let updated = 0;
  const skipped: string[] = [];
  for (const id of [...new Set(input.ids)].slice(0, 200)) {
    try {
      if (input.action === "suspend") await suspendMember(actor, id, ip);
      else await changeLevel(actor, id, input.level!, ip);
      updated++;
    } catch (e) {
      if (e instanceof AdminError) skipped.push(id);
      else throw e;
    }
  }
  return { updated, skipped };
}

// ---------------------------------------------------------------- CSV export

/** Quote when needed and neutralise spreadsheet formulas (= + - @ and control prefixes). */
function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const s = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(s) || s !== raw ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportMembersCsv(q: Partial<MemberQuery>): Promise<string> {
  const rows = await prisma.user.findMany({
    where: buildWhere(q),
    include: { profile: true },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 5000,
  });
  const lines = ["id,name,email,level,plan,status,joined,lastActive"];
  for (const u of rows.map(toRow)) {
    lines.push([u.id, u.displayName, u.email, u.level, u.plan, u.status, u.joinedAt, u.lastActiveAt].map(csvCell).join(","));
  }
  return "﻿" + lines.join("\n") + "\n";
}
