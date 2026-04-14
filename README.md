# Hoddle Melbourne

Mentorship platform for first-year international students in Melbourne. Mentors publish advice, host live Q&As, and share their stories. Students discover matched mentors, join community forums, and eventually graduate into mentors themselves.

**Version 1.0** — Phases 1 and 2 complete and deployed.

---

## What's in v1.0

- **Landing page** — editorial marketing site with mentor previews and value proposition
- **Auth** — email magic link (no passwords), Supabase-backed
- **Student onboarding** — 5-step wizard (name, university, goals, challenges, fields of interest)
- **Student dashboard** — matched mentor recommendations, latest content, registered sessions, forum activity
- **Mentor matching** — weighted-score algorithm (country, field, expertise overlap)
- **Mentor profiles** — public profiles with expertise chips, published content, upcoming sessions
- **Content library** — articles (rich text), videos (YouTube/Vimeo embed), downloadable resources
- **Community forums** — category-threaded discussions with two-level nesting and reactions
- **Success stories** — student-submitted, admin-moderated, editorial gallery
- **Live Q&A sessions** — scheduling, registration with capacity limits, anonymous questions
- **Notifications** — in-app bell with realtime badge + transactional email for all types
- **Admin panel** — invite mentors, verify profiles, moderate success stories

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC-first) |
| Language | TypeScript strict |
| Styling | Tailwind CSS v4 |
| Database | Supabase Postgres + Row Level Security |
| Auth | Supabase Auth — email magic link |
| Storage | Supabase Storage |
| Email | Resend |
| Rich text | Tiptap |
| Forms | react-hook-form + zod |
| Deployment | Vercel |

---

## Quick start

**Prerequisites:** Node 20+, pnpm, Docker Desktop, Supabase CLI.

```bash
git clone <repo-url> hoddle
cd hoddle
pnpm install
cp .env.local.example .env.local
```

Fill in `.env.local` (see [Environment variables](#environment-variables) below), then:

```bash
npx supabase start                          # start local Postgres + Auth (Docker required)
npx supabase db push                        # apply all migrations
npx supabase gen types typescript --local > lib/supabase/database.types.ts
pnpm dev
```

Open `http://localhost:3000`.

---

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL from Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon key from Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — server only, never expose client-side |
| `SUPABASE_ACCESS_TOKEN` | Local dev | CLI auth token for `supabase` commands |
| `RESEND_API_KEY` | Yes | From resend.com |
| `RESEND_FROM_EMAIL` | Yes | Verified sender address (e.g. `hello@hoddle.com.au`) |

All variables are documented in `.env.local.example`.

---

## Project structure

```
app/
  (marketing)/     Landing page, about — public, no auth required
  (auth)/          Login, signup, student + mentor onboarding wizards
  (app)/           Authenticated student + mentor surfaces
  (browse)/        Public mentor profiles, content, forums, stories, sessions
  (admin)/         Admin panel — role-gated (admin only)
  api/             Cron jobs, auth callbacks

components/
  ui/              Primitives: Button, Card, Input, Tag, Pagination
  patterns/        Composed: MentorCard, ContentCard, TiptapEditor, FollowButton
  layout/          Nav shells, notification bell, auth shell

lib/
  supabase/        Typed server + browser + admin clients
  actions/         All server actions (mutations)
  validation/      Zod schemas shared between forms and server actions
  matching/        Mentor recommendation algorithm
  email/           Resend templates
  utils/           Slug generation, rate limiting, video embeds

supabase/
  migrations/      SQL migration files — run in order
```

---

## Documentation

| File | Purpose |
|---|---|
| `docs/guide.md` | Full operator guide — setup, admin, mentors, students |
| `docs/architecture.md` | System architecture, rendering strategy, data layer |
| `docs/design.md` | Visual design system — colours, typography, tokens |
| `docs/database-schema.md` | All tables, RLS policies, enums, storage buckets |
| `docs/component-library.md` | Component inventory |
| `docs/changelog.md` | Version history |
| `CLAUDE.md` | Coding conventions and rules for AI assistants |
| `todo.md` | Phase task list |

---

## Deployment

Deploy to Vercel. Set all environment variables under **Project → Settings → Environment Variables**, using production Supabase credentials. Cron jobs in `vercel.json` activate automatically on the Vercel Pro plan.

See `docs/guide.md` for the full step-by-step deployment and admin walkthrough.
