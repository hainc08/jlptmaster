import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/login",
}));

import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: { user: { id: "u1", email: "a@b.vn", role: "STUDENT" } } }),
  } as unknown as Response);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("/login", () => {
  it("shows the fields, N5 level, sign-in button and forgot-password help", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Mật khẩu")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: /N5/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /N4/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toHaveAttribute("type", "submit");
    fireEvent.click(screen.getByRole("button", { name: "Quên mật khẩu?" }));
    expect(screen.getByText(/Liên hệ quản trị viên/)).toBeInTheDocument();
  });

  it("links to sign-up and has no social login", () => {
    render(<LoginPage />);
    expect(screen.getByRole("link", { name: "Đăng ký" })).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("button", { name: /google|facebook|apple/i })).toBeNull();
  });

  it("posts email and password to the login endpoint", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.vn" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Secret-123x" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "a@b.vn", password: "Secret-123x" }) })
    );
  });
});

describe("/register", () => {
  it("shows the create-account button and no forgot-password", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("button", { name: "Tạo tài khoản" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quên mật khẩu?" })).toBeNull();
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/login");
  });
});
