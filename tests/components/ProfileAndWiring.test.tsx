import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, act, within } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/profile",
  useParams: () => ({ lessonSlug: "bai-03" }),
}));

import ProfilePage from "@/app/profile/page";
import { FuriganaProvider } from "@/app/components/RubyText";
import { LocaleProvider } from "@/app/components/i18n";
import { useStudyHeartbeat } from "@/app/components/useStudyHeartbeat";

type Calls = { url: string; method: string; body?: string }[];

function mockProfileApis(history: unknown[] = [], goal = 15) {
  const calls: Calls = [];
  global.fetch = vi.fn((url: string, opts?: RequestInit) => {
    calls.push({ url, method: opts?.method ?? "GET", body: opts?.body as string | undefined });
    const ok = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data }) } as Response);
    if (url.startsWith("/api/v1/attempts")) return ok(history);
    if (url.startsWith("/api/v1/progress/overview")) return ok({ totalReviewsCount: 33, activity: { streakDays: 12, todayMinutes: 0, dailyGoalMinutes: goal, week: [] } });
    if (url.startsWith("/api/v1/profile")) return ok({ targetLevel: "N5", dailyGoalMinutes: goal, furiganaDefault: true, uiLanguage: "vi" });
    if (url.startsWith("/api/v1/auth/logout")) return ok({});
    if (url.startsWith("/api/v1/auth/me")) return ok({ user: { email: "minh.anh@example.com" } });
    return ok({});
  }) as unknown as typeof fetch;
  return calls;
}

const wrap = (ui: React.ReactNode) => (
  <LocaleProvider>
    <FuriganaProvider>{ui}</FuriganaProvider>
  </LocaleProvider>
);

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("jlpt_auth_email", "stale-hint@example.com");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Profile (frame 09)", () => {
  it("shows the empty history state with a link to the first test", async () => {
    mockProfileApis([]);
    render(wrap(<ProfilePage />));
    expect(await screen.findByText("Bạn chưa làm đề thi thử nào")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Làm đề N5 đầu tiên" })).toHaveAttribute("href", "/mock-exams");
    expect(screen.getByText("minh.anh@example.com")).toBeInTheDocument();
    expect(screen.getByText("Thẻ đã học")).toBeInTheDocument();
    expect(await screen.findByText("33")).toBeInTheDocument();
  });

  it("lists attempts with score, estimate chip, date and duration", async () => {
    mockProfileApis([
      { id: "a1", examId: "e1", examTitle: "N5 Đề 01", internalScore: 129, maxScore: 180, submittedAt: "2026-11-05T03:00:00Z", durationSeconds: 3900 },
      { id: "a2", examId: "e1", examTitle: "N5 Đề 01", internalScore: 70, maxScore: 180, submittedAt: "2026-11-01T03:00:00Z", durationSeconds: 1500 },
    ]);
    render(wrap(<ProfilePage />));
    const list = await screen.findByRole("list", { name: "Lịch sử thi thử" });
    const items = within(list).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("129/180");
    expect(items[0]).toHaveTextContent("Có khả năng đạt · ước tính");
    expect(items[0]).toHaveTextContent("05/11/2026");
    expect(items[0]).toHaveTextContent("65 phút");
    expect(items[1]).toHaveTextContent("Chưa đạt · ước tính");
  });

  it("the furigana switch saves the preference and hides furigana", async () => {
    const calls = mockProfileApis();
    const { container } = render(wrap(<ProfilePage />));
    const sw = await screen.findByRole("switch", { name: /Furigana mặc định/ });
    fireEvent.click(sw);
    await waitFor(() =>
      expect(calls.some((c) => c.method === "PATCH" && c.body === JSON.stringify({ furiganaDefault: false }))).toBe(true)
    );
    expect(container.querySelector(".furigana-hidden")).not.toBeNull();
  });

  it("goal and language controls PATCH; logout signs out", async () => {
    const calls = mockProfileApis([], 30);
    render(wrap(<ProfilePage />));
    const goal = await screen.findByRole("radiogroup", { name: "Mục tiêu mỗi ngày" });
    expect(await within(goal).findByRole("radio", { name: "30 phút" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(within(goal).getByRole("radio", { name: "10 phút" }));
    fireEvent.click(within(screen.getByRole("radiogroup", { name: "Ngôn ngữ giao diện" })).getByRole("radio", { name: "English" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(calls.some((c) => c.method === "PATCH" && c.body === JSON.stringify({ dailyGoalMinutes: 10 }))).toBe(true);
    expect(calls.some((c) => c.method === "PATCH" && c.body === JSON.stringify({ uiLanguage: "en" }))).toBe(true);
    expect(calls.some((c) => c.url === "/api/v1/auth/logout" && c.method === "POST")).toBe(true);
  });
});

describe("study heartbeat", () => {
  function Probe() {
    useStudyHeartbeat();
    return null;
  }

  it("sends a minute every 60 s while visible, and nothing while hidden", async () => {
    vi.useFakeTimers();
    const calls = mockProfileApis();
    let state: DocumentVisibilityState = "hidden";
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => state);
    render(<Probe />);
    await act(async () => {
      vi.advanceTimersByTime(130_000);
    });
    expect(calls.filter((c) => c.url === "/api/v1/progress/activity")).toHaveLength(0);
    state = "visible";
    await act(async () => {
      vi.advanceTimersByTime(61_000);
    });
    const beats = calls.filter((c) => c.url === "/api/v1/progress/activity");
    expect(beats).toHaveLength(1);
    expect(beats[0]).toMatchObject({ method: "POST", body: JSON.stringify({ minutes: 1 }) });
  });
});
