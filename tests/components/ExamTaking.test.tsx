import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act, within } from "@testing-library/react";

const push = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useParams: () => ({ attemptId: "att-1" }),
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/mock-exams",
  useSearchParams: () => new URLSearchParams(search),
}));

import ExamPage from "@/app/mock-exams/[attemptId]/page";
import LobbyPage from "@/app/mock-exams/page";

const questions = Array.from({ length: 10 }, (_, i) => ({
  id: `q${i + 1}`,
  prompt: i === 0 ? "毎朝、新聞を読みます。" : `問題 ${i + 1}`,
  sectionTitleVi: "Phần 1",
  options: [
    { id: `q${i + 1}a`, text: "A" },
    { id: `q${i + 1}b`, text: "B" },
  ],
}));

function mockAttempt(remainingSeconds: number, answers: Record<string, string> = {}) {
  const finish = vi.fn();
  global.fetch = vi.fn((url: string, opts?: RequestInit) => {
    if (url.endsWith("/finish")) {
      finish();
      return new Promise(() => {}); // never resolves: a second click must not send again
    }
    if (opts?.method === "PUT") return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: "att-1", title: "N5 Đề 01", status: "IN_PROGRESS", remainingSeconds, questions, answers } }),
    } as Response);
  }) as unknown as typeof fetch;
  return finish;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  sessionStorage.clear();
  search = "";
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("exam taking (frames 06, 06b)", () => {
  it("flags a question and keeps the flag after a remount", async () => {
    mockAttempt(600);
    const { unmount } = render(<ExamPage />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Câu 5" }));
    fireEvent.click(screen.getByRole("button", { name: /Đánh dấu/ }));
    expect(screen.getByRole("button", { name: /Câu 5.*đã đánh dấu/ })).toBeInTheDocument();
    unmount();
    render(<ExamPage />);
    await flush();
    expect(screen.getByRole("button", { name: /Câu 5.*đã đánh dấu/ })).toBeInTheDocument();
  });

  it("shows answered / unanswered / flagged counts in the submit dialog", async () => {
    mockAttempt(600, { q1: "q1a", q2: "q2a", q3: "q3b" });
    render(<ExamPage />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Câu 4" }));
    fireEvent.click(screen.getByRole("button", { name: /Đánh dấu/ }));
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByTestId("count-answered")).toHaveTextContent("3");
    expect(within(dialog).getByTestId("count-unanswered")).toHaveTextContent("7");
    expect(within(dialog).getByTestId("count-flagged")).toHaveTextContent("1");
    expect(within(dialog).getByRole("button", { name: "Tiếp tục làm bài" })).toHaveFocus();
  });

  it("sends finish once even if Nộp bài is clicked twice", async () => {
    const finish = mockAttempt(600);
    render(<ExamPage />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    const submit = within(screen.getByRole("dialog")).getByRole("button", { name: /Nộp bài/ });
    fireEvent.click(submit);
    fireEvent.click(submit);
    await flush();
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it("auto-submits exactly once when time runs out with the dialog open", async () => {
    const finish = mockAttempt(3);
    render(<ExamPage />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    await flush();
    expect(finish).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    const submit = screen.queryByRole("button", { name: "Nộp bài" });
    if (submit) fireEvent.click(submit);
    await flush();
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it("renders question text without furigana", async () => {
    mockAttempt(600);
    const { container } = render(<ExamPage />);
    await flush();
    expect(screen.getByText("毎朝、新聞を読みます。")).toBeInTheDocument();
    expect(container.querySelector("main rt, article rt")).toBeNull();
  });
});

describe("mock lobby (frame 05)", () => {
  it("shows the error state and retries", async () => {
    vi.useRealTimers();
    const f = vi.fn(() => Promise.resolve({ ok: false, status: 500, json: async () => ({}) } as Response));
    global.fetch = f as unknown as typeof fetch;
    render(<LobbyPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được danh sách đề");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await vi.waitFor(() => expect(f).toHaveBeenCalledTimes(2));
  });

  it("lists exams with duration, questions and the disclaimer", async () => {
    vi.useRealTimers();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: "e1", title: "N5 Đề 01", totalMinutes: 90, totalQuestions: 60 }] }),
      } as Response)
    ) as unknown as typeof fetch;
    render(<LobbyPage />);
    expect(await screen.findByText("N5 Đề 01")).toBeInTheDocument();
    expect(screen.getByText(/90 phút/)).toBeInTheDocument();
    expect(screen.getByText(/60 câu/)).toBeInTheDocument();
    expect(screen.getByText("Điểm ước tính, không phải cách chấm điểm chính thức của JLPT.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bắt đầu/ })).toBeInTheDocument();
  });

  it("never fetches for a locked level in the URL", async () => {
    vi.useRealTimers();
    search = "level=N4";
    const f = vi.fn();
    global.fetch = f as unknown as typeof fetch;
    render(<LobbyPage />);
    expect(screen.getByText("N4 · Sắp ra mắt")).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });
});

describe("exam finish robustness (review fixes)", () => {
  it("keeps the room open with a retry when finish fails", async () => {
    let n = 0;
    global.fetch = vi.fn((url: string, opts?: RequestInit) => {
      if (url.endsWith("/finish")) {
        n++;
        return Promise.resolve({ ok: n > 1, status: n > 1 ? 200 : 500, json: async () => ({}) } as Response);
      }
      if (opts?.method === "PUT") return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: { id: "att-1", status: "IN_PROGRESS", remainingSeconds: 600, questions, answers: {} } }) } as Response);
    }) as unknown as typeof fetch;
    push.mockClear();
    render(<ExamPage />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Nộp bài/ }));
    await flush();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/Chưa nộp được bài/);
    fireEvent.click(screen.getByRole("button", { name: "Nộp lại" }));
    await flush();
    await flush();
    expect(n).toBe(2);
    expect(push).toHaveBeenCalledWith("/results/att-1");
  });

  it("sends no autosave after the attempt has been finished", async () => {
    const puts: number[] = [];
    global.fetch = vi.fn((url: string, opts?: RequestInit) => {
      if (opts?.method === "PUT") { puts.push(Date.now()); return Promise.resolve({ ok: true, json: async () => ({}) } as Response); }
      if (url.endsWith("/finish")) return new Promise(() => {});
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: { id: "att-1", status: "IN_PROGRESS", remainingSeconds: 1, questions, answers: {} } }) } as Response);
    }) as unknown as typeof fetch;
    render(<ExamPage />);
    await flush();
    await act(async () => { vi.advanceTimersByTime(500); });
    fireEvent.click(screen.getAllByRole("radio")[0]); // autosave due at 1.1 s, timer ends at 1 s
    await act(async () => { vi.advanceTimersByTime(1500); });
    await flush();
    expect(puts).toHaveLength(0);
  });
});
