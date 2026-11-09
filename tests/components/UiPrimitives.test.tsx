import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});
const notFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  redirect: (u: string) => redirect(u),
  notFound: () => notFound(),
  usePathname: () => "/learn/n4",
}));

import { LevelSelector } from "@/app/components/ui/LevelSelector";
import { ProgressRing } from "@/app/components/ui/ProgressRing";
import { StateView } from "@/app/components/ui/StateView";
import { WeekBars } from "@/app/components/ui/WeekBars";
import LevelPage from "@/app/learn/[level]/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LevelSelector", () => {
  it("keeps N4–N1 locked for clicks and Enter, and N5 pressed", () => {
    const onSelect = vi.fn();
    render(<LevelSelector onSelect={onSelect} />);
    const n5 = screen.getByRole("button", { name: /N5/ });
    const n4 = screen.getByRole("button", { name: /N4/ });
    expect(n5).toHaveAttribute("aria-pressed", "true");
    expect(n4).toHaveAttribute("aria-disabled", "true");
    expect(n4).toHaveTextContent("Sắp ra mắt");
    fireEvent.click(n4);
    fireEvent.keyDown(n4, { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
    expect(n5).toHaveAttribute("aria-pressed", "true");
    expect(n4).not.toHaveAttribute("aria-pressed", "true");
  });
});

describe("ProgressRing", () => {
  it("clamps the arc but keeps the label", () => {
    const { container } = render(<ProgressRing value={20} max={15} label="20 trên 15 phút" />);
    expect(screen.getByRole("img", { name: "20 trên 15 phút" })).toBeInTheDocument();
    const arc = container.querySelector("[data-arc]")!;
    expect(arc.getAttribute("stroke-dashoffset")).toBe("0");
  });

  it("handles max = 0 without NaN", () => {
    const { container } = render(<ProgressRing value={3} max={0} label="x" />);
    expect(container.innerHTML).not.toContain("NaN");
  });
});

describe("StateView", () => {
  it("announces errors", () => {
    render(<StateView kind="error" title="Không tải được" action={{ label: "Thử lại", onClick: () => {} }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("marks loading as busy", () => {
    const { container } = render(<StateView kind="loading" title="Đang tải" />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it("renders a link action", () => {
    render(<StateView kind="empty" title="Trống" action={{ label: "Đi", href: "/mock-exams" }} />);
    expect(screen.getByRole("link", { name: "Đi" })).toHaveAttribute("href", "/mock-exams");
  });
});

describe("WeekBars", () => {
  it("describes each day and marks future days", () => {
    const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label, i) => ({
      label,
      minutes: i < 5 ? i * 5 : null,
    }));
    const { container } = render(<WeekBars days={days} todayIndex={4} />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("aria-label")).toContain("T3: 5 phút");
    expect(img.getAttribute("aria-label")).toContain("T7: chưa tới");
    expect(container.querySelectorAll("[data-future]")).toHaveLength(2);
  });
});

describe("/learn/[level]", () => {
  it("shows the locked state for N4", async () => {
    render(await LevelPage({ params: Promise.resolve({ level: "n4" }) }));
    expect(screen.getByText("Nội dung N4 đang được biên soạn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về lộ trình N5" })).toHaveAttribute("href", "/learn/n5");
  });

  it("redirects N5 to the N5 path", async () => {
    await expect(LevelPage({ params: Promise.resolve({ level: "N5" }) })).rejects.toThrow("REDIRECT /learn/n5");
  });

  it("404s anything else", async () => {
    await expect(LevelPage({ params: Promise.resolve({ level: "n9" }) })).rejects.toThrow("NOT_FOUND");
  });
});
