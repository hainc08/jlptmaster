import React, { useState } from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FuriganaProvider } from "@/app/components/RubyText";
import { Navbar } from "@/app/components/Navbar";
import { BottomNav } from "@/app/components/BottomNav";

let mockPathname = "/admin/members";
const replace = vi.fn();
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace, push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

import { CmsShell } from "@/app/admin/(cms)/_components/CmsShell";
import { StatusChip } from "@/app/admin/(cms)/_components/StatusChip";
import { ConfirmDialog } from "@/app/admin/(cms)/_components/ConfirmDialog";
import { ToastProvider, useToast } from "@/app/admin/(cms)/_components/Toast";
import { t } from "@/app/admin/(cms)/_lib/i18n";

const ALL = ["dashboard", "members", "levels", "settings", "audit"] as const;
const shell = (allowed: readonly string[], role = "OWNER", lang: "vi" | "en" | "ja" = "en") => (
  <CmsShell user={{ name: "Nguyễn Hải Yến", email: "yen@example.com", role }} allowed={allowed as never} lang={lang}>
    <p>page body</p>
  </CmsShell>
);

beforeEach(() => {
  mockPathname = "/admin/members";
  replace.mockClear(); push.mockClear(); refresh.mockClear();
  document.cookie = "admin_lang=; Max-Age=0; path=/";
});

describe("CMS i18n", () => {
  it("translates the chrome into VI, EN and JA", () => {
    expect(t("ja", "members")).toBe("会員");
    expect(t("vi", "members")).toBe("Thành viên");
    expect(t("en", "audit")).toBe("Audit Log");
  });
});

describe("CmsShell navigation (AC-CMS-01, AC-CMS-10)", () => {
  it("shows all five modules to OWNER and marks the active one with aria-current", () => {
    render(shell(ALL));
    const nav = screen.getByRole("navigation", { name: /main/i });
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/admin/dashboard", "/admin/members", "/admin/levels", "/admin/settings", "/admin/audit"]);
    expect(within(nav).getByRole("link", { name: "Members" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Levels" })).not.toHaveAttribute("aria-current");
  });

  it("only lists the modules a role may open (SUPPORT: dashboard, members, audit)", () => {
    render(shell(["dashboard", "members", "audit"], "SUPPORT"));
    const nav = screen.getByRole("navigation", { name: /main/i });
    expect(within(nav).getAllByRole("link").map((l) => l.textContent)).toEqual(["Dashboard", "Members", "Audit Log"]);
  });

  it("redirects to the first allowed module when the current route is not permitted", () => {
    mockPathname = "/admin/settings";
    render(shell(["dashboard", "members"], "SUPPORT"));
    expect(replace).toHaveBeenCalledWith("/admin/dashboard");
    expect(screen.queryByText("page body")).not.toBeInTheDocument();
  });

  it("does not redirect (and renders the page) on an allowed route", () => {
    render(shell(ALL));
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  it("shows a no-access message when the role has no modules at all", () => {
    render(shell([], "EDITOR"));
    expect(screen.getByText(/no access/i)).toBeInTheDocument();
  });

  it("renders the user's role in the avatar menu and signs out via the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(shell(ALL, "SUPPORT"));
    fireEvent.click(screen.getByRole("button", { name: /Nguyễn Hải Yến/ }));
    expect(screen.getByText("Support")).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" })); });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/logout", expect.objectContaining({ method: "POST" }));
    expect(push).toHaveBeenCalledWith("/login");
    vi.unstubAllGlobals();
  });

  it("switching language writes the admin_lang cookie and refreshes", () => {
    render(shell(ALL));
    fireEvent.click(screen.getByRole("button", { name: "JA" }));
    expect(document.cookie).toContain("admin_lang=ja");
    expect(refresh).toHaveBeenCalled();
  });

  it("renders Japanese labels when lang is ja", () => {
    render(shell(ALL, "OWNER", "ja"));
    expect(screen.getByRole("link", { name: "会員" })).toBeInTheDocument();
  });

  it("the global search goes to the members list with the query", () => {
    render(shell(ALL));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "田中" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(push).toHaveBeenCalledWith("/admin/members?q=%E7%94%B0%E4%B8%AD");
  });

  it("the collapse button toggles the icon rail", () => {
    const { container } = render(shell(ALL));
    const root = container.querySelector(".cms")!;
    expect(root).not.toHaveClass("rail");
    fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    expect(root).toHaveClass("rail");
  });
});

describe("learner chrome is hidden on CMS routes", () => {
  it("Navbar and BottomNav render nothing under /admin/members", () => {
    render(<FuriganaProvider><Navbar /><BottomNav /></FuriganaProvider>);
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("banner")).toBeNull();
  });

  it("but stay visible on other admin and learner routes", () => {
    mockPathname = "/admin/content";
    render(<FuriganaProvider><Navbar /></FuriganaProvider>);
    expect(screen.getByRole("navigation", { name: /Điều hướng chính/i })).toBeInTheDocument();
  });
});

describe("StatusChip", () => {
  it("always renders a text label, not colour alone", () => {
    render(<><StatusChip kind="active" /><StatusChip kind="suspended" /><StatusChip kind="pending" /><StatusChip kind="expired" /><StatusChip kind="published" /><StatusChip kind="draft" /><StatusChip kind="soon" /></>);
    for (const label of ["Active", "Suspended", "Pending", "Expired", "Published", "Draft", "Coming soon"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe("ConfirmDialog", () => {
  function Harness({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>opener</button>
        <ConfirmDialog open={open} title="Delete this member?" body="This cannot be undone." confirmLabel="Delete member" danger
          onConfirm={() => { onConfirm(); setOpen(false); }} onCancel={() => { onCancel(); setOpen(false); }} />
      </>
    );
  }

  it("is an alertdialog, focuses Cancel for destructive actions, Esc cancels and focus returns to the opener", () => {
    const onCancel = vi.fn(), onConfirm = vi.fn();
    render(<Harness onCancel={onCancel} onConfirm={onConfirm} />);
    const opener = screen.getByText("opener");
    opener.focus();
    fireEvent.click(opener);
    const dlg = screen.getByRole("alertdialog", { name: "Delete this member?" });
    expect(dlg).toHaveTextContent("This cannot be undone.");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    fireEvent.keyDown(dlg, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("confirm calls onConfirm exactly once", () => {
    const onCancel = vi.fn(), onConfirm = vi.fn();
    render(<Harness onCancel={onCancel} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("opener"));
    fireEvent.click(screen.getByRole("button", { name: "Delete member" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("keeps Tab focus inside the dialog", () => {
    render(<Harness onCancel={() => {}} onConfirm={() => {}} />);
    fireEvent.click(screen.getByText("opener"));
    const dlg = screen.getByRole("alertdialog");
    const confirm = screen.getByRole("button", { name: "Delete member" });
    confirm.focus();
    fireEvent.keyDown(dlg, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    fireEvent.keyDown(dlg, { key: "Tab", shiftKey: true });
    expect(confirm).toHaveFocus();
  });
});

describe("Toast", () => {
  it("announces messages in a polite status region", async () => {
    function Fire() {
      const toast = useToast();
      return <button onClick={() => toast("Saved")}>fire</button>;
    }
    render(<ToastProvider><Fire /></ToastProvider>);
    fireEvent.click(screen.getByText("fire"));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
});
