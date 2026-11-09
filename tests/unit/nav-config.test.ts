import { describe, it, expect } from "vitest";
import {
  LEARNER_TABS,
  getActiveTab,
  isFocusPath,
  showsFurigana,
} from "@/app/components/nav-config";

describe("LEARNER_TABS", () => {
  it("has the five tabs in order with their routes", () => {
    expect(LEARNER_TABS.map((t) => [t.id, t.href])).toEqual([
      ["home", "/dashboard"],
      ["learn", "/learn/n5"],
      ["test", "/mock-exams"],
      ["kanji", "/kanji"],
      ["profile", "/profile"],
    ]);
  });
});

describe("getActiveTab", () => {
  it.each([
    ["/dashboard", "home"],
    ["/learn/n5", "learn"],
    ["/learn/n5/bai-3", "learn"],
    ["/learn/n4", "learn"],
    ["/vocabulary", "learn"],
    ["/grammar", "learn"],
    ["/flashcards", "learn"],
    ["/practice", "learn"],
    ["/mock-exams", "test"],
    ["/mock-exams/123", "test"],
    ["/results/abc", "test"],
    ["/kanji", "kanji"],
    ["/profile", "profile"],
    ["/admin/members", null],
    ["/login", null],
    ["/", null],
    ["/learning", null],
  ])("%s → %s", (path, tab) => {
    expect(getActiveTab(path)).toBe(tab);
  });
});

describe("isFocusPath", () => {
  it.each([
    ["/learn/n5", false],
    ["/learn/n5/bai-3", true],
    ["/mock-exams", false],
    ["/mock-exams/123", true],
    ["/dashboard", false],
  ])("%s → %s", (path, focus) => {
    expect(isFocusPath(path)).toBe(focus);
  });
});

describe("showsFurigana", () => {
  it.each([
    ["/learn/n5", true],
    ["/learn/n5/bai-3", true],
    ["/kanji", true],
    ["/results/abc", true],
    ["/mock-exams/123", true],
    ["/vocabulary", true],
    ["/dashboard", false],
    ["/profile", false],
    ["/login", false],
    ["/register", false],
  ])("%s → %s", (path, shown) => {
    expect(showsFurigana(path)).toBe(shown);
  });
});
