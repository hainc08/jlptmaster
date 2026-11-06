# Admin CMS — UI Review Package (awaiting owner approval)

- **Prototype (mock data only, no API/DB):** [`index.html`](./index.html) — open in a browser; routes `#/login`, `#/dashboard`, `#/members`, `#/members/M1003`, `#/levels`, `#/settings`, `#/audit`.
- **Contract:** [`../../api/admin-cms.md`](../../api/admin-cms.md) · **Plan:** [`../../superpowers/plans/2026-11-06-admin-cms.md`](../../superpowers/plans/2026-11-06-admin-cms.md)
- **Does not replace** existing `/admin`, `/admin/content`, `/admin/exams`.

## Scope of the prototype
Login, Dashboard, Members list, Member detail, Levels, System settings (General / Exam rules / Roles and permissions / Notifications), Audit log. Design system: Material Design 3 roles, indigo primary `#3730A3`, vermilion accent `#C0331B`, 12px cards, 8px grid, Noto Sans + Noto Sans JP, VI/EN/JA switcher, icon rail at ≤768px, no dark mode.

Prototype-only helpers (not product features): the "Preview state" selector on Members (loading/empty/error) and the "any value signs in" login.

## Owner decisions requested
1. Add roles `OWNER` and `SUPPORT` to the role model (SPEC currently has STUDENT/EDITOR/ADMIN).
2. Member "Delete" = anonymize + keep exam history (not hard delete).
3. Settings are stored only; wiring them into the exam engine and sending notification emails are separate work.
4. Plans (Free/Standard/Premium) are admin-assigned labels; no billing.
5. SUPPORT may read the audit log (sitemap currently says Admin only).
6. Logo upload is out of scope for this phase.
7. `@axe-core/playwright` as a new devDependency for accessibility checks (optional).

## Approval requested
- [ ] UI scope approved (owner, in writing)
- [ ] API/DB contract approved (owner, in writing)

The owner records approval in `docs/phase-state.yaml`; the agent does not edit approval fields.
