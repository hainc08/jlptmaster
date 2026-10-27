# JLPT Master — Design System & Visual Tokens

**Document:** `docs/design-system.md`  
**Phase:** 2 — UI/UX Design (`ui-ux-designer`)  
**Status:** Under Review (Gate Approval Required)  

---

## 1. Design Philosophy: "Tinh gọn & Chuẩn Nhật" (Zen Precision)

The JLPT Master visual identity combines the serene clarity of traditional Japanese editorial aesthetics (*Wabi-Sabi* meets modern Tokyo editorial) with the functional accessibility required by Vietnamese learners.
- **Intentionality:** Every element has a clear educational purpose. No superfluous decorative distractions.
- **Dual-Script Legibility:** Seamless coexistence of Vietnamese diacritics and Japanese kanji/kana without baseline clipping.
- **Calm Focus:** A warm paper canvas (`#F7F7F4`) reduces eye strain during 60-minute intensive study and exam sessions.
- **Clear Feedback:** Unambiguous color and shape feedback for correctness, progress, and review states.

---

## 2. Color Palette & Visual Tokens

```
========================================================================================
TOKEN NAME             HEX VALUE     HSL VALUE         USAGE DESCRIPTION
========================================================================================
--color-primary        #B9343F       hsl(355, 56%, 46%) Japanese Vermilion (Shuu-iro) - Brand CTA
--color-primary-hover  #A02731       hsl(355, 60%, 39%) Primary hover and active tap state
--color-primary-subtle #FBEBEB       hsl(355, 65%, 95%) Primary light surface / active tab
--color-secondary      #2B4C7E       hsl(216, 49%, 33%) Indigo Slate - Grammar & Theory accents
--color-canvas         #F7F7F4       hsl(60, 9%, 96%)   Warm Paper canvas background
--color-surface        #FFFFFF       hsl(0, 0%, 100%)   Card & Modal container background
--color-surface-hover  #F3F4F6       hsl(210, 14%, 96%) List item hover state
--color-text-main      #1F2937       hsl(217, 19%, 17%) Charcoal - High-contrast body text
--color-text-muted     #6B7280       hsl(220, 9%, 46%)  Subheadings, timestamps, secondary notes
--color-border         #E5E7EB       hsl(220, 13%, 91%) Subtle structural borders
--color-success-bg     #E8F3EC       hsl(140, 31%, 93%) Correct answer & mastered SRS cards
--color-success-text   #1E6B37       hsl(140, 56%, 27%) High-contrast green text/icons
--color-info-bg        #E7ECF8       hsl(221, 56%, 94%) Explanatory callouts & hint boxes
--color-info-text      #1D4ED8       hsl(224, 76%, 48%) Info text and links
--color-warning-bg     #FEF3C7       hsl(48, 96%, 89%)  Expiring timers, hard SRS cards
--color-warning-text   #B45309       hsl(38, 92%, 37%)  Warning alerts
--color-danger-bg      #FDE8E8       hsl(0, 75%, 95%)   Incorrect answers & again SRS cards
--color-danger-text    #991B1B       hsl(0, 70%, 35%)   Error messages & badges
========================================================================================
```

---

## 3. Typography & Dual-Script Standards

### 3.1 Typeface Selection
- **Vietnamese UI & Latin Body:** `Be Vietnam Pro` (Primary) with fallback to `Inter`, `system-ui`.
  - Supports all 134 Vietnamese accented characters with tailored diacritic positioning that prevents vertical line collision.
- **Japanese Character Set:** `Noto Sans JP` (Primary) with fallback to `Hiragino Sans`, `Yu Gothic`, sans-serif.
  - Ensures clean rendering of Kanji, Hiragana, and Katakana at both small reading sizes (12px) and large display sizes (48px).

### 3.2 Type Scale System
| Token | Size | Line Height | Weight | Typical Application |
|---|---|---|---|---|
| `text-xs` | 12px (0.75rem) | 16px (1.33) | 400 / 500 | Furigana `<rt>`, tags, timestamps |
| `text-sm` | 14px (0.875rem)| 20px (1.42) | 400 / 500 | Secondary text, options, button labels |
| `text-base` | 16px (1.00rem) | 24px (1.50) | 400 / 500 | Standard body paragraphs, explanations |
| `text-lg` | 18px (1.125rem)| 28px (1.55) | 500 / 600 | Question prompts, card headings |
| `text-xl` | 20px (1.25rem) | 28px (1.40) | 600 | Modal titles, section banners |
| `text-2xl` | 24px (1.50rem) | 32px (1.33) | 700 | Main page `<h1>` titles |
| `text-3xl` | 30px (1.875rem)| 38px (1.26) | 700 | Score display, module hero |
| `text-4xl` | 36px (2.25rem) | 44px (1.22) | 700 | Kanji display, flashcard front character |

### 3.3 Japanese Furigana / Ruby Display Specification
To ensure strict accessibility (FR-18) and avoid text-selection distortion:
```html
<ruby class="ruby-container font-japanese">
  漢字<rp>(</rp><rt class="text-xs text-primary font-normal">かんじ</rt><rp>)</rp>
</ruby>
```
- `<rt>` elements are styled with `font-size: 0.55em`, positioned centrally above the base character.
- The global layout includes a persistent **Furigana Toggle Switch** (`[ 振 ] Bật/Tắt Furigana`). When toggled OFF, `<rt>` elements receive `opacity: 0` or `display: none` according to user preference.
- Screen readers read the base character cleanly without stuttering over ruby annotations.

---

## 4. Spacing System, Radii & Elevations

### 4.1 Spacing Grid (8px Base System)
All layout margins, paddings, and component alignments strictly adhere to the 8px spatial grid:
- `space-1`: 4px (micro gaps between badge icon and label)
- `space-2`: 8px (gap between buttons, compact padding)
- `space-3`: 12px (card internal padding on mobile)
- `space-4`: 16px (standard card padding, list gap)
- `space-6`: 24px (section padding, form group gap)
- `space-8`: 32px (page margin on mobile, major module gap)
- `space-12`: 48px (page margin on desktop, hero vertical padding)

### 4.2 Corner Radii
- `rounded-sm`: 6px (Badges, tags, small inputs)
- `rounded-md`: 10px (Standard buttons, dropdown menus, textareas)
- `rounded-lg`: 14px (Cards, dialogs, question containers)
- `rounded-full`: 9999px (Avatars, pills, circular score indicators)

### 4.3 Depth & Elevation (Subtle & Clean)
- `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (Cards at rest)
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.08)` (Card hover, active dropdown)
- `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.10)` (Modals, sticky bottom bar)

---

## 5. Ergonomics & Touch Target Requirements

- **Minimum Hit Area:** Every interactive element (buttons, tabs, answer choices, checkboxes, audio play/pause) must have a touch target of at least **$44 \times 44\text{px}$** on mobile viewports.
- **Touch Separation:** A minimum gap of **8px** is enforced between adjacent interactive targets to prevent accidental mis-taps.
- **Focus Rings:** All interactive components include a prominent 2px focus ring with 2px offset (`ring-2 ring-primary ring-offset-2`) when navigated via keyboard.

---

## 6. Core Reusable Component Specifications

### 6.1 Buttons (`Button`)
- **Primary:** Background `--color-primary`, white text, subtle hover darkening. Used for "Bắt đầu học", "Nộp bài", "Xác nhận".
- **Secondary:** Background `--color-secondary`, white text. Used for "Xem giải thích", "Luyện tập".
- **Outline:** Transparent background, 1px border `--color-border`, text `--color-text-main`. Used for "Lật thẻ", "Lưu nháp".
- **Ghost:** Minimal hover tint, no border. Used for navigation icons and header links.
- **Recall Grade Buttons (SRS):**
  - *Again (Chưa nhớ):* Border and hover `--color-danger-text`, background `--color-danger-bg`.
  - *Hard (Khó nhớ):* Border and hover `--color-warning-text`, background `--color-warning-bg`.
  - *Good (Nhớ tốt):* Border and hover `--color-info-text`, background `--color-info-bg`.
  - *Easy (Rất dễ):* Border and hover `--color-success-text`, background `--color-success-bg`.

### 6.2 Question Containers (`QuestionCard`)
- Displays question number (e.g., `Câu 05 / 20`), question type badge (e.g., `Đọc chữ Hán`), and prompt with ruby text.
- 4 full-width clickable options with radio indicator.
- States: `DEFAULT` $\rightarrow$ `SELECTED` $\rightarrow$ `SUBMITTED_CORRECT` (green surface) / `SUBMITTED_INCORRECT` (red surface).
- Expandable bottom drawer reveals Vietnamese grammar analysis and vocabulary breakdown after submission.

### 6.3 Accessible Audio Player (`AudioPlayerBar`)
- Large 44x44px Play/Pause toggle with clear ARIA labels (`aria-label="Phát đoạn hội thoại"`).
- Playback speed dropdown: `0.8x` (chậm cho người mới) và `1.0x` (tốc độ thi chuẩn).
- Linear progress bar showing elapsed time and total duration (e.g., `00:18 / 00:45`).
- Secondary button: `Xem lời thoại (Transcript)` — disabled during active mock exam, enabled during practice/results review.

### 6.4 Flashcard Flip Component (`FlashcardDeck`)
- Perspective 1000px 3D card flip animation triggered by clicking the card or pressing `Space`.
- Front side: Prominent 48px character display with speaker button.
- Back side: Full lexical entry with Sino-Vietnamese reading, example sentence, and meaning.
- Keyboard support: Hotkeys `1`, `2`, `3`, `4` mapped to Again, Hard, Good, Easy.
