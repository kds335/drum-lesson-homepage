# Handoff: 비트스튜디오 드럼교습소

**Project:** `C:\Users\bgr\homepage\1. 드럼교습소`
**Date:** 2026-05-20
**Branch:** main

---

## What this project is

Next.js 16 drum lesson booking website for "비트스튜디오 드럼교습소". Full stack: App Router + Tailwind CSS v4 + Supabase (auth + DB). See `CLAUDE.md` and memory at `C:\Users\bgr\.claude\projects\C--Users-bgr-homepage-1-------\memory\` for full context.

---

## What was done this session

### 1. Supabase integration (dummy data → real DB)

All three main pages converted from static dummy data to live Supabase queries:

| Page | Before | After |
|---|---|---|
| `app/booking/page.tsx` | `'use client'` with hardcoded `bookedSlots` | Server Component, fetches `lessons` + profile from Supabase |
| `app/schedule/page.tsx` | `MOCK_USER = 'u1'`, `dummyBookings` | Server Component, fetches current user's bookings |
| `app/admin/page.tsx` | `dummyBookings`, `dummyStudents`, state-only updates | Server Component, real Supabase queries, `AdminDashboard.tsx` client split |

New client components created alongside pages:
- `app/booking/BookingWizard.tsx` — real-time slot fetch, `createBooking` Server Action
- `app/schedule/ScheduleView.tsx` — accepts `bookings` prop from server
- `app/admin/AdminDashboard.tsx` — uses `useTransition` for status updates

### 2. Auth flow: `next` redirect param

After login, users return to the page they came from (not always `/`).

- `app/actions/auth.ts` — `login()` reads `next` from FormData, validates relative path, redirects there
- `app/auth/login/page.tsx` — reads `?next=` from URL, injects as hidden form input
- Protected pages pass `?next=/booking`, `?next=/schedule`, `?next=/admin` when redirecting to login

### 3. Server Actions

- `app/actions/auth.ts` — login / signup / logout (`next` param added)
- `app/actions/booking.ts` — `createBooking` (with server-side validation) + `updateBookingStatus`

### 4. Architecture deepening (5 modules extracted)

| New module | Purpose |
|---|---|
| `lib/auth.ts` | `requireAuth(next?)`, `requireAdmin()` — replaces duplicated `getUser() + redirect()` in 3 pages |
| `lib/calendar.ts` | `getDaysInMonth`, `getFirstDayOfMonth`, `toDateString`, `DAYS` — was duplicated in BookingWizard + ScheduleView |
| `lib/booking-status.ts` | `getAllowedTransitions`, `canTransitionTo`, `ALLOWED_TRANSITIONS` — status state machine |
| `lib/booking-stats.ts` | `computeBookingStats(bookings)` — extracted from AdminDashboard render logic |

Server-side booking validation added to `createBooking`:
- Past date check
- Sunday check
- Schedule slot existence check (queries `schedules` table)
- Double-booking check (queries `bookings` table)

`updateBookingStatus` uses `canTransitionTo` to reject invalid transitions server-side.

---

## Current state

**All changes committed** as `47afcee` — pushed to `origin/main`.

**TypeScript: 0 errors** (verified with `npx tsc --noEmit`).

**Supabase schema not yet applied.** `supabase/schema.sql` must be run in Supabase SQL Editor before the app works end-to-end.

---

## What still needs doing

### High priority
1. **Run `supabase/schema.sql`** in the Supabase dashboard SQL Editor — tables, RLS policies, triggers, seed data
2. **Test end-to-end** — login → booking flow, admin status updates, schedule view
3. **`proxy.ts`** — verify session refresh middleware is wired correctly (Next.js 16 uses `proxy.ts` not `middleware.ts`, export named `proxy` not `middleware`)

### Medium priority
4. **`app/contact/page.tsx`** — contact form not yet wired to any backend (UI-only)
5. **Cancellation from student side** — `ScheduleView.tsx` has "취소 요청" button that's a no-op
6. **`app/lessons/page.tsx`** — check if still uses `dummyLessons`, replace with Supabase query

### Low priority
7. **Error message string-matching** in `app/actions/auth.ts` (lines 23-28) — depends on exact Supabase error text, fragile
8. **`.env.local`** — not committed (correct), but new devs need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Key technical constraints (from CLAUDE.md)

- **Next.js 16**: `params` and `searchParams` are `Promise<...>` — always `await` them
- **Next.js 16**: middleware file is `proxy.ts`, export named `proxy` (not `middleware`)
- **Tailwind CSS v4**: use `@custom-variant dark` — no v3 syntax
- **React 19**: `useActionState` imported from `react` (not `react-dom`)
- **`redirect()`**: must be called **outside** try/catch blocks

---

## Suggested skills

- `/verify` — run the app and confirm booking flow, auth redirects, admin dashboard work end-to-end
- `/grill-me` — stress-test the cancellation flow design before implementing student-side cancel
- `/improve-codebase-architecture` — remaining friction: error message string-matching in auth.ts, lessons page still on dummy data

---

## File map (new/changed this session)

```
lib/
  auth.ts              NEW — requireAuth, requireAdmin
  calendar.ts          NEW — getDaysInMonth, getFirstDayOfMonth, toDateString, DAYS
  booking-status.ts    NEW — getAllowedTransitions, canTransitionTo, ALLOWED_TRANSITIONS
  booking-stats.ts     NEW — computeBookingStats

app/
  actions/
    auth.ts            MOD — next param support in login()
    booking.ts         NEW — createBooking (server validated) + updateBookingStatus
  booking/
    page.tsx           MOD — Server Component using requireAuth
    BookingWizard.tsx  NEW — client wizard, real Supabase slot fetch
  schedule/
    page.tsx           MOD — Server Component using requireAuth
    ScheduleView.tsx   NEW — client view, accepts bookings prop
  admin/
    page.tsx           MOD — Server Component using requireAdmin
    AdminDashboard.tsx NEW — client dashboard, computeBookingStats, getAllowedTransitions
  auth/
    login/page.tsx     MOD — hidden next input
```
