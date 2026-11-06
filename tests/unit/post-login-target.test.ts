import { describe, it, expect } from "vitest";
import { postLoginTarget } from "../../app/components/nav-config";

describe("postLoginTarget (where to send a user after signing in)", () => {
  it("students go to their dashboard, or back to a learner page they asked for", () => {
    expect(postLoginTarget("STUDENT", null)).toBe("/dashboard");
    expect(postLoginTarget("STUDENT", "/mock-exams")).toBe("/mock-exams");
  });

  it("students are never sent into /admin, even if the redirect asks for it", () => {
    expect(postLoginTarget("STUDENT", "/admin")).toBe("/dashboard");
    expect(postLoginTarget("STUDENT", "/admin/members")).toBe("/dashboard");
  });

  it("ADMIN and OWNER land on the existing admin home and may follow any admin redirect", () => {
    for (const role of ["ADMIN", "OWNER"]) {
      expect(postLoginTarget(role, null)).toBe("/admin");
      expect(postLoginTarget(role, "/admin/members")).toBe("/admin/members");
      expect(postLoginTarget(role, "/admin/content")).toBe("/admin/content");
    }
  });

  it("SUPPORT and EDITOR land on the new console and may only follow console redirects", () => {
    for (const role of ["SUPPORT", "EDITOR"]) {
      expect(postLoginTarget(role, null)).toBe("/admin/dashboard");
      expect(postLoginTarget(role, "/admin/members")).toBe("/admin/members");
      expect(postLoginTarget(role, "/admin/content")).toBe("/admin/dashboard");
      expect(postLoginTarget(role, "/admin")).toBe("/admin/dashboard");
      expect(postLoginTarget(role, "/mock-exams")).toBe("/mock-exams");
    }
  });

  it("ignores redirects that are not same-site paths", () => {
    expect(postLoginTarget("ADMIN", "//evil.example")).toBe("/admin");
    expect(postLoginTarget("STUDENT", "https://evil.example/x")).toBe("/dashboard");
    expect(postLoginTarget("STUDENT", "javascript:alert(1)")).toBe("/dashboard");
  });
});
