# Hoddle Melbourne — Design System

## 1. Overview & Creative North Star

**Creative North Star: "The Curated Sanctuary"**

Hoddle's design system rejects the cold, transactional nature of traditional EdTech. Instead, it adopts the persona of a high-end editorial journal — think *Kinfolk* meets a premium concierge service. We are building a "Curated Sanctuary" for international students: a place that feels grounded, human, trustworthy, and deeply aspirational.

To break the "standard template" look, we use **intentional asymmetry**. Layouts should feel like a well-composed magazine spread, where high-quality photography breaks the grid and typography is used as a primary design element. Breathing room is prioritised over information density so every interaction feels calm and supportive.

---

## 2. Colors: Editorial Blue on Warm Cream

The palette pairs a **deep editorial blue** — evoking trust, focus, and the calm of a late-night library — with the warm cream tones of Melbourne's coffee culture. Blue replaces the previous terracotta as the primary brand colour, but the warm, organic surface family is preserved. This tension between cool-blue hierarchy and warm-cream foundation is the signature of Hoddle.

### The Color Logic

**Primary — "Hoddle Blue"**
- `primary` — `#1e3a5f` — Deep editorial navy. Used for primary actions, headlines, logo, and high-impact moments. Represents trust and mentor wisdom.
- `primary-container` — `#dbe5f1` — Soft powder blue. Used for primary tag backgrounds, selected states, and container fills.
- `on-primary` — `#fef8f1` — Cream text on blue (never pure white).
- `on-primary-container` — `#142845` — Deepest ink blue for text on powder blue.

**Secondary — "Botanical Green"** (mentor & success accent)
- `secondary` — `#2d6a4f` — Reserved for trust-building elements, success states, verified-mentor badges, and progress fills.
- `secondary-container` — `#dbeee2`
- `on-secondary` — `#fef8f1`

**Tertiary — "Encouragement Gold"** (focus states & highlights)
- `tertiary` — `#b8860b` — Warm gold used for input focus rings and editorial accents.
- `tertiary-container` — `#f5e6b8`

**Surface & Background** (the cream foundation — do not change)
- `surface` — `#fef8f1` — Soft, buttery off-white. The foundation. **Never use `#ffffff` for backgrounds.**
- `surface-container-lowest` — `#fffdf8` — Brightest "paper" for top-layer content cards.
- `surface-container-low` — `#f9f3eb`
- `surface-container` — `#f3ede4`
- `surface-container-high` — `#eee7dd`
- `surface-container-highest` — `#e8e2d7` — Used for inset sections and secondary button fills.

**Text & On-Surface**
- `on-surface` — `#2a2620` — Soft warm black. **Never use `#000000` for text.**
- `on-surface-variant` — `#635f56` — Secondary text, captions, metadata.
- `outline-variant` — `rgba(42, 38, 32, 0.15)` — Ghost borders only when accessibility demands it.

### The "No-Line" Rule

Prohibit 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts.
- Separate a hero from a content section by transitioning from `surface` to `surface-container-low`.
- Highlight a sidebar with `surface-container-high` against a `surface` background.

### Signature Textures & Glass

**Glassmorphism** is used for floating navigation bars and overlay cards to create layered depth.
- **The Glass Recipe:** `surface` at 70% opacity with `backdrop-filter: blur(20px)`. This lets warm photography bleed through cool-blue navigation, creating the signature tension of the brand.

**Signature Gradient (Hero CTAs & brand moments):**
- Linear gradient `135deg` from `primary` (`#1e3a5f`) → `#2c5282` (a lifted mid-blue).
- For soft hero backdrops, layer `primary-container` (`#dbe5f1`) → `surface` (`#fef8f1`) at `160deg` — this is the signature "cream-to-sky" wash unique to Hoddle.

---

## 3. Typography: The Human Voice

We pair a characterful modern sans-serif for headings with a clean, legible sans-serif for body copy — approachability balanced with professional clarity.

- **Display & Headlines — Plus Jakarta Sans.** Slightly rounded terminals, wide apertures. Friendly yet authoritative. Use `display-lg` (56–72px) for hero headers for editorial impact.
- **Body & Titles — Be Vietnam Pro.** Highly legible, handles bilingual nuance well. Stays "out of the way" to let the student's story lead.

**Editorial Tips:**
- Use **hanging punctuation** and wide letter-spacing (tracking `0.12em`) for uppercase `label-md` to create a premium, curated feel.
- Headlines should sit in `primary` (`#1e3a5f`), not pure black — this reinforces brand voice at every scroll.
- Body copy in `on-surface` (`#2a2620`) for maximum readability on cream backgrounds.

---

## 4. Elevation & Depth: The Layering Principle

We do not use shadows to create "pop" — we use **tonal layering** to create "presence."

**The Stacking Rule** — treat the UI as physical sheets of fine paper.
- Base layer: `surface`
- Content card: `surface-container-lowest` (the brightest paper, for maximum focus)
- Inset section: `surface-container-highest`

**Ambient Shadows** — when an element must float (e.g., a Mentor Card on hover), use an extra-diffused, blue-tinted shadow:
```
box-shadow: 0 12px 40px rgba(30, 58, 95, 0.08);
```
The subtle blue tint (rather than neutral grey) ties the shadow to the brand.

**The Ghost Border** — if a boundary is strictly required for accessibility, use `outline-variant` at 15% opacity. Anything higher reads as corporate.

---

## 5. Components

### Buttons
Large, tactile, welcoming.
- **Primary:** `primary` background, `on-primary` text. Radius `md` (0.75rem). Min height 48px.
- **Secondary:** `surface-container-highest` background. No border. `on-surface` text.
- **Hover State:** Do not simply darken the colour — shift elevation by lifting the background toward `surface-container-lowest` and adding the ambient blue shadow.
- **Hero CTA:** Uses the signature blue gradient (see §2).

### Cards (Mentor & Content Blocks)
- **No divider lines.** Use vertical whitespace and typography shifts (`title-md` → `body-sm`) to build hierarchy.
- Corner radius `md` (0.75rem).
- High-quality photography is required. Missing images use a `surface-container-high` placeholder with a centred Hoddle brand-mark — **never generic icons**.
- Mentor cards: verified badge uses `secondary` (Botanical Green), not blue. This protects the "trust cue" signal.

### Progress Indicators
"Pill" indicators, not thin lines.
- Track: `secondary-container` (`#dbeee2`)
- Fill: `secondary` (`#2d6a4f`)
- Height: 10–12px, fully rounded.
Substantial and encouraging — never thin or clinical.

### Input Fields
- Min height 56px.
- Background `surface-container-low`.
- Focus state: 2px `outline` using `tertiary` (gold `#b8860b`) — "warm encouragement," not system alert.
- Error state: `#8b2e2e` (deep warm red, never bright red).

### Navigation
- Top nav uses the Glass Recipe (§2) so warm photography bleeds through.
- Active nav item: `primary` colour text with a 2px underline in `primary`, no background fill.

### Tags & Chips
- Category tags: `primary-container` background (`#dbe5f1`) with `on-primary-container` text.
- Success/verified chips: `secondary-container` background with `secondary` text.

---

## 6. Do's and Don'ts

**Do:**
- Use asymmetrical margins — if the left margin is 80px, try 120px on the right for editorial layouts.
- Lean heavily on photography of students in Melbourne environments (cafés, laneways, libraries, Yarra-side parks).
- Use blue-tinted "surface tint" overlays on photos to ensure text readability while reinforcing brand colour.
- Let the warm cream foundation do the heavy emotional work — blue is for hierarchy, cream is for hospitality.

**Don't:**
- Don't decorate with icons. Icons are functional UI only — nav items, form controls, menu toggles, close buttons. Use `lucide-react` at `strokeWidth={1.5}` in `on-surface-variant` or `primary`. For illustrative or emotional moments (hero visuals, empty states, mentor context), use cropped photography — never an icon.
- Don't use pure black (`#000000`) for text. Use `on-surface` (`#2a2620`).
- Don't use pure white (`#ffffff`) for backgrounds. Always use `surface` (`#fef8f1`).
- Don't use bright or electric blue (`#0066ff`, `#1e90ff`). Hoddle blue is always deep, desaturated, and editorial.
- Don't use default CSS drop shadows — if a shadow looks standard, it is too heavy. Tint it with the primary blue and diffuse it.
- Don't use grid-based dividers. If separation is needed, use 48px or 64px of whitespace.
- Don't let blue dominate surface area. It should appear as *punctuation* — headlines, CTAs, key actions — against the cream foundation.

---

## 7. AI-Generated Photography

Hoddle uses photography — not icons or illustrations — for all hero visuals, empty states, mentor context, and emotional moments. Where stock photography is unavailable or doesn't fit, generate images with AI tools (Midjourney, DALL-E, Flux, etc.). Every generated image must feel like it belongs in a *Kinfolk* or *Cereal* editorial spread — warm, human, slightly aspirational.

### General style modifiers

Append these to **every** prompt below to maintain visual consistency:

```
editorial photography, soft natural light, warm tones, shallow depth of field,
shot on 35mm film, slightly desaturated, cream and warm brown palette with
cool blue accents, Kinfolk magazine aesthetic, no text overlays, no logos
```

### Prompt library

#### 1. Hero / Landing page — Melbourne student life

Use for the main landing hero and the marketing shell's full-bleed sections.

```
A young international university student sitting in a sunlit Melbourne laneway
café, laptop open, smiling warmly, surrounded by exposed brick and trailing
greenery. Morning golden hour light filtering through the gap between
buildings. [append general style modifiers]
```

**Alt prompt (library variant):**
```
A diverse group of three university students studying together at a long
timber table in the State Library of Victoria reading room. Warm overhead
light, stacks of books, one student pointing at a notebook while the others
lean in. [append general style modifiers]
```

#### 2. Auth shell — split-screen editorial portrait

Used as the left-panel photograph in the `AuthShell` layout (50% desktop width).

```
Close-up portrait of a young international student looking out a rain-dotted
window in a Melbourne tram, expression thoughtful and hopeful. Soft
reflections of city buildings on the glass. Shot from the shoulder up, tight
crop. [append general style modifiers]
```

**Alt prompt (outdoor variant):**
```
A young woman walking across Princes Bridge at golden hour with the Yarra
River and Melbourne skyline behind her. Mid-stride, natural candid pose,
wind in hair, looking slightly off-camera. Waist-up crop. [append general
style modifiers]
```

#### 3. Mentor card — portrait headshot

Used inside `MentorCard` as the top photography slot.

```
Natural headshot of a confident young [man/woman] in casual smart clothing,
standing against a blurred Melbourne café interior backdrop. Warm smile,
direct eye contact, shoulders slightly angled. Head-and-shoulders crop,
background bokeh. [append general style modifiers]
```

> **Diversity note:** generate a range of ethnicities, genders, and personal styles to reflect Melbourne's international student community. Never default to a single demographic.

#### 4. Empty state — warm vignette

Used in `EmptyState` components where Phase 2 content hasn't landed yet.

```
An open journal lying on a wooden desk beside a flat white coffee and a small
potted succulent. A pen rests on the blank page. Overhead shot, soft morning
light from a nearby window. Feeling of calm potential and a fresh start.
[append general style modifiers]
```

**Alt prompt (outdoor variant):**
```
An empty wooden bench in the Royal Botanic Gardens Melbourne, dappled
sunlight through eucalyptus canopy, blurred jogger in the far background.
Peaceful, inviting, anticipatory. [append general style modifiers]
```

#### 5. Onboarding — step illustrations

Used as supporting visuals alongside `OnboardingStep` content.

```
Close-up of hands holding a warm cup of coffee in a ceramic mug, sitting at a
café table with a city map partially visible underneath. Cosy, personal,
first-person perspective. [append general style modifiers]
```

```
A student's desk from above: open laptop, colourful sticky notes on a
corkboard, a small Australian flag pin, and a well-worn notebook. Lived-in
and personal. [append general style modifiers]
```

#### 6. OG / social share image

Used for `og:image` meta tags and social previews.

```
Wide letterbox crop (1200×630). Melbourne skyline at dusk seen from Southbank,
warm city lights reflecting on the Yarra River. Soft blue-hour sky fading to
warm amber at the horizon. No people, no text. [append general style modifiers]
```

### Post-generation treatment

After generating, apply the following before placing in `/public/images`:

1. **Colour grade** — shift highlights toward cream (`#fef8f1`) and shadows toward Hoddle Blue (`#1e3a5f`). The image should feel like it already lives on the cream surface.
2. **Crop asymmetrically** — avoid perfectly centred subjects. Subjects should sit on editorial thirds, leaving breathing room.
3. **Blue-tint overlay** — for images that will have text overlaid, add a `linear-gradient(135deg, rgba(30,58,95,0.35), rgba(30,58,95,0.10))` in CSS rather than baking it into the image. This keeps the brand tension between warm photo and cool overlay.
4. **Export** — WebP at quality 80 for inline images, AVIF where browser support allows. Keep file sizes under 200KB for hero images, under 80KB for cards.
5. **Name** — `kebab-case` describing the scene: `hero-laneway-cafe.webp`, `mentor-portrait-01.webp`, `empty-state-journal.webp`.

### When NOT to use AI images

- **Actual mentor profiles** — once real mentors exist, replace generated headshots with their real photos.
- **User-submitted content** — success stories, forum posts, etc. should use the student's own images.
- **Logos and brand marks** — the Hoddle wordmark is designed separately, not generated.