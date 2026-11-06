import { test, expect } from "@playwright/test";
import { login, STUDENT_EMAIL } from "./helpers";

test.describe("Student mock exam journey (real API + MariaDB)", () => {
  test("start, answer with autosave, submit, see skill results, then the dashboard roadmap", async ({ page }) => {
    await login(page, STUDENT_EMAIL, "/mock-exams");
    await expect(page).toHaveURL(/\/mock-exams$/);

    // N5 is selected, N4 is locked, and N5 has an open exam
    await expect(page.getByRole("button", { name: "N5" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /N4/ })).toHaveAttribute("aria-disabled", "true");
    await page.getByRole("button", { name: /^(Bắt đầu|Làm lại)/ }).first().click();

    // Real attempt id (UUID) and real questions from the server
    await expect(page).toHaveURL(/\/mock-exams\/[0-9a-f-]{36}$/);
    await expect(page.getByText(/^Câu 1\/\d+$/)).toBeVisible();
    await expect(page.getByRole("timer", { name: "Thời gian còn lại" })).toBeVisible();

    // Answer the first question and wait for the server autosave
    await page.getByRole("radio").first().click();
    await expect(page.getByText(/Đã lưu tự động lúc/)).toBeVisible();

    // Reload: the saved answer survives because state comes from the server
    await page.reload();
    await expect(page.getByText(/Đã trả lời \(1\)/)).toBeVisible();

    // Flag question 2, then check the dialog counts
    await page.getByRole("button", { name: "Câu 2", exact: true }).click();
    await page.getByRole("button", { name: "Đánh dấu" }).click();
    await expect(page.getByRole("button", { name: /^Câu 2, đã đánh dấu$/ })).toBeVisible();

    // Submit through the confirmation dialog that warns about unanswered questions
    await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Nộp bài thi?")).toBeVisible();
    await expect(dialog.getByTestId("count-answered")).toHaveText("1");
    await expect(dialog.getByTestId("count-flagged")).toHaveText("1");
    await expect(dialog.getByText(/chưa chọn đáp án/)).toBeVisible();
    await dialog.getByRole("button", { name: "Nộp bài", exact: true }).click();

    // Results are computed by the server from the real answers
    await expect(page).toHaveURL(/\/results\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Điểm theo kỹ năng")).toBeVisible();
    await expect(page.getByText("Kỹ năng cần cải thiện")).toBeVisible();
    await expect(page.getByText("Điểm ước tính", { exact: true })).toBeVisible();
    await expect(page.getByText("Điểm ước tính, không phải cách chấm điểm chính thức của JLPT.")).toBeVisible();
    await expect(page.getByText("Mốc tham khảo: 80/180")).toBeVisible();

    // The weak skills feed the personal roadmap on the dashboard
    await page.goto("/dashboard");
    await expect(page.getByText("Lộ trình ôn tập cho bạn")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ôn ngay" }).first()).toBeVisible();
  });

  test("an anonymous visitor cannot open or read an attempt", async ({ page, browser }) => {
    await login(page, STUDENT_EMAIL, "/mock-exams");
    await page.getByRole("button", { name: /^(Bắt đầu|Làm lại)/ }).first().click();
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
