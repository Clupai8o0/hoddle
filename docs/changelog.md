# Changelog

All notable changes to Hoddle Melbourne are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

When you finish a task in `todo.md`, add a line here under `## [Unreleased]` in the appropriate category (`Added`, `Changed`, `Fixed`, `Removed`, `Security`). When a phase ships, cut a version and move the entries under a dated heading.

---

## [Unreleased]

_Phase 2 work in progress. See `todo.md`._

### Added
- Phase 2 dependencies installed: `@tanstack/react-query`, `date-fns`, `@tiptap/react`, `@tiptap/starter-kit`, `react-day-picker`, `resend`
- `lib/email/index.ts` — typed `sendEmail` wrapper around Resend SDK
- `.env.local.example` with `RESEND_API_KEY` and `RESEND_FROM_EMAIL` vars
- `components/providers/query-provider.tsx` — `QueryClientProvider` client wrapper; mounted in `app/(app)/layout.tsx`
- Route stubs for all Phase 2 surfaces: `/mentors`, `/content`, `/forums`, `/stories`, `/sessions`, `/inbox`
- `app/(admin)/layout.tsx` — admin-only layout; redirects non-admin users to `/dashboard`
- `app/(admin)/page.tsx` — admin home stub
- `AppNav` updated: Mentors, Library, Forums, Sessions links are now live `NavLink`s (replaced Phase 1 placeholder spans)

---

## [0.1.0] — 2026-04-13

### Added
- `CLAUDE.md` master briefing covering stack, design non-negotiables, conventions, and the documentation map.
- `docs/architecture.md` describing route groups, Supabase integration, auth flow, and component tiers.
- `docs/database-schema.md` documenting `profiles` and `onboarding_responses` tables with RLS policies.
- `docs/component-library.md` inventory of primitives, patterns, and layout shells.
- `docs/design.md` visual design system with Hoddle Blue primary palette.
- `docs/product-one-pager.md` product context reference.
- Project foundations: Next.js App Router + TypeScript + Tailwind, design tokens wired through Tailwind v4 `@theme`, Plus Jakarta Sans + Be Vietnam Pro via `next/font`.
- Supabase clients (server + browser) with `@supabase/ssr`, middleware-based session refresh, env scaffolding.
- Design system primitives: `Button`, `Input`, `Textarea`, `Card`, `Tag`, `ProgressPill`, `GlassNav`, `Container`, `Avatar`, `SectionDivider`.
- Schema: `profiles` and `onboarding_responses` tables with full RLS, auto-create trigger on `auth.users` insert, generated TypeScript types.
- Auth: magic-link signup and login, `/api/auth/callback` handler, protected route group middleware.
- Onboarding: 5-step wizard with Zod validation and `submitOnboarding` server action.
- Landing page at `/` with editorial hero, narrative section, mentor preview placeholders, value props, footer.
- Student dashboard at `/dashboard` with welcome block, goals summary, recommended mentors placeholder, progress pill, and empty states for Phase 2 sections.
- `app/not-found.tsx` — global 404 page styled on-brand with back-to-home and dashboard CTAs.
- `app/error.tsx`, `app/(app)/error.tsx`, `app/(auth)/error.tsx`, `app/(marketing)/error.tsx` — per-route-group error boundaries with try-again and navigation fallbacks.
- `app/(app)/dashboard/loading.tsx` — dashboard loading skeleton using tonal surface layering with `animate-pulse`; no shimmer.
- `app/opengraph-image.tsx` — edge-rendered 1200×630 OG image using Hoddle Blue and cream palette.
- `lib/analytics.ts` — analytics stub (`trackEvent`, `identifyUser`, `trackPageView`) ready for Phase 2 provider wiring.
- Root layout metadata extended with `openGraph`, `twitter`, `robots`, `metadataBase`, and `title.template`.
- Design tokens `--color-primary-dark`, `--color-primary-mid`, `--color-primary-elevated` added to `@theme` for editorial gradient ramp.

### Changed
- Primary brand colour from terracotta `#a63c26` to Hoddle Blue `#1e3a5f`. Ambient shadows re-tinted to match.
- `middleware.ts` renamed to `proxy.ts` and export renamed to `proxy` (Next.js 16 convention).
- All hardcoded hex values in components replaced with CSS custom properties; `opengraph-image.tsx` exempted (Satori limitation).
- Icon policy: `lucide-react` permitted for functional UI only (`strokeWidth={1.5}`). Decorative/illustrative use remains photography-led.

### Security
- Row Level Security enabled on `profiles` and `onboarding_responses`. Cross-user isolation verified.
- `SUPABASE_SERVICE_ROLE_KEY` confined to server-only admin scripts; never exposed with `NEXT_PUBLIC_` prefix.
- RLS verified in migration: `onboarding_responses` select/insert/update policies all use `auth.uid() = profile_id`; no policy for delete (default deny).

---

## Template for future entries

```
## [0.2.0] — YYYY-MM-DD  ← Phase 2 ship

### Added
- Mentor profiles, mentor dashboard, admin invite flow
- Content library, article reader, Tiptap editor
- Community forums with categories, threads, replies, reactions
- Success stories gallery with admin moderation
- Live Q&A scheduling with registration and question submission
- Notifications (in-app bell + email via Resend)
- Matching algorithm v1 with weighted scoring

### Changed
- Student dashboard now surfaces real recommendations, content, and session activity (replaces Phase 1 placeholders)

### Security
- RLS enabled on all new tables; admin role enforcement on `(admin)` route group
```
