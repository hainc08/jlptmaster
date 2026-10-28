# JLPT Master — Header & Navigation UX Audit

**Document:** `docs/design/header-ux-audit.md`  
**Phase:** Phase 1 — UX Audit (`ui-ux-designer`)  
**Audited URL:** `https://jlpt.manabihub.me/mock-exams`  
**Audited Source Files:** [app/components/Navbar.tsx](file:///d:/100.JLPT/00.web_app/app/components/Navbar.tsx), [app/components/BottomNav.tsx](file:///d:/100.JLPT/00.web_app/app/components/BottomNav.tsx), [app/layout.tsx](file:///d:/100.JLPT/00.web_app/app/layout.tsx)  
**Date:** 2026-10-28  

---

## 1. Executive Summary

An end-to-end UX and code audit of the current JLPT Master navigation on `https://jlpt.manabihub.me/mock-exams` reveals **8 structural usability, information architecture, and accessibility issues**. While the visual palette (`#B9343F` Japanese Vermilion on `#F7F7F4` warm paper) is strong, the current navigation flattens all features into a single ungrouped bar, leaks Admin links to guests/students, lacks a JLPT Level Switcher, and breaks down at tablet/laptop breakpoints (`768px–1100px`).

---

## 2. Detailed UX Findings

### 2.1 Navigation Hierarchy & Menu Overcrowding (Severity: HIGH)
- **Flat, Ungrouped Links:** [Navbar.tsx](file:///d:/100.JLPT/00.web_app/app/components/Navbar.tsx#L68-L126) places 7 heterogeneous links (`Bảng điều khiển`, `Khóa học N5`, `Từ vựng`, `Ngữ pháp`, `Thẻ nhớ SRS`, `Thi thử N5`, `Admin`) on the same hierarchy level.
- **Missing Core P0 Modules:** Because the horizontal bar ran out of space, essential student destinations from `SPEC.md` are **completely unreachable** from the desktop header:
  - `/practice` (Luyện tập trắc nghiệm) — missing on desktop!
  - `/kanji` (Chữ Hán N5) — missing on both desktop and mobile!
  - `/reading` (Đọc hiểu) & `/listening` (Nghe hiểu) — missing!
  - `/progress` (Tiến độ & Thống kê) — missing!
- **Breakpoint Collision at `768px–1024px`:** At `768px` (`md:` breakpoint), the logo + subtitle + `"N5 Sẵn sàng"` badge + 7 nav links + `"Furigana: BẬT"` + `"Đăng nhập"` exceed 1000px of intrinsic width, causing text wrapping and cramped 4px gaps.

### 2.2 Incoherent User Journeys Across Desktop & Mobile (Severity: HIGH)
- **Three Different Mental Models:**
  1. **Desktop Top Bar:** 7 items (omits `Luyện tập` and `Tiến độ`).
  2. **Mobile Top Hamburger Drawer:** 8 vertical links (includes `Luyện tập`, omits `Tiến độ` and `Kanji`).
  3. **Mobile Bottom Tab Bar ([BottomNav.tsx](file:///d:/100.JLPT/00.web_app/app/components/BottomNav.tsx#L16-L22)):** 5 items (`Trang chủ`, `Học N5`, `Luyện tập`, `Thẻ nhớ`, `Thi thử`) — omits `Tiến độ` and duplicates `Thẻ nhớ` alongside `Học N5`.
- **Dual Mobile Navigation Conflict:** On mobile (`375px`), users see **both** a top-right Hamburger Menu button and a fixed Bottom Navigation Bar with overlapping items, creating cognitive friction about where secondary features live.

### 2.3 Guest vs. Authenticated vs. Admin State Confusion (Severity: CRITICAL)
- **Unconditional Admin Exposure:** [Navbar.tsx](file:///d:/100.JLPT/00.web_app/app/components/Navbar.tsx#L117-L125) renders the `<Shield /> Admin` link to **every visitor** regardless of role (`GUEST`, `STUDENT`, or `ADMIN`). In an educational product, exposing CMS links to learners breaks trust and clutters the primary bar.
- **Static "Đăng nhập" Button on Student Screens:** Even when a learner is actively studying on `/dashboard` or `/mock-exams`, the header displays a static `Đăng nhập` button instead of an authenticated state (Notification bell, Study streak/level indicator, and User Avatar dropdown with `Hồ sơ`, `Cài đặt`, `Đăng xuất`).

### 2.4 Static Level Badge Instead of JLPT Level Selector (Severity: MEDIUM)
- Currently, the header renders a static badge: `<span className="...">N5 Sẵn sàng</span>`.
- Learners have no way to view the 5-level JLPT roadmap (`N5`–`N1`) or switch levels from the header. A dedicated **JLPT Level Selector (`N5` active, `N4–N1` labeled "Sắp ra mắt")** is needed in the header utility zone.

### 2.5 Global Furigana Toggle Misplacement (Severity: MEDIUM)
- The `振 Furigana: BẬT` toggle is permanently pinned to the global header ([Navbar.tsx](file:///d:/100.JLPT/00.web_app/app/components/Navbar.tsx#L130-L142)).
- On non-reading screens (`/mock-exams` catalog, `/dashboard`, `/progress`, `/admin`), the button has zero effect on the page content, confusing users when they click it and nothing changes.
- **Solution:** Move the Furigana toggle out of the global header and into a **Contextual Learning Toolbar** inside learning/reading interfaces (`/learn/*`, `/vocabulary`, `/kanji`, `/grammar`, `/flashcards`).

### 2.6 Active States & Accessibility Deficiencies (Severity: HIGH)
- **Broken Active State on Sub-routes:** Only `/learn` and `/admin` use `pathname.startsWith(...)`. All other links use strict `pathname === "..."`. Viewing exam results (`/results/[attemptId]`) or sub-pages leaves the `Thi thử` and `Học tập` tabs visually inactive.
- **Touch Target Violations (<44×44px):** Action controls in the header (`px-2.5 py-1.5 text-xs` $\approx 28\text{px}$ height) and mobile hamburger button (`p-2` $\approx 36\text{px}$) fail the **44×44px minimum touch target** requirement in `SPEC.md` Section 4.1.
- **ARIA & Keyboard Navigation Gaps:** No `aria-current="page"` on active links, no keyboard `Escape` handler to close the mobile menu, and no focus ring standardization (`focus-visible:ring-2`).

---

## 3. Visual Evidence (Current Live UI vs. Redesigned Prototype)

### 3.1 Live Website (`https://jlpt.manabihub.me/mock-exams`)
- **Desktop (1440×900):** Crowded 7-item flat bar, exposed `Admin` link, global `Furigana: BẬT` button, static `Đăng nhập` button, missing `Luyện tập` & `Tiến độ`.
  - Screenshot: `docs/design/screenshots/live-mock-exams-desktop-1440.png`
- **Mobile (375×812):** Redundant top hamburger menu + bottom 5-tab bar missing `Tiến độ`.
  - Screenshot: `docs/design/screenshots/live-mock-exams-mobile-375.png`

---

## 4. Summary of Required Changes for Phase 2–4

| Problem Area | Current Implementation | Proposed Redesign |
|---|---|---|
| **Primary IA** | 7 flat ungrouped links (missing Practice, Kanji, Progress) | **5 Primary Sections** (`Trang chủ`, `Học tập`, `Luyện tập`, `Thi thử`, `Tiến độ`) with structured dropdowns |
| **Level Selection** | Static `"N5 Sẵn sàng"` pill | Interactive **JLPT Level Selector (`N5`–`N1`)** with status badges |
| **Furigana Toggle** | Pinned in global header on all pages | Moved to **Contextual Learning Bar** inside study screens |
| **Auth / Role UI** | Always shows `Admin` + `Đăng nhập` | **Role-aware utility bar**: Guest (`Đăng nhập`/`Đăng ký`), Student (`Thông báo` + `Avatar Menu`), Admin (`Admin CMS` badge in menu/utility only for `ADMIN`) |
| **Mobile UX** | Hamburger menu + mismatched BottomNav | Compact top utility header + **5-item Fixed Bottom Nav** with bottom sheet for sub-navigation |
| **Accessibility** | ~28–36px targets, no ARIA menu states | **≥44×44px targets**, full keyboard navigation (`Tab`, `Enter`, `Escape`, `ArrowDown`), `aria-expanded`, `aria-current` |

