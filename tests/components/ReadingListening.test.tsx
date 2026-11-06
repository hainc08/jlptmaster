import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListeningPlayer } from "@/app/components/ListeningPlayer";

vi.mock("next/navigation", () => ({
  useParams: () => ({ attemptId: "att-rl-1" }),
  useRouter: () => ({ push: vi.fn() }),
}));

const TRANSCRIPT = "おんなの ひと：すみません、えきは どこですか。 おとこの ひと：あの ぎんこうの となりです。";

function installSpeech() {
  const spoken: { text: string; pitch: number }[] = [];
  class FakeUtterance {
    text: string;
    lang = "";
    rate = 1;
    pitch = 1;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      cancel: vi.fn(),
      speak: vi.fn((u: FakeUtterance) => {
        spoken.push({ text: u.text, pitch: u.pitch });
        setTimeout(() => u.onend?.(), 0);
      }),
    },
  });
  return spoken;
}

describe("ListeningPlayer", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("never shows the transcript, speaks each line without the speaker label, and limits plays to 2", async () => {
    const spoken = installSpeech();
    render(<ListeningPlayer trackId="t1" text={TRANSCRIPT} />);

    expect(screen.queryByText(/ぎんこう/)).not.toBeInTheDocument();
    expect(screen.getByText(/Còn 2 lượt nghe/)).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: /Nghe/ });
    fireEvent.click(btn);
    await waitFor(() => expect(spoken.length).toBe(2));
    expect(spoken[0].text).toBe("すみません、えきは どこですか。");
    expect(spoken[1].text).toBe("あの ぎんこうの となりです。");
    expect(spoken[0].pitch).not.toBe(spoken[1].pitch); // female vs male voice
    await waitFor(() => expect(screen.getByText(/Còn 1 lượt nghe/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Nghe/ }));
    await waitFor(() => expect(screen.getByText(/Đã hết lượt nghe/)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Nghe/ })).toBeDisabled();
  });

  it("explains when the browser has no speech synthesis", () => {
    vi.stubGlobal("SpeechSynthesisUtterance", undefined);
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    render(<ListeningPlayer trackId="t2" text={TRANSCRIPT} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/không hỗ trợ/i);
  });
});

describe("Exam room shows reading passage and listening player", () => {
  const mockAttempt = (questions: unknown[]) => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: "att-rl-1", title: "t", status: "IN_PROGRESS", remainingSeconds: 600, questions, answers: {} },
      }),
    }) as unknown as typeof fetch;
  };

  it("renders the reading passage above a reading question", async () => {
    installSpeech();
    mockAttempt([
      {
        id: "q1",
        prompt: "わたしの へやは どこに ありますか。",
        skillTag: "Đọc hiểu N5",
        sectionTitleVi: "Phần 2: Ngữ pháp & Đọc hiểu",
        context: { id: "p1", kind: "READING", text: "わたしの へやは にかいに あります。" },
        options: [
          { id: "o1", text: "いっかい" },
          { id: "o2", text: "にかい" },
          { id: "o3", text: "さんがい" },
          { id: "o4", text: "よんかい" },
        ],
      },
    ]);
    const ExamPage = (await import("@/app/mock-exams/[attemptId]/page")).default;
    render(<ExamPage />);
    expect(await screen.findByText("わたしの へやは にかいに あります。")).toBeInTheDocument();
    expect(screen.getByText("Phần 2: Ngữ pháp & Đọc hiểu")).toBeInTheDocument();
  });

  it("renders a listening player (no transcript on screen) for a listening question", async () => {
    installSpeech();
    mockAttempt([
      {
        id: "q2",
        prompt: "おんなの ひとは どこへ いきたいですか。",
        skillTag: "Nghe hiểu N5",
        sectionTitleVi: "Phần 3: Nghe hiểu",
        context: { id: "l1", kind: "LISTENING", text: TRANSCRIPT },
        options: [
          { id: "o1", text: "ぎんこう" },
          { id: "o2", text: "がっこう" },
          { id: "o3", text: "びょういん" },
          { id: "o4", text: "えき" },
        ],
      },
    ]);
    const ExamPage = (await import("@/app/mock-exams/[attemptId]/page")).default;
    render(<ExamPage />);
    expect(await screen.findByRole("button", { name: /Nghe/ })).toBeInTheDocument();
    expect(screen.queryByText(/すみません/)).not.toBeInTheDocument();
  });
});
