# Handoff — Beat Studio Drum School — 2026-05-21 Session 5

## Project

Full-stack booking site for "Beat Studio" drum school.
Working directory: `C:\Users\bgr\homepage\1. 드럼교습소`
Stack: Next.js 16 (App Router) · Tailwind CSS v4 · Supabase · React 19
Deploy target: Vercel (`main` branch)

---

## What Happened This Session

### Architecture Review

`/improve-codebase-architecture` was run. Five deepening opportunities were identified and ranked. See the review output in conversation history for full analysis. Two were implemented immediately.

### Refactor #1 — Generic status-update action (commit `d8e93fb`)

Three near-identical `updateXStatus` server actions collapsed into one parameterised helper.

**New module:** `lib/record-status-action.ts`
- `updateRecordStatus<T>({ table, id, nextStatus, stateMachine, revalidatePaths })` — fetch → state-machine guard → update → revalidate
- Actions are now thin adapters (~7 lines each)

**Also added to `lib/booking-status.ts`:**
- `contactStateMachine` — linear chain `new → read → replied` (previously NO server-side guard on contacts)
- `contactTransitionLabels` — button labels for contact transitions
- `ContactStatus` added to imports

**AdminDashboard change:** `contactNextStatus` map deleted from the UI; contact tab now drives buttons through `contactStateMachine.getAllowedTransitions()` like the other two tabs.

### Refactor #2 — Booking intake module (commit `68ad6bf`)

All booking admission logic pulled behind a seam.

**New module:** `lib/booking-intake.ts`
- `admitLessonBooking({ supabase, input })` — owns all 6 lesson admission checks (pure + DB)
- `admitPracticeBooking({ supabase, userId, input })` — owns all 9 practice admission checks (pure + DB)
- Both return `{ ok: true, ...data } | { ok: false; code: AdmitCode; error: string }`
- `QueryClient` duck type (`{ from, rpc }`) — Supabase client injected; test-ready
- `CreateBookingInput` and `CreatePracticeBookingInput` moved here from action files (fixed lib→app import direction)

**Deleted:** `lib/validators.ts` — 68 lines of shallow pass-throughs, zero callers remaining after refactor

**Dead code removed:** `slotStart` field from old `validatePracticeInput` return type

---

## Current lib/ Module Map

| Module | Role |
|--------|------|
| `lib/booking-intake.ts` | **NEW** — all booking/practice admission (pure + DB) |
| `lib/record-status-action.ts` | **NEW** — generic admin status-update helper |
| `lib/booking-status.ts` | State machines (lesson, practice, contact) + transition descriptors + labels |
| `lib/packages-repo.ts` | All DB access for `monthly_packages` |
| `lib/parse-features.ts` | `parseFeaturesInput(raw)` — textarea → `string[]` |
| `lib/auth.ts` | `requireAuth(next?)` · `requireAdmin()` |
| `lib/booking-stats.ts` | `computeBookingStats(bookings)` |
| `lib/types.ts` | All domain types + practice constants |
| `lib/calendar.ts` | Calendar helpers |
| `lib/utils.ts` | `formatPrice`, `formatDateTime`, `cn` |

---

## Remaining Architecture Candidates (from this session's review)

Three candidates identified but NOT yet implemented:

### Candidate 3 — Repo pattern is half-applied
**Files:** `lib/packages-repo.ts` (exists) vs raw `supabase.from(...)` in `app/admin/page.tsx`, `app/actions/booking.ts`, `app/actions/practice.ts`, `app/schedule/page.tsx`, `app/actions/contact.ts`

`monthly_packages` has a repo. Six other tables do not. An AI navigator asking "how do I read bookings" bounces between files. The bookings join-select string `'*, profiles(...), lessons(*)'` could drift.

**Decision needed:** Extend repo pattern to `bookings` + `practice_bookings` (highest traffic), OR remove `monthlyPackagesRepo` and standardise on raw queries. Inconsistency is the cost; either direction beats half.

### Candidate 4 — `parsePackageForm` extraction
**Files:** `app/actions/packages.ts` — `createPackage` lines 14-27 and `updatePackage` lines 46-62 duplicate ~16 lines of FormData parse+validate verbatim.

Small but clean: pure `parsePackageForm(formData)` beside `parseFeaturesInput` or in a new `lib/parse-package-form.ts`.

### Candidate 5 — `<StatusActions>` component
**Files:** `app/admin/AdminDashboard.tsx` — bookings action cell (~lines 240-264) and practice action cell (~lines 386-409) are near-identical JSX blocks.

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

---

## Suggested Skills

- `/improve-codebase-architecture` — continue with candidates 3, 4, or 5
- `/caveman-review` — review any diff before committing
- `/caveman-commit` — generate commit message after changes
- `/handoff` — update this document at session end
- `/grill-with-docs` — stress-test design decisions against CLAUDE.md / remind.md before implementing candidate 3 (repo consistency involves an architectural choice)
