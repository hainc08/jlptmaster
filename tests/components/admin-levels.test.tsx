import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/levels",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import LevelsPage from "@/app/admin/(cms)/levels/page";
import { CmsProvider } from "@/app/admin/(cms)/_components/CmsContext";
import { ToastProvider } from "@/app/admin/(cms)/_components/Toast";

const LEVELS = [
  { code: "N5", name: "Nhập môn căn bản", description: "Basic grammar and vocabulary.", status: "PUBLISHED", enabled: true, passScore: 60, displayOrder: 1, lessons: 48, exams: 6, enrolled: 2310 },
  { code: "N4", name: "Sơ cấp mở rộng", description: "Elementary grammar.", status: "DRAFT", enabled: false, passScore: 60, displayOrder: 2, lessons: 36, exams: 4, enrolled: 842 },
  { code: "N3", name: "Trung cấp", description: "Bridge level.", status: "DRAFT", enabled: false, passScore: 60, displayOrder: 3, lessons: 12, exams: 1, enrolled: 410 },
  { code: "N2", name: "Trung - Cao cấp", description: "Business reading.", status: "COMING_SOON", enabled: false, passScore: 60, displayOrder: 4, lessons: 0, exams: 0, enrolled: 190 },
  { code: "N1", name: "Cao cấp chuyên sâu", description: "Advanced.", status: "COMING_SOON", enabled: false, passScore: 60, displayOrder: 5, lessons: 0, exams: 0, enrolled: 90 },
];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
let fetchMock: ReturnType<typeof vi.fn>;
const setFetch = (impl: (url: string, init?: RequestInit) => Response) => {
  fetchMock = vi.fn((url: string, init?: RequestInit) => Promise.resolve(impl(url, init)));
  vi.stubGlobal("fetch", fetchMock);
};
const sent = (suffix: string, method: string) => fetchMock.mock.calls.find(([u, i]) => String(u).endsWith(suffix) && i?.method === method);
const mount = () =>
  render(
    <CmsProvider value={{ lang: "en", role: "EDITOR", allowed: ["dashboard", "levels"] }}>
      <ToastProvider><LevelsPage /></ToastProvider>
    </CmsProvider>,
  );
const order = () => screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent!.slice(0, 2));

beforeEach(() => setFetch((url, init) => (init?.method && init.method !== "GET" ? new Response(null, { status: 204 }) : json({ data: LEVELS }))));
afterEach(() => vi.unstubAllGlobals());

describe("Levels screen (AC-CMS-06, AC-CMS-10)", () => {
  it("shows the five levels with the right status chip, counts and 'Waitlist' wording for unpublished levels", async () => {
    mount();
    const n5 = (await screen.findByRole("heading", { level: 2, name: /^N5/ })).closest("article")!;
    expect(within(n5).getByText("Published")).toBeInTheDocument();
    expect(within(n5).getByText("2,310")).toBeInTheDocument();
    expect(within(n5).getByText("Enrolled")).toBeInTheDocument();
    const n4 = screen.getByRole("heading", { level: 2, name: /^N4/ }).closest("article")!;
    expect(within(n4).getByText("Draft")).toBeInTheDocument();
    expect(within(n4).getByText("Waitlist")).toBeInTheDocument();
    const n1 = screen.getByRole("heading", { level: 2, name: /^N1/ }).closest("article")!;
    expect(within(n1).getByText("Coming soon")).toBeInTheDocument();
    expect(order()).toEqual(["N5", "N4", "N3", "N2", "N1"]);
  });

  it("moving N5 later sends the full new order and re-renders immediately", async () => {
    mount();
    await screen.findByRole("heading", { level: 2, name: /^N5/ });
    fireEvent.click(screen.getByRole("button", { name: "Move N5 later" }));
    expect(order()).toEqual(["N4", "N5", "N3", "N2", "N1"]);
    await waitFor(() => expect(sent("/api/v1/admin/levels/reorder", "POST")).toBeDefined());
    expect(JSON.parse(sent("/api/v1/admin/levels/reorder", "POST")![1].body)).toEqual({ order: ["N4", "N5", "N3", "N2", "N1"] });
    expect(await screen.findByText("Display order updated")).toBeInTheDocument();
  });

  it("disables moving the first level earlier and the last level later", async () => {
    mount();
    await screen.findByRole("heading", { level: 2, name: /^N5/ });
    expect(screen.getByRole("button", { name: "Move N5 earlier" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move N1 later" })).toBeDisabled();
  });

  it("rolls the order back and says so when the server rejects the reorder", async () => {
    setFetch((url, init) => (init?.method === "POST" ? json({ error: { code: "INVALID_ORDER", message: "Thứ tự không hợp lệ" } }, 400) : json({ data: LEVELS })));
    mount();
    await screen.findByRole("heading", { level: 2, name: /^N5/ });
    fireEvent.click(screen.getByRole("button", { name: "Move N5 later" }));
    expect(await screen.findByText(/Thứ tự không hợp lệ/)).toBeInTheDocument();
    await waitFor(() => expect(order()).toEqual(["N5", "N4", "N3", "N2", "N1"]));
  });

  it("the table view lists the same levels with an order column", async () => {
    mount();
    await screen.findByRole("heading", { level: 2, name: /^N5/ });
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.getByRole("columnheader", { name: "Order" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Table" })).toHaveAttribute("aria-pressed", "true");
  });

  it("the edit panel cannot enable an unpublished level and explains why", async () => {
    mount();
    await screen.findByRole("heading", { level: 2, name: /^N4/ });
    fireEvent.click(within(screen.getByRole("heading", { level: 2, name: /^N4/ }).closest("article")!).getByRole("button", { name: /edit/i }));
    const panel = screen.getByRole("dialog", { name: "Edit N4" });
    expect(within(panel).getByRole("switch", { name: /enabled for learners/i })).toBeDisabled();
    expect(within(panel).getByText(/only published levels can be enabled/i)).toBeInTheDocument();
  });

  it("the pass-score control is limited to 30–100", async () => {
    mount();
    await screen.findByRole("heading", { level: 2, name: /^N5/ });
    fireEvent.click(within(screen.getByRole("heading", { level: 2, name: /^N5/ }).closest("article")!).getByRole("button", { name: /edit/i }));
    const slider = within(screen.getByRole("dialog", { name: "Edit N5" })).getByRole("slider", { name: /pass score/i });
    expect(slider).toHaveAttribute("min", "30");
    expect(slider).toHaveAttribute("max", "100");
    expect(slider).toHaveValue("60");
  });

  it("saving sends only the changed fields and reloads", async () => {
    mount();
    await screen.findByRole("heading", { level: 2, name: /^N5/ });
    fireEvent.click(within(screen.getByRole("heading", { level: 2, name: /^N5/ }).closest("article")!).getByRole("button", { name: /edit/i }));
    const panel = screen.getByRole("dialog", { name: "Edit N5" });
    fireEvent.change(within(panel).getByRole("slider", { name: /pass score/i }), { target: { value: "70" } });
    fireEvent.click(within(panel).getByRole("switch", { name: /enabled for learners/i }));
    fireEvent.click(within(panel).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(sent("/api/v1/admin/levels/N5", "PATCH")).toBeDefined());
    expect(JSON.parse(sent("/api/v1/admin/levels/N5", "PATCH")![1].body)).toEqual({ passScore: 70, enabled: false });
    expect(await screen.findByText("N5 saved")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("saving without changes just closes the panel", async () => {
    mount();
    await screen.findByRole("heading", { level: 2, name: /^N5/ });
    fireEvent.click(within(screen.getByRole("heading", { level: 2, name: /^N5/ }).closest("article")!).getByRole("button", { name: /edit/i }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Edit N5" })).getByRole("button", { name: "Save changes" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(sent("/api/v1/admin/levels/N5", "PATCH")).toBeUndefined();
  });

  it("shows a server rule failure inside the panel and keeps it open", async () => {
    setFetch((url, init) => (init?.method === "PATCH" ? json({ error: { code: "INVALID_NAME", message: "Tên cấp độ phải từ 1 đến 50 ký tự" } }, 400) : json({ data: LEVELS })));
    mount();
    await screen.findByRole("heading", { level: 2, name: /^N5/ });
    fireEvent.click(within(screen.getByRole("heading", { level: 2, name: /^N5/ }).closest("article")!).getByRole("button", { name: /edit/i }));
    const panel = screen.getByRole("dialog", { name: "Edit N5" });
    fireEvent.change(within(panel).getByLabelText("Name"), { target: { value: "x".repeat(60) } });
    fireEvent.click(within(panel).getByRole("button", { name: "Save changes" }));
    expect(await within(panel).findByRole("alert")).toHaveTextContent("Tên cấp độ phải từ 1 đến 50 ký tự");
  });

  it("shows a loading skeleton, then an error state with retry", async () => {
    let n = 0;
    setFetch(() => (++n === 1 ? json({ error: { code: "INTERNAL_ERROR", message: "x" } }, 500) : json({ data: LEVELS })));
    mount();
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load/i);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("heading", { level: 2, name: /^N5/ })).toBeInTheDocument();
  });
});
