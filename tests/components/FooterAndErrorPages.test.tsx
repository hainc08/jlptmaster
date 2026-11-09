import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NotFound from "@/app/not-found";
import ErrorPage from "@/app/error";
import { LEARNER_TABS } from "@/app/components/nav-config";

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

describe("navigation config has no dead links", () => {
  it("has plain route links only (no query-string filters or fake ids)", () => {
    for (const t of LEARNER_TABS) {
      expect(t.href, t.id).toMatch(/^\/[a-z0-9/-]+$/);
      expect(t.href, t.id).not.toMatch(/\/results\/att-/);
    }
  });
});
