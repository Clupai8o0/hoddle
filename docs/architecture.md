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
- **`app/api/`** — route handlers. Phase 1 only needs `/api/auth/callback` for the Supabase email link exchange.

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

**`lib/supabase/browser.ts`** — used in Client Components. Created once per browser session. Safe for client-side subscriptions and real-time if needed.

**Service role client** — only inside `scripts/` and server-only admin utilities. Never imported from `app/` or `components/`. The `SUPABASE_SERVICE_ROLE_KEY` env var is never exposed with the `NEXT_PUBLIC_` prefix.

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

## 11. Out of scope for this document

Mentor workflows, content publishing, forum moderation, real-time Q&A, notifications, analytics. These land in Phase 2 and will each extend this document when they arrive.