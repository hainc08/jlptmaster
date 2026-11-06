import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { PrefsSync } from "@/app/components/shell/PrefsSync";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PrefsSync", () => {
  it("applies account preferences only once per page session (remounts do not undo local choices)", async () => {
    const f = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ data: { furiganaDefault: true, uiLanguage: "vi" } }) } as Response));
    global.fetch = f as unknown as typeof fetch;
    const a = render(<PrefsSync />);
    await act(async () => { await Promise.resolve(); });
    a.unmount();
    render(<PrefsSync />);
    await act(async () => { await Promise.resolve(); });
    expect(f).toHaveBeenCalledTimes(1);
  });
});
