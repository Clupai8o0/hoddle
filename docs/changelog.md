# Changelog

All notable changes to Hoddle Melbourne are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

When you finish a task in `todo.md`, add a line here under `## [Unreleased]` in the appropriate category (`Added`, `Changed`, `Fixed`, `Removed`, `Security`). When a phase ships, cut a version and move the entries under a dated heading.

---

## [Unreleased]

### Added
- Design system primitives: `Button` (primary/secondary/hero/ghost), `Input`, `Textarea`, `Card` (with sub-components), `Tag`, `ProgressPill`, `Avatar`, `Container`, `SectionDivider`, `GlassNav` + `NavLink`.
- `lib/utils/cn.ts` — clsx + tailwind-merge composition utility.
- Smoke test page at `/dev/components` rendering every primitive against the Hoddle token set.
- Phase 1 foundations: installed all dependencies (Supabase SSR, react-hook-form, zod, clsx, tailwind-merge, lucide-react, prettier).
- Full Hoddle design token set wired into Tailwind v4 `@theme` in `app/globals.css` (primary/secondary/tertiary/surface palette, shadow, radius, typography variables).
- Plus Jakarta Sans (display) and Be Vietnam Pro (body) configured via `next/font` in root layout.
- `lib/supabase/server.ts` and `lib/supabase/browser.ts` typed Supabase clients.
- `lib/supabase/database.types.ts` placeholder (regenerate after first migration).
- `.env.local.example` with required environment variable keys.
- Scaffolded route groups `app/(marketing)`, `app/(auth)`, `app/(app)`.
- `supabase/migrations/20260413000001_phase1_schema.sql` — Phase 1 schema: `user_role` enum, `profiles` table, `onboarding_responses` table, `updated_at` triggers, auth-user trigger, and full RLS policies.
- `lib/supabase/database.types.ts` updated with typed `profiles` and `onboarding_responses` rows (Insert/Update/Row + Enums). Re-run `npx supabase gen types typescript --local` once local Supabase is running.
- `supabase/migrations/` directory for upcoming schema migrations.
- `.prettierrc` with project formatting conventions.
- `CLAUDE.md` master briefing covering stack, design non-negotiables, conventions, and the documentation map.
- `todo.md` with Phase 1 scope (landing + auth + onboarding + student dashboard) and parked Phase 2 items.
- `docs/architecture.md` describing route groups, Supabase integration, auth flow, and component tiers.
- `docs/database-schema.md` documenting `profiles` and `onboarding_responses` tables with RLS policies.
- `docs/component-library.md` inventory of primitives, patterns, and layout shells.
- `docs/design.md` visual design system with Hoddle Blue primary palette.
- `docs/product-one-pager.md` product context reference.

### Changed
- Primary brand colour from terracotta `#a63c26` to Hoddle Blue `#1e3a5f`. Ambient shadows re-tinted to match.

---

## Template for future entries

```
## [0.1.0] — YYYY-MM-DD  ← Phase 1 ship

### Added
- Landing page at `/`
- Magic-link signup and login flows
- 5-step onboarding wizard writing to `onboarding_responses`
- Student dashboard at `/dashboard` with goals summary and empty states

### Changed
- …

### Fixed
- …

### Security
- Enabled RLS on `profiles` and `onboarding_responses`; verified cross-user isolation.
```