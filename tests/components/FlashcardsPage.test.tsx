import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FlashcardsReviewPage from "@/app/flashcards/page";

const dueCards = [
  {
    id: "card-1",
    kind: "VOCAB",
    frontText: "猫",
    frontReading: "ねこ",
    backMeaningVi: "Con mèo",
    hanViet: "MIÊU",
    exampleJa: "猫がいます。",
    exampleVi: "Có con mèo.",
  },
  {
    id: "card-2",
    kind: "VOCAB",
    frontText: "犬",
    frontReading: "いぬ",
    backMeaningVi: "Con chó",
    hanViet: null,
    exampleJa: null,
    exampleVi: null,
  },
];

function mockFetch(handler: (url: string, init?: RequestInit) => { status?: number; body?: unknown }) {
  const spy = vi.fn(async (url: string, init?: RequestInit) => {
    const { status = 200, body = {} } = handler(String(url), init);
    return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("FlashcardsReviewPage (live data only)", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("shows the first real due card and flips with click / Space", async () => {
    mockFetch(() => ({ body: { data: dueCards } }));
    render(<FlashcardsReviewPage />);

    expect(await screen.findByText("猫")).toBeInTheDocument();
    expect(screen.getByText("Nhấn Space hoặc chạm để lật")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Nhấn để lật thẻ flashcard/i }));
    expect(screen.getByText("Đang xem mặt sau")).toBeInTheDocument();
    expect(screen.getByText("Con mèo")).toBeInTheDocument();

    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByText("Nhấn Space hoặc chạm để lật")).toBeInTheDocument();
  });

  it("grading with hotkey 3 posts {cardId, grade} to /api/v1/reviews and advances", async () => {
    const spy = mockFetch(() => ({ body: { data: dueCards } }));
    render(<FlashcardsReviewPage />);
    await screen.findByText("猫");

    fireEvent.keyDown(window, { code: "Space" });
    fireEvent.keyDown(window, { key: "3" });

    expect(await screen.findByText(/Thẻ 2 \//i)).toBeInTheDocument();
    const post = spy.mock.calls.find(([u, i]) => String(u) === "/api/v1/reviews" && i?.method === "POST");
    expect(post).toBeTruthy();
    const body = JSON.parse(String(post![1]!.body));
    expect(body).toMatchObject({ cardId: "card-1", grade: "GOOD" });
    expect(typeof body.idempotencyKey).toBe("string");
    expect(body.reviewCardId).toBeUndefined();
    expect(body.rating).toBeUndefined();
  });

  it("shows a real empty state (no mock cards) when nothing is due", async () => {
    mockFetch(() => ({ body: { data: [] } }));
    render(<FlashcardsReviewPage />);

    expect(await screen.findByText(/Không có thẻ nào đến hạn/i)).toBeInTheDocument();
    expect(screen.queryByText("Nhấn Space hoặc chạm để lật")).not.toBeInTheDocument();
    expect(screen.queryByText("水")).not.toBeInTheDocument();
  });

  it("shows an error state (no mock cards) when the API fails", async () => {
    mockFetch(() => ({ status: 500, body: {} }));
    render(<FlashcardsReviewPage />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Nhấn Space hoặc chạm để lật")).not.toBeInTheDocument();
  });

  it("completion screen does not show a fabricated streak", async () => {
    mockFetch(() => ({ body: { data: [dueCards[0]] } }));
    render(<FlashcardsReviewPage />);
    await screen.findByText("猫");
    fireEvent.keyDown(window, { code: "Space" });
    fireEvent.keyDown(window, { key: "3" });
    await waitFor(() => expect(screen.getByText(/Xuất sắc/)).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.queryByText(/5 ngày/)).not.toBeInTheDocument();
  });
});
