# PRD: Admin-Managed Monthly Packages

## Problem Statement

The admin (studio owner) cannot edit monthly lesson packages without a code change and redeploy. The three packages displayed on `/lessons` (베이직, 스탠다드, 프리미엄) are hardcoded in `lib/packages.ts` as a static TypeScript array. Pricing changes, feature bullet updates, adding a new tier, or seasonal promotions all require a developer to ship a build. This is friction for a small studio whose pricing and offerings change a few times a year.

Every other content surface in the dashboard — lessons, schedules, practice rooms, contacts, bookings — is already DB-backed and editable. Monthly packages are the last static content island.

## Solution

Move monthly packages from the static `lib/packages.ts` array into a new `monthly_packages` Supabase table, and add a "패키지 관리" tab to the admin dashboard so the admin can create, edit, reorder-by-price, highlight, and delete packages without code changes.

The public `/lessons` page reads from the table instead of the static array. The "월정액 패키지" section hides itself when the table is empty (no awkward placeholder UI for visitors).

## User Stories

1. As the studio admin, I want to view all monthly packages in the dashboard, so that I can see what is currently offered to visitors.
2. As the studio admin, I want to add a new monthly package (name, sessions, price, features, highlight flag), so that I can launch a new tier without contacting a developer.
3. As the studio admin, I want to edit an existing package's price, so that I can adjust to seasonal pricing.
4. As the studio admin, I want to edit a package's feature bullet list (multi-line free text), so that I can refine the selling points.
5. As the studio admin, I want to edit a package's session count, so that I can change the included lessons per month.
6. As the studio admin, I want to rename a package, so that I can rebrand a tier.
7. As the studio admin, I want to mark exactly one package as "highlighted" (인기), so that visitors see the recommended option prominently.
8. As the studio admin, I want highlighting one package to automatically unhighlight any other, so that I cannot accidentally promote two packages at once.
9. As the studio admin, I want to delete a package with a confirmation prompt, so that I cannot remove a tier by accident.
10. As the studio admin, I want my changes to appear on the public `/lessons` page immediately after saving, so that I can verify the result without manual cache busting.
11. As a visitor to `/lessons`, I want to see the current monthly packages with name, price, session count, and feature bullets, so that I can compare tiers.
12. As a visitor to `/lessons`, I want the "인기" package visually emphasized, so that I can quickly spot the recommended tier.
13. As a visitor to `/lessons`, I want packages ordered cheapest-first, so that the price ladder is predictable.
14. As a visitor to `/lessons`, I want the entire "월정액 패키지" section to disappear if no packages exist, so that I do not see a half-broken UI.
15. As a developer, I want the `MonthlyPackage` type defined alongside other domain types in `lib/types.ts`, so that I do not need to remember a separate `lib/packages.ts` import.
16. As a developer, I want package mutations to go through a single repo module with a `setHighlighted` operation that enforces the only-one-highlighted invariant atomically, so that the invariant cannot be violated by a careless caller.
17. As a developer, I want package CRUD server actions to gate on `requireAdmin()` and revalidate both `/lessons` and `/admin`, so that authorization and cache freshness are guaranteed.
18. As a developer, I want the table protected by RLS policies matching `lessons` (public read, admin manage), so that the public read path is unauthenticated but writes are admin-only.
19. As a developer, I want the textarea-to-features parsing extracted as a pure function, so that bullet-list normalization is unit-testable without touching Supabase.
20. As the studio admin, I want initial seed data (the existing three packages) inserted by the schema migration, so that the public page does not go blank during the cutover.
21. As the studio admin, I want a new package to default to non-highlighted, so that adding a tier never disturbs the current 인기 badge placement.
22. As the studio admin, I want disabled states on action buttons during save transitions, so that I do not double-submit.

## Implementation Decisions

### Schema

A new `monthly_packages` table:

```sql
create table if not exists monthly_packages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sessions integer not null check (sessions > 0),
  price integer not null check (price >= 0),
  features jsonb not null default '[]',
  highlighted boolean not null default false,
  created_at timestamptz default now() not null
);
```

- `features` stored as `jsonb` array of strings. Ordered by array index. Never queried by content.
- No `is_active` / soft-delete column — hard delete only, matching the `lessons` table pattern.
- Ordering is by `price asc` on every read. No `position` column.
- `highlighted` is a plain boolean. The only-one-highlighted invariant is enforced by the repo's `setHighlighted` operation (transactionally unsets all others), not a partial unique index — this keeps the "zero highlighted" state legal.

### RLS

Mirror the `lessons` table policies:

- `anyone can view monthly_packages` — `select using (true)`
- `admins can manage monthly_packages` — `for all using (get_user_role() = 'admin')`

### Seed Data

Schema migration inserts the existing three packages (베이직 / 스탠다드 / 프리미엄) verbatim from `lib/packages.ts`, with 스탠다드 highlighted. Uses `on conflict do nothing` so re-running the schema is safe.

### Modules

**`monthlyPackagesRepo` (new, deep)** — encapsulates all DB access for packages. Interface:

- `list()` — returns packages ordered by price ascending
- `create(input)` — insert with validation
- `update(id, input)` — partial update
- `delete(id)` — hard delete
- `setHighlighted(id)` — atomic: sets the target row to `highlighted=true`, sets all other rows to `highlighted=false`

This is the only module that talks to the `monthly_packages` table. Server actions and pages call it.

**`parseFeaturesInput(raw: string): string[]` (new, deep, pure)** — splits a textarea string on newlines, trims each line, drops empties. Pure function. No I/O. Unit-testable in isolation. Single source of truth for the admin features-input parsing rule.

**`MonthlyPackage` type (moved)** — moved from `lib/packages.ts` into `lib/types.ts` alongside `Lesson`, `Profile`, `Booking`, etc. `lib/packages.ts` is deleted.

**`app/actions/packages.ts` (new, shallow)** — thin server-action wrappers (`createPackage`, `updatePackage`, `deletePackage`, `setHighlightedPackage`) that:
1. Call `requireAdmin()`
2. Parse `FormData` (no zod — matches existing `app/actions/booking.ts` / `contact.ts` style)
3. Call the corresponding `monthlyPackagesRepo` method
4. `revalidatePath('/lessons')` and `revalidatePath('/admin')`

**Admin UI tab (new, shallow)** — fifth tab in `AdminDashboard` labeled "패키지 관리". Lists packages in a table. Each row has inline edit (expandable form) and delete (with `window.confirm`). A "추가" button reveals an inline create form. Highlight toggle is a star/radio-style button that calls `setHighlightedPackage`.

**Public `/lessons` page (modified, shallow)** — replaces the `monthlyPackages` static import with a Supabase fetch using `lib/supabase/server.ts` (matching the `lessons` fetch already on the page). If the result is empty, the entire "월정액 패키지" `<section>` is not rendered.

### Validation Rules (server action layer)

- `name` — non-empty after trim
- `sessions` — positive integer
- `price` — non-negative integer (free packages allowed)
- `features` — passed through `parseFeaturesInput`; may be empty array
- `highlighted` — boolean checkbox in form

Validation errors return a string message via `useActionState` (matching `submitContact` pattern).

### Highlighted Invariant Enforcement

The admin UI exposes highlighting as a single action — clicking a non-highlighted row's star calls `setHighlightedPackage(id)`. The repo runs both updates (target=true, others=false) inside a single Supabase request batch or PostgREST transaction. If a single PostgREST call cannot atomically do this, fall back to two sequential `update` calls in this order: unset all → set target. Worst-case interleaving: brief window with zero highlighted (acceptable; better than two highlighted).

A plain `update` form on the package itself does **not** expose `highlighted` as a free checkbox — it is set only through `setHighlightedPackage`, so callers cannot bypass the invariant.

### Docs & Migration Bookkeeping

- `CLAUDE.md` key-files table: drop the `lib/packages.ts` row; add a note next to `lib/types.ts` that `MonthlyPackage` now lives there; add `app/actions/packages.ts` row; mention `monthly_packages` table.
- `CLAUDE.md` DB tables list: append `monthly_packages`.
- `remind.md`: per the maintenance rule, update to reflect the new actual state.
- `supabase/schema.sql`: append the table, RLS policies, and seed inserts.

## Testing Decisions

A good test for this feature verifies external behavior, not implementation details:

- **What it tests**: the observable outcome of calling a module's public interface (e.g. "after `setHighlighted('B')`, exactly one row is highlighted and it is row B").
- **What it does NOT test**: which Supabase methods were called, the order of internal awaits, private helper signatures, or that a specific SQL query string was produced.

### Modules To Test

- **`parseFeaturesInput`** — pure function. Unit tests covering: empty string, single line, multiple lines, mixed leading/trailing whitespace, blank lines in the middle, only-whitespace lines, CRLF vs LF line endings.
- **`monthlyPackagesRepo.setHighlighted`** — integration test against a test Supabase project (or test schema). Cases: setting on a table with zero highlighted, with one already highlighted on a different row, with the target already highlighted (idempotent), with multiple highlighted (defensive — should converge to exactly one).

The other repo operations (`list`, `create`, `update`, `delete`) are thin pass-throughs to Supabase; integration testing them adds little value beyond confirming the schema matches. They can be smoke-tested manually via the admin UI during the verification step.

### Prior Art

The codebase has no existing test infrastructure (no `*.test.ts`, no test runner config in `package.json`). This PRD does not require introducing one. Recommendation: defer test setup to a follow-up if/when a second testable module appears, and verify this feature manually through the admin UI plus a `/lessons` page check (the same verification path used for the existing `lessons`, `schedules`, and `practice_rooms` admin tabs).

If tests are written ahead of that follow-up, use the same Supabase client setup the server actions use, target a non-prod project, and reset table state between tests.

## Out of Scope

- **Package archiving / soft delete.** Hard delete only, matching `lessons`. If the admin wants to "hide" a package, they delete it. Restoring requires recreating.
- **Per-feature metadata** (icons, color emphasis, links). Features remain plain strings. If richer feature objects become necessary, the `jsonb` column upgrades cleanly without a schema break.
- **Reordering UI** beyond price-sort. No drag-and-drop. Admin controls order by setting prices.
- **Multiple highlights**, badges other than "인기", or A/B testing different highlights to different visitors.
- **Booking integration.** Clicking "지금 신청하기" on a package continues to link to `/booking` with no pre-selected package; per-package booking flow is a separate feature.
- **Package validity windows** (start_at, end_at for seasonal availability). Out of scope for this PRD.
- **Audit log of edits.** No `updated_at` or change history table.
- **i18n.** Field values remain Korean free-text; no translation layer.
- **Image / icon per package.** Visuals stay as the current text-and-badge layout.
- **Test infrastructure introduction.** See Testing Decisions above.

## Further Notes

- Cutover safety: the schema migration seeds the existing three rows, so a deploy that runs the SQL before the code change still renders the same `/lessons` page (the old static array also still works). After the code change, the page reads from DB. There is no data-loss risk because the static array is the source for the seed.
- The `lib/packages.ts` file is deleted entirely after the type moves to `lib/types.ts`. Any import of `monthlyPackages` from the old path will hard-error at build time, which is the desired signal that a caller missed the migration.
- The admin highlight toggle should optimistically reflect the new state via `useTransition` (matching the existing booking-status toggles in `AdminDashboard`) so the UI does not feel laggy.
- The public page query uses the server Supabase client (`lib/supabase/server.ts`) and `revalidatePath('/lessons')` from server actions to invalidate the static cache.
- Existing CLAUDE.md rule: `redirect()` outside try/catch — not relevant here, but worth noting that server actions in this PRD do not redirect on success; they return a status string and rely on `revalidatePath`.
