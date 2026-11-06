import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let mockParams = new URLSearchParams();
const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/members",
  useRouter: () => ({ replace, push, refresh: vi.fn() }),
  useSearchParams: () => mockParams,
}));
const download = vi.fn();
vi.mock("@/app/admin/(cms)/_lib/download", () => ({ downloadFile: (u: string) => download(u) }));

import MembersPage from "@/app/admin/(cms)/members/page";
import { CmsProvider } from "@/app/admin/(cms)/_components/CmsContext";
import { ToastProvider } from "@/app/admin/(cms)/_components/Toast";

const ROWS = [
  { id: "m1", displayName: "Nguyễn Minh Anh", email: "minh.anh@example.com", level: "N5", plan: "FREE", status: "ACTIVE", joinedAt: "2026-03-01T00:00:00.000Z", lastActiveAt: "2026-11-05T00:00:00.000Z" },
  { id: "m2", displayName: "田中 美咲", email: "tanaka.misaki@example.com", level: "N4", plan: "PREMIUM", status: "SUSPENDED", joinedAt: "2026-02-10T00:00:00.000Z", lastActiveAt: null },
  { id: "m3", displayName: "Lê Thu Hà", email: "thu.ha@example.com", level: "N5", plan: "STANDARD", status: "EXPIRED", joinedAt: "2026-01-20T00:00:00.000Z", lastActiveAt: "2026-10-01T00:00:00.000Z" },
];
const page = (data = ROWS, total = data.length, p = 1, perPage = 10) => ({ data, page: p, perPage, total });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

let fetchMock: ReturnType<typeof vi.fn>;
const setFetch = (impl: (url: string, init?: RequestInit) => Response | Promise<Response>) => {
  fetchMock = vi.fn((url: string, init?: RequestInit) => Promise.resolve(impl(url, init)));
  vi.stubGlobal("fetch", fetchMock);
};
const mount = (allowed = ["dashboard", "members", "levels", "settings", "audit"] as const) =>
  render(
    <CmsProvider value={{ lang: "en", role: "ADMIN", allowed }}>
      <ToastProvider><MembersPage /></ToastProvider>
    </CmsProvider>,
  );

beforeEach(() => {
  mockParams = new URLSearchParams();
  replace.mockClear(); push.mockClear(); download.mockClear();
  setFetch(() => json(page()));
});
afterEach(() => vi.unstubAllGlobals());

describe("Members list (AC-CMS-03, AC-CMS-10)", () => {
  it("renders each member with avatar initials, level and status chips, plan and links to the detail page", async () => {
    mount();
    expect(await screen.findByRole("link", { name: "Nguyễn Minh Anh" })).toHaveAttribute("href", "/admin/members/m1");
    const row = screen.getByRole("link", { name: "田中 美咲" }).closest("tr")!;
    expect(within(row).getByText("tanaka.misaki@example.com")).toBeInTheDocument();
    expect(within(row).getByText("N4")).toBeInTheDocument();
    expect(within(row).getByText("Premium")).toBeInTheDocument();
    expect(within(row).getByText("Suspended")).toBeInTheDocument();
    expect(within(screen.getByRole("link", { name: "Lê Thu Hà" }).closest("tr")!).getByText("Expired")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /last active/i })).toBeInTheDocument();
  });

  it("requests the page with the filters from the URL and shows removable chips", async () => {
    mockParams = new URLSearchParams("level=N5&status=SUSPENDED&q=minh");
    mount();
    await screen.findByText("Nguyễn Minh Anh");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/admin/members?");
    expect(url).toContain("level=N5");
    expect(url).toContain("status=SUSPENDED");
    expect(url).toContain("q=minh");
    expect(screen.getByText("Level: N5")).toBeInTheDocument();
    expect(screen.getByText("Status: Suspended")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove filter Level: N5" }));
    expect(replace).toHaveBeenCalledWith("/admin/members?status=SUSPENDED&q=minh");
  });

  it("changing a filter updates the query string and resets to page 1", async () => {
    mockParams = new URLSearchParams("page=3");
    mount();
    await screen.findByText("Nguyễn Minh Anh");
    fireEvent.change(screen.getByLabelText("Level"), { target: { value: "N5" } });
    expect(replace).toHaveBeenCalledWith("/admin/members?level=N5");
  });

  it("debounces the search box into the URL", async () => {
    mount();
    await screen.findByText("Nguyễn Minh Anh");
    fireEvent.change(screen.getByRole("searchbox", { name: /search members/i }), { target: { value: "田中" } });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/members?q=%E7%94%B0%E4%B8%AD"));
  });

  it("selecting rows shows the bulk bar; select-all picks the whole page", async () => {
    mount();
    await screen.findByText("Nguyễn Minh Anh");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Nguyễn Minh Anh" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select 田中 美咲" }));
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /select all on page/i }));
    expect(screen.getByText("3 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /select all on page/i }));
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  it("bulk suspend asks for confirmation first and only then calls the API, reporting skipped ids", async () => {
    setFetch((url, init) => (init?.method === "POST" ? json({ updated: 1, skipped: ["m3"] }) : json(page())));
    mount();
    await screen.findByText("Nguyễn Minh Anh");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Nguyễn Minh Anh" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Lê Thu Hà" }));
    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));
    expect(screen.getByRole("alertdialog", { name: /suspend 2 members/i })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Suspend members" }));
    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
      expect(post[0]).toBe("/api/v1/admin/members/bulk");
      expect(JSON.parse(post[1].body)).toEqual({ ids: ["m1", "m3"], action: "suspend" });
    });
    expect(await screen.findByText(/1 member suspended, 1 skipped/i)).toBeInTheDocument();
    expect(screen.queryByText(/2 selected/)).not.toBeInTheDocument();
  });

  it("bulk change level posts the chosen level", async () => {
    setFetch((url, init) => (init?.method === "POST" ? json({ updated: 1, skipped: [] }) : json(page())));
    mount();
    await screen.findByText("Nguyễn Minh Anh");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Nguyễn Minh Anh" }));
    fireEvent.click(screen.getByRole("button", { name: "Change level" }));
    fireEvent.change(screen.getByLabelText("New level"), { target: { value: "N4" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
      expect(JSON.parse(post[1].body)).toEqual({ ids: ["m1"], action: "change-level", level: "N4" });
    });
  });

  it("Export CSV downloads using the current filters", async () => {
    mockParams = new URLSearchParams("level=N5&page=2&perPage=25");
    mount();
    await screen.findByText("Nguyễn Minh Anh");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Nguyễn Minh Anh" }));
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(download).toHaveBeenCalledWith("/api/v1/admin/members/export?level=N5");
  });

  it("paginates through the URL and disables Previous on the first page", async () => {
    setFetch(() => json(page(ROWS, 25, 1, 10)));
    mount();
    await screen.findByText("Nguyễn Minh Anh");
    expect(screen.getByText("1–3 of 25")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(replace).toHaveBeenCalledWith("/admin/members?page=2");
  });

  it("shows a retryable error state when the API fails", async () => {
    let calls = 0;
    setFetch(() => (++calls === 1 ? json({ error: { code: "INTERNAL_ERROR", message: "x" } }, 500) : json(page())));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load/i);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Nguyễn Minh Anh")).toBeInTheDocument();
  });

  it("explains an empty directory differently from an empty filter result", async () => {
    setFetch(() => json(page([], 0)));
    const first = mount();
    expect(await screen.findByText("No members yet")).toBeInTheDocument();
    first.unmount();

    mockParams = new URLSearchParams("level=N1");
    mount();
    expect(await screen.findByText("No members match these filters")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(replace).toHaveBeenCalledWith("/admin/members");
  });

  it("shows an API refusal (403) as an error toast and keeps the page usable", async () => {
    setFetch((url, init) => (init?.method === "POST" ? json({ error: { code: "FORBIDDEN", message: "Truy cập bị từ chối" } }, 403) : json(page())));
    mount();
    await screen.findByText("Nguyễn Minh Anh");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Nguyễn Minh Anh" }));
    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));
    fireEvent.click(screen.getByRole("button", { name: "Suspend members" }));
    expect(await screen.findByText(/Truy cập bị từ chối/)).toBeInTheDocument();
  });
});

describe("Add member panel", () => {
  const open = async () => {
    mount();
    await screen.findByText("Nguyễn Minh Anh");
    fireEvent.click(screen.getByRole("button", { name: "Add member" }));
    return screen.getByRole("dialog", { name: "Add member" });
  };

  it("validates required fields inline and does not call the API", async () => {
    const panel = await open();
    fireEvent.click(within(panel).getByRole("button", { name: "Add member" }));
    expect(within(panel).getByText("Full name is required")).toBeInTheDocument();
    expect(within(panel).getByText("Enter a valid email address")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
  });

  it("shows a duplicate-email error from the API on the email field and keeps the panel open", async () => {
    setFetch((url, init) => (init?.method === "POST" ? json({ error: { code: "EMAIL_TAKEN", message: "Email đã tồn tại" } }, 409) : json(page())));
    const panel = await open();
    fireEvent.change(within(panel).getByLabelText(/full name/i), { target: { value: "Test User" } });
    fireEvent.change(within(panel).getByLabelText(/email/i), { target: { value: "minh.anh@example.com" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Add member" }));
    expect(await within(panel).findByText("A member with this email already exists")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Add member" })).toBeInTheDocument();
  });

  it("creates the member, closes, toasts and reloads the list", async () => {
    setFetch((url, init) => (init?.method === "POST" ? json({ data: ROWS[0] }, 201) : json(page())));
    const panel = await open();
    fireEvent.change(within(panel).getByLabelText(/full name/i), { target: { value: "  Test User " } });
    fireEvent.change(within(panel).getByLabelText(/email/i), { target: { value: "new@example.com" } });
    fireEvent.change(within(panel).getByLabelText("Plan"), { target: { value: "STANDARD" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Add member" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add member" })).not.toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(JSON.parse(post[1].body)).toEqual({ displayName: "Test User", email: "new@example.com", level: "N5", plan: "STANDARD" });
    expect(await screen.findByText(/member added/i)).toBeInTheDocument();
    const gets = fetchMock.mock.calls.filter(([, init]) => !init?.method || init.method === "GET");
    expect(gets.length).toBeGreaterThanOrEqual(2);
  });
});
