# TODO — Hoddle Melbourne

Phase 1 scope: **Landing + Auth + Onboarding + Student Dashboard**. Everything else is parked until Phase 1 is shippable. See `CLAUDE.md` §5.

Format: `- [ ] task` for pending, `- [x] task` for done. Move completed items to `## Shipped` at the bottom and mirror in `docs/changelog.md`.

---

## 0. Foundations

- [x] Install dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `react-hook-form`, `zod`, `@hookform/resolvers`, `clsx`, `tailwind-merge`, `lucide-react`
- [x] Configure `next/font` for Plus Jakarta Sans (display) and Be Vietnam Pro (body)
- [x] Wire design tokens via Tailwind v4 `@theme` in `app/globals.css` (colors, fonts, shadow, radius) — note: project uses Tailwind v4 CSS-first config, not `tailwind.config.ts`
- [x] Add CSS custom properties for the full surface/primary/secondary/tertiary token set to `app/globals.css`
- [x] Set up `lib/supabase/server.ts` and `lib/supabase/browser.ts` clients
- [x] Add `.env.local.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] Configure ESLint + Prettier + TypeScript strict mode
- [x] Set up `/supabase/migrations/` directory
- [x] Create route groups: `app/(marketing)`, `app/(auth)`, `app/(app)`

## 1. Design system primitives (`/components/ui`)

- [x] `Button` — primary (blue), secondary (surface-container-highest), hero-gradient variants; 48px min height
- [x] `Input` — 56px min height, gold focus ring, cream background
- [x] `Textarea` — same treatment as Input
- [x] `Card` — no borders, tonal layering, md radius, ambient blue-tinted shadow on hover
- [x] `Tag` / `Chip` — primary-container and secondary-container variants
- [x] `ProgressPill` — pill-style, secondary green fill on secondary-container track
- [x] `Avatar` — initials fallback, sm/md/lg sizes
- [x] `SectionDivider` — semantic whitespace, 48px/64px
- [x] `GlassNav` wrapper + `NavLink` — glassmorphism recipe from `docs/design.md` §2
- [x] `Container` — page-width wrapper with editorial asymmetric padding
- [x] Smoke page at `app/dev/components` → `/dev/components`

## 2. Database schema (Supabase)

- [x] Migration: `profiles` table (id FK to auth.users, full_name, country_of_origin, university, year_of_study, role)
- [x] Migration: `onboarding_responses` table (profile_id, goals[], challenges[], fields_of_interest[], created_at)
- [x] Enable RLS on both tables; policies so users can only read/write their own row
- [x] Trigger: auto-create `profiles` row on `auth.users` insert
- [x] Generate TypeScript types → `lib/supabase/database.types.ts` (hand-written; re-run `npx supabase gen types typescript --local` once local Supabase is running)
- [x] Document the schema in `docs/database-schema.md`

## 3. Auth + onboarding flow

- [x] Signup page — email magic link flow, editorial layout, photography hero
- [x] Login page — same magic link flow
- [x] Auth callback route handler at `app/api/auth/callback/route.ts`
- [x] Middleware for session refresh across RSCs (`middleware.ts`)
- [x] Protected route helper: redirect to `/login` if no session on `(app)` group
- [x] Onboarding wizard — 5-step flow capturing background, goals, challenges
  - [x] Step 1: Welcome + name
  - [x] Step 2: Where are you from + which university
  - [x] Step 3: What are your top 3 goals (multi-select chips)
  - [x] Step 4: What are your biggest challenges (multi-select chips)
  - [x] Step 5: Fields of interest + submit
- [x] Zod schemas for each step in `lib/validation/onboarding.ts`
- [x] Server action: `submitOnboarding` with `{ ok, data | error }` return shape
- [x] Redirect post-onboarding to `/dashboard`

## 4. Landing page (`app/page.tsx`)

- [x] Hero section — editorial headline, cream-to-sky gradient backdrop, asymmetric 7/12 + 5/12 grid
- [x] Narrative section — "Priya at 2am" story, asymmetric magazine layout with sticky pull-quote
- [x] Mentor preview strip — 3 placeholder mentor cards (Raj, Sarah, Minh) with tonal photo placeholders
- [x] Value propositions — 3-step bento grid (Tell / Match / Grow), tonal surface cards
- [x] CTA section — hero gradient button → `/signup`
- [x] Glass nav at top with Log in + Get started actions
- [x] Footer — minimal, on `surface-container-high`, 4-column grid
- [x] `Button` updated with `asChild` support via `@radix-ui/react-slot`

## 5. Student dashboard (`app/(app)/dashboard/page.tsx`)

- [x] Shell layout with glass nav + authenticated user menu
- [x] Welcome block — greets user by name, pulls from `profiles`
- [x] Goals summary card — echoes back the onboarding answers so the student feels "seen"
- [x] Recommended mentors section — placeholder cards for Phase 2
- [x] Progress pill showing onboarding completion / "your journey" framing
- [x] Empty states for every section that will be filled in Phase 2 (content, forums, success stories)
- [ ] Reference screen: `docs/design/student_dashboard/screen.png`

## 5b. Photography — swap gradient placeholders with generated images

All prompts are inline in code as `IMAGE NEEDED` comments. Generate with Midjourney / DALL-E / Flux, apply post-processing from `docs/design.md §7`, then drop into `public/images/` and replace the gradient `<div>` with `<Image>`.

- [ ] `public/images/hero-laneway-cafe.webp` — hero panel, `app/page.tsx`
      Prompt in code. Alt: "A student working at a Melbourne laneway café"
- [ ] `public/images/mentor-portrait-raj.webp` — Raj card, `app/page.tsx`
      Prompt in code. Male, Indian background, smart-casual, café bokeh.
- [ ] `public/images/mentor-portrait-sarah.webp` — Sarah card, `app/page.tsx`
      Prompt in code. Female, Chinese background, smart-casual, café bokeh.
- [ ] `public/images/mentor-portrait-minh.webp` — Minh card, `app/page.tsx`
      Prompt in code. Male, Vietnamese background, smart-casual, café bokeh.
- [ ] `public/images/auth-tram-portrait.webp` — auth shell left panel, `components/layout/auth-shell.tsx`
      Prompt in code. Student on Melbourne tram, rain on window.
- [ ] `public/images/onboarding-step-illustration.webp` — onboarding sidebar, `app/(auth)/onboarding/page.tsx`
      Prompt in code. Hands holding coffee mug, city map on table.
- [ ] `public/images/empty-state-journal.webp` — content library empty state, `app/(app)/dashboard/page.tsx`
      Prompt in code. Open journal on desk, flat white, potted succulent. Overhead shot.
- [ ] `public/images/empty-state-botanic.webp` — forums empty state, `app/(app)/dashboard/page.tsx`
      Prompt in code. Empty bench, Royal Botanic Gardens Melbourne, dappled sunlight.
- [ ] `public/images/empty-state-library.webp` — success stories empty state, `app/(app)/dashboard/page.tsx`
      Prompt in code. Students at State Library of Victoria reading room timber table.

Post-generation checklist (per `docs/design.md §7`):
- [ ] Colour grade: highlights → cream `#fef8f1`, shadows → Hoddle Blue `#001842`
- [ ] Crop asymmetrically (subjects on editorial thirds)
- [ ] Export WebP at quality 80 — hero max 200 KB, mentor cards max 80 KB
- [ ] Replace gradient `<div>` placeholders with `<Image>` (next/image) + correct alt text

## 6. Cross-cutting

- [ ] Error boundary + `not-found.tsx` + `error.tsx` in each route group, styled on-brand
- [ ] Loading skeletons using tonal layering (not shimmer)
- [ ] Metadata / OG images for landing page
- [ ] Basic analytics stub (to be wired in Phase 2)
- [ ] Accessibility audit: keyboard nav through every Phase 1 flow, contrast check against cream

## 7. Pre-ship checks

- [ ] `pnpm build` passes with no TS errors
- [ ] All Phase 1 routes work end-to-end: land → sign up → onboard → dashboard
- [ ] RLS verified: a second test user cannot read the first user's `onboarding_responses`
- [ ] Mobile responsive at 375px, 768px, 1280px
- [ ] No hardcoded hex values in any component (grep check)
- [ ] No `#ffffff` or `#000000` anywhere in source
- [ ] Update `docs/changelog.md` for Phase 1 release

---

## Phase 2 (parked — do not start)

- Mentor profiles + mentor dashboard
- Content library + article reader
- Community forums + forum threads
- Success stories gallery
- Live Q&A sessions
- Mentor verification badges
- Email notification system

---

## Shipped

### Phase 1 — Foundations (2026-04-13)
- Installed all Phase 1 dependencies (Supabase SSR, react-hook-form, zod, clsx, tailwind-merge, lucide-react)
- Configured Plus Jakarta Sans + Be Vietnam Pro via `next/font`
- Wired full Hoddle design token set into Tailwind v4 `@theme` (all colors, shadow, radius, fonts)
- Set up `lib/supabase/server.ts` and `lib/supabase/browser.ts` with typed Database generics
- Added `.env.local.example`
- Configured Prettier
- Scaffolded route groups `(marketing)`, `(auth)`, `(app)` and `supabase/migrations/`