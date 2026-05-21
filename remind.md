# Beat Studio — REMIND.md

> Quick-reference for Claude. Only captures what can't be derived from code or git history.

---

## Project Goal

Full-stack booking site for "Beat Studio" drum school.
- **Students**: sign up → book lessons → view schedule
- **Non-members**: book practice rooms only (name + phone)
- **Admin**: confirm/cancel lesson bookings + practice room bookings

**Deploy target**: Vercel (build fix already applied — commit `8c1a116`)

---

## Hard Rules — Never Forget

| Rule | Detail |
|---|---|
| Middleware file | `proxy.ts` + `export async function proxy` — NOT `middleware.ts` |
| `params` / `searchParams` | Always `await` — both are `Promise<...>` in Next.js 16 |
| `redirect()` | Must be called **outside** try/catch — inside = `NEXT_REDIRECT` gets caught as error |
| Tailwind dark mode | `@custom-variant dark` (v4) — never use v3 `darkMode: 'class'` |
| `useActionState` | Import from `react`, not `react-dom` |
| Supabase client | Server: `lib/supabase/server.ts` / Browser: `lib/supabase/client.ts` — never mix |
| `useSearchParams()` | Wrap parent component in `<Suspense>` — required for Vercel build |
| `.env.local` | **NEVER commit** — contains Supabase secrets |

---

## Incomplete Features

### Not implemented
1. **`app/contact/page.tsx`** — form UI exists, submit does nothing; needs email send or Supabase insert
2. **"취소 요청" button** (`app/schedule/ScheduleView.tsx:150`) — no-op; student-side cancel Server Action missing
3. **Monthly packages** (`app/lessons/page.tsx` `monthlyPackages` array) — hardcoded dummy; not in Supabase

### Fragile (works but can break)
4. **Auth error string matching** (`app/actions/auth.ts:23-28, 65-69`)
   Uses `error.message.includes('Invalid login credentials')` etc.
   If Supabase changes error wording → wrong Korean error shown silently.
   Strings watched: `'Invalid login credentials'`, `'Email not confirmed'`, `'already registered'`, `'Signups not allowed'`

5. **PracticeBookingStatus cast** (`app/actions/practice.ts:136`)
   `PracticeBookingStatus` cast to `BookingStatus` to reuse `canTransitionTo`.
   Safe now (both are `pending|confirmed|cancelled`) but breaks if practice statuses diverge.

---

## First-Run Checklist (new environment)

- [ ] Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Run full `supabase/schema.sql` in Supabase SQL Editor (includes practice room tables added in `8936ec6`)
- [ ] Verify `proxy.ts` session refresh works end-to-end

---

## Domain Business Rules

### Lesson Booking Validation (enforced server-side in `createBooking`)
- Past dates blocked
- Sunday (day=0) blocked
- Slot must exist in `schedules` table with `is_available=true`
- No double-booking: same `scheduled_at` + non-cancelled status already exists → reject

### Practice Room Rules
```
PRACTICE_OPEN_HOUR   = 9      (09:00)
PRACTICE_CLOSE_HOUR  = 21     (21:00)
PRACTICE_HOURLY_RATE = 20000  (non-member, KRW)
PRACTICE_MEMBER_DAILY_LIMIT = 2 hours
```
- 1 slot = 1 hour fixed (DB CHECK: `end_hour = start_hour + 1`)
- Member (logged in) = free + 2hr/day cap
- Non-member = ₩20,000/hr, no cap
- Slot occupancy fetched via RPC `get_practice_slots(date)` — no PII in response

### Booking Status State Machine
```
pending    → confirmed, cancelled
confirmed  → cancelled
cancelled  → confirmed    (intentional: re-activation allowed)
```
Shared between lesson bookings and practice room bookings.

### Admin Auth Pattern
- `lib/auth.ts` `requireAdmin()` — clean helper, use for page-level protection
- `app/actions/practice.ts` `updatePracticeBookingStatus` — **does its own DB role check** (doesn't use `requireAdmin`). Watch for inconsistency.

---

## Architecture Map

```
lib/
  auth.ts              requireAuth(next?) / requireAdmin()
  booking-status.ts    ALLOWED_TRANSITIONS / canTransitionTo / getAllowedTransitions
  booking-stats.ts     computeBookingStats(bookings)
  calendar.ts          getDaysInMonth / getFirstDayOfMonth / toDateString / DAYS
  types.ts             All types + PRACTICE_* constants
  utils.ts             formatPrice / formatDateTime

app/actions/
  auth.ts              login (next param) / signup / logout
  booking.ts           createBooking / updateBookingStatus
  practice.ts          createPracticeBooking / updatePracticeBookingStatus

proxy.ts               Session refresh (Next.js 16 middleware)
supabase/schema.sql    Full schema — 6 tables + RLS + triggers + seed data
```

---

## Priority TODO

1. Run `supabase/schema.sql` on Supabase (practice room tables included)
2. Implement student cancel in `ScheduleView.tsx` — needs Server Action
3. Wire `app/contact/page.tsx` form to backend
4. Replace auth error `includes()` hacks with Supabase error codes
5. Split `PracticeBookingStatus` into its own state machine
