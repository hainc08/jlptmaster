import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Footer } from "@/app/components/Footer";
import NotFound from "@/app/not-found";
import ErrorPage from "@/app/error";
import { NAV_SECTIONS } from "@/app/components/nav-config";

describe("Footer", () => {
  it("shows brand, key links and the non-affiliation disclaimer", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getAllByText(/ManabiHub/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Thi thử/i })).toHaveAttribute("href", "/mock-exams");
    expect(screen.getByRole("link", { name: /Từ vựng/i })).toHaveAttribute("href", "/vocabulary");
    expect(screen.getByText(/không trực thuộc/i)).toBeInTheDocument();
  });
});

describe("not-found page", () => {
  it("explains the 404 and links back to home and the learning path", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: /404|Không tìm thấy/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Về trang chủ/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Lộ trình/i })).toHaveAttribute("href", "/learn/n5");
  });
});

describe("error boundary page", () => {
  it("offers a retry that calls reset() and never leaks the error message", () => {
    const reset = vi.fn();
    const err = Object.assign(new Error("SECRET db password leak"), { digest: "abc123" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorPage error={err} reset={reset} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/SECRET/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Thử lại/i }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: /Về trang chủ/i })).toHaveAttribute("href", "/");
  });
});

describe("navigation config has no dead links or fabricated badges", () => {
  const items = NAV_SECTIONS.flatMap((s) => s.subItems ?? []);

  it("has no query-string links to unsupported filters and no fake attempt ids", () => {
    for (const it of items) {
      expect(it.href, it.label).not.toMatch(/\?(type|filter|tab)=/);
      expect(it.href, it.label).not.toMatch(/\/results\/att-/);
    }
  });

  it("has no hardcoded count badges", () => {
    for (const it of items) expect(it.badge ?? "", it.label).not.toMatch(/\d+\s*(bài|đến hạn|câu|thẻ)/i);
  });
});
