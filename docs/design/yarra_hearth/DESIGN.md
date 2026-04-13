# Design System Document: The Warm Editorial

## 1. Overview & Creative North Star
**Creative North Star: "The Curated Sanctuary"**

This design system moves away from the cold, transactional nature of traditional EdTech. Instead, it adopts the persona of a high-end editorial journal—think *Kinfolk* meets a premium concierge service. We are designing a "Curated Sanctuary" for international students: a place that feels grounded, human, and deeply aspirational. 

To break the "standard template" look, we utilize **intentional asymmetry**. Layouts should feel like a well-composed magazine spread, where high-quality photography breaks the grid and typography is used as a primary design element. We prioritize breathing room over information density, ensuring every interaction feels calm and supportive.

---

## 2. Colors: Tonal Depth & Warmth
The palette is rooted in the earth. It rejects the sterile "tech white" in favor of light creams and rich, organic tones that evoke Melbourne’s coffee culture and historic laneways.

### The Color Logic
- **Primary (`#a63c26`):** Our "Terracotta." Use this for high-impact moments and primary actions. It represents the warmth of human connection.
- **Secondary (`#2d6a4f`):** Our "Botanical Green." Reserved for trust-building elements, success states, and mentor-related accents.
- **Surface & Background (`#fef8f1`):** A soft, buttery off-white that serves as the foundation. Never use `#ffffff` for backgrounds.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. 
- To separate a hero from a content section, transition from `surface` to `surface-container-low`. 
- To highlight a sidebar, use `surface-container-high` against a `surface` background.

### Signature Textures & Glass
To provide a "signature" feel, use **Glassmorphism** for floating navigation bars or overlay cards. 
- **The Glass Recipe:** Use `surface` at 70% opacity with a `backdrop-filter: blur(20px)`. This allows the warm earth tones of the photography to bleed through the UI, creating a sense of layered depth.
- **Signature Gradients:** For Hero CTAs, use a subtle linear gradient from `primary` to `primary-container` at a 135-degree angle. This adds "soul" and dimension that flat color cannot provide.

---

## 3. Typography: The Human Voice
We pair a characterful, modern sans-serif for headings with a clean, legible sans-serif for body copy to balance approachability with professional clarity.

- **Display & Headlines (Plus Jakarta Sans):** Chosen for its slightly rounded terminals and wide apertures. It feels friendly yet authoritative. Use `display-lg` for hero headers to create an editorial impact.
- **Body & Titles (Be Vietnam Pro):** A highly legible typeface that handles bilingual nuances well. It stays "out of the way" to let the student's story take center stage.

**Editorial Tip:** Use "Hanging Punctuation" and wide letter-spacing (tracking) for `label-md` uppercase text to create a premium, curated feel.

---

## 4. Elevation & Depth: The Layering Principle
We do not use shadows to create "pop"; we use **Tonal Layering** to create "presence."

- **The Stacking Rule:** Treat the UI as physical sheets of fine paper. 
    - Base Layer: `surface`
    - Content Card: `surface-container-lowest` (The brightest "paper" for maximum focus)
    - Inset Section: `surface-container-highest`
- **Ambient Shadows:** When a element must float (e.g., a Mentor Card on hover), use an extra-diffused shadow:
    - `box-shadow: 0 12px 40px rgba(53, 50, 43, 0.06);` (Using a tinted `on-surface` color).
- **The Ghost Border:** If a boundary is strictly required for accessibility, use `outline-variant` at **15% opacity**. Anything higher is too corporate.

---

## 5. Components: Soft & Accessible

### Buttons
Large, tactile, and welcoming.
- **Primary:** `primary` background with `on-primary` text. Radius: `md` (0.75rem).
- **Secondary:** `surface-container-highest` background. No border.
- **State Tip:** On hover, do not just darken the color; shift the elevation using a subtle `surface-container-lowest` lift.

### Cards (The Mentor & Content Block)
- **Rule:** Forbid divider lines. Use vertical white space and typography (shifting from `title-md` to `body-sm`) to create hierarchy.
- **Imagery:** Cards must feature high-quality photography. Use `md` (0.75rem) corner radius. Use a `surface-variant` placeholder with a centered brand-mark for missing images—never use generic icons.

### Progress Indicators
- Instead of thin lines, use "Pill" indicators using `secondary-container` for the track and `secondary` for the fill. They should feel substantial and encouraging.

### Input Fields
- Large height (min 56px) with `surface-container-low` background. 
- Focus state: A 2px `outline` using the `tertiary` (Gold) color to signify "warm encouragement" rather than a "system alert."

---

## 6. Do’s and Don’ts

### Do:
- **Do** use asymmetrical margins. If the left margin is 80px, try a right margin of 120px for editorial layouts.
- **Do** lean heavily on photography. Students should see themselves in the Melbourne environment (cafes, libraries, parks).
- **Do** use "Surface-Tint" overlays on photos to ensure text readability while maintaining color harmony.

### Don’t:
- **Don’t** use abstract line icons. This platform is about humans. If you need a visual aid, use a small, cropped photo or a stylized "organic" shape.
- **Don’t** use pure black `#000000` for text. Use `on-surface` (`#35322b`) to keep the reading experience soft on the eyes.
- **Don’t** use "Default" shadows. If the shadow looks like a standard CSS drop-shadow, it’s too heavy. Soften it.
- **Don’t** use standard grid-based dividers. If you feel the need to separate content, use a 48px or 64px gap instead of a line.