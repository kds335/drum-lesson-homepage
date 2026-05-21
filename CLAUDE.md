# Beat Studio Drum School

## Working Directory
`C:\Users\bgr\homepage\1. 드럼교습소`

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
| `app/actions/packages.ts` | `createPackage` · `updatePackage` · `deletePackage` · `setHighlightedPackage` |
| `lib/highlight-package.ts` | `highlightPackage` — only-one-highlighted invariant for `monthly_packages` |
| `lib/booking-intake.ts` | `admitLessonBooking` · `admitPracticeBooking` — all booking admission (pure + DB) |
| `lib/record-status-action.ts` | `updateRecordStatus` — generic admin status-update helper |
| `lib/parse-features.ts` | `parseFeaturesInput(raw)` — textarea string → `string[]` (pure fn) |
| `app/auth/callback/route.ts` | Email verification callback |
| `lib/auth.ts` | `requireAuth(next?)` · `requireAdmin()` |
| `lib/booking-status.ts` | Generic state machine factory + `lessonBookingStateMachine` · `practiceBookingStateMachine` |
| `lib/booking-stats.ts` | `computeBookingStats(bookings)` |
| `lib/calendar.ts` | `getDaysInMonth` · `getFirstDayOfMonth` · `toDateString` · `DAYS` |
| `lib/types.ts` | All types incl. `MonthlyPackage` + practice room constants (`PRACTICE_*`) |
| `supabase/schema.sql` | Full DB schema — run in Supabase SQL Editor before first use |

## DB Tables
`profiles` · `lessons` · `schedules` · `bookings` · `practice_rooms` · `practice_bookings` · `monthly_packages`
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

## Environment Variables (never commit)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
CONTACT_EMAIL=
```

## remind.md Maintenance
After completing any task:
1. Remove the item from "Incomplete Features" or "Priority TODO" in remind.md if it is now done
2. Add any new known issues or fragile points discovered during the work
3. Keep remind.md reflecting current actual state — not historical record

Do not add this as a reminder to do manually — update remind.md as part of every task completion.
