import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let mockParams = new URLSearchParams();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/audit",
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => mockParams,
}));

import AuditPage from "@/app/admin/(cms)/audit/page";
import { CmsProvider } from "@/app/admin/(cms)/_components/CmsContext";
import { ToastProvider } from "@/app/admin/(cms)/_components/Toast";

const ROWS = [
  { id: "a1", actor: { id: "u1", displayName: "Nguyễn Hải Yến", role: "ADMIN" }, action: "member.suspend", entityType: "member", entityId: "m-1001", createdAt: "2026-11-06T02:42:10.000Z", ip: "113.190.24.7", before: { status: "ACTIVE" }, after: { status: "SUSPENDED" } },
  { id: "a2", actor: { id: "u2", displayName: "Trần Đức Thịnh", role: "EDITOR" }, action: "level.update", entityType: "level", entityId: "N4", createdAt: "2026-11-06T02:12:51.000Z", ip: null, before: { passScore: 55 }, after: { passScore: 60 } },
];
const body = (data = ROWS, total = data.length, page = 1, perPage = 10) => ({ data, total, page, perPage });
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
let fetchMock: ReturnType<typeof vi.fn>;
const setFetch = (impl: (url: string) => Response) => {
  fetchMock = vi.fn((url: string) => Promise.resolve(impl(url)));
  vi.stubGlobal("fetch", fetchMock);
};
const mount = () =>
  render(
    <CmsProvider value={{ lang: "en", role: "SUPPORT", allowed: ["dashboard", "members", "audit"] }}>
      <ToastProvider><AuditPage /></ToastProvider>
    </CmsProvider>,
  );

beforeEach(() => { mockParams = new URLSearchParams(); replace.mockClear(); setFetch(() => json(body())); });
afterEach(() => vi.unstubAllGlobals());

describe("Audit log (AC-CMS-04, AC-CMS-10)", () => {
  it("lists who did what, to what, when and from which IP", async () => {
    mount();
    const row = (await screen.findByRole("cell", { name: /Nguyễn Hải Yến/ })).closest("tr")!;
    expect(within(row).getByText("Admin")).toBeInTheDocument();
    expect(within(row).getByText("member.suspend")).toBeInTheDocument();
    expect(within(row).getByText("member m-1001")).toBeInTheDocument();
    expect(within(row).getByText("113.190.24.7")).toBeInTheDocument();
    const other = screen.getByRole("cell", { name: /Trần Đức Thịnh/ }).closest("tr")!;
    expect(within(other).getByText("—")).toBeInTheDocument(); // no IP recorded
    expect(screen.getByRole("columnheader", { name: "Timestamp" })).toBeInTheDocument();
  });

  it("requests the page with filters from the URL", async () => {
    mockParams = new URLSearchParams("module=member&range=7d&actor=u1");
    mount();
    await screen.findByRole("table");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/admin/audit?");
    for (const part of ["module=member", "range=7d", "actor=u1"]) expect(url).toContain(part);
  });

  it("changing the module or range filter updates the URL and resets paging", async () => {
    mockParams = new URLSearchParams("page=2");
    mount();
    await screen.findByRole("table");
    fireEvent.change(screen.getByLabelText("Module"), { target: { value: "level" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/audit?module=level");
    fireEvent.change(screen.getByLabelText("Date range"), { target: { value: "30d" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/audit?range=30d");
  });

  it("offers an actor filter built from the people who appear in the log", async () => {
    mount();
    await screen.findByRole("table");
    const select = screen.getByLabelText("Actor");
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["All actors", "Nguyễn Hải Yến", "Trần Đức Thịnh"]);
    fireEvent.change(select, { target: { value: "u2" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/audit?actor=u2");
  });

  it("expands a row to show before and after, and collapses it again", async () => {
    mount();
    await screen.findByRole("table");
    const toggle = screen.getAllByRole("button", { name: /show changes/i })[0];
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const before = screen.getByRole("region", { name: "Before" });
    const after = screen.getByRole("region", { name: "After" });
    expect(before).toHaveTextContent('"status": "ACTIVE"');
    expect(after).toHaveTextContent('"status": "SUSPENDED"');
    fireEvent.click(toggle);
    expect(screen.queryByRole("region", { name: "Before" })).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    setFetch(() => json(body([], 0)));
    mount();
    expect(await screen.findByText("No audit entries match")).toBeInTheDocument();
  });

  it("paginates through the URL", async () => {
    setFetch(() => json(body(ROWS, 25)));
    mount();
    await screen.findByRole("table");
    expect(screen.getByText("1–2 of 25")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(replace).toHaveBeenCalledWith("/admin/audit?page=2");
  });

  it("retries after an error and explains a 403", async () => {
    let n = 0;
    setFetch(() => (++n === 1 ? json({ error: { code: "INTERNAL_ERROR", message: "x" } }, 500) : json(body())));
    const first = mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load/i);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
    first.unmount();

    setFetch(() => json({ error: { code: "FORBIDDEN", message: "x" } }, 403));
    mount();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/don.t have access/i));
  });
});
