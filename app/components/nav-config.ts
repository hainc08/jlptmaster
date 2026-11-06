import React from "react";
import {
  Home,
  BookOpen,
  Target,
  FileCheck2,
  TrendingUp,
  Compass,
  BookMarked,
  Languages,
  FileText,
  Layers,
  Headphones,
  RotateCcw,
  History,
  Award,
  BarChart3,
  Trophy,
} from "lucide-react";

/** Admin CMS screens render their own shell, so the learner header and bottom nav are hidden there. */
export function isCmsPath(pathname: string): boolean {
  return /^\/admin\/(dashboard|members|levels|settings|audit)(\/|$)/.test(pathname);
}

/**
 * Where to send a user after signing in. ADMIN/OWNER keep the existing admin home; SUPPORT/EDITOR
 * use the new console only. Redirects must be same-site paths and never grant access to /admin.
 */
export function postLoginTarget(role: string, redirect: string | null): string {
  const safe = redirect && /^\/(?!\/)/.test(redirect) ? redirect : null;
  const fullAdmin = role === "ADMIN" || role === "OWNER";
  const consoleOnly = role === "SUPPORT" || role === "EDITOR";
  const home = fullAdmin ? "/admin" : consoleOnly ? "/admin/dashboard" : "/dashboard";
  if (!safe) return home;
  if (!safe.startsWith("/admin")) return safe;
  if (fullAdmin) return safe;
  if (consoleOnly && isCmsPath(safe)) return safe;
  return home;
}

export type TabId = "home" | "learn" | "test" | "kanji" | "profile";

/** Learner navigation: bottom bar below 1024px, sidebar at ≥1024px. */
export const LEARNER_TABS: { id: TabId; labelKey: string; href: string }[] = [
  { id: "home", labelKey: "nav.home", href: "/dashboard" },
  { id: "learn", labelKey: "nav.learn", href: "/learn/n5" },
  { id: "test", labelKey: "nav.test", href: "/mock-exams" },
  { id: "kanji", labelKey: "nav.kanji", href: "/kanji" },
  { id: "profile", labelKey: "nav.profile", href: "/profile" },
];

const under = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(base + "/");

export function getActiveTab(pathname: string): TabId | null {
  if (under(pathname, "/dashboard")) return "home";
  if (["/learn", "/vocabulary", "/grammar", "/flashcards", "/practice"].some((b) => under(pathname, b))) {
    return "learn";
  }
  if (under(pathname, "/mock-exams") || under(pathname, "/results")) return "test";
  if (under(pathname, "/kanji")) return "kanji";
  if (under(pathname, "/profile")) return "profile";
  return null;
}

/** Lesson and exam screens hide the tab bar and sidebar. */
export function isFocusPath(pathname: string): boolean {
  return /^\/learn\/n5\/[^/]+\/?$/.test(pathname) || /^\/mock-exams\/[^/]+\/?$/.test(pathname);
}

/** The furigana switch only appears on screens that show Japanese text. */
export function showsFurigana(pathname: string): boolean {
  const tab = getActiveTab(pathname);
  return tab === "learn" || tab === "kanji" || tab === "test";
}

export type UserRole = "student" | "guest" | "admin";
export type SectionId = "trang-chu" | "hoc-tap" | "luyen-tap" | "thi-thu" | "tien-do";

export interface SubNavItem {
  id: string;
  label: string;
  description: string;
  href: string;
  badge?: string;
  icon: React.ElementType;
}

export interface NavSection {
  id: SectionId;
  label: string;
  href: string;
  icon: React.ElementType;
  subItems?: SubNavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "trang-chu",
    label: "Trang chủ",
    href: "/dashboard",
    icon: Home,
  },
  {
    id: "hoc-tap",
    label: "Học tập",
    href: "/learn/n5",
    icon: BookOpen,
    subItems: [
      {
        id: "lo-trinh",
        label: "Lộ trình học",
        description: "Giáo trình N5 theo từng bài học có cấu trúc",
        href: "/learn/n5",
        icon: Compass,
      },
      {
        id: "tu-vung",
        label: "Từ vựng",
        description: "Sổ tay từ vựng kèm âm thanh và ví dụ thực tế",
        href: "/vocabulary",
        icon: BookMarked,
      },
      {
        id: "kanji",
        label: "Kanji",
        description: "Chữ Hán N5, âm On/Kun, Hán-Việt và số nét",
        href: "/kanji",
        icon: Languages,
      },
      {
        id: "ngu-phap",
        label: "Ngữ pháp",
        description: "Mẫu câu, quy tắc chia thể và ngữ cảnh sử dụng",
        href: "/grammar",
        icon: FileText,
      },
      {
        id: "flashcard-srs",
        label: "Flashcard SRS",
        description: "Ôn tập ngắt quãng 4 mức độ ghi nhớ dài hạn",
        href: "/flashcards",
        icon: Layers,
      },
    ],
  },
  {
    id: "luyen-tap",
    label: "Luyện tập",
    href: "/practice",
    icon: Target,
    subItems: [
      {
        id: "trac-nghiem",
        label: "Trắc nghiệm",
        description: "Luyện câu hỏi theo kỹ năng, giải thích tức thì",
        href: "/practice",
        icon: Target,
      },
    ],
  },
  {
    id: "thi-thu",
    label: "Thi thử",
    href: "/mock-exams",
    icon: FileCheck2,
    subItems: [
      {
        id: "danh-sach-de",
        label: "Danh sách đề",
        description: "Phòng thi mô phỏng bấm giờ 3 phần chuẩn JLPT",
        href: "/mock-exams",
        badge: "N5",
        icon: FileCheck2,
      },
    ],
  },
  {
    id: "tien-do",
    label: "Tiến độ",
    href: "/dashboard",
    icon: TrendingUp,
    subItems: [
      {
        id: "tong-quan",
        label: "Tổng quan",
        description: "Chuỗi ngày học liên tiếp (Streak) và mục tiêu ngày",
        href: "/dashboard",
        icon: TrendingUp,
      },
      {
        id: "thong-ke",
        label: "Lộ trình ôn tập",
        description: "Kỹ năng còn yếu rút ra từ các bài thi thử của bạn",
        href: "/dashboard#roadmap",
        icon: BarChart3,
      },
    ],
  },
];

export const JLPT_LEVELS = [
  { code: "N5", name: "Sơ cấp 1 (Nhập môn)", active: true, statusText: "Đang học" },
  { code: "N4", name: "Sơ cấp 2", active: false, statusText: "Sắp ra mắt" },
  { code: "N3", name: "Trung cấp", active: false, statusText: "Sắp ra mắt" },
  { code: "N2", name: "Trung - Cao cấp", active: false, statusText: "Sắp ra mắt" },
  { code: "N1", name: "Cao cấp", active: false, statusText: "Sắp ra mắt" },
];

export function getActiveSectionFromPathname(pathname: string): SectionId {
  if (
    pathname.startsWith("/learn") ||
    pathname.startsWith("/vocabulary") ||
    pathname.startsWith("/kanji") ||
    pathname.startsWith("/grammar") ||
    pathname.startsWith("/flashcards")
  ) {
    return "hoc-tap";
  }
  if (
    pathname.startsWith("/practice") ||
    pathname.startsWith("/reading") ||
    pathname.startsWith("/listening")
  ) {
    return "luyen-tap";
  }
  if (pathname.startsWith("/mock-exams") || pathname.startsWith("/results")) {
    return "thi-thu";
  }
  if (pathname.startsWith("/progress")) {
    return "tien-do";
  }
  return "trang-chu";
}

