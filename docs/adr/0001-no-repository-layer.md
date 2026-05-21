# No repository layer — inline DB access, purpose-named modules for invariants

Supabase is a permanent dependency with no planned swap; there is no caching layer and no DB-layer unit tests planned. A repository abstraction would add ceremony without leverage. Instead: trivial CRUD is inlined at the call site; when a DB operation enforces a non-trivial invariant, it gets a purpose-named module (`highlightPackage`, `admitLessonBooking`, `admitPracticeBooking`, `updateRecordStatus`) with an injected `QueryClient` duck type so the invariant can be tested in isolation.

## Considered Options

- **A — Full repos for all 7 tables.** Multiplies the shallow-module anti-pattern. Callers already express intent through action names; a repo layer adds a name-redundant hop.
- **B — Full removal including inlining the highlight invariant.** Scatters the only-one-highlighted enforcement across call sites with no seam to test against.
- **C — Repos only for `bookings` + `practice_bookings`.** Same inconsistency as the starting state, just different tables.
- **D (chosen) — Dissolve `packages-repo`, keep invariant logic in `highlight-package.ts`.** Resolves the inconsistency without ceremony; invariant has a test seam; trivial CRUD is readable inline.

## Consequences

- No `*-repo.ts` files. If a new invariant arises, add a purpose-named module matching the pattern of `lib/highlight-package.ts`, `lib/booking-intake.ts`, and `lib/record-status-action.ts` — injected `QueryClient`, returns typed result or throws.
- Raw `.from(...)` calls in actions are not a smell to fix; they are the intended pattern.
