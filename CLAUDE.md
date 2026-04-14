# CLAUDE.md — Hoddle Melbourne

This file is the master briefing for Claude Code when working in this repository. Read it before making changes. When in doubt, re-read the relevant doc in `/docs` rather than guessing.

---

## 1. What Hoddle is

Hoddle Melbourne is a mentorship platform connecting first-year international students in Melbourne with high-achieving mentors who have overcome similar challenges. The product is **one-to-many mentorship** — not 1:1 tutoring and not a job board. Mentors publish advice, host Q&As, and tell their story; students consume that content, ask questions in forums, track their own progress, and eventually graduate into sharing their own success stories.

Full product context: [`docs/product-one-pager.md`](./docs/product-one-pager.md).

**Audience:** first-year international students in Melbourne (primary), high-achieving senior-student mentors (secondary).
**Tone:** warm, editorial, human — never corporate EdTech. See `docs/design.md`.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js (App Router)** |
| Language | **TypeScript** (strict mode) |
| Styling | **Tailwind CSS** |
| Backend | **Supabase** — Postgres, Auth, Storage, Row Level Security |
| Forms | `react-hook-form` + `zod` |
| Data fetching | React Server Components by default; `@tanstack/react-query` only for client-side interactive data |
| Icons | **`lucide-react`** — functional UI only (nav, form controls, menu toggles). `strokeWidth={1.5}`. Photography, not icons, for hero/illustrative moments |
| Fonts | Plus Jakarta Sans (display), Be Vietnam Pro (body) via `next/font` |
| Deployment | Vercel |

### Directory layout

```
/app
  /(marketing)          # public: landing, about, apply
  /(auth)               # login, signup, onboarding flow
  /(app)                # authenticated: dashboard, mentors, forums, profile
  /api                  # route handlers (webhooks, server actions fallback)
/components
  /ui                   # primitive components (Button, Card, Input, Tag)
  /patterns             # composed components (MentorCard, ContentBlock, ProgressPill)
  /layout               # Nav, Footer, Shell
/lib
  /supabase             # server + browser clients, typed queries
  /validation           # zod schemas shared by forms + server actions
  /utils
/docs                   # all project documentation (see §6)
/public
  /images               # brand photography, og images
/styles
  globals.css           # Tailwind layers + CSS variables from design.md
```

**Rule:** business logic lives in `/lib`, never in components. Components render; lib decides.

---

## 3. Design system — non-negotiables

The full spec is in [`docs/design.md`](./docs/design.md). Before writing any UI code, read it. The rules below are the ones that are most often violated and must never be broken:

1. **Never use `#ffffff` for page backgrounds.** The foundation is cool gray `#f5f7fa` (`surface`). Pure white (`#ffffff`) is only permitted as `surface-container-lowest` — top-layer cards.
2. **Never use `#000000` for text.** Use `on-surface` `#1a2035`.
3. **No warm or orange-tinted colors anywhere.** The entire palette lives on the blue-gray axis. Warm tones fight the Hoddle Blue brand color.
4. **No 1px solid borders for sectioning.** Use background tonal shifts or 48–64px whitespace.
5. **Icons are functional, never decorative.** Use `lucide-react` at `strokeWidth={1.5}` for nav, form controls, and menu toggles. Hero visuals, empty states, and mentor context use cropped photography.
6. **Primary is Hoddle Blue `#001842`** — deep, desaturated, editorial. Never bright/electric blue.
7. **Botanical green `#2d6a4f` is reserved** for verified-mentor, success, and progress signals. Do not use it decoratively.
8. **Shadows are blue-tinted and diffused:** `0 12px 40px rgba(0, 24, 66, 0.10)`. Default CSS drop shadows are banned.
9. **Asymmetric layouts are encouraged** — Hoddle is an editorial journal, not a dashboard template.

All design tokens are defined in the `@theme` block in `app/globals.css` (Tailwind CSS v4 — there is no `tailwind.config.ts`). They are referenced as Tailwind utility classes (`bg-surface`, `text-on-surface`, etc.). Never hardcode hex values in components.

### Photography placeholders

Whenever a component needs a photo that doesn't exist yet, **do both of the following — never skip either step:**

1. **Leave an `IMAGE NEEDED` comment** directly above the placeholder `<div>` (not in a separate file). The comment must include:
   - Target path: `public/images/kebab-case-name.webp`
   - Full generation prompt drawn from `docs/design.md §7` (including the general style modifiers)
   - Alt text the `<Image>` tag will use
   - Export spec: format (WebP), quality, max file size, crop guidance

2. **Add a checklist item to `todo.md §5b`** (create the section if it doesn't exist) with the filename, source component, and a reference to the inline prompt.

The post-generation checklist in `todo.md §5b` must always include:
- Colour grade (highlights → cool off-white `#f5f7fa`, shadows → Hoddle Blue `#001842`)
- Asymmetric crop (subjects on editorial thirds)
- Export at WebP quality 80 — hero images max 200 KB, card images max 80 KB
- Replace gradient `<div>` placeholder with `<Image>` (next/image) and correct alt text

---

## 4. Supabase conventions

- Three clients — use the right one:
  - `lib/supabase/server.ts` — RSC and server actions (uses cookies, respects RLS). Default choice.
  - `lib/supabase/browser.ts` — client components only.
  - `lib/supabase/admin.ts` — service role, **bypasses RLS**. Only for system tasks (cron jobs, notifications, post-auth setup). Never import in client components or expose to the browser.
- **Row Level Security is on for every table.** No exceptions. Policies live in `/supabase/migrations/`.
- Auth flows use Supabase Auth with email magic links for students. Mentors are invite-only (admin sends invite → mentor accepts → admin verifies). Prospective mentors can express interest via `/apply`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It is used only in server-side code via the admin client.
- Database types are generated: `npx supabase gen types typescript --local > lib/supabase/database.types.ts`. Regenerate after every migration.
- Schema reference: [`docs/database-schema.md`](./docs/database-schema.md).

---

## 5. Build phases

**Phase 1 (shipped v0.1.0):** Landing + Auth + Onboarding + Student Dashboard.

**Phase 2 (shipped v0.2.0):** Mentor profiles + dashboard, Content library, Forums, Success stories, Live Q&A, Notifications, Matching algorithm v1.

**v1.0 (current release):** All Phase 1 + Phase 2 features, plus: mentor application form (`/apply`), updated marketing pages (homepage, about with team section), cool blue-gray design palette, operator guide and README. This is the version being deployed to production.

**Phase 3 (not started — future):** Badges & tiers, Mentee→mentor graduation, i18n (UI only), PWA, University calendars, Matching v2, Mentor analytics, Resource hub, Anonymous questions, Admin audit log. Do not start Phase 3 until v1.0 has two weeks of production telemetry.

Track work in [`todo.md`](./todo.md). Log shipped work in [`docs/changelog.md`](./docs/changelog.md).

**Out of scope:** Phase 4 is deliberately unscoped — telemetry from Phase 3 determines what comes next.

---

## 6. Documentation map

| File | Purpose |
|---|---|
| `CLAUDE.md` | This file. Master briefing. |
| `todo.md` | Active task list. Phase 3 work, in priority order. |
| `docs/product-one-pager.md` | Product context, goals, user stories, personas. |
| `docs/architecture.md` | System architecture, data flow, routing, auth. |
| `docs/design.md` | Visual design system. Colours, typography, components. |
| `docs/database-schema.md` | Supabase tables, relationships, RLS policies. |
| `docs/component-library.md` | Primitive + pattern components inventory. |
| `docs/changelog.md` | Shipped work log. Keep-a-changelog format. |
| `docs/design/` | Reference screens for all 10 pages (static PNGs + reference HTML). |

Any new doc lives in `/docs` and is linked here.

---

## 7. Coding conventions

- **TypeScript strict mode.** No `any`. Use `unknown` and narrow.
- **Server Components by default.** Add `'use client'` only when you need state, effects, or browser APIs.
- **Server Actions** for mutations; API route handlers only for webhooks or third-party callbacks.
- **Validation:** every form and every server action validates input with a Zod schema from `lib/validation/`.
- **Error handling:** server actions return `{ ok: true, data } | { ok: false, error }` — never throw to the client.
- **File naming:** `kebab-case.tsx` for files, `PascalCase` for components, `camelCase` for functions.
- **Imports:** absolute from `@/` root. No deep relative paths.
- **Accessibility:** every interactive element is keyboard-reachable and has an accessible name. Colour contrast must meet WCAG AA against the cool-gray surface (`#f5f7fa`).

---

## 8. When working in this repo

1. Read the relevant section of `docs/architecture.md` or `docs/design.md` before touching code in that area.
2. Check `todo.md` — if the task isn't on it, ask whether it should be added before starting.
3. When finishing a task, move it to `## Shipped` in `todo.md` and add a line to `docs/changelog.md` under `## [Unreleased]`.
4. Never bypass RLS, hardcode colours, use pure black/white, or use icons decoratively.
5. If a request conflicts with this file or the design system, flag it rather than silently complying.

---

## 9. Skills

The following skills are installed and must be used at the points described below. If a skill's default output conflicts with a rule in this file (colours, icons, token usage), apply the Hoddle rule and flag the conflict rather than silently letting the skill override it.

### Skill map

| Skill | When to invoke |
|---|---|
| **`superpowers:writing-plans`** | Before any multi-step task — produces the implementation plan before touching code. |
| **`superpowers:executing-plans`** | When running a written plan in a new session with review checkpoints. |
| **`superpowers:brainstorming`** | Before creating any new feature, component, or page — explores intent and requirements first. |
| **`superpowers:test-driven-development`** | Before writing any implementation code for a feature or bug fix. |
| **`superpowers:systematic-debugging`** | At the first sign of a bug, test failure, or unexpected behaviour — before proposing fixes. |
| **`superpowers:subagent-driven-development`** | When a plan has 2+ independent tasks that can be parallelised. |
| **`superpowers:dispatching-parallel-agents`** | Same trigger as above — independent tasks with no shared state. |
| **`superpowers:requesting-code-review`** | After completing a feature or before merging, to verify work meets requirements. |
| **`superpowers:receiving-code-review`** | When review feedback arrives — prevents performative agreement or blind implementation. |
| **`superpowers:verification-before-completion`** | Before claiming any work is done, fixed, or passing. Run verification commands first. |
| **`superpowers:finishing-a-development-branch`** | When implementation is complete and it's time to decide how to integrate. |
| **`superpowers:using-git-worktrees`** | When starting feature work that needs isolation from the main workspace. |
| **`frontend-design`** | When building any page, section, or UI component. Ensures production-grade output. **Override:** use Hoddle tokens (`surface`, `primary`, `secondary`) — never the skill's default palette. |
| **`ui-ux-pro-max`** | When planning visual layouts, colour decisions, or UX flows. **Override:** the Hoddle palette and typography are locked — do not let this skill introduce new typefaces or colours. |
| **`shadcn-component-discovery`** | Proactively, before writing any UI component code — searches 1,500+ components so we don't rebuild what exists. See `docs/component-library.md §shadcn`. |
| **`shadcn-component-review`** | After building any component — audits against shadcn patterns, spacing, and design-token usage. **Override:** map shadcn's semantic tokens (`--primary`, `--background`) to Hoddle tokens. |
| **`code-review`** | Supplement for `superpowers:requesting-code-review` — multi-perspective review covering architecture, security, and performance. |
| **`coding-standards`** | Baseline cross-project conventions — use only when a question isn't already answered by §7 of this file. |
| **`security-guidance`** | Whenever touching Supabase RLS policies, auth flows, server actions, or any boundary where user input enters the system. |