import { expect, type Page } from "@playwright/test";
import { DEMO_PASSWORDS } from "../prisma/demo-credentials";
import { hashPassword } from "../src/server/services/password-service";

// Seeded demo accounts. Their passwords are set by `SEED_DEMO_PASSWORDS=1 npm run db:seed` (local/CI only).
export const STUDENT_EMAIL = "minh@jlptmaster.vn";
export const ADMIN_EMAIL = "admin@jlptmaster.vn";

function passwordFor(email: string): string {
  return email === ADMIN_EMAIL ? DEMO_PASSWORDS.admin : DEMO_PASSWORDS.student;
}

export async function login(page: Page, email: string, redirect?: string, password?: string) {
  await page.goto(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password ?? passwordFor(email));
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Unlock every N5 exam via the admin API (used in finally blocks so a failed run never leaves a locked exam). */
export async function unlockAllExams(page: Page) {
  const res = await page.request.get("/api/v1/admin/exams?level=N5");
  expect(res.ok()).toBeTruthy();
  const { data } = await res.json();
  for (const e of data as { id: string; isLocked: boolean }[]) {
    if (e.isLocked) {
      await page.request.post(`/api/v1/admin/exams/${e.id}/lock`, { data: { locked: false } });
    }
  }
}

/** Delete a throw-away user created by an E2E test (reads DATABASE_URL from the environment or .env). */
export async function deleteTestUser(email: string) {
  const fs = await import("node:fs");
  const path = await import("node:path");
  if (!process.env.DATABASE_URL) {
    const envFile = path.resolve(__dirname, "../.env");
    if (fs.existsSync(envFile)) {
      const line = fs.readFileSync(envFile, "utf8").split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
      if (line) process.env.DATABASE_URL = line.slice("DATABASE_URL=".length).replace(/^"|"$/g, "");
    }
  }
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.user.deleteMany({ where: { email } });
  } finally {
    await prisma.$disconnect();
  }
}

/** Creates a throw-away staff account (SUPPORT/EDITOR/...) with a known password for E2E; remove it with deleteTestUser. */
export const STAFF_PASSWORD = "Staff-E2E-2026!";
export async function createStaffUser(email: string, role: "SUPPORT" | "EDITOR" | "OWNER" | "ADMIN") {
  await deleteTestUser(email);
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.user.create({
      data: { email, role, status: "ACTIVE", displayName: `E2E ${role}`, passwordHash: await hashPassword(STAFF_PASSWORD), profile: { create: { targetLevel: "N5" } } },
    });
  } finally {
    await prisma.$disconnect();
  }
}

/** Puts a seeded learner back to ACTIVE (a previous failed run may have left it suspended). */
export async function resetUserStatus(email: string) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.user.updateMany({ where: { email }, data: { status: "ACTIVE" } });
  } finally {
    await prisma.$disconnect();
  }
}
