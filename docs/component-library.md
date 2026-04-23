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

### `OAuthButtons`
- Renders the "Continue with Google" button with the official Google SVG icon (not a Lucide icon).
- Submits a form to the `signInWithGoogle` server action.
- Includes an "or" divider below, to sit above the email magic-link form.

### `StarRow`
- Read-only star rating display. Accepts an integer `rating` (1–5) and renders filled/empty stars.
- Used in `ReviewCard` and the admin reviews form.

### `PublishSuccessModal`
- Confirmation modal shown after a mentor successfully publishes a content item.
- Displays the public URL and a "View article" CTA.

### `MarkdownEditor`
- Client-side Tiptap-based rich-text editor with a formatting toolbar (bold, italic, headings, lists, blockquote).
- Used in mentor content authoring (`mentor/content/new`, `mentor/content/[id]/edit`) and forum reply forms.
- Outputs Tiptap JSON stored in `content_items.body`.

---

## Tier 2 — Patterns (`/components/patterns`)

Composed, domain-aware. Can import from `/ui`. Data is passed in as props.

### `MentorCard`
- Photography top (avatar with initials fallback), no crop artifacts.
- Name in `title-md` primary blue, role in `body-sm` on-surface-variant.
- Achievement chips below (using `Tag` success variant for verified badge).
- Optional `reasoning` prop renders a "Why this mentor" line below the card (used in recommendation sections).
- Hover: the card-level ambient shadow.

### `ContentCard`
- Article/video/resource preview card. Hero image with type badge overlay, headline in `title-md`, mentor byline, view count.
- `ContentCard` is the production component; `ContentBlock` was a Phase 1 placeholder name.

### `FollowButton`
- Optimistic follow/unfollow toggle using `toggleFollow` server action.
- Shows "Following" with a filled icon or "Follow" with an outlined icon.
- Only rendered when the viewer is authenticated.

### `MarkdownRenderer`
- Renders plain-text markdown stored in forum posts and success story bodies.
- Applies special formatting: `> quoted line` → styled blockquote, `@Name` tokens → highlighted span.

### `FeedbackWidget`
- Floating panel fixed to the bottom-right corner, rendered in the `(browse)` layout for authenticated users.
- Category picker (Bug / Suggestion / Confusion / Other) + textarea + submit.
- Calls `lib/actions/feedback.ts` → Airtable base.
- Collapses via outside-click or the × button.

### `ReviewCard`
- Editorial review card: `StarRow`, pull-quote body, author name, optional author context line, optional author photo.
- Used in `ReviewsWall` and will appear in a homepage section when ≥ 3 published reviews exist.

### `ReviewsWall`
- Asymmetric masonry-style grid of `ReviewCard`s.
- Only renders when at least 3 published reviews are present (avoids sparse single-card layout).
- Photography-led layout; no default drop shadows on individual cards.

### `SurveyStatWall`
- Four tonal stat cards for the About page research section (between "The problem" and "How it works").
- Sticky intro column on desktop; stacked on mobile.

### `SurveyStrip`
- Inline 3-stat proof strip on the homepage (72% / 58% / 39% from founding research).
- Placed between the Priya narrative section and the mentor preview.

### Messages sub-components (`/components/patterns/messages/`)

A suite of Client Components that together form the direct messaging UI at `app/(app)/messages/`:

| Component | Purpose |
|---|---|
| `MessagesShell` | Two-pane layout shell: conversation list left, thread right |
| `ConversationList` | Paginated list of conversations with unread badges and last-message preview |
| `ConversationClient` | Top-level client orchestrator for a single conversation; manages real-time updates |
| `MessageThread` | Scrolling message history with load-more pagination |
| `MessageBubble` | Individual message bubble (sent vs received styling, timestamp, sender avatar) |
| `ComposeInput` | Sticky textarea + send button at the bottom of the thread |
| `NewConversationPage` | Profile search + "Start conversation" UI at `/messages/new` |
| `MessageMentorButton` | CTA button on mentor profile pages; calls `getOrCreateConversation` and redirects to the thread |

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

### `BrowseNav`
- Used by the `(browse)` route group.
- Server Component; receives a pre-fetched `user` prop (name, avatar, unread notification count).
- When authenticated: shows avatar + notification badge; links to inbox, messages, and the user's dashboard.
- When unauthenticated: shows "Sign in" CTA.
- Shares the glass recipe and active-link style with `GlassNav`.

### `Footer`
- `bg-surface-container-high`, tonal separation (no border).
- Minimal: wordmark, three columns of links, credit line.

---

## What's intentionally missing

- **Decorative icons** — Hoddle does not use icons for emotional or illustrative purposes. Hero visuals, empty states, and mentor context all use cropped photography. Icons from `lucide-react` are permitted for **functional UI only** (nav items, form controls, menu toggles, close buttons, dropdown carets), rendered at `strokeWidth={1.5}` in `on-surface-variant` or `primary`, never as the focal point of a section.
- **Toast / Notification** — server action error states render inline near the field or button that triggered them. Toast-style feedback (`sonner`) is used sparingly in `FeedbackWidget` only.
- **Table** — admin list views use card rows rather than tables. When a true table is needed it will obey the no-divider rule (zebra-stripe via `surface-container-low`).

`PublishSuccessModal` is the first dialog in the codebase. Any new modal must follow the same token usage (no `#ffffff`, no default CSS shadow) and be documented here before building.

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