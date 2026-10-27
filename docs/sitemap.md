# JLPT Master — Information Architecture & Sitemap

**Document:** `docs/sitemap.md`  
**Phase:** 2 — UI/UX Design (`ui-ux-designer`)  
**Status:** Under Review (Gate Approval Required)  

---

## 1. Information Architecture Overview

The JLPT Master application is organized into four distinct access tiers:
1. **Public Zone:** Accessible to all visitors without authentication. Optimized for SEO, course previews, and marketing conversion.
2. **Guest Auth Zone:** Accessible only to unauthenticated visitors. Validated credential login, registration, and password recovery.
3. **Student Learner Zone (Authenticated):** Restricted to authenticated users with the `STUDENT` role. Features personalized onboarding, curriculum navigation, practice engine, SRS flashcards, mock exams, and analytics.
4. **Admin / Editorial Zone (Authorized):** Restricted to `ADMIN` and `EDITOR` roles. Contains content authoring, question banks, CSV batch ingestion, media asset licensing, and audit trail logs.

---

## 2. Route Hierarchy & Access Matrix

| Route Path | Access Tier | Page Title (VI) | Layout Structure | Key Interactive Components | Responsive Behavior |
|---|---|---|---|---|---|
| `/` | Public | JLPT Master — Luyện thi JLPT N5–N1 thông minh | Public Header + Footer | Hero CTA, Roadmap Preview, Interactive Kana Teaser | Full responsive, collapsible mobile menu |
| `/login` | Guest | Đăng nhập — JLPT Master | Minimal Centered Card | AuthForm, Social/OAuth button placeholders | Full width on 375px, centered 420px on desktop |
| `/register` | Guest | Đăng ký tài khoản | Minimal Centered Card | RegisterForm, Password strength meter | Full width on 375px, centered 420px on desktop |
| `/forgot-password` | Guest | Khôi phục mật khẩu | Minimal Centered Card | PasswordResetRequestForm | Full width on 375px, centered 420px on desktop |
| `/onboarding` | Student (New) | Thiết lập lộ trình học | Wizard Stepper Layout | LevelSelector (N5 active, N4-N1 disabled), DailyGoalSlider | Card stack on mobile, step grid on desktop |
| `/dashboard` | Student | Bảng điều khiển học tập | App Shell (Sidebar/BottomNav) | StreakWidget, ResumeLessonCard, DueSrsBadge, QuickExamCTA | Sticky bottom tab bar (mobile), Left sidebar (desktop) |
| `/learn` | Student | Lộ trình khóa học | App Shell | LevelTabs, CourseList (N5 Active, others 'Sắp ra mắt') | Single column card list (mobile), 3-col grid (desktop) |
| `/learn/n5` | Student | Khóa học N5 Toàn diện | App Shell | LessonRoadmapTree, ModuleChecklist, KanaModuleCTA | Vertical timeline roadmap with status badges |
| `/learn/n5/[lessonSlug]` | Student | Chi tiết bài học: [Tên bài] | App Shell + Sticky Lesson Nav | TheoryViewer, FuriganaToggle, VocabTable, GrammarCards, PracticeCTA | Tabbed sections on mobile, split sidebar on desktop |
| `/vocabulary` | Student | Sổ tay Từ vựng N5 | App Shell + Search Header | SearchBar, FuriganaDisplay, AudioPronounceBtn, TagFilters | Sticky search header, infinite scroll list |
| `/vocabulary/[slug]` | Student | Chi tiết từ vựng: [Từ] | App Shell | WordCard, PitchAccentViewer, ExampleSentences, AddToDeckBtn | Centered card on desktop, full-width on mobile |
| `/kanji` | Student | Bảng tra cứu chữ Hán N5 | App Shell + Filter Bar | KanjiGrid, RadicalFilter, StrokeCountSelector | 4-col grid on mobile, 8-col grid on desktop |
| `/kanji/[slug]` | Student | Chữ Hán: [Chữ] | App Shell | KanjiDetailCard, StrokeOrderAnimator, OnyomiKunyomiTable | Stacked layout on mobile, side-by-side on desktop |
| `/grammar` | Student | Sổ tay Ngữ pháp N5 | App Shell + Search Header | GrammarList, FormationRuleBox, NuanceCallout | Card list with collapsible detail accordions |
| `/grammar/[slug]` | Student | Cấu trúc: [Mẫu ngữ pháp] | App Shell | GrammarDetailCard, ExampleSentenceList, RelatedPracticeBtn | Stacked layout on mobile, side-by-side on desktop |
| `/flashcards` | Student | Ôn tập thẻ nhớ (SRS) | Minimal Distraction-Free Shell | FlashcardDeck, 3D FlipCard, 4-Grade Recall Buttons, HotkeyListener | Swipe/Tap on mobile, Keyboard shortcuts (1-4, Space) on desktop |
| `/practice` | Student | Luyện tập câu hỏi N5 | Minimal Practice Shell | SkillFilter, QuestionCard, OptionList, ExplanationDrawer | Sticky bottom submit button, instant explanation reveal |
| `/reading` | Student | Luyện đọc hiểu N5 | App Shell | PassageCatalog, DifficultyBadge, TopicFilter | Card grid with estimated reading time |
| `/reading/[id]` | Student | Bài đọc: [Tiêu đề] | Split Reading Shell | PassageTextPane, FuriganaToggle, SubQuestionNavigator | Stacked (passage top, questions bottom) on mobile, split-screen on desktop |
| `/listening` | Student | Luyện nghe hiểu N5 | App Shell | AudioCatalog, TrackCard, DurationBadge | Single column audio exercise cards |
| `/listening/[id]` | Student | Bài nghe: [Tiêu đề] | Audio Focus Shell | AudioPlayerBar, QuestionChoices, TranscriptDrawer | Sticky audio player at bottom on mobile |
| `/mock-exams` | Student | Phòng thi thử JLPT N5 | App Shell | MockExamCatalog, SectionTimeBreakdown, PastAttemptsTable | List of exam papers with start button and status |
| `/mock-exams/[attemptId]`| Owner Only | Đang làm bài thi thử: [Mã đề] | Fullscreen Locked Exam Shell | StickySectionTimer, QuestionPalette, QuestionSheet, AutosaveIndicator | Bottom question drawer on mobile, right question matrix on desktop |
| `/results/[attemptId]` | Owner Only | Kết quả bài thi thử | App Shell | MockScoreBadge, SectionScoreBars, ItemReviewList, RemedialTags | Visual score circle, question breakdown accordion |
| `/progress` | Student | Thống kê tiến độ & Kỹ năng | App Shell | MasteryRadarChart, RetentionCurve, WeakTagList | Responsive charts using SVG/Canvas |
| `/settings` | Student | Cài đặt tài khoản | App Shell | ProfileForm, DailyGoalPicker, TimezoneSelector, ChangePasswordForm | Form layout with sticky save action |
| `/admin` | Admin/Editor | Quản trị hệ thống & Nội dung | Admin Shell (Top Nav + Admin Sidebar) | MetricSummaryCards, PendingReviewQueue, QuickActionToolbar | Collapsible admin sidebar on desktop |
| `/admin/content` | Admin/Editor | Quản lý Nội dung học tập | Admin Shell | ContentDataTable, StatusFilter (Draft/Review/Published), BatchActionToolbar | Responsive data table with horizontal scrolling |
| `/admin/content/new` | Admin/Editor | Soạn thảo nội dung mới | Admin Shell | MultiTabContentEditor, JapanesePreviewPane, AudioUploader | Two-column live preview editor on desktop |
| `/admin/content/import`| Admin/Editor | Nhập dữ liệu hàng loạt (CSV) | Admin Shell | CsvDropzone, DryRunPreviewTable, ErrorReportAccordion | Tabular preview with sticky commit bar |
| `/admin/questions` | Admin/Editor | Ngân hàng câu hỏi | Admin Shell | QuestionFilterBar, QuestionTypeBadge, QuestionPreviewModal | Data table with pagination and bulk publish |
| `/admin/exams` | Admin | Quản lý Đề thi thử | Admin Shell | ExamBuilder, SectionTimingConfigurator, QuestionOrderManager | Drag-and-drop question ordering interface |
| `/admin/media` | Admin/Editor | Thư viện tệp âm thanh & ảnh | Admin Shell | MediaGrid, AudioWaveformPreview, LicenseAttributionModal | Media thumbnail grid with file details drawer |
| `/admin/audit` | Admin Only | Nhật ký thao tác hệ thống | Admin Shell | AuditLogTable, JsonMetadataViewer, ActorFilter | Paginated monospace log viewer with search |

---

## 3. Global Navigation Blueprint

### 3.1 Mobile Viewport (<768px)
- **Top Bar:** Brand Logo (`JLPT Master`), Notification Bell, Avatar / Profile link.
- **Sticky Bottom Navigation Bar (4 Primary Tabs):**
  1. `Trang chủ` (`/dashboard`) — Icon: Home
  2. `Học tập` (`/learn/n5`) — Icon: BookOpen
  3. `Luyện thi` (`/practice` & `/mock-exams`) — Icon: Target / CheckCircle2
  4. `Tiến độ` (`/progress`) — Icon: TrendingUp
- **Exam Mode Overrides:** During active mock exams (`/mock-exams/[attemptId]`), all navigation bars are hidden to prevent accidental navigation away from the timed session.

### 3.2 Desktop Viewport (≥1024px)
- **Collapsible Left Sidebar (Width: 260px):**
  - Brand Header with JLPT Master seal.
  - Section 1: **Tổng quan** (Bảng điều khiển, Tiến độ của tôi).
  - Section 2: **Học tập N5** (Lộ trình N5, Bảng chữ cái, Từ vựng, Chữ Hán, Ngữ pháp).
  - Section 3: **Luyện tập & Thi thử** (Ôn tập Flashcards, Bài tập thực hành, Đọc hiểu, Nghe hiểu, Đề thi thử N5).
  - Section 4: **Tài khoản** (Cài đặt cá nhân, Trợ giúp, Đăng xuất).
- **Admin Switcher:** If user role is `ADMIN` or `EDITOR`, an "Admin Workspace" button appears in the sidebar footer.
