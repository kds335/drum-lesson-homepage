# Beat Studio Drum School

## Behavior Rules
- State assumptions before coding; ask if uncertain
- Implement only what was asked — no speculative features
- Preserve existing code style; don't touch unrelated code
- Call `redirect()` **outside** try/catch blocks
- **NEVER commit `.env.local`** — contains Supabase secrets

## Stack
- Next.js 16 (App Router) — many breaking changes; check `node_modules/next/dist/docs/` when unsure
- Tailwind CSS v4 — use `@custom-variant dark`; v3 syntax forbidden
- Supabase — `@supabase/ssr` / browser: `lib/supabase/client.ts` / server: `lib/supabase/server.ts`
- React 19 — import `useActionState` from `react` (not `react-dom`)

## Next.js 16 Breaking Changes
- Middleware file: `proxy.ts` — export named `proxy`, not `middleware`
- `params` and `searchParams` are both `Promise<...>` — always `await` them
- `useSearchParams()` components must be wrapped in `<Suspense>` — required for Vercel build

## Git
- Branch: `main` (not master)
- Push: `git push origin main`

## Key Files
| File | Role |
|---|---|
| `proxy.ts` | Session refresh middleware |
| `app/actions/auth.ts` | Login · signup · logout (supports `next` redirect param) |
| `app/actions/booking.ts` | `createBooking` (server-validated) · `updateBookingStatus` |
| `app/actions/practice.ts` | `createPracticeBooking` · `updatePracticeBookingStatus` |
| `app/actions/contact.ts` | `submitContact` — honeypot, saves to `contacts` table, sends via Resend |
| `app/auth/callback/route.ts` | Email verification callback |
| `lib/auth.ts` | `requireAuth(next?)` · `requireAdmin()` |
| `lib/booking-status.ts` | Status state machine — `canTransitionTo` · `ALLOWED_TRANSITIONS` |
| `lib/booking-stats.ts` | `computeBookingStats(bookings)` |
| `lib/calendar.ts` | `getDaysInMonth` · `getFirstDayOfMonth` · `toDateString` · `DAYS` |
| `lib/types.ts` | All types + practice room constants (`PRACTICE_*`) |
| `supabase/schema.sql` | Full DB schema — run in Supabase SQL Editor before first use |

## DB Tables
`profiles` · `lessons` · `schedules` · `bookings` · `practice_rooms` · `practice_bookings`
— All tables have RLS enabled. Admin check via `get_user_role()`.

## Supabase Client Rules
- Server Components / Server Actions → `lib/supabase/server.ts` (`createClient()`)
- Client Components → `lib/supabase/client.ts` (`createBrowserClient()`)
- Never mix them — server client in browser context breaks cookie access

## Booking Status Transitions
```
pending → confirmed, cancelled
confirmed → cancelled
cancelled → confirmed   ← intentional (re-activation allowed)
```
Same state machine used for both lesson bookings and practice room bookings.

## Practice Room Business Rules
- Hours: 09:00–21:00 (`PRACTICE_OPEN_HOUR=9`, `PRACTICE_CLOSE_HOUR=21`)
- 1 slot = 1 hour fixed (`end_hour = start_hour + 1`)
- Non-member: `amount = 20,000 KRW`
- Member (logged in): free (`amount = 0`), max 2 hrs/day
- Slot availability via RPC `get_practice_slots(date)` — no PII exposed

## Known Incomplete / Fragile
- `ScheduleView.tsx` line 150 — "취소 요청" button is a no-op

## Environment Variables (never commit)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
CONTACT_EMAIL=
```
