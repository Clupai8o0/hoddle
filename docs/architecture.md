# Architecture — Hoddle Melbourne

## 1. High-level shape

Hoddle is a Next.js App Router application backed by Supabase. Rendering is server-first: most pages are React Server Components that read directly from Supabase using a server client bound to the request's cookies. Client Components are used only where interactivity demands it (forms, wizards, interactive dashboards).

```
   Browser
      │
      ▼
  Next.js (Vercel)
   ├── (marketing)  ─ public RSC pages, read-only
   ├── (auth)       ─ login / signup / onboarding
   ├── (app)        ─ authenticated RSC pages
   └── /api         ─ route handlers (webhooks, auth callback)
      │
      ▼
  Supabase
   ├── Auth          ─ email magic link
   ├── Postgres      ─ app data, RLS enforced
   └── Storage       ─ profile photos, content imagery
```

No separate backend service. No external ORM — Supabase's generated types are the contract.

---

## 2. Route groups

App Router route groups are used to share layouts without affecting the URL:

- **`app/(marketing)/`** — unauthenticated landing and marketing pages. Public. Uses the glass nav + editorial shell.
- **`app/(auth)/`** — login, signup, onboarding wizard. Minimal shell, no nav, heavy photography. Middleware redirects away to `/dashboard` if the user already has a session.
- **`app/(app)/`** — everything behind auth. Layout includes the authenticated nav with user menu. Middleware redirects to `/login` if no session.
- **`app/(admin)/`** — admin-only tools: mentor invitation, verification, story moderation. Layout enforces `profiles.role = 'admin'`; non-admins are redirected to `/dashboard`.
- **`app/api/`** — route handlers. Auth callback (`/api/auth/callback`) and Vercel cron endpoints (`/api/cron/*`).

Each group has its own `layout.tsx`, `error.tsx`, `loading.tsx`, and `not-found.tsx`, all styled on-brand (tonal layering for loading skeletons — no shimmer).

---

## 3. Rendering strategy

- **Default:** React Server Component. Reads data via `lib/supabase/server.ts`.
- **Client Component (`'use client'`):** only for interactive UI — forms, wizards, menus, any `useState`/`useEffect` need. Kept as leaf components so most of the tree stays on the server.
- **Streaming:** use `loading.tsx` and React Suspense boundaries around data-heavy sections of the dashboard so the shell paints immediately.
- **Caching:** rely on Next.js default fetch caching for public marketing pages; use `export const dynamic = 'force-dynamic'` for authenticated pages that read per-user data.

---

## 4. Supabase integration

Two clients, strictly separated:

**`lib/supabase/server.ts`** — used in Server Components, Server Actions, and route handlers. Binds to request cookies via `@supabase/ssr`'s `createServerClient`. Reads/writes the session cookie so auth state flows through the RSC tree.

**`lib/supabase/browser.ts`** — used in Client Components. Created once per browser session. Powers the Realtime subscription in `notification-bell.tsx` — subscribes to `postgres_changes` on the `notifications` table to keep the bell badge live without polling.

**`lib/supabase/admin.ts`** — service-role client (`createAdminClient()`). Used only in server-side privileged writes: `notify()`, `computeRecommendationsForProfile()`, and `notifyFollowersOfContent()`. These operations require bypassing RLS because they write rows on behalf of system actors, not the authenticated user. Never imported from `app/` or `components/`. The `SUPABASE_SERVICE_ROLE_KEY` env var is never exposed with the `NEXT_PUBLIC_` prefix.

**Middleware** — `middleware.ts` runs on every request, refreshes the session cookie if needed, and handles the `(app)` group redirect. This is the only place session refresh happens.

**Type safety** — after every migration, run `npx supabase gen types typescript --local > lib/supabase/database.types.ts` and commit the result. All queries are typed against this file.

---

## 5. Authentication flow

Phase 1 uses **email magic links only**. No password flow, no OAuth providers yet.

```
/signup (email submit)
    │
    ▼
Supabase sends magic link
    │
    ▼
User clicks link → /api/auth/callback?code=...
    │
    ▼
Server exchanges code for session, sets cookie
    │
    ▼
Redirect: first-time user → /onboarding
          returning user  → /dashboard
```

A `profiles` row is auto-created by a Postgres trigger on `auth.users` insert. The onboarding wizard writes to `onboarding_responses` and flips a `profiles.onboarded_at` timestamp; middleware uses that flag to decide whether to force the onboarding redirect.

---

## 6. Data layer conventions

- **Business logic lives in `/lib`**, never in components. A component calls a function from `lib/queries/` or invokes a server action from `lib/actions/`.
- **Queries:** `lib/queries/<domain>.ts` — typed read functions that take a server Supabase client and return `Promise<T>`.
- **Actions:** `lib/actions/<domain>.ts` — server actions marked `'use server'`, validated with Zod, returning `{ ok: true, data } | { ok: false, error: string }`.
- **Validation:** `lib/validation/<domain>.ts` — Zod schemas shared between client forms and server actions so validation logic isn't duplicated.
- **Row Level Security** is the source of truth for authorisation. Application code does not re-check ownership — if RLS would reject the query, the query should fail. This is non-negotiable.

---

## 7. Component architecture

Three tiers in `/components`:

1. **`/ui`** — primitives. Button, Input, Card, Tag, ProgressPill. No business logic, no data fetching. Props-in, markup-out. Built from the design tokens in `tailwind.config.ts`.
2. **`/patterns`** — composed, domain-aware components. MentorCard, ContentBlock, OnboardingStep. Can import from `/ui` but never from sibling patterns. Still no data fetching — data is passed in.
3. **`/layout`** — shells. GlassNav, AuthenticatedShell, MarketingShell, Footer. Can read from Supabase directly when needed (e.g. nav needs the current user).

See `docs/component-library.md` for the full inventory.

---

## 8. Styling

Tailwind CSS with design tokens wired through `tailwind.config.ts`. The full token set — colors, typography scale, shadows, radii — is defined in `docs/design.md` and mirrored into Tailwind's `theme.extend`. Components never use raw hex values; they reference the token name (e.g. `bg-surface`, `text-primary`, `shadow-ambient`).

CSS custom properties are declared in `styles/globals.css` as a fallback and for any dynamic theming work. Fonts are loaded via `next/font` so Google Fonts never ships a blocking request.

---

## 9. Environments

| Env var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | **Never** `NEXT_PUBLIC_`. Used only in admin scripts. |
| `NEXT_PUBLIC_SITE_URL` | client + server | Needed for magic link redirect |

All listed in `.env.local.example`. Production secrets live in Vercel's environment variables.

---

## 10. Deployment

- **Hosting:** Vercel, connected to the main Git branch.
- **Preview deploys** on every PR.
- **Supabase:** local stack via `supabase start` for development; a separate Supabase project for staging and production.
- **Migrations:** `supabase/migrations/` is the source of truth. Applied via `supabase db push` against staging, then production, from CI (Phase 2).

---

## 11. Phase 2 additions

### Cron jobs (Vercel)

Scheduled via `vercel.json`. Three jobs ship with Phase 2:

| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/session-reminders` | `0 * * * *` (hourly) | Sends 24h reminder emails to session registrants |
| `/api/cron/session-starting-soon` | `*/5 * * * *` (every 5 min) | Sends in-app notification 10–20 min before sessions start |
| `/api/cron/recompute-recommendations` | `0 16 * * *` (02:00 AEST) | Nightly full recompute of mentor recommendations for all onboarded students |

All cron routes validate the `CRON_SECRET` header before executing to prevent unauthorized calls.

### Matching algorithm

Pure-function scoring in `lib/matching/score.ts`. `scoreMentor(student, mentor)` returns a numeric score and human-readable `reasoning` string based on:

- Country of origin match: +30
- Field of interest overlap: +15 per overlap
- Challenges / goals overlap with mentor expertise: +10 per overlap
- Verified mentors only (pre-filter, not scored)

Results persisted to `mentor_recommendations` (top 5 per student, ranked). Triggered: at onboarding completion (fire-and-forget), and nightly for all students.

### Real-time notifications

`NotificationBell` (Client Component) subscribes to Supabase Realtime `postgres_changes` on the `notifications` table filtered by `recipient_id`. `INSERT` increments the badge; `UPDATE` where `read_at` is set decrements it. Initial count is server-rendered and passed as a prop so the badge is never empty on first paint.

### Follow system

Students can follow mentors. `mentor_follows` table stores the relationship. When a mentor publishes content, `notifyFollowersOfContent()` (admin client) fetches all followers and dispatches a `new_content_from_mentor_you_follow` notification to each.

### Rate limiting

`lib/utils/rate-limit.ts` implements DB row-count rate limiting — no external KV required. Counts rows inserted by a user in a rolling time window and returns `{ allowed, retryAfterSeconds }`. Applied to: forum post creation (10/10 min), story submission (3/60 min), session question submission (5/60 min). Fails open on DB error to avoid false positives.

---

## 12. Environments (updated)

| Env var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | **Never** `NEXT_PUBLIC_`. Admin client only. |
| `NEXT_PUBLIC_SITE_URL` | client + server | Magic link redirect base |
| `RESEND_API_KEY` | server only | Transactional email via Resend |
| `RESEND_FROM_EMAIL` | server only | From address (e.g. `hello@hoddle.com.au`) |
| `NEXT_PUBLIC_APP_URL` | client + server | Used in email template CTAs |
| `CRON_SECRET` | server only | Validates Vercel cron requests |

All listed in `.env.local.example`. Production secrets live in Vercel's environment variables.