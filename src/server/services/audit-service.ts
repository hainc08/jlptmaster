import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/src/server/db";

const SECRET_KEY = /password|hash|token|secret/i;

/** Recursively drops keys that look like secrets so audit rows can never leak credentials. */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !SECRET_KEY.test(key))
        .map(([key, v]) => [key, redact(v)]),
    );
  }
  return value;
}

export interface AuditInput {
  actorId: string;
  /** `module.verb`, e.g. `member.suspend` */
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

const asJson = (v: unknown) => (v === undefined ? undefined : (redact(v) as Prisma.InputJsonValue));

export async function recordAudit(input: AuditInput, tx?: Prisma.TransactionClient): Promise<void> {
  const db = tx ?? prisma;
  await db.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadataJsonRedacted: {},
      beforeJson: asJson(input.before),
      afterJson: asJson(input.after),
      ip: input.ip ?? null,
    },
  });
}

export interface AuditQuery {
  actor?: string;
  module?: string;
  range?: "7d" | "30d";
  page: number;
  perPage: number;
}

export interface AuditRow {
  id: string;
  actor: { id: string; displayName: string; role: Role };
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  ip: string | null;
  before: unknown;
  after: unknown;
}

const DAY = 86_400_000;

export async function listAudit(q: AuditQuery): Promise<{ data: AuditRow[]; total: number; page: number; perPage: number }> {
  const perPage = Math.min(Math.max(Math.trunc(q.perPage) || 10, 1), 100);
  const page = Math.max(Math.trunc(q.page) || 1, 1);
  const where: Prisma.AuditLogWhereInput = {
    ...(q.actor ? { actorId: q.actor } : {}),
    ...(q.module ? { action: { startsWith: `${q.module}.` } } : {}),
    ...(q.range ? { createdAt: { gte: new Date(Date.now() - (q.range === "7d" ? 7 : 30) * DAY) } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { actor: { select: { id: true, displayName: true, email: true, role: true } } },
    }),
  ]);
  return {
    total,
    page,
    perPage,
    data: rows.map((r) => ({
      id: r.id,
      actor: { id: r.actor.id, displayName: r.actor.displayName ?? r.actor.email, role: r.actor.role },
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      createdAt: r.createdAt.toISOString(),
      ip: r.ip,
      before: r.beforeJson,
      after: r.afterJson,
    })),
  };
}
