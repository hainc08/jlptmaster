import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { FuriganaProvider, useFurigana } from "@/app/components/RubyText";
import { LocaleProvider, useLocale, useT } from "@/app/components/i18n";

function FuriganaProbe() {
  const { showFurigana, setFurigana, toggleFurigana } = useFurigana();
  return (
    <div>
      <span data-testid="state">{showFurigana ? "on" : "off"}</span>
      <button onClick={() => setFurigana(false)}>off</button>
      <button onClick={() => toggleFurigana()}>toggle</button>
      <ruby>日<rt>にち</rt></ruby>
    </div>
  );
}

function LocaleProbe({ k }: { k: string }) {
  const t = useT();
  const { setLocale } = useLocale();
  return (
    <div>
      <span data-testid="text">{t(k)}</span>
      <button onClick={() => setLocale("en")}>en</button>
    </div>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("FuriganaProvider", () => {
  it("defaults to on, hides furigana when turned off, and remembers it", () => {
    const { container, unmount } = render(
      <FuriganaProvider><FuriganaProbe /></FuriganaProvider>
    );
    expect(screen.getByTestId("state").textContent).toBe("on");
    expect(container.querySelector(".furigana-hidden")).toBeNull();

    act(() => screen.getByText("off").click());
    expect(container.querySelector(".furigana-hidden")).not.toBeNull();
    expect(localStorage.getItem("jlpt.furigana")).toBe("0");
    unmount();

    render(<FuriganaProvider><FuriganaProbe /></FuriganaProvider>);
    expect(screen.getByTestId("state").textContent).toBe("off");
  });

  it("uses the initial prop before storage is read", () => {
    render(<FuriganaProvider initial={false}><FuriganaProbe /></FuriganaProvider>);
    expect(screen.getByTestId("state").textContent).toBe("off");
  });

  it("survives storage that throws and stays on by default", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<FuriganaProvider><FuriganaProbe /></FuriganaProvider>);
    expect(screen.getByTestId("state").textContent).toBe("on");
    expect(() => act(() => screen.getByText("toggle").click())).not.toThrow();
    expect(screen.getByTestId("state").textContent).toBe("off");
  });
});

describe("LocaleProvider / useT", () => {
  it("translates nav labels and switches to English", () => {
    render(<LocaleProvider><LocaleProbe k="nav.learn" /></LocaleProvider>);
    expect(screen.getByTestId("text").textContent).toBe("Học");
    act(() => screen.getByText("en").click());
    expect(screen.getByTestId("text").textContent).toBe("Learn");
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem("jlpt.locale")).toBe("en");
  });

  it("never returns undefined for an unknown key", () => {
    render(<LocaleProvider initial="en"><LocaleProbe k="no.such.key" /></LocaleProvider>);
    expect(screen.getByTestId("text").textContent).toBe("no.such.key");
  });

  it("works without a provider (Vietnamese)", () => {
    render(<LocaleProbe k="nav.home" />);
    expect(screen.getByTestId("text").textContent).toBe("Trang chủ");
  });
});
