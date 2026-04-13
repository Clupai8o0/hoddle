# Component Library — Hoddle Melbourne

The inventory of reusable UI. Three tiers: primitives, patterns, layout. Rules for each tier are in `docs/architecture.md` §7. Visual rules are in `docs/design.md`.

Every component in this document must reference design tokens from `tailwind.config.ts`. No raw hex values. No `#ffffff`. No `#000000`. No 1px borders. No generic line icons.

---

## Tier 1 — Primitives (`/components/ui`)

Props-in, markup-out. No data fetching, no domain knowledge.

### `Button`
Variants: `primary`, `secondary`, `hero` (gradient), `ghost`.
- Primary: `bg-primary text-on-primary`, radius `md` (0.75rem), min-height 48px.
- Secondary: `bg-surface-container-highest text-on-surface`, no border.
- Hero: `135deg` gradient from `primary` to `#2c5282` (Hoddle blue lift).
- Ghost: transparent, primary text, used in glass nav only.
- Hover: shift elevation via background lift + ambient blue-tinted shadow. Never simply darken.
- Disabled: reduce opacity to 50%, cursor not-allowed. No greyscale shift.

### `Input` / `Textarea`
- Min-height 56px (Input), 120px (Textarea).
- `bg-surface-container-low`, no border by default.
- Focus: 2px outline in `tertiary` gold (`#b8860b`).
- Error: 2px outline in `#8b2e2e`, helper text below in the same colour.
- Label sits above the field with `label-md` tracking.

### `Card`
- `bg-surface-container-lowest` (the brightest "paper").
- Radius `md`.
- No border. No divider lines inside.
- Hover (when interactive): ambient blue-tinted shadow `0 12px 40px rgba(0, 24, 66, 0.10)` and a 2px upward translate.
- Hierarchy inside is created by typography shifts (`title-md` → `body-sm`) and whitespace, never by rules.

### `Tag` / `Chip`
- `default`: `bg-primary-container text-on-primary-container`
- `success`: `bg-secondary-container text-secondary` (reserved for verified / achievement signals)
- `muted`: `bg-surface-container-high text-on-surface-variant`
- Rounded-full. Uppercase `label-md` with wide tracking.

### `ProgressPill`
- Track: `bg-secondary-container`, height 10–12px, fully rounded.
- Fill: `bg-secondary` (`#2d6a4f`).
- Substantial and encouraging, never thin. Never uses primary blue — progress is a green signal.

### `Avatar`
- Circular, `md` or `lg` sizes.
- Fallback: initials on `bg-surface-container-high` with `text-primary`. Do not fall back to a Lucide person icon — initials only.

### `Container`
- Page-width wrapper with editorial asymmetric padding (e.g. `pl-20 pr-32` on wide screens).
- Max width `1280px`.

### `SectionDivider`
- Not a visual line — a semantic component that renders 48px or 64px of whitespace. Exists so intent is legible in the tree.

---

## Tier 2 — Patterns (`/components/patterns`)

Composed, domain-aware. Can import from `/ui`. Data is passed in as props.

### `MentorCard` _(Phase 1: placeholder data only)_
- Photography top, no crop artifacts.
- Name in `title-md` primary blue, role in `body-sm` on-surface-variant.
- Achievement chips below (using `Tag` success variant for verified).
- Hover: the card-level ambient shadow.

### `ContentBlock` _(Phase 2)_
- Article/advice preview card. Photography lead, headline in display-sm, excerpt in body-md.

### `OnboardingStep`
- Wrapper for each wizard step: step indicator (ProgressPill), question headline in display-sm, controls, back/next buttons.
- Maintains consistent vertical rhythm across all 5 steps.

### `EmptyState`
- Used in dashboard sections that will be filled in Phase 2.
- Warm message ("Your first mentor recommendations will land here once we match you…"), with a subtle illustration via cropped photography. A functional Lucide icon may appear in a secondary action (e.g. a "Browse mentors" link), but the focal visual is always photographic.

### `GoalsSummary`
- Reads the current user's onboarding answers and displays them back as Tags grouped by category. Purely presentational — data fetched by the parent.

---

## Tier 3 — Layout (`/components/layout`)

Shells. May read directly from Supabase when needed.

### `MarketingShell`
- Used by `(marketing)` route group.
- GlassNav at top, Footer at bottom, unbounded content in between.
- Cream `surface` background.

### `AuthShell`
- Used by `(auth)` route group.
- Minimal — no nav, no footer. Editorial photography occupies ~50% of desktop width on the left; form on the right.
- On mobile, photography becomes a short hero above the form.

### `AuthenticatedShell`
- Used by `(app)` route group.
- GlassNav with user menu (avatar + dropdown).
- No sidebar in Phase 1 — content lives in a single column with editorial asymmetric padding.

### `GlassNav`
- Implements the glass recipe from `docs/design.md` §2: `bg-surface/70 backdrop-blur-xl`.
- Sticky top-0.
- Active link style: `text-primary` with a 2px underline in `primary`, no background fill.

### `Footer`
- `bg-surface-container-high`, tonal separation (no border).
- Minimal: wordmark, three columns of links, credit line.

---

## What's intentionally missing

- **Decorative icons** — Hoddle does not use icons for emotional or illustrative purposes. Hero visuals, empty states, and mentor context all use cropped photography. Icons from `lucide-react` are permitted for **functional UI only** (nav items, form controls, menu toggles, close buttons, dropdown carets), rendered at `strokeWidth={1.5}` in `on-surface-variant` or `primary`, never as the focal point of a section.
- **Modal / Dialog** — not needed in Phase 1. If Phase 2 requires one, add it here before building.
- **Toast / Notification** — not needed in Phase 1. Server action error states render inline near the field or button that triggered them.
- **Table** — not needed in Phase 1. When it arrives, it will also obey the no-divider rule (zebra-stripe via `surface-container-low`).

---

## shadcn Integration

Hoddle uses shadcn components as a starting point wherever a suitable one exists. Two project-level skills govern this workflow — see `docs/.agents/skills/` for the full reference.

### Before building any component

1. **Invoke `shadcn-component-discovery`** — search the 1,500+ component registry ecosystem (@shadcn, @blocks, @reui, @animate-ui, @diceui, etc.) for an existing match.
2. If a match exists, install it (`npx shadcn@latest add @registry/component-name`) and adapt it to Hoddle's design system (see token mapping below).
3. If no match exists, build custom — but still reference the closest shadcn primitive for structural patterns (`data-slot`, CVA variants, `cn()` utility).

### After building any component

1. **Invoke `shadcn-component-review`** — audit spacing, structure, design tokens, composability, and responsive behaviour.
2. Fix any findings before marking the component as done.

### Token mapping: shadcn → Hoddle

shadcn's semantic tokens do not match Hoddle's palette. When installing or adapting a shadcn component, always map:

| shadcn token | Hoddle equivalent | Notes |
|---|---|---|
| `--background` / `bg-background` | `surface` (`#fef8f1`) | Never `#ffffff` |
| `--foreground` / `text-foreground` | `on-surface` (`#2a2620`) | Never `#000000` |
| `--primary` | `primary` (`#001842`) | Hoddle Blue |
| `--primary-foreground` | `on-primary` (`#fef8f1`) | Cream on blue |
| `--secondary` | `secondary` (`#2d6a4f`) | Botanical green — reserved for trust/success signals |
| `--muted` / `bg-muted` | `surface-container-high` (`#eee7dd`) | |
| `--muted-foreground` | `on-surface-variant` (`#635f56`) | |
| `--accent` / `bg-accent` | `primary-container` (`#dbe5f1`) | |
| `--card` / `bg-card` | `surface-container-lowest` (`#fffdf8`) | Brightest paper |
| `--border` | `outline-variant` (`rgba(42,38,32,0.15)`) | Ghost borders only — prefer tonal shifts |
| `--ring` | `tertiary` (`#b8860b`) | Gold focus ring |
| `--radius` | `0.75rem` (`md`) | |
| `--destructive` | `#8b2e2e` | Deep warm red, never bright red |

**Rule:** after installing a shadcn component, grep for any hardcoded `gray-`, `neutral-`, `slate-`, `zinc-`, `white`, or `black` classes and replace them with the Hoddle tokens above. Default CSS shadows must also be replaced with the blue-tinted ambient shadow (`0 12px 40px rgba(0, 24, 66, 0.10)`).

---

## Adding a new component

1. Decide the tier: does it have domain knowledge? → pattern. Does it fetch data? → layout only. Otherwise → primitive.
2. **Search first** — run `shadcn-component-discovery` before writing code from scratch.
3. Check the design tokens exist in `tailwind.config.ts`. If a new token is needed, add it there and mirror it in `docs/design.md` before writing the component.
4. Adapt installed shadcn components using the token mapping table above.
5. **Review** — run `shadcn-component-review` on the finished component.
6. Add the component to this document under the right tier.
7. Add an entry to `docs/changelog.md` under `## [Unreleased]`.