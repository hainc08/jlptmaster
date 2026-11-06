import { test, expect } from "@playwright/test";
import { login, STUDENT_EMAIL } from "./helpers";

test.describe("learner shell", () => {
  test("no horizontal scroll at 320px with English selected", async ({ page }) => {
    await login(page, STUDENT_EMAIL);
    await page.setViewportSize({ width: 320, height: 700 });
    for (const path of ["/learn/n5", "/mock-exams", "/dashboard", "/kanji"]) {
      await page.goto(path);
      await page.evaluate(() => localStorage.setItem("jlpt.locale", "en"));
      await page.reload();
      await expect(page.getByRole("group", { name: "Language" })).toBeVisible();
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, path).toBeLessThanOrEqual(320);
    }
    await page.evaluate(() => localStorage.removeItem("jlpt.locale"));
  });

  test("bottom tabs on phones, sidebar on desktop", async ({ page }) => {
    await login(page, STUDENT_EMAIL);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/dashboard");
    const navs = page.getByRole("navigation", { name: "Điều hướng chính" });
    await expect(navs).toHaveCount(1);
    await expect(navs.getByRole("link", { name: /Thi thử/ })).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator("aside nav[aria-label='Điều hướng chính']")).toBeVisible();
    await expect(page.locator("nav.fixed[aria-label='Điều hướng chính']")).toBeHidden();
  });
});
