import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useParams: () => ({ attemptId: "att-1" }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/results/att-1",
}));

import ResultsPage from "@/app/results/[attemptId]/page";
import { meetsReference } from "@/app/components/scoring";

const DISCLAIMER = "Điểm ước tính, không phải cách chấm điểm chính thức của JLPT.";

function item(n: number, correct: boolean) {
  return {
    questionId: `q${n}`,
    questionNumber: n,
    prompt: `問題${n}`,
    selectedOptionId: correct ? `q${n}a` : `q${n}b`,
    correctOptionId: `q${n}a`,
    isCorrect: correct,
    explanationVi: `Giải thích ${n}`,
    options: [
      { id: `q${n}a`, text: `Đúng ${n}` },
      { id: `q${n}b`, text: `Sai ${n}` },
    ],
  };
}

function mockResult(score: number, wrong: number) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          attemptId: "att-1",
          examTitle: "N5 Đề 01",
          status: "SUBMITTED",
          rawCorrect: 10 - wrong,
          rawTotal: 10,
          internalScore: score,
          maxScore: 180,
          disclaimerVi: "JLPT Master là nền tảng luyện thi độc lập, không trực thuộc JEES.",
          skillBreakdown: [{ skill: "Từ vựng", correct: 7, total: 10, percent: 70 }],
          weakSkills: [],
          itemReviews: [
            ...Array.from({ length: 10 - wrong }, (_, i) => item(i + 1, true)),
            ...Array.from({ length: wrong }, (_, i) => item(20 + i, false)),
          ],
        },
      }),
    } as Response)
  ) as unknown as typeof fetch;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Result screen (frame 07)", () => {
  it("labels the score as an estimate with the exact disclaimer and reference mark", async () => {
    mockResult(129, 2);
    render(<ResultsPage />);
    expect(await screen.findByText(DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByText("Điểm ước tính")).toBeInTheDocument();
    expect(screen.getByText("Mốc tham khảo: 80/180")).toBeInTheDocument();
    expect(screen.getByText(/không trực thuộc/)).toBeInTheDocument();
    expect(screen.getByText("Từ vựng")).toBeInTheDocument();
    expect(screen.getByText("7/10 · 70%")).toBeInTheDocument();
  });

  it("79 is below the reference mark, 80 meets it", async () => {
    expect(meetsReference(79, 180)).toBe(false);
    expect(meetsReference(80, 180)).toBe(true);
    expect(meetsReference(40, 90)).toBe(true);
    mockResult(79, 1);
    const { unmount } = render(<ResultsPage />);
    expect(await screen.findByText("Chưa đạt · ước tính")).toBeInTheDocument();
    unmount();
    mockResult(80, 1);
    render(<ResultsPage />);
    expect(await screen.findByText("Có khả năng đạt · ước tính")).toBeInTheDocument();
  });

  it("lists the first 3 wrong answers and expands to all", async () => {
    mockResult(100, 5);
    render(<ResultsPage />);
    const more = await screen.findByRole("button", { name: "Xem tất cả 5 câu" });
    expect(screen.getAllByTestId("wrong-item")).toHaveLength(3);
    expect(screen.getAllByText(/Bạn chọn:/)[0]).toHaveTextContent("Sai 20");
    expect(screen.getAllByText(/Đáp án đúng:/)[0]).toHaveTextContent("Đúng 20");
    fireEvent.click(more);
    expect(screen.getAllByTestId("wrong-item")).toHaveLength(5);
  });

  it("shows the empty state when nothing is wrong", async () => {
    mockResult(180, 0);
    render(<ResultsPage />);
    expect(await screen.findByText("Bạn không sai câu nào")).toBeInTheDocument();
  });
});
