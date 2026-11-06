import { test, expect } from "@playwright/test";
import { login, STUDENT_EMAIL } from "./helpers";

test.describe("learner journey (redesign, real API + MariaDB)", () => {
  test("home → lesson cards → mock test → result → profile history", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page, STUDENT_EMAIL);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Chào buổi (sáng|trưa|chiều|tối)/);
    await expect(page.getByText("ngày liên tiếp")).toBeVisible();

    // Lesson with vocabulary cards: go through all of them
    await page.goto("/learn/n5");
    await page.getByRole("link", { name: /Bài 03/ }).click();
    await expect(page.getByText(/^Thẻ 1 \/ \d+$/)).toBeVisible();
    const total = Number((await page.getByText(/^Thẻ 1 \/ \d+$/).textContent())!.split("/")[1].trim());
    for (let i = 0; i < total; i++) {
      await page.getByRole("button", { name: "Đã thuộc" }).click();
    }
    await expect(page.getByText("Đã hoàn thành bài học")).toBeVisible();

    // Learn now shows the completed chip from the server
    await page.goto("/learn/n5");
    await expect(page.getByRole("link", { name: /Bài 03.*Hoàn thành/ })).toBeVisible();

    // Mock test: answer, flag, submit
    await page.getByRole("link", { name: /Thi thử/ }).click();
    await expect(page).toHaveURL(/\/mock-exams$/);
    const card = page.getByRole("listitem").filter({ hasText: "Số 01" });
    await card.getByRole("button", { name: /^(Bắt đầu|Làm lại)/ }).click();
    await expect(page).toHaveURL(/\/mock-exams\/[0-9a-f-]{36}$/);
    await page.getByRole("radio").first().click();
    await page.getByRole("button", { name: "Đánh dấu" }).click();
    await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Nộp bài", exact: true }).click();

    await expect(page).toHaveURL(/\/results\/[0-9a-f-]{36}$/);
    const attemptId = page.url().split("/").pop()!;
    await expect(page.getByText("Điểm ước tính", { exact: true })).toBeVisible();
    await expect(page.getByText("Điểm ước tính, không phải cách chấm điểm chính thức của JLPT.")).toBeVisible();

    // Profile lists the new attempt first
    await page.getByRole("link", { name: /Hồ sơ/ }).click();
    const history = page.getByRole("list", { name: "Lịch sử thi thử" });
    await expect(history.getByRole("link").first()).toHaveAttribute("href", `/results/${attemptId}`);

    // The lobby now offers a retake and shows the best score
    await page.goto("/mock-exams");
    await expect(card.getByRole("button", { name: /Làm lại/ })).toBeVisible();
    await expect(card.getByText(/Cao nhất: \d+\/180/)).toBeVisible();
  });
});
