import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/settings",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import SettingsPage from "@/app/admin/(cms)/settings/page";
import { CmsProvider } from "@/app/admin/(cms)/_components/CmsContext";
import { ToastProvider } from "@/app/admin/(cms)/_components/Toast";

const SETTINGS = {
  general: { siteName: "JLPT Master", defaultLanguage: "vi" },
  examRules: { timeLimitMin: 105, retakeLimit: 3, passThreshold: 60 },
  notifications: { welcome: true, passwordReset: true, examResult: true, weeklyDigest: false, suspension: true, planExpiry: true },
};
const MATRIX = {
  OWNER: { dashboard: true, members: true, levels: true, settings: true, audit: true },
  ADMIN: { dashboard: true, members: true, levels: true, settings: true, audit: true },
  EDITOR: { dashboard: true, members: false, levels: true, settings: false, audit: false },
  SUPPORT: { dashboard: true, members: true, levels: false, settings: false, audit: true },
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
let fetchMock: ReturnType<typeof vi.fn>;
type Handler = (url: string, init?: RequestInit) => Response | undefined;
const setFetch = (override?: Handler) => {
  fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const custom = override?.(url, init);
    if (custom) return Promise.resolve(custom);
    if (init?.method && init.method !== "GET") return Promise.resolve(json({ data: {} }));
    return Promise.resolve(json({ data: url.endsWith("/roles") ? MATRIX : SETTINGS }));
  });
  vi.stubGlobal("fetch", fetchMock);
};
const sent = (suffix: string, method: string) => {
  const call = fetchMock.mock.calls.find(([u, i]) => String(u).endsWith(suffix) && i?.method === method);
  return call ? JSON.parse(call[1].body) : undefined;
};
const mount = () =>
  render(
    <CmsProvider value={{ lang: "en", role: "ADMIN", allowed: ["dashboard", "members", "levels", "settings", "audit"] }}>
      <ToastProvider><SettingsPage /></ToastProvider>
    </CmsProvider>,
  );
const saveBtn = () => screen.getByRole("button", { name: "Save changes" });

beforeEach(() => setFetch());
afterEach(() => vi.unstubAllGlobals());

describe("System settings (AC-CMS-07, AC-CMS-10)", () => {
  it("shows four tabs, the General values, and a clean save bar", async () => {
    mount();
    expect(await screen.findByLabelText("Site name")).toHaveValue("JLPT Master");
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["General", "Exam rules", "Roles and permissions", "Notifications"]);
    expect(screen.getByText("All changes saved")).toBeInTheDocument();
    expect(saveBtn()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Discard" })).toBeDisabled();
  });

  it("editing marks the bar 'Unsaved changes'; Discard restores the saved value", async () => {
    mount();
    const name = await screen.findByLabelText("Site name");
    fireEvent.change(name, { target: { value: "Nihongo Hub" } });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(saveBtn()).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.getByLabelText("Site name")).toHaveValue("JLPT Master");
    expect(screen.getByText("All changes saved")).toBeInTheDocument();
  });

  it("keeps edits when switching tabs", async () => {
    mount();
    fireEvent.change(await screen.findByLabelText("Site name"), { target: { value: "Nihongo Hub" } });
    fireEvent.click(screen.getByRole("tab", { name: "Exam rules" }));
    expect(await screen.findByLabelText(/time limit/i)).toHaveValue(105);
    fireEvent.click(screen.getByRole("tab", { name: "General" }));
    expect(screen.getByLabelText("Site name")).toHaveValue("Nihongo Hub");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("saves only the changed fields, toasts, and returns to a clean bar", async () => {
    mount();
    fireEvent.change(await screen.findByLabelText("Site name"), { target: { value: "Nihongo Hub" } });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(sent("/api/v1/admin/settings", "PATCH")).toBeDefined());
    expect(sent("/api/v1/admin/settings", "PATCH")).toEqual({ general: { siteName: "Nihongo Hub" } });
    expect(sent("/api/v1/admin/settings/roles", "PUT")).toBeUndefined();
    expect(await screen.findByText("Settings saved")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("All changes saved")).toBeInTheDocument());
  });

  it("validates exam-rule ranges inline and blocks saving", async () => {
    mount();
    await screen.findByLabelText("Site name");
    fireEvent.click(screen.getByRole("tab", { name: "Exam rules" }));
    fireEvent.change(await screen.findByLabelText(/time limit/i), { target: { value: "5" } });
    expect(screen.getByText("Enter a whole number from 10 to 240")).toBeInTheDocument();
    expect(saveBtn()).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/time limit/i), { target: { value: "90" } });
    fireEvent.change(screen.getByLabelText(/retake limit/i), { target: { value: "11" } });
    expect(screen.getByText("Enter a whole number from 0 to 10")).toBeInTheDocument();
    expect(saveBtn()).toBeDisabled();
  });

  it("says plainly that exam rules and notifications are stored but not yet enforced/sent", async () => {
    mount();
    await screen.findByLabelText("Site name");
    fireEvent.click(screen.getByRole("tab", { name: "Exam rules" }));
    expect(await screen.findByText(/stored only.*exam engine/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Notifications" }));
    expect(await screen.findByText(/stored only.*no emails are sent/i)).toBeInTheDocument();
  });

  it("an exam-rule edit is sent as a partial patch", async () => {
    mount();
    await screen.findByLabelText("Site name");
    fireEvent.click(screen.getByRole("tab", { name: "Exam rules" }));
    fireEvent.change(await screen.findByLabelText(/retake limit/i), { target: { value: "4" } });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(sent("/api/v1/admin/settings", "PATCH")).toEqual({ examRules: { retakeLimit: 4 } }));
  });

  it("notification toggles are switches and save as a partial patch", async () => {
    mount();
    await screen.findByLabelText("Site name");
    fireEvent.click(screen.getByRole("tab", { name: "Notifications" }));
    const digest = await screen.findByRole("switch", { name: /weekly progress digest/i });
    expect(digest).not.toBeChecked();
    fireEvent.click(digest);
    fireEvent.click(saveBtn());
    await waitFor(() => expect(sent("/api/v1/admin/settings", "PATCH")).toEqual({ notifications: { weeklyDigest: true } }));
  });

  it("the roles matrix locks OWNER and the two ADMIN permissions that prevent a lock-out", async () => {
    mount();
    await screen.findByLabelText("Site name");
    fireEvent.click(screen.getByRole("tab", { name: "Roles and permissions" }));
    expect(await screen.findByRole("checkbox", { name: "OWNER · Settings" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "OWNER · Audit Log" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "ADMIN · Settings" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "ADMIN · Dashboard" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "ADMIN · Members" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "EDITOR · Levels" })).toBeChecked();
  });

  it("saving a matrix change PUTs the whole matrix", async () => {
    mount();
    await screen.findByLabelText("Site name");
    fireEvent.click(screen.getByRole("tab", { name: "Roles and permissions" }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "EDITOR · Audit Log" }));
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    fireEvent.click(saveBtn());
    await waitFor(() => expect(sent("/api/v1/admin/settings/roles", "PUT")).toBeDefined());
    expect(sent("/api/v1/admin/settings/roles", "PUT")).toEqual({ ...MATRIX, EDITOR: { ...MATRIX.EDITOR, audit: true } });
    expect(sent("/api/v1/admin/settings", "PATCH")).toBeUndefined();
  });

  it("changes to both a setting and the matrix are saved together", async () => {
    mount();
    fireEvent.change(await screen.findByLabelText("Site name"), { target: { value: "Nihongo Hub" } });
    fireEvent.click(screen.getByRole("tab", { name: "Roles and permissions" }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "SUPPORT · Levels" }));
    fireEvent.click(saveBtn());
    await waitFor(() => expect(sent("/api/v1/admin/settings/roles", "PUT")).toBeDefined());
    expect(sent("/api/v1/admin/settings", "PATCH")).toEqual({ general: { siteName: "Nihongo Hub" } });
  });

  it("shows a server rejection inline and stays dirty so nothing is lost", async () => {
    setFetch((url, init) => (init?.method === "PUT" ? json({ error: { code: "LOCKOUT", message: "ADMIN phải giữ quyền Dashboard và Settings" } }, 409) : undefined));
    mount();
    await screen.findByLabelText("Site name");
    fireEvent.click(screen.getByRole("tab", { name: "Roles and permissions" }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "EDITOR · Audit Log" }));
    fireEvent.click(saveBtn());
    expect(await screen.findByRole("alert")).toHaveTextContent("ADMIN phải giữ quyền Dashboard và Settings");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("warns before leaving the page only while there are unsaved changes", async () => {
    mount();
    const name = await screen.findByLabelText("Site name");
    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    fireEvent.change(name, { target: { value: "Nihongo Hub" } });
    const dirty = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });

  it("a 403 shows the no-access state, not an empty form", async () => {
    setFetch((url) => json({ error: { code: "FORBIDDEN", message: "x" } }, 403));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(/don.t have access/i);
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });

  it("the logo control is honest: upload is not available in this release", async () => {
    mount();
    await screen.findByLabelText("Site name");
    expect(within(screen.getByRole("tabpanel")).getByRole("button", { name: /replace logo/i })).toBeDisabled();
    expect(screen.getByText(/logo upload is not available yet/i)).toBeInTheDocument();
  });
});
