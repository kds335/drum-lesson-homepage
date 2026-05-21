# Handoff — Beat Studio Drum School — 2026-05-21 Session 6

## Project

Full-stack booking site for "Beat Studio" drum school.
Working directory: `C:\Users\bgr\homepage\1. 드럼교습소`
Stack: Next.js 16 (App Router) · Tailwind CSS v4 · Supabase · React 19
Deploy target: Vercel (`main` branch)

---

## What Happened This Session

### Refactor #3 — Dissolve `packages-repo`, extract `highlightPackage` (Scenario D + D2)

Resolved the repo-pattern inconsistency identified in session 5's architecture review. Decision recorded in `docs/adr/0001-no-repository-layer.md`.

**Deleted:** `lib/packages-repo.ts` — shallow wrapper, `list()` was dead code

**Created:** `lib/highlight-package.ts`
- `highlightPackage({ supabase, id })` — sole enforcer of only-one-highlighted invariant on `monthly_packages`
- `QueryClient` duck type `{ from }` — matches `booking-intake.ts` pattern, test-injectable
- Sequential unset-all → set-target; brief zero-highlighted window is acceptable

**Rewritten:** `app/actions/packages.ts`
- Removed `monthlyPackagesRepo` import
- Each action: `const { supabase } = await requireAdmin()` — single client, no double-create
- Trivial CRUD inlined; `highlightPackage` called for invariant operation
- `createPackage`/`updatePackage` return error string on DB error; `deletePackage` throws (pre-existing asymmetry, not introduced here)

**Updated:**
- `CLAUDE.md` — key files table: removed `lib/packages-repo.ts`, added `lib/highlight-package.ts` + the two session-5 modules that were missing
- `docs/issues/monthly-packages-issues.md` — Issue 7: `setHighlighted` → `highlightPackage`
- `docs/adr/0001-no-repository-layer.md` — new ADR recording the "purpose-named module per invariant, inline for trivial CRUD" rule

### ⚠️ Uncommitted

All changes are staged and ready. Commit message generated this session:

```
refactor(packages): dissolve packages-repo, extract highlightPackage

monthlyPackagesRepo was a shallow wrapper — list() was dead code,
CRUD methods added a name-redundant hop with no invariant logic.
One genuine invariant (only-one-highlighted) extracted to
lib/highlight-package.ts with injected QueryClient for testability.
Trivial CRUD inlined; actions now get supabase from requireAdmin()
instead of double-creating the client.

Adds docs/adr/0001-no-repository-layer.md recording the decision.
Pattern: purpose-named module per invariant, inline for trivial CRUD.
```

**First action next session: commit + push this.**

Files to stage:
```
CLAUDE.md
app/actions/packages.ts
docs/issues/monthly-packages-issues.md
lib/packages-repo.ts   (deletion)
docs/adr/              (new dir)
lib/highlight-package.ts
```

---

## Established Architecture Pattern

From ADR `docs/adr/0001-no-repository-layer.md`:

> **Purpose-named module per invariant, inline for trivial CRUD.**
> No `*-repo.ts` files. New invariants → purpose-named module with injected `QueryClient` duck type, matching `lib/highlight-package.ts` / `lib/booking-intake.ts` / `lib/record-status-action.ts`.

---

## Current lib/ Module Map

| Module | Role |
|--------|------|
| `lib/highlight-package.ts` | **NEW** — `highlightPackage` — only-one-highlighted invariant |
| `lib/booking-intake.ts` | All booking/practice admission (pure + DB) |
| `lib/record-status-action.ts` | Generic admin status-update helper |
| `lib/booking-status.ts` | State machines (lesson, practice, contact) + transition descriptors + labels |
| `lib/parse-features.ts` | `parseFeaturesInput(raw)` — textarea → `string[]` |
| `lib/auth.ts` | `requireAuth(next?)` · `requireAdmin()` → returns `{ user, supabase }` |
| `lib/booking-stats.ts` | `computeBookingStats(bookings)` |
| `lib/types.ts` | All domain types + practice constants |
| `lib/calendar.ts` | Calendar helpers |
| `lib/utils.ts` | `formatPrice`, `formatDateTime`, `cn` |

---

## Remaining Architecture Candidates (from session 5 review)

Two candidates identified but NOT yet implemented:

### Candidate 4 — `parsePackageForm` extraction
**Files:** `app/actions/packages.ts` — `createPackage` lines 14–27 and `updatePackage` lines 46–62 duplicate ~16 lines of FormData parse+validate verbatim.

Small: pure `parsePackageForm(formData)` beside `parseFeaturesInput` or in `lib/parse-package-form.ts`.

### Candidate 5 — `<StatusActions>` component
**Files:** `app/admin/AdminDashboard.tsx` — bookings action cell and practice action cell are near-identical JSX blocks.

One `<StatusActions transitions onUpdate>` component. Lowest-impact of the five (pure presentation, no invariant).

---

## Key File Reference

| File | Role |
|------|------|
| `proxy.ts` | Session refresh middleware (named export `proxy`, not `middleware`) |
| `app/actions/auth.ts` | Login · signup · logout |
| `app/actions/booking.ts` | `createBooking` · `updateBookingStatus` · `requestCancellation` |
| `app/actions/practice.ts` | `createPracticeBooking` · `updatePracticeBookingStatus` |
| `app/actions/contact.ts` | `submitContact` (honeypot + Resend) · `updateContactStatus` |
| `app/actions/packages.ts` | `createPackage` · `updatePackage` · `deletePackage` · `setHighlightedPackage` |
| `app/admin/AdminDashboard.tsx` | All 5 admin tabs (client component) |
| `app/admin/page.tsx` | Server component — fetches all data + `requireAdmin()` |
| `docs/adr/0001-no-repository-layer.md` | **NEW** — records repo-pattern decision |
| `supabase/schema.sql` | Full DB schema |
| `CLAUDE.md` | Project rules and stack notes |
| `remind.md` | Business rules quick-reference |

---

## Constraints (always active)

- Next.js 16: `params`/`searchParams` are `Promise<...>` — always `await`; `useSearchParams()` needs `<Suspense>`; middleware is `proxy.ts` with named export `proxy`
- Tailwind CSS v4: use `@custom-variant dark`, NOT v3 syntax
- `redirect()` must be called **outside** try/catch
- Never commit `.env.local`
- `useActionState` imported from `react`, not `react-dom`
- Server components/actions → `lib/supabase/server.ts`; client components → `lib/supabase/client.ts`
- Use `git -C "<path>"` instead of `cd` in Bash tool to avoid hook warnings

---

## Suggested Skills

- `/caveman-commit` — commit the staged changes using the message above
- `/improve-codebase-architecture` — continue with candidates 4 or 5
- `/caveman-review` — review any diff before committing
- `/handoff` — update this document at session end
