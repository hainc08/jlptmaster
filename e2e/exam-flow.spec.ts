import { test, expect } from "@playwright/test";
import { login, STUDENT_EMAIL } from "./helpers";

test.describe("Student mock exam journey (real API + MariaDB)", () => {
  test("start, answer with autosave, submit, see skill results, then the dashboard roadmap", async ({ page }) => {
    await login(page, STUDENT_EMAIL, "/mock-exams");
    await expect(page).toHaveURL(/\/mock-exams$/);

    // Level tabs exist and N5 has an open exam
    await expect(page.getByRole("tab", { name: "N5" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: /Bắt đầu thi/ }).first().click();

    // Real attempt id (UUID) and real questions from the server
    await expect(page).toHaveURL(/\/mock-exams\/[0-9a-f-]{36}$/);
    await expect(page.getByText(/Câu hỏi 1 \/ \d+/)).toBeVisible();
    await expect(page.getByText("Thời gian còn lại")).toBeVisible();

    // Answer the first question and wait for the server autosave
    await page.locator("button.w-full.p-4").first().click();
    await expect(page.getByText(/Đã lưu tự động lúc/)).toBeVisible();

    // Reload: the saved answer survives because state comes from the server
    await page.reload();
    await expect(page.getByText(/Đã trả lời \(1\)/)).toBeVisible();

    // Submit through the confirmation dialog that warns about unanswered questions
    await page.getByRole("button", { name: "Nộp bài thi" }).click();
    await expect(page.getByText("Xác nhận nộp bài thi?")).toBeVisible();
    await expect(page.getByText(/chưa chọn đáp án/)).toBeVisible();
    await page.getByRole("button", { name: "Nộp bài ngay" }).click();

    // Results are computed by the server from the real answers
    await expect(page).toHaveURL(/\/results\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Kết quả theo từng kỹ năng")).toBeVisible();
    await expect(page.getByText(/Chẩn đoán kỹ năng cần cải thiện/)).toBeVisible();
    await expect(page.getByText("/ 180 điểm")).toBeVisible();

    // The weak skills feed the personal roadmap on the dashboard
    await page.goto("/dashboard");
    await expect(page.getByText("Lộ trình ôn tập cho bạn")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ôn ngay" }).first()).toBeVisible();
  });

  test("an anonymous visitor cannot open or read an attempt", async ({ page, browser }) => {
    await login(page, STUDENT_EMAIL, "/mock-exams");
    await page.getByRole("button", { name: /Bắt đầu thi/ }).first().click();
    await expect(page).toHaveURL(/\/mock-exams\/[0-9a-f-]{36}$/);
    const attemptUrl = page.url();
    const attemptId = attemptUrl.split("/").pop()!;

    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(attemptUrl);
    await expect(anonPage).toHaveURL(/\/login/);
    // The API also refuses without a session, even if a userId is supplied
    const apiRes = await anonPage.request.get(`/api/v1/attempts/${attemptId}?userId=anything`);
    expect(apiRes.status()).toBe(401);
    await anon.close();
  });
});
