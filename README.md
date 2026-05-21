# Beat Studio 드럼교습소

Full-stack booking site for Beat Studio drum school. Students book lessons, non-members book practice rooms, admin manages everything from a dashboard.

**Live:** Vercel (deploy via `git push origin main`)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Email | Resend |
| Deploy | Vercel |

---

## Local Setup

**1. Clone & install**
```bash
git clone https://github.com/kds335/drum-lesson-homepage.git
cd drum-lesson-homepage
npm install
```

**2. Environment variables**

Create `.env.local` in the project root (never commit this file):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
CONTACT_EMAIL=email_to_receive_contact_form_submissions
```

**3. Database**

Run `supabase/schema.sql` in full in the Supabase SQL Editor.
Creates all tables, RLS policies, triggers, and seed data.

**4. Run dev server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Key Pages & Features

| Page | Path | Notes |
|---|---|---|
| Home | `/` | Studio intro, CTA |
| Lessons | `/lessons` | Lesson types + monthly packages (DB-managed) |
| Booking | `/booking` | Lesson booking form (auth required) |
| Practice | `/practice` | Practice room booking (open to all) |
| Contact | `/contact` | Contact form → email via Resend |
| Admin | `/admin` | Dashboard: bookings, students, practice, contacts, packages |
| Login / Signup | `/login`, `/signup` | Supabase Auth |

### Admin Dashboard Tabs
- **예약 관리** — confirm / cancel lesson bookings
- **수강생 관리** — view registered students
- **연습실 관리** — confirm / cancel practice room bookings
- **문의 관리** — mark contact submissions as read / replied
- **패키지 관리** — create / edit / delete / highlight monthly packages

---

## Project Structure

```
app/               Next.js App Router pages and server actions
  actions/         Server actions (auth, booking, practice, contact, packages)
  admin/           Admin dashboard (server page + client component)
lib/               Domain logic
  auth.ts          requireAuth / requireAdmin helpers
  booking-status.ts  State machine for booking transitions
  packages-repo.ts   CRUD for monthly_packages table
  parse-features.ts  Pure fn: textarea → string[]
  types.ts         All shared TypeScript types
supabase/
  schema.sql       Full DB schema — run once to set up
proxy.ts           Session refresh middleware (Next.js 16)
```

---

## Notes

- `proxy.ts` is the middleware file (not `middleware.ts`) — required by Next.js 16
- Admin role is set via `profiles.role = 'admin'` in Supabase directly
- Practice rooms are seeded; add more via the Supabase table editor or admin SQL
