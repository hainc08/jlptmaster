import { z } from "zod";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/src/server/db";
import type { SessionPayload } from "@/src/server/services/auth-service";
import { recordAudit } from "@/src/server/services/audit-service";
import { AdminError } from "@/src/server/services/admin-errors";
import { ADMIN_MODULES, type AdminModule } from "@/src/server/services/admin-guard";

// Settings are stored only: the exam engine and email sender do not read them yet (see docs/api/admin-cms.md §4).

const GeneralSchema = z.object({
  siteName: z.string().trim().min(1).max(60),
  defaultLanguage: z.enum(["vi", "en", "ja"]),
});
const ExamRulesSchema = z.object({
  timeLimitMin: z.number().int().min(10).max(240),
  retakeLimit: z.number().int().min(0).max(10),
  passThreshold: z.number().int().min(30).max(100),
});
const NotificationsSchema = z.object({
  welcome: z.boolean(),
  passwordReset: z.boolean(),
  examResult: z.boolean(),
  weeklyDigest: z.boolean(),
  suspension: z.boolean(),
  planExpiry: z.boolean(),
});

const SECTIONS = {
  general: { key: "general", action: "settings.general", schema: GeneralSchema },
  examRules: { key: "exam_rules", action: "settings.exam_rules", schema: ExamRulesSchema },
  notifications: { key: "notifications", action: "settings.notifications", schema: NotificationsSchema },
} as const;
type SectionName = keyof typeof SECTIONS;

const PatchSchema = z
  .object({
    general: GeneralSchema.partial().strict().optional(),
    examRules: ExamRulesSchema.partial().strict().optional(),
    notifications: NotificationsSchema.partial().strict().optional(),
  })
  .strict();

export type Settings = {
  general: z.infer<typeof GeneralSchema>;
  examRules: z.infer<typeof ExamRulesSchema>;
  notifications: z.infer<typeof NotificationsSchema>;
};
export type SettingsPatch = z.input<typeof PatchSchema>;

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.systemSetting.findMany();
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.valueJson]));
  return {
    general: GeneralSchema.parse(byKey.general),
    examRules: ExamRulesSchema.parse(byKey.exam_rules),
    notifications: NotificationsSchema.parse(byKey.notifications),
  };
}

export async function updateSettings(actor: SessionPayload, patch: SettingsPatch, ip?: string | null): Promise<Settings> {
  const parsed = PatchSchema.safeParse(patch);
  if (!parsed.success) {
    throw new AdminError(400, "INVALID_SETTINGS", parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; "));
  }
  const current = await getSettings();
  await prisma.$transaction(async (tx) => {
    for (const name of Object.keys(SECTIONS) as SectionName[]) {
      const incoming = parsed.data[name] as Record<string, unknown> | undefined;
      if (!incoming) continue;
      const before: Record<string, unknown> = {};
      const after: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(incoming)) {
        const was = (current[name] as Record<string, unknown>)[field];
        if (value !== undefined && value !== was) {
          before[field] = was;
          after[field] = value;
        }
      }
      if (!Object.keys(after).length) continue;
      const { key, action } = SECTIONS[name];
      const merged = { ...current[name], ...after } as Prisma.InputJsonObject;
      await tx.systemSetting.upsert({ where: { key }, update: { valueJson: merged }, create: { key, valueJson: merged } });
      await recordAudit({ actorId: actor.userId, action, entityType: "settings", entityId: key, before, after, ip }, tx);
    }
  });
  return getSettings();
}

// ------------------------------------------------------------------ role × module matrix

export const MATRIX_ROLES = ["OWNER", "ADMIN", "EDITOR", "SUPPORT"] as const;
export type MatrixRole = (typeof MATRIX_ROLES)[number];
export type RoleMatrix = Record<MatrixRole, Record<AdminModule, boolean>>;

const CellSchema = z.object(Object.fromEntries(ADMIN_MODULES.map((m) => [m, z.boolean()])) as Record<AdminModule, z.ZodBoolean>).strict();
const MatrixSchema = z.object(Object.fromEntries(MATRIX_ROLES.map((r) => [r, CellSchema])) as Record<MatrixRole, typeof CellSchema>).strict();

export async function getRoleMatrix(): Promise<RoleMatrix> {
  const rows = await prisma.rolePermission.findMany({ where: { role: { in: [...MATRIX_ROLES] as Role[] } } });
  const matrix = Object.fromEntries(
    MATRIX_ROLES.map((r) => [r, Object.fromEntries(ADMIN_MODULES.map((m) => [m, false]))]),
  ) as RoleMatrix;
  for (const row of rows) {
    if ((MATRIX_ROLES as readonly string[]).includes(row.role) && (ADMIN_MODULES as readonly string[]).includes(row.module)) {
      matrix[row.role as MatrixRole][row.module as AdminModule] = row.allowed;
    }
  }
  return matrix;
}

/**
 * Replaces the matrix with per-cell upserts in one transaction (never delete-then-insert, so a
 * concurrent permission check can never observe a missing row). OWNER is immutable and ADMIN keeps
 * `dashboard` + `settings`, so the last people able to repair permissions cannot be locked out.
 */
export async function putRoleMatrix(actor: SessionPayload, matrix: RoleMatrix, ip?: string | null): Promise<RoleMatrix> {
  const parsed = MatrixSchema.safeParse(matrix);
  if (!parsed.success) throw new AdminError(400, "INVALID_MATRIX", "Ma trận phải có đủ 4 vai trò × 5 module với giá trị đúng/sai");
  const next = parsed.data as RoleMatrix;
  if (ADMIN_MODULES.some((m) => !next.OWNER[m])) throw new AdminError(409, "OWNER_LOCKED", "Quyền của OWNER không thể thay đổi");
  if (!next.ADMIN.settings || !next.ADMIN.dashboard) {
    throw new AdminError(409, "LOCKOUT", "ADMIN phải giữ quyền Dashboard và Settings");
  }
  const before = await getRoleMatrix();
  await prisma.$transaction(async (tx) => {
    for (const role of MATRIX_ROLES) {
      for (const mod of ADMIN_MODULES) {
        await tx.rolePermission.upsert({
          where: { role_module: { role: role as Role, module: mod } },
          update: { allowed: next[role][mod] },
          create: { role: role as Role, module: mod, allowed: next[role][mod] },
        });
      }
    }
    await recordAudit({ actorId: actor.userId, action: "settings.roles", entityType: "settings", entityId: "roles", before, after: next, ip }, tx);
  });
  return getRoleMatrix();
}
