import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard",
}));

import DashboardPage from "@/app/dashboard/page";

const overview = {
  totalLessonsCount: 3,
  completedLessonsCount: 1,
  dueReviewsCount: 4,
  totalReviewsCount: 9,
  nextLesson: { id: "l2", slug: "bai-02", titleVi: "Bài 02: Chào hỏi" },
  recentAttempts: [{ id: "a1", examTitle: "N5 Đề 01", internalScore: 129, submittedAt: "2026-11-05T03:00:00Z" }],
};

function mockApis(over: Record<string, unknown> = overview, overviewOk = true) {
  const f = vi.fn((url: string) => {
    if (url.includes("/progress/overview")) {
      return Promise.resolve({ ok: overviewOk, status: overviewOk ? 200 : 500, json: async () => ({ data: over }) } as Response);
    }
    if (url.includes("/profile")) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: { targetLevel: "N5", dailyGoalMinutes: 15 } }) } as Response);
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: { roadmap: [] } }) } as Response);
  });
  global.fetch = f as unknown as typeof fetch;
  return f;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Home (frame 02)", () => {
  it("renders no streak, ring or week bars while activity data is absent", async () => {
    mockApis();
    render(<DashboardPage />);
    expect(await screen.findByText("Bài 02: Chào hỏi")).toBeInTheDocument();
    expect(screen.queryByText(/ngày liên tiếp/)).toBeNull();
    expect(screen.queryByRole("img", { name: /phút/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Ôn tập/ })).toHaveAttribute("href", "/flashcards");
    expect(screen.getByText("129/180")).toBeInTheDocument();
  });

  it("greets by local time of day", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 6, 9, 0, 0));
    mockApis();
    render(<DashboardPage />);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(/^Chào buổi sáng/);
  });

  it("shows the error state and retries", async () => {
    const f = mockApis(overview, false);
    render(<DashboardPage />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    const before = f.mock.calls.filter((c) => String(c[0]).includes("overview")).length;
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() =>
      expect(f.mock.calls.filter((c) => String(c[0]).includes("overview")).length).toBe(before + 1)
    );
  });

  it("renders the ring, streak and week when activity is present", async () => {
    mockApis({
      ...overview,
      activity: {
        todayMinutes: 10,
        dailyGoalMinutes: 15,
        streakDays: 12,
        week: ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"].map((day, i) => ({
          day,
          minutes: i < 5 ? 10 : null,
        })),
      },
    });
    render(<DashboardPage />);
    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("ngày liên tiếp")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "10 trên 15 phút hôm nay" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /T2: 10 phút/ })).toBeInTheDocument();
  });
});
