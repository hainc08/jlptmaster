import { test, expect } from "@playwright/test";
import { login, deleteTestUser, STUDENT_EMAIL, ADMIN_EMAIL } from "./helpers";

test.describe("Authentication & route guards", () => {
  test("anonymous visitors are sent to /login with a redirect back", async ({ page }) => {
    for (const path of ["/admin", "/admin/exams", "/dashboard", "/flashcards", "/mock-exams"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?redirect=${encodeURIComponent(path)}`));
    }
  });

  test("a student logs in, lands on the dashboard, and cannot open /admin", async ({ page }) => {
    await login(page, STUDENT_EMAIL);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Lộ trình ôn tập cho bạn")).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("an admin reaches /admin, but a forged unsigned ADMIN cookie is rejected", async ({ page, context }) => {
    await login(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin/);

    // Replace the real cookie with an unsigned token that merely claims ADMIN.
    const payload = { role: "ADMIN", userId: "x", email: "x@x", exp: 9999999999 };
    const forged = Buffer.from(JSON.stringify(payload)).toString("base64url") + ".bogus";
    await context.clearCookies();
    await context.addCookies([{ name: "jlpt_session", value: forged, url: "http://localhost:3000" }]);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unknown URLs show the Vietnamese 404 page with a 404 status and the footer", async ({ page }) => {
    const res = await page.goto("/trang-khong-ton-tai");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Không tìm thấy trang bạn cần" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("a wrong password is rejected with a generic message and no session", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill("definitely-wrong-1");
    await page.getByRole("button", { name: /Đăng nhập vào hệ thống/ }).click();
    await expect(page.getByText("Email hoặc mật khẩu không chính xác")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("sign-up validates the password policy, then creates a real account that can log in again", async ({ page, context }) => {
    const email = `e2e-${Date.now()}@example.test`;
    const password = "E2e-Pass-2026x";
    try {
      await page.goto("/register");

      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill("lettersonly");
      await page.getByRole("button", { name: /Đăng ký và bắt đầu học/ }).click();
      await expect(page.getByRole("alert").filter({ hasText: "chữ và số" })).toBeVisible();

      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button", { name: /Đăng ký và bắt đầu học/ }).click();
      await expect(page).toHaveURL(/\/onboarding/);

      // Log out (drop the cookie) and sign in again with the new credentials
      await context.clearCookies();
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login/);
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button", { name: /Đăng nhập vào hệ thống/ }).click();
      await expect(page).toHaveURL(/\/dashboard/);
    } finally {
      await deleteTestUser(email);
    }
  });
});
