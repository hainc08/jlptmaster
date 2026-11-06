# PHASE 2 — UX/UI & ACCESSIBILITY AUDIT

Act as a Senior UX/UI Designer specializing in educational platforms.

Use Phase 0 and Phase 1 findings.

Do not modify UI code.

## UX-001 — Information Architecture

Inspect:

- Main menu
- Header
- Footer
- Sidebar
- Mobile navigation
- Breadcrumbs
- Hierarchy of course/lesson/practice pages
- Active menu states
- Navigation consistency across routes

Provide a CURRENT sitemap and a PROPOSED sitemap.

## UX-002 — Dashboard UX

Assess whether learners can immediately answer:

1. What should I study today?
2. Where did I stop?
3. What am I struggling with?
4. How close am I to my JLPT goal?
5. What happens if I complete this activity?

Review information hierarchy and competing calls to action.

## UX-003 — Page-by-Page Heuristic Review

Apply Nielsen's usability heuristics.

For each page assess:

- Visibility of system status
- Real-world language
- User control and freedom
- Consistency
- Error prevention
- Recognition over recall
- Efficiency
- Minimalist interface
- Error recovery
- Help and guidance

Give evidence-based findings; avoid invented numeric ratings.

## UX-004 — Responsive Audit

Inspect at minimum:

- 375px mobile
- 768px tablet
- 1280px desktop
- 1440px large desktop

Verify:

- Header collision
- Menu overflow
- Horizontal scrolling
- Table overflow
- Card layout
- Typography
- Touch target size
- Input usability
- Exam question layout
- Audio player layout

Capture screenshots when browser access allows.

## UX-005 — Japanese Typography

Verify:

- Japanese font rendering
- Kanji legibility
- Furigana/ruby positioning
- Line height
- Long Japanese text wrapping
- Vietnamese diacritics
- Mixed Japanese/Vietnamese text
- Mobile readability

## UX-006 — Learning Interaction

Inspect:

- Flashcard flipping
- Answer selection
- Feedback states
- Progress indicators
- Lesson completion
- Audio controls
- Exam navigation
- Focus and distraction

Identify unnecessary interactions or cognitive load.

## UX-007 — Accessibility

Evaluate against WCAG 2.2 AA where applicable.

Check:

- Keyboard navigation
- Focus indicators
- Semantic HTML
- Form labels
- Color contrast
- Screen reader names
- Error announcements
- Reduced motion
- Tap target size

Use automated tools only as supporting evidence; report manual checks separately.

## UX-008 — Design System Consistency

Inventory:

- Typography
- Color tokens
- Spacing
- Buttons
- Cards
- Inputs
- Tabs
- Badges
- Progress bars
- Dialogs
- Empty states
- Loading skeletons

Identify duplicated or inconsistent components.

## Deliverables

Write:
docs/audit/02-ux-ui-audit.md

Include:

1. Current sitemap
2. Proposed sitemap
3. Page-by-page UX findings
4. Responsive issue matrix
5. Accessibility findings
6. Design system inconsistencies
7. Before/after recommendations as textual wireframes
8. Prioritized UX backlog

No redesign implementation until approved.
