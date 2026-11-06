import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, fireEvent, cleanup } from "@testing-library/react";

let mockPathname = "/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { AppShell } from "@/app/components/shell/AppShell";
import { FuriganaProvider } from "@/app/components/RubyText";
import { LocaleProvider } from "@/app/components/i18n";

function shell() {
  return render(
    <LocaleProvider>
      <FuriganaProvider>
        <AppShell>
          <p>page body</p>
        </AppShell>
      </FuriganaProvider>
    </LocaleProvider>
  );
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("AppShell", () => {
  it("lists the five tabs in order and marks the active one", () => {
    mockPathname = "/mock-exams";
    shell();
    const navs = screen.getAllByRole("navigation", { name: "Điều hướng chính" });
    // bottom bar + sidebar (CSS decides which one is visible)
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      const links = within(nav).getAllByRole("link");
      expect(links.map((l) => l.textContent?.replace("字", "").trim())).toEqual([
        "Trang chủ",
        "Học",
        "Thi thử",
        "Kanji",
        "Hồ sơ",
      ]);
      expect(within(nav).getByRole("link", { name: /Thi thử/ })).toHaveAttribute("aria-current", "page");
    }
  });

  it("shows the furigana switch only on screens with Japanese text", () => {
    mockPathname = "/dashboard";
    const { unmount } = shell();
    expect(screen.queryByRole("group", { name: "Furigana" })).toBeNull();
    unmount();

    mockPathname = "/kanji";
    shell();
    const group = screen.getByRole("group", { name: "Furigana" });
    const off = within(group).getByRole("button", { name: "Tắt" });
    expect(off).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(off);
    expect(off).toHaveAttribute("aria-pressed", "true");
    expect(within(group).getByRole("button", { name: "Bật" })).toHaveAttribute("aria-pressed", "false");
  });

  it("switches labels to English", () => {
    mockPathname = "/learn/n5";
    shell();
    fireEvent.click(within(screen.getByRole("group", { name: "Ngôn ngữ" })).getByRole("button", { name: "EN" }));
    expect(screen.getAllByRole("link", { name: /Learn/ }).length).toBeGreaterThan(0);
  });

  it("hides navigation on focus screens", () => {
    mockPathname = "/mock-exams/abc";
    shell();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  it("renders only the page on CMS routes", () => {
    mockPathname = "/admin/members";
    shell();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  it("gives legacy admin pages a top bar without learner tabs", () => {
    mockPathname = "/admin/content/import";
    shell();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Điều hướng chính" })).toBeNull();
  });

  it("leaves login, register and the welcome page without chrome", () => {
    for (const p of ["/login", "/register", "/"]) {
      mockPathname = p;
      const { unmount } = shell();
      expect(screen.queryByRole("navigation")).toBeNull();
      unmount();
    }
  });
});
