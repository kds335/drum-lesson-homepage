# Handoff — Beat Studio Drum School — 2026-05-21 Session 4

## Project

Full-stack booking site for "Beat Studio" drum school.  
Working directory: `C:\Users\bgr\homepage\1. 드럼교습소`  
Stack: Next.js 16 (App Router) · Tailwind CSS v4 · Supabase · React 19  
Deploy target: Vercel (`main` branch)

---

## What Was Completed This Session

### Monthly Packages Feature — ALL 6 ISSUES DONE

Full CRUD + highlight invariant for `monthly_packages`. Completed in prior sessions, all commits landed on `main`.

| Commit | Work |
|--------|------|
| `c951f88` | `monthly_packages` table in schema + RLS + seed data |
| `77c2cca` | `/lessons` page reads from DB; static `lib/packages.ts` deleted |
| `fb97ae6` | Admin 패키지 관리 tab — create, edit, delete, highlight (all 6 issues in one commit) |
| `3add0f5` | PRD + issue breakdown docs (`docs/prd/`, `docs/issues/`) |
| `fd2b7d4` | Generic state machine factory; `requireAdmin` used across all actions; map iframe replaced |
| `d5be4cc` | `getTransitionDescriptor` consolidates button label + intent |

### Architecture Introduced

- **`lib/booking-status.ts`** — `createStateMachine<T>()` factory + `lessonBookingStateMachine` + `practiceBookingStateMachine` + `getTransitionDescriptor(from, to)`  
- **`lib/packages-repo.ts`** — `monthlyPackagesRepo` with `list`, `create`, `update`, `delete`, `setHighlighted`  
- **`lib/parse-features.ts`** — `parseFeaturesInput(raw)` pure fn (textarea string → `string[]`)  
- **`app/actions/packages.ts`** — `createPackage` · `updatePackage` · `deletePackage` · `setHighlightedPackage`

---

## Current State

`remind.md` reports:
- **Incomplete features**: none  
- **Fragile points**: none  

All DB tables have RLS. Admin gated by `requireAdmin()` in `lib/auth.ts`.

---

## Admin Dashboard Tabs

| Tab | Korean | Status |
|-----|--------|--------|
| bookings | 예약 관리 | ✅ Full CRUD (confirm/cancel/restore) |
| students | 수강생 관리 | ✅ Read-only list |
| practice | 연습실 관리 | ✅ Full CRUD (confirm/cancel/restore) |
| contacts | 문의 관리 | ✅ Status progression (new→read→replied) |
| packages | 패키지 관리 | ✅ Full CRUD + highlight invariant |

---

## Key Files

| File | Role |
|------|------|
| `proxy.ts` | Session refresh middleware (named export `proxy`, not `middleware`) |
| `app/actions/auth.ts` | Login · signup · logout |
| `app/actions/booking.ts` | `createBooking` · `updateBookingStatus` |
| `app/actions/practice.ts` | `createPracticeBooking` · `updatePracticeBookingStatus` |
| `app/actions/contact.ts` | `submitContact` (honeypot + Resend) |
| `app/actions/packages.ts` | `createPackage` · `updatePackage` · `deletePackage` · `setHighlightedPackage` |
| `lib/packages-repo.ts` | All DB access for `monthly_packages` |
| `lib/parse-features.ts` | `parseFeaturesInput(raw)` |
| `lib/booking-status.ts` | Generic state machine + transition descriptors |
| `lib/auth.ts` | `requireAuth(next?)` · `requireAdmin()` |
| `lib/types.ts` | All domain types incl. `MonthlyPackage` + practice constants |
| `supabase/schema.sql` | Full DB schema — run in Supabase SQL Editor |
| `app/admin/AdminDashboard.tsx` | All 5 admin tabs (client component) |
| `app/admin/page.tsx` | Server component — fetches all data + calls `requireAdmin()` |

---

## Business Rules (quick ref)

### Booking status state machine (shared for lessons + practice)
```
pending    → confirmed, cancelled
confirmed  → cancelled
cancelled  → confirmed    (re-activation intentional)
```

### Practice room
- Hours: 09:00–21:00
- 1 slot = 1 hour fixed
- Non-member: ₩20,000/hr
- Member (logged in): free, max 2 hrs/day
- Availability via RPC `get_practice_slots(date)`

### Monthly packages highlight invariant
- Exactly one package can be `highlighted=true` at a time
- `setHighlighted(id)` atomically unsets all others and sets target
- Clicking already-highlighted row is no-op

---

## Next.js 16 Gotchas (active in this project)

- Middleware file is `proxy.ts` — exports named `proxy`, not `middleware`
- `params` and `searchParams` are `Promise<...>` — always `await` them
- `useSearchParams()` components must be in `<Suspense>` for Vercel build
- `useActionState` imported from `react`, not `react-dom`

---

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=       # never commit
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # never commit
RESEND_API_KEY=                 # never commit
CONTACT_EMAIL=                  # never commit
```

---

## Deferred Work

**Issue 7 — Tests** for `parseFeaturesInput` and `setHighlighted` invariant.  
Deferred per `docs/prd/monthly-packages-admin.md` — "test infrastructure introduction is out of scope." Pick up when test infra is added or a second testable module appears.

No other known outstanding work.

---

## Suggested Skills

- `/handoff` — generate updated handoff after future sessions  
- `/caveman-review` — review any new diff before committing  
- `/to-issues` — if new features are planned, break them into vertical slices first  
- `/grill-with-docs` — stress-test new feature designs against CLAUDE.md / remind.md  
- `/simplify` — after any new feature, review for reuse and quality  
- `/security-review` — before any auth or RLS changes

---

## References

- PRD: `docs/prd/monthly-packages-admin.md`  
- Issue breakdown: `docs/issues/monthly-packages-issues.md`  
- DB schema: `supabase/schema.sql`  
- Project rules: `CLAUDE.md`  
- Live state: `remind.md`
