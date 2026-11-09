"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useStoredValue, writeStoredValue } from "./stored-value";

export type Locale = "vi" | "en";

/**
 * UI strings. Vietnamese is the source; English covers navigation and headings only
 * (owner decision Q5, docs/ui-approval.md §5.3). A missing English key falls back to Vietnamese.
 */
const VI: Record<string, string> = {
  "nav.home": "Trang chủ",
  "nav.learn": "Học",
  "nav.test": "Thi thử",
  "nav.kanji": "Kanji",
  "nav.profile": "Hồ sơ",
  "nav.main": "Điều hướng chính",
  "furigana.on": "Bật",
  "furigana.off": "Tắt",
  "lang.label": "Ngôn ngữ",
  "brand.tagline": "Học và luyện thi JLPT",
  "auth.signIn": "Đăng nhập",
  "auth.signUp": "Đăng ký",
  "auth.welcome": "Chào mừng bạn",
  "auth.chooseLevel": "Chọn cấp độ",
  "home.continue": "Tiếp tục học",
  "home.review": "Ôn tập",
  "home.latestAttempt": "Bài thi gần nhất",
  "home.todayGoal": "Mục tiêu hôm nay",
  "home.week": "Tuần này",
  "learn.title": "Lộ trình N5",
  "learn.tools": "Công cụ học",
  "learn.tab.vocab": "Từ vựng",
  "learn.tab.grammar": "Ngữ pháp",
  "learn.tab.reading": "Đọc hiểu",
  "kanji.title": "Sổ tay Kanji",
  "test.title": "Thi thử",
  "test.lobby": "Chọn đề thi",
  "result.title": "Kết quả",
  "result.estimated": "Điểm ước tính",
  "result.sections": "Điểm theo phần",
  "result.review": "Câu sai cần xem lại",
  "profile.title": "Hồ sơ",
  "profile.history": "Lịch sử thi thử",
  "profile.settings": "Cài đặt",
  "profile.logout": "Đăng xuất",
};

const EN: Record<string, string> = {
  "nav.home": "Home",
  "nav.learn": "Learn",
  "nav.test": "Mock test",
  "nav.kanji": "Kanji",
  "nav.profile": "Profile",
  "nav.main": "Main navigation",
  "furigana.on": "On",
  "furigana.off": "Off",
  "lang.label": "Language",
  "brand.tagline": "Learn and practise for the JLPT",
  "auth.signIn": "Sign in",
  "auth.signUp": "Sign up",
  "auth.welcome": "Welcome",
  "auth.chooseLevel": "Choose a level",
  "home.continue": "Continue learning",
  "home.review": "Review",
  "home.latestAttempt": "Latest mock test",
  "home.todayGoal": "Today's goal",
  "home.week": "This week",
  "learn.title": "N5 path",
  "learn.tools": "Study tools",
  "learn.tab.vocab": "Vocabulary",
  "learn.tab.grammar": "Grammar",
  "learn.tab.reading": "Reading",
  "kanji.title": "Kanji handbook",
  "test.title": "Mock test",
  "test.lobby": "Choose a test",
  "result.title": "Result",
  "result.estimated": "Estimated score",
  "result.sections": "Score by section",
  "result.review": "Questions to review",
  "profile.title": "Profile",
  "profile.history": "Mock test history",
  "profile.settings": "Settings",
  "profile.logout": "Sign out",
};

export function translate(locale: Locale, key: string): string {
  return (locale === "en" ? EN[key] : undefined) ?? VI[key] ?? key;
}

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType>({ locale: "vi", setLocale: () => {} });

const STORAGE_KEY = "jlpt.locale";

export function LocaleProvider({ children, initial }: { children: React.ReactNode; initial?: Locale }) {
  const stored = useStoredValue(STORAGE_KEY);
  const locale: Locale = stored === "vi" || stored === "en" ? stored : initial ?? "vi";

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => writeStoredValue(STORAGE_KEY, l);

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT(): (key: string) => string {
  const { locale } = useLocale();
  return (key: string) => translate(locale, key);
}
