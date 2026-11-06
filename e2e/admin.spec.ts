import { test, expect } from "@playwright/test";
import { login, ADMIN_EMAIL, STUDENT_EMAIL } from "./helpers";
import type { Page } from "@playwright/test";

/** Unlock every exam of every level (the UI test above may lock an exam of any level). */
async function unlockEveryExam(page: Page) {
  const res = await page.request.get("/api/v1/admin/exams");
  expect(res.ok()).toBeTruthy();
  for (const e of (await res.json()).data as { id: string; isLocked: boolean }[]) {
    if (e.isLocked) await page.request.post(`/api/v1/admin/exams/${e.id}/lock`, { data: { locked: false } });
  }
}

test.describe("Admin: exam lock/unlock and CMS", () => {
  test("locking an exam hides it from students; unlocking restores it", async ({ page, browser }) => {
    await login(page, ADMIN_EMAIL);
    await page.goto("/admin/exams");
    const student = await browser.newContext();
    const studentPage = await student.newPage();
    await login(studentPage, STUDENT_EMAIL, "/mock-exams");

    try {
      await expect(page.getByText("Đang mở").first()).toBeVisible();
      await page.getByRole("button", { name: "Khóa đề", exact: true }).first().click();
      await expect(page.getByText("Đã khóa").first()).toBeVisible();

      // Several N5 exams are published now (Số 01 + Số 02): lock the remaining N5 ones through the API so the
      // student's N5 list is empty, whichever exam the UI click above happened to lock.
      const n5 = await page.request.get("/api/v1/admin/exams?level=N5");
      expect(n5.ok()).toBeTruthy();
      for (const e of (await n5.json()).data as { id: string; isLocked: boolean }[]) {
        if (!e.isLocked) await page.request.post(`/api/v1/admin/exams/${e.id}/lock`, { data: { locked: true } });
      }

      await studentPage.goto("/mock-exams");
      await expect(studentPage.getByText(/chưa có bộ đề nào đang mở cho cấp độ N5/)).toBeVisible();

      await page.getByRole("button", { name: "Mở khóa đề", exact: true }).first().click();
      await expect(page.getByText("Đang mở").first()).toBeVisible();
      await unlockEveryExam(page);
      await studentPage.goto("/mock-exams");
      await expect(studentPage.getByRole("button", { name: /Bắt đầu thi/ }).first()).toBeVisible();
    } finally {
      await unlockEveryExam(page);
      await student.close();
    }
  });

  test("CMS: unpublish and republish a content item through the real API", async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await page.goto("/admin");
    // First currently-published row (earlier runs may have left archived E2E rows at the top)
    const firstRow = page.locator("tbody tr", { has: page.getByRole("button", { name: "Gỡ xuất bản" }) }).first();
    await expect(firstRow).toBeVisible();
    const title = await firstRow.locator("td").first().innerText();

    await firstRow.getByRole("button", { name: "Gỡ xuất bản" }).click();
    const row = page.locator("tbody tr", { hasText: title }).first();
    await expect(row.getByText("ARCHIVED")).toBeVisible();
    await row.getByRole("button", { name: "Phê duyệt xuất bản" }).click();
    await expect(page.locator("tbody tr", { hasText: title }).first().getByText("PUBLISHED")).toBeVisible();
  });

  test("CSV import: an invalid file blocks the commit, a valid file inserts into the database", async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await page.goto("/admin/content/import");
    const header = "surface,reading,romaji,pos,meaningVi\n";

    // Invalid: a row without reading gives an error and the commit stays disabled (atomic policy)
    await page.getByLabel("Chọn tệp CSV").setInputFiles({
      name: "bad.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(header + "雨,あめ,ame-e2e,Danh từ,Cơn mưa\n大きい,,ookii-e2e,Tính từ,To lớn\n"),
    });
    await expect(page.getByText("1 dòng lỗi")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Nhập \d+ dòng/ })).toBeDisabled();

    // Valid: commit
    const romaji = `e2e${Date.now()}`;
    await page.getByLabel("Chọn tệp CSV").setInputFiles({
      name: "ok.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(header + `猫,ねこ,${romaji},Danh từ,Con mèo (E2E)\n`),
    });
    await expect(page.getByText("0 dòng lỗi")).toBeVisible();
    await page.getByRole("button", { name: /^Nhập 1 dòng/ }).click();
    await expect(page.getByRole("status")).toContainText("Đã nhập 1 từ vựng");

    // Cleanup: archive the imported row so learners never see test data
    const list = await (await page.request.get("/api/v1/admin/content")).json();
    const created = (list.data as { id: string; slug: string }[]).find((i) => i.slug.includes(romaji));
    expect(created).toBeTruthy();
    const res = await page.request.post(`/api/v1/admin/content/${created!.id}/publish`, {
      data: { status: "ARCHIVED" },
    });
    expect(res.ok()).toBeTruthy();
  });
});
