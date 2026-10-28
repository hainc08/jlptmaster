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
        badge: "3 bài N5",
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
        badge: "8 đến hạn",
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
      {
        id: "doc-hieu",
        label: "Đọc hiểu",
        description: "Đoạn văn ngắn và trung bình chuẩn cấu trúc JLPT",
        href: "/practice?type=READING",
        icon: BookOpen,
      },
      {
        id: "nghe-hieu",
        label: "Nghe hiểu",
        description: "Luyện phản xạ nghe hội thoại kèm lời thoại",
        href: "/practice?type=LISTENING",
        icon: Headphones,
      },
      {
        id: "on-cau-sai",
        label: "Ôn câu sai",
        description: "Tổng hợp các câu trả lời sai cần khắc phục",
        href: "/practice?filter=mistakes",
        badge: "5 câu",
        icon: RotateCcw,
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
      {
        id: "lich-su-thi",
        label: "Lịch sử thi",
        description: "Danh sách các lượt thi đã hoàn thành và đang lưu",
        href: "/mock-exams?tab=history",
        icon: History,
      },
      {
        id: "ket-qua",
        label: "Kết quả",
        description: "Phân tích điểm số 0–180 và chẩn đoán kỹ năng yếu",
        href: "/results/att-01",
        icon: Award,
      },
    ],
  },
  {
    id: "tien-do",
    label: "Tiến độ",
    href: "/dashboard#progress",
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
        label: "Thống kê",
        description: "Biểu đồ tỷ lệ chính xác theo Từ vựng, Ngữ pháp, Đọc, Nghe",
        href: "/results/att-01",
        icon: BarChart3,
      },
      {
        id: "thanh-tich",
        label: "Thành tích",
        description: "Các cột mốc chinh phục lộ trình JLPT N5–N1",
        href: "/dashboard#achievements",
        icon: Trophy,
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

