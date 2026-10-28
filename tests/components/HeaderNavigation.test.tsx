import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FuriganaProvider } from "@/app/components/RubyText";
import { Navbar } from "@/app/components/Navbar";
import { BottomNav } from "@/app/components/BottomNav";
import { LearningToolbar } from "@/app/components/LearningToolbar";

let mockPathname = "/mock-exams";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("Redesigned Header, BottomNav & LearningToolbar (TDD RED -> GREEN)", () => {
  beforeEach(() => {
    mockPathname = "/mock-exams";
  });

  it("renders the 5 primary navigation sections and marks 'Thi thử' active on /mock-exams", () => {
    render(
      <FuriganaProvider>
        <Navbar />
      </FuriganaProvider>
    );

    const nav = screen.getByRole("navigation", { name: /Điều hướng chính/i });
    expect(nav).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /^Trang chủ$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Học tập$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Luyện tập$/i })).toBeInTheDocument();
    const examBtn = screen.getByRole("button", { name: /^Thi thử$/i });
    expect(examBtn).toBeInTheDocument();
    expect(examBtn).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /^Tiến độ$/i })).toBeInTheDocument();

    // Global Furigana button must NOT exist in normal global header
    expect(screen.queryByLabelText(/Bật hoặc tắt phiên âm Furigana/i)).not.toBeInTheDocument();
  });

  it("opens 'Học tập' dropdown with 5 sub-items and closes on Escape key", () => {
    render(
      <FuriganaProvider>
        <Navbar />
      </FuriganaProvider>
    );

    const hocTapBtn = screen.getByRole("button", { name: /^Học tập$/i });
    fireEvent.click(hocTapBtn);

    const menu = screen.getByRole("menu", { name: /Menu Học tập/i });
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Lộ trình học/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Từ vựng/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Kanji/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Ngữ pháp/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Flashcard SRS/i })).toBeInTheDocument();

    // Press Escape -> dropdown closes
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: /Menu Học tập/i })).not.toBeInTheDocument();
  });

  it("opens JLPT Level Selector (N5–N1) with N5 active and N4–N1 coming soon", () => {
    render(
      <FuriganaProvider>
        <Navbar />
      </FuriganaProvider>
    );

    const levelBtn = screen.getByRole("button", { name: /Chọn cấp độ JLPT/i });
    fireEvent.click(levelBtn);

    expect(screen.getByRole("menu", { name: /Danh sách cấp độ JLPT/i })).toBeInTheDocument();
    expect(screen.getByText(/Sơ cấp 1/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sắp ra mắt/i).length).toBe(4);
  });

  it("enforces role-based visibility: hides Admin for student/guest and shows for admin", () => {
    const { rerender } = render(
      <FuriganaProvider>
        <Navbar initialRole="student" />
      </FuriganaProvider>
    );

    // Student sees notifications + avatar, NO Admin CMS link
    expect(screen.getByRole("button", { name: /Thông báo học tập/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Menu tài khoản cá nhân/i })).toBeInTheDocument();
    expect(screen.queryByText(/Quản trị CMS/i)).not.toBeInTheDocument();

    // Guest sees Login / Register, NO Admin CMS link and NO Notifications
    rerender(
      <FuriganaProvider>
        <Navbar initialRole="guest" />
      </FuriganaProvider>
    );
    expect(screen.getByRole("link", { name: /Đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Đăng ký/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Thông báo học tập/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Quản trị CMS/i)).not.toBeInTheDocument();

    // Admin sees Quản trị CMS link
    rerender(
      <FuriganaProvider>
        <Navbar initialRole="admin" />
      </FuriganaProvider>
    );
    expect(screen.getByText(/Quản trị CMS/i)).toBeInTheDocument();
  });

  it("renders BottomNav with 5 primary items and opens secondary bottom sheet on tap", () => {
    render(<BottomNav />);

    const mobileNav = screen.getByRole("navigation", { name: /Điều hướng di động/i });
    expect(mobileNav).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(5);

    const luyenTapBtn = screen.getByRole("button", { name: /Luyện tập/i });
    fireEvent.click(luyenTapBtn);

    const sheet = screen.getByRole("dialog", { name: /Menu Luyện tập/i });
    expect(sheet).toBeInTheDocument();
    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument();
    expect(screen.getByText("Đọc hiểu")).toBeInTheDocument();
    expect(screen.getByText("Nghe hiểu")).toBeInTheDocument();
    expect(screen.getByText("Ôn câu sai")).toBeInTheDocument();
  });

  it("renders LearningToolbar with contextual Furigana toggle", () => {
    render(
      <FuriganaProvider>
        <LearningToolbar title="Sổ tay Từ vựng N5" />
      </FuriganaProvider>
    );

    const toggleBtn = screen.getByRole("button", { name: /Furigana/i });
    expect(toggleBtn).toHaveTextContent(/ĐANG BẬT/i);
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent(/ĐANG TẮT/i);
  });

  it("enforces single-line non-wrapping layout classes (whitespace-nowrap & shrink-0) on all desktop navigation items and utility controls", () => {
    render(
      <FuriganaProvider>
        <Navbar initialRole="student" />
      </FuriganaProvider>
    );

    const nav = screen.getByRole("navigation", { name: /Điều hướng chính/i });
    expect(nav.className).toContain("flex-nowrap");
    expect(nav.className).toContain("shrink-0");

    const navLabels = ["Trang chủ", "Học tập", "Luyện tập", "Thi thử", "Tiến độ"];
    for (const label of navLabels) {
      const trigger = screen.getByRole("button", { name: new RegExp(`^${label}$`, "i") });
      expect(trigger.className).toContain("whitespace-nowrap");
      expect(trigger.className).toContain("shrink-0");

      const labelSpan = screen.getByText(label);
      expect(labelSpan.className).toContain("whitespace-nowrap");
    }

    const levelBtn = screen.getByRole("button", { name: /Chọn cấp độ JLPT/i });
    expect(levelBtn.className).toContain("whitespace-nowrap");
    expect(levelBtn.className).toContain("shrink-0");

    const profileBtn = screen.getByRole("button", { name: /Menu tài khoản cá nhân/i });
    expect(profileBtn.className).toContain("whitespace-nowrap");
    expect(profileBtn.className).toContain("shrink-0");
  });
});

