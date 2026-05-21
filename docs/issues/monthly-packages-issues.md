# Monthly Packages Admin — Issue Breakdown

Parent PRD: [`docs/prd/monthly-packages-admin.md`](../prd/monthly-packages-admin.md)

Six vertical-slice issues. Implement in dependency order. All AFK. Slice 7 (tests) from the draft was deferred per the PRD's "test infrastructure introduction is out of scope" decision.

## Dependency Graph

```
1 (public read swap)
└── 2 (admin read-only tab)
    ├── 3 (admin create)
    │   └── 4 (admin edit)
    ├── 5 (admin delete)
    └── 6 (admin highlight invariant)
```

Recommended implementation order: **1 → 2 → 3 → 4 → 5 → 6**. Slices 5 and 6 only require Slice 2, so they can run in parallel with 3/4 if multiple agents pick up work.

---

## Issue 1 — Public lessons page reads packages from DB

### Parent

PRD: `docs/prd/monthly-packages-admin.md`

### What to build

Move the monthly packages out of the static `lib/packages.ts` array and into a new Supabase table, then make the public `/lessons` page render from the table instead of the array. The visual output of `/lessons` must be identical to the current behavior at the moment the slice merges, because the schema migration seeds the same three packages (베이직, 스탠다드, 프리미엄) that are currently hardcoded.

Schema shape (from the design conversation, encodes the locked-in decisions):

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

RLS policies mirror the `lessons` table: public read, admin manage. The `MonthlyPackage` type moves into `lib/types.ts` alongside other domain types, and `lib/packages.ts` is deleted. The public page hides the entire "월정액 패키지" section when the table is empty.

### Acceptance criteria

- [ ] `supabase/schema.sql` defines the `monthly_packages` table with the columns and checks above
- [ ] RLS is enabled on the table with `anyone can view monthly_packages` and `admins can manage monthly_packages` policies
- [ ] Schema seeds the existing three packages, with 스탠다드 highlighted, using `on conflict do nothing`
- [ ] `MonthlyPackage` type is defined in `lib/types.ts`
- [ ] `lib/packages.ts` is deleted; no remaining imports reference it
- [ ] `/lessons` page fetches packages via the server Supabase client and orders by `price asc`
- [ ] The "월정액 패키지" section does not render when the fetch returns zero rows
- [ ] After running the updated schema in Supabase, `/lessons` displays the same three packages in the same order with the same highlight as before the change
- [ ] CLAUDE.md key-files table and DB tables list are updated to reflect the new file layout and table

### Blocked by

None — can start immediately.

---

## Issue 2 — Admin read-only "패키지 관리" tab

### Parent

PRD: `docs/prd/monthly-packages-admin.md`

### What to build

Add a fifth tab to the admin dashboard labeled "패키지 관리" that lists all monthly packages in a table view. This slice is read-only — no create, edit, delete, or highlight controls yet. The admin can see every package's name, session count, price, feature bullets, highlighted flag, and creation date. The order matches the public page (price ascending).

The admin page server component fetches packages alongside the existing bookings/students/practice/contacts queries and passes them to the dashboard.

### Acceptance criteria

- [ ] Admin dashboard has a fifth tab labeled "패키지 관리" alongside the existing four
- [ ] `app/admin/page.tsx` fetches packages from `monthly_packages` ordered by `price asc`
- [ ] Packages render in a table showing name, sessions, price (formatted via `formatPrice`), features (multi-line or condensed list), and highlighted flag
- [ ] Empty state matches the visual style of other admin tabs (icon + "패키지가 없습니다" message)
- [ ] Tab is reachable only by admins (gated by the existing `requireAdmin` on the admin page)

### Blocked by

- Issue 1 (table must exist before the admin can read from it)

---

## Issue 3 — Admin can create a package

### Parent

PRD: `docs/prd/monthly-packages-admin.md`

### What to build

Add a "추가" button on the 패키지 관리 tab that reveals an inline create form. The form collects name, sessions, price, features (textarea, one bullet per line), and submits via a server action. On success the new package appears in the list and on `/lessons` after revalidation. The `highlighted` field is **not** exposed in the create form — new packages are always created with `highlighted=false`. Highlighting is a separate action delivered in Issue 6.

This slice introduces three new modules:

- **`monthlyPackagesRepo`** — a new module that owns all DB access to `monthly_packages`. This slice implements `list()` and `create(input)`. Later slices add `update`, `delete`, and `setHighlighted`.
- **`parseFeaturesInput(raw: string): string[]`** — pure function that splits a textarea string on newlines, trims, drops empties. Single source of truth for textarea → features-array normalization.
- **`app/actions/packages.ts`** — server actions file. This slice adds `createPackage`, which calls `requireAdmin()`, parses `FormData`, validates, calls `monthlyPackagesRepo.create`, and `revalidatePath('/lessons')` + `revalidatePath('/admin')`.

Validation rules:
- `name` non-empty after trim
- `sessions` positive integer
- `price` non-negative integer
- `features` may be empty array

Validation errors return a string via `useActionState`, matching the `submitContact` pattern in `app/actions/contact.ts`.

### Acceptance criteria

- [ ] "추가" button on the 패키지 관리 tab reveals an inline form
- [ ] Form fields: name (text), sessions (number), price (number), features (textarea)
- [ ] Submit button is disabled during the transition (no double-submit)
- [ ] Successful submit closes the form, the new row appears in the admin list, and revalidation refreshes `/lessons`
- [ ] Validation errors display next to the form without losing user input
- [ ] New packages always start with `highlighted=false` (no checkbox in the create form)
- [ ] `monthlyPackagesRepo` exists as a module with `list` and `create`
- [ ] `parseFeaturesInput` is implemented as a pure function in its own module
- [ ] `createPackage` action calls `requireAdmin` before any DB write

### Blocked by

- Issue 2 (admin tab must exist to host the create button)

---

## Issue 4 — Admin can edit a package

### Parent

PRD: `docs/prd/monthly-packages-admin.md`

### What to build

Each row in the 패키지 관리 tab gains an inline-edit affordance (expandable row or "수정" button revealing the same form layout as Issue 3) that lets the admin update name, sessions, price, and features. Submitting calls an `updatePackage` server action that goes through `monthlyPackagesRepo.update`. The `highlighted` field is **not** edited through this form — it is owned by the `setHighlightedPackage` action introduced in Issue 6.

### Acceptance criteria

- [ ] Each package row has an edit affordance that reveals a populated form
- [ ] Form pre-fills with the row's current name, sessions, price, and features
- [ ] Features textarea displays the existing bullets one per line
- [ ] Submitting calls `updatePackage`, which validates and persists via `monthlyPackagesRepo.update`
- [ ] After save, the row reflects the new values without a full page reload
- [ ] `/lessons` reflects the change after revalidation
- [ ] Cancel button discards changes and closes the form
- [ ] Edit form does not expose `highlighted`

### Blocked by

- Issue 3 (form components, validation, and parsing are shared)

---

## Issue 5 — Admin can delete a package

### Parent

PRD: `docs/prd/monthly-packages-admin.md`

### What to build

Each package row gains a delete control. Clicking it triggers a `window.confirm('삭제하시겠습니까?')` (or equivalent confirmation). If confirmed, a `deletePackage` server action calls `monthlyPackagesRepo.delete` and revalidates `/lessons` and `/admin`. Deletion is hard — there is no soft-delete column. After delete, the row vanishes from the admin list and the public page.

### Acceptance criteria

- [ ] Each row has a delete button visually distinct from other actions
- [ ] Clicking delete shows a confirmation prompt; dismissing it does nothing
- [ ] Confirming the prompt removes the row from the database
- [ ] After delete, both the admin list and `/lessons` no longer show the package
- [ ] Delete action calls `requireAdmin` before any DB write
- [ ] `monthlyPackagesRepo.delete` is implemented

### Blocked by

- Issue 2 (admin tab must exist to host the delete button). Independent of Issues 3 and 4.

---

## Issue 6 — Admin can highlight exactly one package

### Parent

PRD: `docs/prd/monthly-packages-admin.md`

### What to build

Each package row gains a highlight toggle (star icon or radio-style button). Clicking it on a non-highlighted row calls `setHighlightedPackage(id)`, which routes to `monthlyPackagesRepo.setHighlighted(id)`. That repo method enforces the **only-one-highlighted invariant**: the target row becomes `highlighted=true` and every other row becomes `highlighted=false`. The operation is atomic if PostgREST permits; otherwise a sequential "unset all → set target" is acceptable (brief zero-highlighted window is preferable to a two-highlighted state).

Clicking the toggle on an already-highlighted row is a no-op (idempotent). There is no "unhighlight" button — the only way to remove the badge from a package is to highlight a different one.

The public `/lessons` page renders the `highlighted=true` row with the existing 인기 badge styling. No public-side change is required beyond what Issue 1 already delivered, since the same `highlighted` column drives both surfaces.

### Acceptance criteria

- [ ] Each row in the admin list has a highlight toggle that visually indicates current state
- [ ] Clicking the toggle on a non-highlighted row makes that row highlighted and unsets every other row
- [ ] Clicking the toggle on the currently-highlighted row is a no-op (no error, no state change)
- [ ] After the toggle, only one row in the table has `highlighted=true`
- [ ] `/lessons` reflects the new highlighted package after revalidation
- [ ] `setHighlightedPackage` action calls `requireAdmin` before any DB write
- [ ] The `updatePackage` action from Issue 4 does not accept a `highlighted` value (defense against bypassing the invariant)

### Blocked by

- Issue 2 (admin tab must exist to host the highlight toggle). Independent of Issues 3, 4, and 5.

---

## Deferred

**Issue 7 — Unit + integration tests** for `parseFeaturesInput` and `setHighlighted` invariant. Deferred per PRD decision to not introduce test infrastructure in this PRD. Pick up when a second testable module appears, or when test infra is added by another initiative.
