import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FuriganaProvider } from "@/app/components/RubyText";
import { NAV_SECTIONS } from "@/app/components/nav-config";
import LandingPage from "@/app/page";
import GrammarPage from "@/app/grammar/page";
import KanjiPage from "@/app/kanji/page";

describe("Production Pages Live MariaDB Wiring & Prototype Badge Removal (TDD RED -> GREEN)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("LandingPage does NOT display 'PROTOTYPE BROWSER DEMO — KHÔNG KẾT NỐI DB THẬT'", () => {
    render(
      <FuriganaProvider>
        <LandingPage />
      </FuriganaProvider>
    );

    expect(screen.queryByText(/PROTOTYPE BROWSER DEMO/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/KHÔNG KẾT NỐI DB THẬT/i)).not.toBeInTheDocument();
  });

  it("GrammarPage fetches live grammar patterns from /api/v1/grammar and shows MariaDB badge", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        data: [
          {
            id: "gram-live-1",
            pattern: "N1 は N2 です",
            meaningVi: "N1 là N2 (Khẳng định lịch sự)",
            explanationVi: "Trợ từ は đánh dấu chủ đề của câu, です đặt cuối câu trần thuật.",
            exampleJa: "わたしは がくせいです。",
            exampleVi: "Tôi là học sinh.",
          },
        ],
      }),
    } as unknown as Response);

    render(
      <FuriganaProvider>
        <GrammarPage />
      </FuriganaProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("N1 は N2 です")).toBeInTheDocument();
    });

    expect(screen.getByText(/N1 là N2 \(Khẳng định lịch sự\)/i)).toBeInTheDocument();
    expect(screen.getByText(/KẾT NỐI MARIADB TRỰC TIẾP/i)).toBeInTheDocument();
    expect(screen.queryByText(/PROTOTYPE/i)).not.toBeInTheDocument();
  });

  it("KanjiPage fetches live N5 Kanji from /api/v1/kanji and nav-config points Kanji to /kanji", async () => {
    const hocTapSection = NAV_SECTIONS.find((s) => s.id === "hoc-tap");
    const kanjiSubItem = hocTapSection?.subItems?.find((sub) => sub.id === "kanji");
    expect(kanjiSubItem?.href).toBe("/kanji");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        data: [
          {
            id: "kanji-live-1",
            character: "日",
            onyomi: "ニチ, ジツ",
            kunyomi: "ひ, -び, -か",
            meaningVi: "NHẬT — Mặt trời, ngày",
            strokeCount: 4,
          },
        ],
      }),
    } as unknown as Response);

    render(
      <FuriganaProvider>
        <KanjiPage />
      </FuriganaProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/NHẬT — Mặt trời, ngày/i)).toBeInTheDocument();
    });

    expect(screen.getByText("ニチ, ジツ")).toBeInTheDocument();
    expect(screen.getByText("ひ, -び, -か")).toBeInTheDocument();
    expect(screen.getByText(/4 nét/i)).toBeInTheDocument();
    expect(screen.getByText(/KẾT NỐI MARIADB TRỰC TIẾP/i)).toBeInTheDocument();
  });
});

