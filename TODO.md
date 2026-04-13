# TODO — Hoddle Melbourne

Phase 1 scope: **Landing + Auth + Onboarding + Student Dashboard**. Everything else is parked until Phase 1 is shippable. See `CLAUDE.md` §5.

Format: `- [ ] task` for pending, `- [x] task` for done. Move completed items to `## Shipped` at the bottom and mirror in `docs/changelog.md`.

---

## 0. Foundations

- [ ] Install dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `react-hook-form`, `zod`, `@hookform/resolvers`, `clsx`, `tailwind-merge`, `lucide-react`
- [ ] Configure `next/font` for Plus Jakarta Sans (display) and Be Vietnam Pro (body)
- [ ] Wire design tokens from `docs/design.md` into `tailwind.config.ts` (colors, fontFamily, boxShadow, borderRadius)
- [ ] Add CSS custom properties for the full surface/primary/secondary/tertiary token set to `styles/globals.css`
- [ ] Set up `lib/supabase/server.ts` and `lib/supabase/browser.ts` clients
- [ ] Add `.env.local.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Configure ESLint + Prettier + TypeScript strict mode
- [ ] Set up `/supabase/migrations/` directory and initial migration
- [ ] Create route groups: `app/(marketing)`, `app/(auth)`, `app/(app)`

## 1. Design system primitives (`/components/ui`)

- [ ] `Button` — primary (blue), secondary (surface-container-highest), hero-gradient variants; 48px min height
- [ ] `Input` — 56px min height, gold focus ring, cream background
- [ ] `Textarea` — same treatment as Input
- [ ] `Card` — no borders, tonal layering, md radius, ambient blue-tinted shadow on hover
- [ ] `Tag` / `Chip` — primary-container and secondary-container variants
- [ ] `ProgressPill` — pill-style, secondary green fill on secondary-container track
- [ ] `GlassNav` wrapper — glassmorphism recipe from `docs/design.md` §2
- [ ] `Container` — page-width wrapper with editorial asymmetric padding
- [ ] Storybook-free smoke page at `/app/_dev/components` to eyeball every primitive

## 2. Database schema (Supabase)

- [ ] Migration: `profiles` table (id FK to auth.users, full_name, country_of_origin, university, year_of_study, role)
- [ ] Migration: `onboarding_responses` table (profile_id, goals[], challenges[], fields_of_interest[], created_at)
- [ ] Enable RLS on both tables; policies so users can only read/write their own row
- [ ] Trigger: auto-create `profiles` row on `auth.users` insert
- [ ] Generate TypeScript types → `lib/supabase/database.types.ts`
- [ ] Document the schema in `docs/database-schema.md`

## 3. Auth + onboarding flow

- [ ] Signup page — email magic link flow, editorial layout, photography hero
- [ ] Login page — same magic link flow
- [ ] Auth callback route handler at `app/auth/callback/route.ts`
- [ ] Middleware for session refresh across RSCs (`middleware.ts`)
- [ ] Protected route helper: redirect to `/login` if no session on `(app)` group
- [ ] Onboarding wizard — 5–7 question flow capturing background, goals, challenges
  - [ ] Step 1: Welcome + name
  - [ ] Step 2: Where are you from + which university
  - [ ] Step 3: What are your top 3 goals (multi-select)
  - [ ] Step 4: What are your biggest challenges (multi-select)
  - [ ] Step 5: Fields of interest (multi-select)
  - [ ] Review + submit → writes to `onboarding_responses`
- [ ] Zod schemas for each step in `lib/validation/onboarding.ts`
- [ ] Server action: `submitOnboarding` with `{ ok, data | error }` return shape
- [ ] Redirect post-onboarding to `/dashboard`

## 4. Landing page (`app/(marketing)/page.tsx`)

- [ ] Hero section — editorial headline in Plus Jakarta Sans display-lg, blue primary, cream-to-sky gradient backdrop
- [ ] Narrative section — the "Priya at 2am" story from the one-pager, asymmetric magazine layout
- [ ] Mentor preview strip — 3 placeholder mentor cards (real data in Phase 2)
- [ ] Value propositions — 3 tonal cards, no borders, photography-led
- [ ] CTA section — hero gradient button → `/signup`
- [ ] Glass nav at top
- [ ] Footer — minimal, on `surface-container-high`
- [ ] Reference screen: `docs/design/landing_page/screen.png`

## 5. Student dashboard (`app/(app)/dashboard/page.tsx`)

- [ ] Shell layout with glass nav + authenticated user menu
- [ ] Welcome block — greets user by name, pulls from `profiles`
- [ ] Goals summary card — echoes back the onboarding answers so the student feels "seen"
- [ ] Recommended mentors section — placeholder cards for Phase 2
- [ ] Progress pill showing onboarding completion / "your journey" framing
- [ ] Empty states for every section that will be filled in Phase 2 (content, forums, success stories)
- [ ] Reference screen: `docs/design/student_dashboard/screen.png`

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

_Nothing yet._