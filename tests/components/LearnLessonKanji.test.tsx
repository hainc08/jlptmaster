import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useParams: () => ({ lessonSlug: "bai-03" }),
  usePathname: () => "/learn/n5",
  useRouter: () => ({ push: vi.fn() }),
}));

import LearnPage from "@/app/learn/n5/page";
import LessonPage from "@/app/learn/n5/[lessonSlug]/page";
import KanjiPage from "@/app/kanji/page";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function json(data: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: async () => data } as Response);
}

describe("Learn (frame 03)", () => {
  it("lists one unit per lesson in position order, without invented progress", async () => {
    global.fetch = vi.fn(() =>
      json({
        data: [
          {
            lessons: [
              { id: "b", slug: "bai-02", titleVi: "Bài 02: Chào hỏi", position: 2, minutesEstimate: 30 },
              { id: "a", slug: "bai-01", titleVi: "Bài 01: Kana", position: 1, minutesEstimate: 25 },
            ],
          },
        ],
      })
    ) as unknown as typeof fetch;
    render(<LearnPage />);
    const list = await screen.findByRole("list", { name: "Danh sách bài học" });
    const links = within(list).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/learn/n5/bai-01", "/learn/n5/bai-02"]);
    expect(screen.queryByText(/Hoàn thành|Đang học|Chưa học/)).toBeNull();
    expect(screen.getByRole("link", { name: /Ngữ pháp/ })).toHaveAttribute("href", "/grammar");
  });

  it("shows an error state with retry when courses fail", async () => {
    const f = vi.fn(() => json({}, false, 500));
    global.fetch = f as unknown as typeof fetch;
    render(<LearnPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được lộ trình");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(f).toHaveBeenCalledTimes(2));
  });
});

const vocab = (i: number) => ({
  kind: "VOCAB",
  vocabulary: {
    contentItemId: `v${i}`,
    surface: `語${i}`,
    reading: `ご${i}`,
    meaningVi: `Nghĩa ${i}`,
    pos: "Danh từ",
    exampleJa: "例",
    exampleReading: "れい",
    exampleVi: "Ví dụ",
  },
});

describe("Lesson (frame 04)", () => {
  it("marking all 12 cards completes the lesson exactly once", async () => {
    const calls: string[] = [];
    global.fetch = vi.fn((url: string, opts?: RequestInit) => {
      calls.push(`${opts?.method ?? "GET"} ${url}`);
      if (url.endsWith("/complete")) return json({ data: { status: "COMPLETED" } });
      return json({
        data: {
          id: "l3",
          slug: "bai-03",
          titleVi: "Bài 03",
          position: 3,
          completionStatus: "IN_PROGRESS",
          contentItems: Array.from({ length: 12 }, (_, i) => vocab(i + 1)),
        },
      });
    }) as unknown as typeof fetch;
    render(<LessonPage />);
    expect(await screen.findByText("Thẻ 1 / 12")).toBeInTheDocument();
    for (let i = 0; i < 12; i++) {
      fireEvent.click(screen.queryByRole("button", { name: "Đã thuộc" }) ?? document.body);
    }
    // extra clicks after the end must not send again
    await screen.findByText(/Hoàn thành bài học|Đã hoàn thành/);
    expect(calls.filter((c) => c.startsWith("POST") && c.endsWith("/complete"))).toHaveLength(1);
  });

  it("offers a manual complete button when the lesson has no cards", async () => {
    global.fetch = vi.fn(() =>
      json({ data: { id: "l1", slug: "bai-03", titleVi: "Bài 01", position: 1, contentItems: [] } })
    ) as unknown as typeof fetch;
    render(<LessonPage />);
    expect(await screen.findByRole("button", { name: /Đánh dấu hoàn thành/ })).toBeInTheDocument();
  });
});

describe("Kanji (frame 08)", () => {
  const kanji = [
    { contentItemId: "k1", character: "日", onyomiJson: ["ニチ"], kunyomiJson: ["ひ"], hanViet: "NHẬT", meaningVi: "Mặt trời", strokes: 4, examplesJson: [{ word: "日本", reading: "にほん", meaning: "Nhật Bản" }] },
    { contentItemId: "k2", character: "月", onyomiJson: ["ゲツ"], kunyomiJson: ["つき"], hanViet: "NGUYỆT", meaningVi: "Mặt trăng", strokes: 4, examplesJson: [] },
  ];

  it("filters by search and shows the empty state", async () => {
    global.fetch = vi.fn(() => json({ data: kanji })) as unknown as typeof fetch;
    render(<KanjiPage />);
    await screen.findByRole("button", { name: /日/ });
    fireEvent.change(screen.getByLabelText("Tìm kanji"), { target: { value: "zzz" } });
    expect(await screen.findByText("Không tìm thấy kanji")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tìm kanji"), { target: { value: "nguyệt" } });
    expect(await screen.findByRole("button", { name: /月/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /日/ })).toBeNull();
  });

  it("opens the detail sheet with focus on Đóng and closes on Escape", async () => {
    global.fetch = vi.fn(() => json({ data: kanji })) as unknown as typeof fetch;
    render(<KanjiPage />);
    fireEvent.click(await screen.findByRole("button", { name: /日/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("NHẬT")).toBeInTheDocument();
    expect(within(dialog).getByText(/4 nét/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Đóng" })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
