import type { LevelStatus } from "@prisma/client";
import { prisma } from "@/src/server/db";
import type { SessionPayload } from "@/src/server/services/auth-service";
import { recordAudit } from "@/src/server/services/audit-service";
import { AdminError } from "@/src/server/services/admin-errors";

export interface LevelRow {
  code: string;
  name: string;
  description: string;
  status: LevelStatus;
  enabled: boolean;
  passScore: number;
  displayOrder: number;
  lessons: number;
  exams: number;
  /** Learners targeting this level; for unpublished levels this is the waitlist. */
  enrolled: number;
}

export async function listLevels(): Promise<LevelRow[]> {
  const levels = await prisma.jlptLevel.findMany({ orderBy: [{ displayOrder: "asc" }, { rankOrder: "asc" }] });
  return Promise.all(
    levels.map(async (l) => {
      const [lessons, exams, enrolled] = await Promise.all([
        prisma.lesson.count({ where: { status: "PUBLISHED", course: { levelId: l.id } } }),
        prisma.exam.count({ where: { status: "PUBLISHED", levelId: l.id } }),
        prisma.user.count({ where: { role: "STUDENT", deletedAt: null, profile: { is: { targetLevel: l.id } } } }),
      ]);
      return {
        code: l.id, name: l.nameVi, description: l.description, status: l.status, enabled: l.isActive,
        passScore: l.passScore, displayOrder: l.displayOrder, lessons, exams, enrolled,
      };
    }),
  );
}

export interface LevelPatch {
  name?: string;
  description?: string;
  passScore?: number;
  enabled?: boolean;
}

/**
 * Editing a level never changes its publication status — that belongs to the content workflow.
 * A level can only be enabled for learners while it is PUBLISHED.
 */
export async function updateLevel(actor: SessionPayload, code: string, patch: LevelPatch, ip?: string | null): Promise<LevelRow> {
  const level = await prisma.jlptLevel.findUnique({ where: { id: String(code) } });
  if (!level) throw new AdminError(404, "NOT_FOUND", "Không tìm thấy cấp độ");

  const data: { nameVi?: string; description?: string; passScore?: number; isActive?: boolean } = {};
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  const set = <K extends keyof LevelPatch>(key: K, column: keyof typeof data, current: unknown, next: unknown) => {
    if (next === current) return;
    (data as Record<string, unknown>)[column] = next;
    before[key] = current;
    after[key] = next;
  };

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (name.length < 1 || name.length > 50) throw new AdminError(400, "INVALID_NAME", "Tên cấp độ phải từ 1 đến 50 ký tự");
    set("name", "nameVi", level.nameVi, name);
  }
  if (patch.description !== undefined) {
    if (patch.description.length > 500) throw new AdminError(400, "INVALID_DESCRIPTION", "Mô tả tối đa 500 ký tự");
    set("description", "description", level.description, patch.description);
  }
  if (patch.passScore !== undefined) {
    if (!Number.isInteger(patch.passScore) || patch.passScore < 30 || patch.passScore > 100) {
      throw new AdminError(400, "INVALID_PASS_SCORE", "Điểm đạt phải là số nguyên từ 30 đến 100");
    }
    set("passScore", "passScore", level.passScore, patch.passScore);
  }
  if (patch.enabled !== undefined) {
    if (patch.enabled && level.status !== "PUBLISHED") {
      throw new AdminError(409, "LEVEL_NOT_PUBLISHED", "Chỉ có thể bật cấp độ đã được xuất bản");
    }
    set("enabled", "isActive", level.isActive, patch.enabled);
  }

  if (Object.keys(data).length) {
    await prisma.$transaction(async (tx) => {
      await tx.jlptLevel.update({ where: { id: level.id }, data });
      await recordAudit({ actorId: actor.userId, action: "level.update", entityType: "level", entityId: level.id, before, after, ip }, tx);
    });
  }
  const row = (await listLevels()).find((l) => l.code === level.id);
  return row!;
}

export async function reorderLevels(actor: SessionPayload, order: string[], ip?: string | null): Promise<void> {
  const levels = await prisma.jlptLevel.findMany({ orderBy: [{ displayOrder: "asc" }, { rankOrder: "asc" }] });
  const known = levels.map((l) => l.id);
  const isPermutation = order.length === known.length && new Set(order).size === known.length && order.every((c) => known.includes(c));
  if (!isPermutation) throw new AdminError(400, "INVALID_ORDER", "Thứ tự phải là hoán vị đầy đủ của các cấp độ");
  await prisma.$transaction(async (tx) => {
    for (const [i, id] of order.entries()) await tx.jlptLevel.update({ where: { id }, data: { displayOrder: i + 1 } });
    await recordAudit({ actorId: actor.userId, action: "level.reorder", entityType: "level", entityId: "levels", before: { order: known }, after: { order }, ip }, tx);
  });
}
