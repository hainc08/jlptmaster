import { test, expect, type Page } from "@playwright/test";
import { login, createStaffUser, deleteTestUser, resetUserStatus, ADMIN_EMAIL, STAFF_PASSWORD } from "./helpers";

const SUPPORT_EMAIL = `e2e-support-${Date.now()}@test.invalid`;
const EDITOR_EMAIL = `e2e-editor-${Date.now()}@test.invalid`;

test.beforeAll(async () => {
  await resetUserStatus("thu.ha@example.com");
  await createStaffUser(SUPPORT_EMAIL, "SUPPORT");
  await createStaffUser(EDITOR_EMAIL, "EDITOR");
});
test.afterAll(async () => {
  await deleteTestUser(SUPPORT_EMAIL);
  await deleteTestUser(EDITOR_EMAIL);
});

// The console defaults to Vietnamese, so button labels may be localized.
const SAVE = /Save changes|Lưu thay đổi/;
const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });

test.describe("Admin CMS console", () => {
  test("ADMIN: dashboard → filter members → suspend a member → see the audit trail with before/after", async ({ page }) => {
    await login(page, ADMIN_EMAIL, "/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByText("Total members")).toBeVisible();
    await expect(page.getByRole("img", { name: /members by level/i })).toBeVisible();

    await nav(page).getByRole("link", { name: /Thành viên|Members/ }).click();
    await expect(page).toHaveURL(/\/admin\/members/);
    await page.getByLabel("Level").selectOption("N5");
    await expect(page).toHaveURL(/level=N5/);
    await page.getByRole("searchbox", { name: "Search members" }).fill("thu.ha");
    await expect(page).toHaveURL(/q=thu\.ha/);
    await page.getByRole("link", { name: "Lê Thu Hà" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Lê Thu Hà" })).toBeVisible();

    try {
      await page.getByRole("button", { name: "Suspend", exact: true }).click();
      await page.getByRole("button", { name: "Suspend account" }).click();
      await expect(page.getByText("Account suspended")).toBeVisible();

      await nav(page).getByRole("link", { name: /Nhật ký|Audit/ }).click();
      await page.getByLabel("Module").selectOption("member");
      const row = page.getByRole("row").filter({ hasText: "member.suspend" }).first();
      await expect(row).toBeVisible();
      await row.getByRole("button", { name: "Show changes" }).click();
      await expect(page.getByRole("region", { name: "Before" })).toContainText("ACTIVE");
      await expect(page.getByRole("region", { name: "After" })).toContainText("SUSPENDED");
    } finally {
      // leave the seeded learner as we found it
      await page.goto("/admin/members?q=thu.ha");
      await page.getByRole("link", { name: "Lê Thu Hà" }).first().click();
      await expect(page.getByRole("heading", { level: 1, name: "Lê Thu Hà" })).toBeVisible();
      const reactivate = page.getByRole("button", { name: "Reactivate", exact: true });
      if (await reactivate.isVisible()) {
        await reactivate.click();
        await page.getByRole("button", { name: "Reactivate account" }).click();
        await expect(page.getByText("Account reactivated")).toBeVisible();
      }
    }
  });

  test("SUPPORT: lands on the console, has no Settings/Levels, and is refused by URL and by API", async ({ page }) => {
    await login(page, SUPPORT_EMAIL, undefined, STAFF_PASSWORD);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    const links = await nav(page).getByRole("link").allTextContents();
    expect(links.map((l) => l.trim())).toEqual(expect.not.arrayContaining(["Settings", "Cài đặt hệ thống", "Levels", "Cấp độ"]));
    expect(links.length).toBe(3);

    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\/dashboard/); // shell redirects to the first permitted module
    expect((await page.request.get("/api/v1/admin/settings")).status()).toBe(403);
    expect((await page.request.get("/api/v1/admin/levels")).status()).toBe(403);
    expect((await page.request.get("/api/v1/admin/members")).status()).toBe(200);

    await page.goto("/admin"); // legacy admin home stays ADMIN/OWNER only
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("EDITOR: can edit levels but cannot see members or audit", async ({ page }) => {
    await login(page, EDITOR_EMAIL, undefined, STAFF_PASSWORD);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    expect(await nav(page).getByRole("link").count()).toBe(2);
    expect((await page.request.get("/api/v1/admin/members")).status()).toBe(403);
    expect((await page.request.get("/api/v1/admin/audit")).status()).toBe(403);
    await nav(page).getByRole("link", { name: /Cấp độ|Levels/ }).click();
    await page.getByRole("button", { name: /Edit N4/ }).click();
    await expect(page.getByRole("switch", { name: /enabled for learners/i })).toBeDisabled();
  });

  test("a student is bounced out of /admin/* and refused by every admin API", async ({ page }) => {
    await login(page, "minh@jlptmaster.vn");
    await page.goto("/admin/members");
    await expect(page).toHaveURL(/\/dashboard$/);
    for (const path of ["dashboard", "members", "levels", "settings", "audit", "members/export"]) {
      expect((await page.request.get(`/api/v1/admin/${path}`)).status(), path).toBe(403);
    }
  });

  test("tablet width collapses the sidebar to icons and navigation still works", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await login(page, ADMIN_EMAIL, "/admin/dashboard");
    await expect(nav(page)).toBeVisible();
    const box = await nav(page).boundingBox();
    expect(box!.width).toBeLessThan(100); // icon rail, not the 256px sidebar
    await expect(nav(page).locator(".lbl").first()).toBeHidden();
    await nav(page).getByRole("link", { name: /Cấp độ|Levels/ }).click();
    await expect(page).toHaveURL(/\/admin\/levels/);
    await expect(page.getByRole("heading", { level: 2, name: /^N5/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test("Settings: a changed exam rule survives a reload, then is restored", async ({ page }) => {
    await login(page, ADMIN_EMAIL, "/admin/settings");
    await page.getByRole("tab", { name: "Exam rules" }).click();
    const retake = page.getByLabel(/retake limit/i);
    const original = await retake.inputValue();
    await retake.fill("4");
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    await page.getByRole("button", { name: SAVE }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();
    try {
      await page.reload();
      await page.getByRole("tab", { name: "Exam rules" }).click();
      await expect(page.getByLabel(/retake limit/i)).toHaveValue("4");
    } finally {
      await page.getByLabel(/retake limit/i).fill(original);
      await page.getByRole("button", { name: SAVE }).click();
      await expect(page.getByText("All changes saved")).toBeVisible();
    }
  });

  test("every console page has one h1, a labelled main nav, and labelled form controls", async ({ page }) => {
    await login(page, ADMIN_EMAIL, "/admin/dashboard");
    // Listen only after sign-in: the guest login page legitimately gets 401s from its own session probe.
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text().slice(0, 300)}`));
    for (const path of ["dashboard", "members", "levels", "settings", "audit"]) {
      await page.goto(`/admin/${path}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(nav(page)).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const unlabeled = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>(".cms input:not([type=hidden]), .cms select, .cms textarea")]
          .filter((el) => !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby") && !(el.id && document.querySelector(`label[for="${el.id}"]`)) && !el.closest("label"))
          .map((el) => el.outerHTML.slice(0, 80)),
      );
      expect(unlabeled, `${path}: unlabeled controls`).toEqual([]);
    }
    expect(problems, "browser errors while visiting the console pages").toEqual([]);
  });
});
