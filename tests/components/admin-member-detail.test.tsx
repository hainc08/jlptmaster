import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/members/m1",
  useRouter: () => ({ replace, push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "m1" }),
}));

import MemberDetailPage from "@/app/admin/(cms)/members/[id]/page";
import { CmsProvider } from "@/app/admin/(cms)/_components/CmsContext";
import { ToastProvider } from "@/app/admin/(cms)/_components/Toast";

const MEMBER = {
  id: "m1", displayName: "Nguyễn Minh Anh", email: "minh.anh@example.com", level: "N5", plan: "PREMIUM", status: "ACTIVE",
  joinedAt: "2026-03-01T00:00:00.000Z", lastActiveAt: "2026-11-05T00:00:00.000Z",
  progress: [
    { level: "N5", totalLessons: 12, completedLessons: 6, published: true, percent: 50 },
    { level: "N4", totalLessons: 0, completedLessons: 0, published: false, percent: 0 },
    { level: "N3", totalLessons: 0, completedLessons: 0, published: false, percent: 0 },
    { level: "N2", totalLessons: 0, completedLessons: 0, published: false, percent: 0 },
    { level: "N1", totalLessons: 0, completedLessons: 0, published: false, percent: 0 },
  ],
  exams: [
    { id: "e1", title: "N5 Mock Exam 02", level: "N5", submittedAt: "2026-11-04T00:00:00.000Z", scorePercent: 82 },
    { id: "e2", title: "N5 Mock Exam 01", level: "N5", submittedAt: "2026-10-29T00:00:00.000Z", scorePercent: 71 },
  ],
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
let fetchMock: ReturnType<typeof vi.fn>;
const setFetch = (impl: (url: string, init?: RequestInit) => Response) => {
  fetchMock = vi.fn((url: string, init?: RequestInit) => Promise.resolve(impl(url, init)));
  vi.stubGlobal("fetch", fetchMock);
};
const posted = (suffix: string, method = "POST") => fetchMock.mock.calls.find(([u, i]) => String(u).endsWith(suffix) && i?.method === method);
const mount = () =>
  render(
    <CmsProvider value={{ lang: "en", role: "ADMIN", allowed: ["dashboard", "members", "levels", "settings", "audit"] }}>
      <ToastProvider><MemberDetailPage /></ToastProvider>
    </CmsProvider>,
  );

beforeEach(() => {
  push.mockClear(); replace.mockClear();
  setFetch((url, init) => (init?.method && init.method !== "GET" ? new Response(null, { status: 204 }) : json({ data: MEMBER })));
});
afterEach(() => vi.unstubAllGlobals());

describe("Member detail (AC-CMS-02, AC-CMS-09, AC-CMS-10)", () => {
  it("renders the profile header with status, email, id and the five actions", async () => {
    mount();
    expect(await screen.findByRole("heading", { level: 1, name: "Nguyễn Minh Anh" })).toBeInTheDocument();
    const header = screen.getByRole("heading", { level: 1 }).closest("section")!;
    expect(within(header).getByText("minh.anh@example.com")).toBeInTheDocument();
    expect(within(header).getByText("ID m1")).toBeInTheDocument();
    expect(within(header).getByText("Active")).toBeInTheDocument();
    for (const name of ["Edit", "Reset password", "Change level", "Suspend", "Delete"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/admin/members/m1");
  });

  it("shows a not-found state with a way back for an unknown member", async () => {
    setFetch(() => json({ error: { code: "NOT_FOUND", message: "x" } }, 404));
    mount();
    expect(await screen.findByText("Member not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to members/i })).toHaveAttribute("href", "/admin/members");
  });

  it("explains a 403 instead of showing a generic error", async () => {
    setFetch(() => json({ error: { code: "FORBIDDEN", message: "x" } }, 403));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(/don.t have access/i);
  });

  it("is a real tablist: arrow keys move between tabs and show the matching panel", async () => {
    mount();
    await screen.findByRole("heading", { level: 1 });
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Overview", "Progress by level", "Exam history", "Account and access"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Overview");
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Progress by level");
    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(tabs[3]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(tabs[3], { key: "ArrowRight" });
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("Overview shows level, plan, exams taken and the average score", async () => {
    mount();
    const panel = await screen.findByRole("tabpanel");
    expect(within(panel).getByText("Premium")).toBeInTheDocument();
    expect(within(panel).getByText("2")).toBeInTheDocument(); // exams taken
    expect(within(panel).getByText("77%")).toBeInTheDocument(); // avg of 82 and 71, rounded
  });

  it("Progress by level shows a progress bar for N5 and 'not yet published' for N4–N1", async () => {
    mount();
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("tab", { name: "Progress by level" }));
    const bar = screen.getByRole("progressbar", { name: "N5 progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("6 / 12 lessons")).toBeInTheDocument();
    expect(screen.getAllByText("Content not yet published")).toHaveLength(4);
  });

  it("Exam history lists exams with percentage scores (no invented official JLPT scale)", async () => {
    mount();
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("tab", { name: "Exam history" }));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("N5 Mock Exam 02")).toBeInTheDocument();
    expect(within(rows[1]).getByText("82%")).toBeInTheDocument();
    expect(screen.queryByText(/\/180/)).not.toBeInTheDocument();
  });

  it("Exam history has an empty state when the member has not taken an exam", async () => {
    setFetch(() => json({ data: { ...MEMBER, exams: [] } }));
    mount();
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("tab", { name: "Exam history" }));
    expect(screen.getByText("No exams taken yet")).toBeInTheDocument();
  });

  it("Suspend asks for confirmation, then calls the API and reloads the member", async () => {
    mount();
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));
    expect(screen.getByRole("alertdialog", { name: "Suspend account?" })).toBeInTheDocument();
    expect(posted("/suspend")).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "Suspend account" }));
    await waitFor(() => expect(posted("/api/v1/admin/members/m1/suspend")).toBeDefined());
    expect(await screen.findByText("Account suspended")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([, i]) => !i?.method || i.method === "GET").length).toBeGreaterThanOrEqual(2);
  });

  it("a suspended member offers Reactivate instead", async () => {
    setFetch((url, init) => (init?.method && init.method !== "GET" ? new Response(null, { status: 204 }) : json({ data: { ...MEMBER, status: "SUSPENDED" } })));
    mount();
    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reactivate" }));
    fireEvent.click(screen.getByRole("button", { name: "Reactivate account" }));
    await waitFor(() => expect(posted("/api/v1/admin/members/m1/reactivate")).toBeDefined());
  });

  it("Delete is destructive: the dialog says history is kept, nothing is sent until confirmed, then it goes back to the list", async () => {
    mount();
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dlg = screen.getByRole("alertdialog", { name: "Delete this member?" });
    expect(dlg).toHaveTextContent(/exam history is kept/i);
    expect(dlg).toHaveTextContent(/can.t be undone/i);
    expect(posted("/api/v1/admin/members/m1", "DELETE")).toBeUndefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Delete member" }));
    await waitFor(() => expect(posted("/api/v1/admin/members/m1", "DELETE")).toBeDefined());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/members"));
  });

  it("Change level posts the selected level", async () => {
    mount();
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Change level" }));
    const dlg = screen.getByRole("alertdialog", { name: "Change level" });
    fireEvent.change(within(dlg).getByLabelText("New level"), { target: { value: "N3" } });
    fireEvent.click(within(dlg).getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(JSON.parse(posted("/api/v1/admin/members/m1/change-level")![1].body)).toEqual({ level: "N3" }));
  });

  it("Reset password confirms, posts, and tells the truth that no email is sent", async () => {
    setFetch((url, init) => (init?.method === "POST" ? json({ data: { sessionsRevoked: 2, emailSent: false } }) : json({ data: MEMBER })));
    mount();
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out everywhere" }));
    await waitFor(() => expect(posted("/api/v1/admin/members/m1/reset-password")).toBeDefined());
    expect(await screen.findByText(/2 sessions signed out.*no email was sent/i)).toBeInTheDocument();
  });

  it("Edit sends only the changed fields and shows a duplicate-email error inline", async () => {
    setFetch((url, init) => (init?.method === "PATCH" ? json({ error: { code: "EMAIL_TAKEN", message: "x" } }, 409) : json({ data: MEMBER })));
    mount();
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const panel = screen.getByRole("dialog", { name: "Edit member" });
    fireEvent.change(within(panel).getByLabelText(/email/i), { target: { value: "taken@example.com" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Save" }));
    expect(await within(panel).findByText("A member with this email already exists")).toBeInTheDocument();
    const patch = posted("/api/v1/admin/members/m1", "PATCH")!;
    expect(JSON.parse(patch[1].body)).toEqual({ email: "taken@example.com" });
  });
});
