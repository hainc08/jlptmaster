import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ attemptId: "attempt-test-123" }),
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Mock Exam & Results Client Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Exam Room renders questions and options without parenthesized Vietnamese translations", async () => {
    // Import ExamRoom
    const ExamPage = (await import("@/app/mock-exams/[attemptId]/page")).default;

    // Mock fetch for GET /api/v1/attempts/:id
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/v1/attempts/attempt-test-123/answers")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { success: true } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: {
            id: "attempt-test-123",
            title: "Đề thi thử JLPT N5 — Số 01",
            status: "IN_PROGRESS",
            remainingSeconds: 1200,
            questions: [
              {
                id: "q-1",
                sectionId: "sec-1",
                sectionTitleVi: "Phần 1: Từ vựng",
                questionNumber: 1,
                questionType: "VOCAB_SELECTION",
                prompt: "冷たい [ ___ ] を飲みたいです。",
                options: [
                  { id: "opt-1", text: "みず" },
                  { id: "opt-2", text: "ごはん" },
                  { id: "opt-3", text: "パン" },
                  { id: "opt-4", text: "にく" },
                ],
              },
            ],
            answers: {},
          },
        }),
      });
    });

    render(<ExamPage />);

    await waitFor(() => {
      expect(screen.getByText(/冷たい/)).toBeDefined();
    });

    // Option text must be pure Japanese without '(Nước)'
    expect(screen.getByText("みず")).toBeDefined();
    expect(screen.queryByText("みず (Nước)")).toBeNull();
  });

  it("Exam Results page displays genuine score and breakdown from API", async () => {
    const ResultsPage = (await import("@/app/results/[attemptId]/page")).default;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: {
            attemptId: "attempt-test-123",
            examTitle: "Đề thi thử JLPT N5 — Số 01",
            levelId: "N5",
            status: "SUBMITTED",
            completedAt: new Date().toISOString(),
            rawCorrect: 15,
            rawTotal: 20,
            internalScore: 135,
            maxScore: 180,
            isPassEstimate: true,
            disclaimerVi: "JLPT Master là nền tảng luyện thi độc lập.",
            sections: [
              {
                sectionId: "sec-1",
                name: "Kiến thức ngôn ngữ (Từ vựng & Kanji)",
                score: 45,
                max: 60,
                pct: 75,
              },
            ],
            itemReviews: [],
            weakSkills: [],
          },
        }),
      });
    });

    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText("135")).toBeDefined();
    });

    expect(screen.queryByText("142")).toBeNull();
  });
});

