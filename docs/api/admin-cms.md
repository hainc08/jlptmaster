# Admin CMS — API & Data Contract (DRAFT — awaiting owner approval)

**Status:** Proposed. No implementation may start until the owner approves this contract and the UI scope in `docs/phase-state.yaml` (AGENTS.md hard gates).
**UI reference:** `docs/design/admin-cms/index.html` · **Plan:** `docs/superpowers/plans/2026-11-06-admin-cms.md`
**Machine-readable:** `docs/api/openapi.yaml` (paths under `/admin/dashboard|members|levels|settings|audit`).

## 1. Conventions
- Base `/api/v1`, session cookie `jlpt_session`, JSON bodies, error envelope `{ "error": { "code", "message" } }`.
- Status codes: `401` no session, `403` role lacks module, `400` validation (zod), `404` unknown id, `409` business-rule conflict, `500` unexpected.
- Every mutation writes one `audit_logs` row (action `module.verb`) with redacted `before`/`after` and request IP. Keys matching `/password|hash|token|secret/i` are dropped recursively.
- Pagination: `page` ≥ 1 (default 1), `perPage` 1–100 (default 10, clamped). A page past the end returns `data: []` with `200`.

## 2. Authorization (module permissions)
Modules: `dashboard`, `members`, `levels`, `settings`, `audit`. Allowed set comes from table `role_permissions`; `OWNER` is always allowed.

| Role | dashboard | members | levels | settings | audit |
|---|---|---|---|---|---|
| OWNER | ✔ | ✔ | ✔ | ✔ | ✔ |
| ADMIN | ✔ | ✔ | ✔ | ✔ | ✔ |
| EDITOR (Content Editor) | ✔ | – | ✔ | – | – |
| SUPPORT | ✔ | ✔ | – | – | ✔ |
| STUDENT | – | – | – | – | – |

Defaults above are seeded and editable through `PUT /admin/settings/roles`, with guards: OWNER row immutable; ADMIN keeps `dashboard` + `settings`. SUPPORT may act on STUDENT accounts only (never on ADMIN/OWNER/EDITOR).

> **Delta vs sitemap:** `docs/sitemap.md` lists `/admin/audit` as "Admin Only"; this contract lets SUPPORT **read** it. Owner decision required.

## 3. Endpoints

| Method & path | Module | Purpose | Notes |
|---|---|---|---|
| `GET /admin/dashboard` | dashboard | KPIs, 30-day activity, members by level, recent activity | Timezone `Asia/Ho_Chi_Minh` |
| `GET /admin/members` | members | Paged list | Query: `q`(≤100), `level`, `status`(ACTIVE\|SUSPENDED\|PENDING\|EXPIRED), `plan`, `page`, `perPage` |
| `POST /admin/members` | members | Create learner | `{displayName,email,level,plan}`; creates user with no usable password + reset invite |
| `GET /admin/members/:id` | members | Detail (profile, progress by level, exam history, access) | |
| `PATCH /admin/members/:id` | members | Edit `displayName`,`email` | email unique → 409 |
| `DELETE /admin/members/:id` | members | **Anonymize** (not hard delete) | See §5 |
| `POST /admin/members/:id/suspend` · `/reactivate` | members | Status change; suspend revokes sessions | self / last OWNER → 409 |
| `POST /admin/members/:id/reset-password` | members | Issue reset via existing password service | Never returns or logs a password |
| `POST /admin/members/:id/change-level` | members | `{level}` must exist in `jlpt_levels` | updates `user_profiles.target_level` |
| `POST /admin/members/bulk` | members | `{ids[], action: suspend\|change-level, level?}` → `{updated, skipped[]}` | self/protected ids are skipped |
| `GET /admin/members/export` | members | CSV (same filters) | UTF-8 BOM, formula-injection safe |
| `GET /admin/levels` | levels | 5 levels with counts | |
| `PATCH /admin/levels/:code` | levels | `name,description,passScore(30–100),enabled` | `enabled=true` requires `status=PUBLISHED` → else 409 |
| `POST /admin/levels/reorder` | levels | `{order: string[5]}` permutation | |
| `GET`/`PATCH /admin/settings` | settings | general, examRules, notifications | ranges in §4 |
| `GET`/`PUT /admin/settings/roles` | settings | role × module matrix | lock-out → 409 |
| `GET /admin/audit` | audit | Paged log with before/after | Query: `actor`,`module`,`range`(7d\|30d),`page`,`perPage` |

### Derived member status
`PENDING` ⇔ `users.status = PENDING_VERIFICATION`; `SUSPENDED` ⇔ `SUSPENDED`; `EXPIRED` ⇔ `status = ACTIVE ∧ plan ≠ FREE ∧ plan_expires_at < now`; otherwise `ACTIVE`. Rows with `deleted_at` set are excluded.

## 4. Settings & validation
- `general`: `siteName` 1–60 chars; `defaultLanguage` ∈ `vi|en|ja`. (Logo upload is **out of scope** in this phase — control is visual only.)
- `examRules`: `timeLimitMin` 10–240; `retakeLimit` 0–10; `passThreshold` 30–100.
- `notifications`: booleans `welcome, passwordReset, examResult, weeklyDigest, suspension, planExpiry`.
- **Stored only.** The exam engine does not read these values yet; no emails are sent. Both are separate future work.

## 5. Schema delta (see `docs/erd.md` §2.6)
- `users`: `+display_name`, `+plan ENUM(FREE,STANDARD,PREMIUM)`, `+plan_expires_at`, `+last_active_at`, `+deleted_at`; `role` enum gains `OWNER`, `SUPPORT`.
- `jlpt_levels`: `+status ENUM(DRAFT,PUBLISHED,COMING_SOON)`, `+description`, `+pass_score`, `+display_order`; `is_active` = "enabled".
- New `system_settings(key PK, value_json)` and `role_permissions(role, module, allowed; PK(role,module))`.
- `audit_logs`: `+ip`, `+before_json`, `+after_json` (nullable).
- **Delete = anonymize:** email → `deleted+<id>@invalid`, `password_hash` NULL, sessions and profile PII removed, `deleted_at` set; `exam_attempts` retained (SPEC: history must not be rewritten). The prototype's "permanently removes… exam history" copy changes accordingly.

## 6. Acceptance criteria
| ID | Criterion |
|---|---|
| AC-CMS-01 | Non-permitted role gets 403 on every endpoint of a module, by direct URL; STUDENT gets 403 everywhere. |
| AC-CMS-02 | Admin cannot suspend/delete self or the last OWNER; bulk skips those ids. |
| AC-CMS-03 | Member list filters/search/pagination behave per §1 and §3, incl. `%`, `_`, empty, over-long and out-of-range inputs. |
| AC-CMS-04 | Every mutation produces an audit row with redacted before/after + IP; no secrets ever appear. |
| AC-CMS-05 | CSV export is correctly quoted and neutralises `= + - @` leading cells. |
| AC-CMS-06 | Level `enabled` only when `PUBLISHED`; pass score 30–100; reorder is a full permutation. |
| AC-CMS-07 | Settings validate per §4; role-matrix edits cannot lock out OWNER/ADMIN. |
| AC-CMS-08 | Dashboard numbers equal DB counts; `activity30d` has 30 zero-filled days. |
| AC-CMS-09 | Delete preserves exam attempts and removes personal identifiers. |
| AC-CMS-10 | UI: sidebar collapses to icons ≤768px; all screens pass keyboard/axe checks; loading, empty and error states exist. |
