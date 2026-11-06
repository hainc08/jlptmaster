import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ lessonSlug: "bai-03-danh-tu-va-tro-tu-wa-desu" }),
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Milestone 3: Dashboard & Learning Truthfulness", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Dashboard renders genuine progress from API instead of hardcoded 5-day streak and fake 142 score", async () => {
    const DashboardPage = (await import("@/app/dashboard/page")).default;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/v1/progress/overview")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              totalLessonsCount: 10,
              completedLessonsCount: 2,
              dueReviewsCount: 5,
              totalReviewsCount: 20,
              vocabCount: 150,
              kanjiCount: 40,
              grammarCount: 25,
              currentStreak: 1,
              recentAttempts: [], // Brand new user, no attempts
              nextLesson: {
                id: "les-03",
                slug: "bai-03-danh-tu-va-tro-tu-wa-desu",
                titleVi: "Bài 03: Khẳng định, Phủ định",
              },
            },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<DashboardPage />);

    await waitFor(() => {
      // Must reflect genuine SRS due count from API (5)
      expect(screen.getByText("5")).toBeDefined();
    });

    // When there are no attempts, it should display empty state rather than hardcoded 142
    expect(screen.queryByText("142")).toBeNull();
  });

  it("Lesson page allows student to mark lesson completed via API", async () => {
    const LessonPage = (await import("@/app/learn/n5/[lessonSlug]/page")).default;

    let completedCalled = false;
    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes("/complete") && options?.method === "POST") {
        completedCalled = true;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: { status: "COMPLETED", lessonId: "les-03" },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: {
            id: "les-03",
            slug: "bai-03-danh-tu-va-tro-tu-wa-desu",
            titleVi: "Bài 03: Khẳng định, Phủ định",
          },
        }),
      });
    });

    render(<LessonPage />);

    // Find and click the mark complete button
    const completeBtn = await screen.findByRole("button", { name: /đánh dấu hoàn thành/i });
    expect(completeBtn).toBeDefined();

    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(completedCalled).toBe(true);
      const matches = screen.getAllByText(/đã hoàn thành/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });
});
