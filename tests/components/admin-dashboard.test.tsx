import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import DashboardPage from "@/app/admin/(cms)/dashboard/page";
import { CmsProvider } from "@/app/admin/(cms)/_components/CmsContext";

const DATA = {
  kpis: { totalMembers: 3842, activeThisWeek: 1276, newThisMonth: 214, examsTaken: 9508 },
  activity30d: Array.from({ length: 30 }, (_, i) => ({ date: `2026-10-${String(8 + i).padStart(2, "0")}`.replace(/-(3[2-9]|[4-9]\d)$/, "-31"), activeMembers: 800 + i * 10 })),
  membersByLevel: [{ level: "N5", count: 2310 }, { level: "N4", count: 842 }, { level: "N3", count: 410 }, { level: "N2", count: 190 }, { level: "N1", count: 90 }],
  recent: [
    { id: "a1", kind: "audit", at: "2026-11-06T02:42:10.000Z", text: "Nguyễn Hải Yến · member.suspend" },
    { id: "e1", kind: "exam", at: "2026-11-06T01:00:00.000Z", text: "田中 美咲 completed N5 Mock Exam 02 — 82%" },
  ],
};

const ok = (body: unknown) => new Response(JSON.stringify({ data: body }), { status: 200 });
const mount = (lang: "vi" | "en" | "ja" = "en") =>
  render(<CmsProvider value={{ lang, role: "OWNER", allowed: ["dashboard", "members", "levels", "settings", "audit"] }}><DashboardPage /></CmsProvider>);

afterEach(() => vi.unstubAllGlobals());

describe("Admin dashboard screen (AC-CMS-08, AC-CMS-10)", () => {
  it("shows a loading skeleton first, then the four KPI cards with formatted numbers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(DATA)));
    mount("en");
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    for (const label of ["Total members", "Active this week", "New this month", "Exams taken"]) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("3,842")).toBeInTheDocument();
    expect(screen.getByText("9,508")).toBeInTheDocument();
    expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
  });

  it("formats numbers with the operator's language (vi uses a dot as the thousands separator)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(DATA)));
    mount("vi");
    expect(await screen.findByText("3.842")).toBeInTheDocument();
  });

  it("draws one bar per level, N5 to N1, with an accessible summary", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(DATA)));
    mount();
    const chart = await screen.findByRole("img", { name: /members by level.*N5 2,310.*N1 90/i });
    for (const l of ["N5", "N4", "N3", "N2", "N1"]) expect(within(chart).getByText(l)).toBeInTheDocument();
    expect(within(chart).getByText("2,310")).toBeInTheDocument();
  });

  it("describes the 30-day line chart for screen readers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(DATA)));
    mount();
    expect(await screen.findByRole("img", { name: /daily active members.*30 days/i })).toBeInTheDocument();
  });

  it("lists recent activity and links to the audit log", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(DATA)));
    mount();
    expect(await screen.findByText(/member\.suspend/)).toBeInTheDocument();
    expect(screen.getByText(/田中 美咲 completed/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view audit log/i })).toHaveAttribute("href", "/admin/audit");
  });

  it("hides the audit link when the role may not open the audit module", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(DATA)));
    render(<CmsProvider value={{ lang: "en", role: "EDITOR", allowed: ["dashboard", "levels"] }}><DashboardPage /></CmsProvider>);
    await screen.findByText("Total members");
    expect(screen.queryByRole("link", { name: /view audit log/i })).not.toBeInTheDocument();
  });

  it("shows an empty state when there is no recent activity", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok({ ...DATA, recent: [] })));
    mount();
    expect(await screen.findByText(/no recent activity/i)).toBeInTheDocument();
  });

  it("shows an error state and retries on request", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "boom" } }), { status: 500 }))
      .mockResolvedValueOnce(ok(DATA));
    vi.stubGlobal("fetch", fetchMock);
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load/i);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Total members")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("tells a 403 user they have no access instead of a generic error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "no" } }), { status: 403 })));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(/don.t have access/i);
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });
});
