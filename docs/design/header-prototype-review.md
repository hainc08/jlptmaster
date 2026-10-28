# JLPT Master — Header & Navigation Prototype Review & Implementation Checklist

**Document:** `docs/design/header-prototype-review.md`  
**Phase:** Phase 4 & Phase 5 — Interactive Prototype & Visual Verification (`ui-ux-designer` / `prototype-builder`)  
**Prototype Route:** `/prototype/header-nav` ([app/prototype/header-nav/page.tsx](file:///d:/100.JLPT/00.web_app/app/prototype/header-nav/page.tsx))  
**Status:** **APPROVED BY OWNER (`"Tôi duyệt thiết kế header"`) — Implemented via TDD (RED → GREEN → REFACTOR)**  
**Date:** 2026-10-28  

---

## 1. Visual Verification Summary (Playwright Browser Audit)

The isolated interactive prototype at `/prototype/header-nav` was tested and compared side-by-side against the live website (`https://jlpt.manabihub.me/mock-exams`) across all 4 target viewport widths (`375px`, `768px`, `1280px`, `1440px`).

### 1.1 Viewport & Interaction Matrix

| Viewport | Scenario Verified | Screenshot File | Verification Result |
|---|---|---|---|
| **1440px** (Desktop) | Current Live Website (`/mock-exams`) | `docs/design/screenshots/live-mock-exams-desktop-1440.png` | Baseline audit: 7 flat links, exposed Admin, global Furigana toggle, missing Practice/Kanji/Progress. |
| **375px** (Mobile) | Current Live Website (`/mock-exams`) | `docs/design/screenshots/live-mock-exams-mobile-375.png` | Baseline audit: Redundant top hamburger + mismatched 5-item bottom bar. |
| **1440px** (Desktop) | Redesigned Header — Student Default (`Thi thử` active) | `docs/design/screenshots/proto-desktop-1440-student.png` | **PASS** — Clean 3-zone balance (Brand+Level left, 5 Pillars center, Notifications+Avatar right). Contextual Furigana bar in content area. |
| **1440px** (Desktop) | Dropdown Menu — `2. Học tập` Open | `docs/design/screenshots/proto-desktop-1440-dropdown-hoctap.png` | **PASS** — Displays `Lộ trình học`, `Từ vựng`, `Kanji`, `Ngữ pháp`, `Flashcard SRS` with icons, badges, and helper descriptions. |
| **1440px** (Desktop) | JLPT Level Selector (`N5–N1`) Open | `docs/design/screenshots/proto-desktop-1440-level-selector.png` | **PASS** — Shows `N5` active (`Đang học`) and `N4–N1` locked (`Sắp ra mắt`). |
| **1280px** (Laptop) | Guest Role State (`?role=guest`) | `docs/design/screenshots/proto-desktop-1280-guest.png` | **PASS** — Shows `Đăng nhập` & `Đăng ký` CTAs (`44px` height); `Admin` and `Notifications` strictly hidden. |
| **1280px** (Laptop) | Admin Role State (`?role=admin`) | `docs/design/screenshots/proto-desktop-1280-admin.png` | **PASS** — Shows `Quản trị CMS` pill and Admin account menu option. |
| **768px** (Tablet) | Tablet Breakpoint + `3. Luyện tập` Dropdown | `docs/design/screenshots/proto-tablet-768.png` | **PASS** — Zero text wrapping or overflow; hides brand subtitle until `1280px` (`xl:`) to preserve horizontal breathing room. |
| **375px** (Mobile) | Compact Top Bar + 5-Item Fixed Bottom Nav | `docs/design/screenshots/proto-mobile-375.png` | **PASS** — Top bar (`56px`) holds Brand + Level Selector + Bell + Avatar; Fixed Bottom Nav holds 5 primary pillars with `48px` touch targets. |
| **375px** (Mobile) | Mobile Bottom Sheet (`2. Học tập`) | `docs/design/screenshots/proto-mobile-375-sheet.png` | **PASS** — Tapping `Học tập` opens a clean modal bottom sheet with `52px`-tall touch rows for all 5 sub-modules. |

---

## 2. Accessibility & Keyboard Audit Results

1. **Keyboard Navigation (`Tab`, `Enter`, `ArrowDown`, `Escape`):**
   - Verified via automated Playwright keyboard events: pressing `Escape` immediately closes open dropdowns (`✔ Keyboard Escape closes dropdown: true`).
   - Pressing `ArrowDown` on any primary section button opens its dropdown menu.
   - All interactive triggers include `focus-visible:ring-2 focus-visible:ring-[#B9343F] focus-visible:ring-offset-2`.
2. **Touch Target Ergonomics (WCAG 2.2 AA):**
   - Desktop nav buttons, Level Selector, Notification Bell (`44×44px`), and Login/Register CTAs enforce `min-h-[44px]`.
   - Mobile Bottom Navigation buttons measured at **`48px` height** (`>= 44px` required).
   - Mobile Bottom Sheet sub-items measured at **`52px` height** with `6px` vertical separation.
3. **ARIA Semantics:**
   - Primary navigation uses `<nav aria-label="Điều hướng chính">` and `<nav aria-label="Điều hướng di động">`.
   - Active pillar and active sub-route expose `aria-current="page"`.
   - Dropdown triggers expose `aria-expanded` and `aria-haspopup="true"`.

---

## 3. Side-by-Side Comparison: Current Live UI vs. Redesigned Prototype

| Criterion | Current Website (`https://jlpt.manabihub.me/mock-exams`) | Redesigned Prototype (`/prototype/header-nav`) |
|---|---|---|
| **Top-Level Items** | 7 flat links (crowded, missing Practice/Kanji/Progress) | **5 structured pillars** (`Trang chủ`, `Học tập`, `Luyện tập`, `Thi thử`, `Tiến độ`) |
| **Sub-Navigation** | None (all flat) | Accessible dropdowns (Desktop) & Bottom Sheet (Mobile) + Contextual Sub-Nav Pill Bar |
| **JLPT Level Control** | Static `"N5 Sẵn sàng"` badge | Interactive **JLPT Level Selector (`N5`–`N1`)** |
| **Furigana Toggle** | Cluttered in global header on every page | Moved to **Contextual Learning Toolbar** inside study screens |
| **Admin Link Security** | Exposed to all guests & students | Strictly hidden unless `user.role === "ADMIN"` |
| **Guest vs. Student UI** | Always shows `"Đăng nhập"` button | Role-aware: Guest sees `Đăng nhập`/`Đăng ký`; Student sees `Bell` + `Avatar Menu` |
| **768px Tablet Fit** | Cramped / wraps onto 2 lines | Fits cleanly on a single 64px row |

---

## 4. Implementation TODO Checklist (Post-Approval TDD Plan)

> [!IMPORTANT]
> **DO NOT EXECUTE UNTIL OWNER APPROVAL (`"Tôi duyệt thiết kế header"`)**

Once approved in writing by the Owner, execute the production migration in the following TDD slices (`RED` $\rightarrow$ `GREEN` $\rightarrow$ `REFACTOR`):

- [x] **TODO-01 (TDD RED — Navigation Unit & Component Tests):**
  - Created [tests/components/HeaderNavigation.test.tsx](file:///d:/100.JLPT/00.web_app/tests/components/HeaderNavigation.test.tsx) testing all 5 primary sections, dropdown menu opening/closing (`Click`, `Escape`), role-based visibility (`GUEST`, `STUDENT`, `ADMIN`), JLPT Level Selector (`N5–N1`), `BottomNav` + Bottom Sheet, and `LearningToolbar`.
- [x] **TODO-02 (TDD GREEN — Production Header & BottomNav Components):**
  - Created [app/components/nav-config.ts](file:///d:/100.JLPT/00.web_app/app/components/nav-config.ts) defining the 5 pillars, sub-items, and route matchers.
  - Updated [app/components/Navbar.tsx](file:///d:/100.JLPT/00.web_app/app/components/Navbar.tsx) and [app/components/BottomNav.tsx](file:///d:/100.JLPT/00.web_app/app/components/BottomNav.tsx) with the approved design.
- [x] **TODO-03 (TDD GREEN — Contextual Learning Toolbar for Furigana):**
  - Created [app/components/LearningToolbar.tsx](file:///d:/100.JLPT/00.web_app/app/components/LearningToolbar.tsx) and integrated it into `/vocabulary`, `/grammar`, and `/learn/n5/[lessonSlug]`.
- [x] **TODO-04 (TDD REFACTOR & E2E Regression):**
  - Verified **43/43 tests passing across 13 test suites** (`npm test`) and **0 TypeScript errors** (`npm run typecheck`).

