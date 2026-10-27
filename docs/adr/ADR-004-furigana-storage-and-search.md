# ADR-004: Furigana Storage Representation & Normalized Multi-Script Search

## Status
Accepted

## Context
Japanese learning applications require displaying phonetic readings (Furigana) above Kanji characters while allowing learners to search by Kanji (`先生`), Hiragana (`せんせい`), Romaji (`sensei`), or Vietnamese translation (`giáo viên`). Storing raw HTML `<ruby>` inside database columns ruins index performance and corrupts text export.

## Decision
1. **Normalized Database Storage:**
   - Raw Kanji surface stored in `surface` (e.g. `先生`).
   - Phonetic reading stored in `reading` (e.g. `せんせい`).
   - A dedicated normalized column `search_normalized` pre-computes a lowercase concatenated representation: `sensei 先生 せんせい giao vien` with accents and punctuation stripped.
2. **Client-Side Semantic Rendering:**
   - The frontend renders semantic HTML5 `<ruby>` and `<rt>` tags at runtime via the `RubyText` component.
   - The global UI Furigana toggle hides or displays `<rt>` via CSS without altering the DOM text hierarchy.

## Consequences
- **Positive:** Blazing fast MariaDB SQL index searches (`WHERE search_normalized LIKE ...`); screen-reader accessible; clean content export.
- **Negative:** Requires an extra normalized string calculation on content creation and CSV import.
