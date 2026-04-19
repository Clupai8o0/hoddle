# Reviews + Survey Data — Design

**Date:** 2026-04-19
**Status:** Approved, awaiting implementation plan
**Scope:** Add admin-curated platform reviews to the homepage. Add survey-data treatments to homepage ("mini strip") and about page ("full stat wall") to strengthen the problem/credibility narrative.

---

## 1. Goals

1. **Reviews** — a Supabase-backed, admin-managed collection of platform testimonials (student voices about Hoddle). Rendered as an editorial wall on the homepage. CRUD via `/admin/reviews`.
2. **Survey data on homepage** — a lightweight 3-up proof band between the Priya narrative and the mentor preview, using bold editorial numbers (no charts).
3. **Survey data on about page** — a full asymmetric stat wall between "The problem" and "How it works", framed as "the research behind Hoddle."

Non-goals:
- No user-submitted reviews. Admin-curated only.
- No carousel / auto-rotation on the reviews section.
- No chart libraries. Numbers are rendered as type.
- No "respond to a review" or rating-of-individual-mentors flow.

## 2. Design-system constraints (non-negotiable)

Lifted from `CLAUDE.md` §3 and enforced throughout:

- Page surface = `bg-surface` (`#f5f7fa`). Cards sit on tonal shifts; `surface-container-lowest` is the only "white-ish" layer allowed.
- No pure `#000` text — use `on-surface`.
- No warm / orange-tinted colors. Default yellow/gold stars are **banned**; stars render in **Hoddle Blue (`primary`)** filled + `outline-variant` empty.
- No 1px borders for sectioning — use background tonal shifts and 28/28–48/64 px whitespace.
- Icons are functional (`lucide-react`, `strokeWidth={1.5}`).
- Shadows are blue-tinted: `shadow-ambient`.
- No hardcoded hex — reference Tailwind tokens only.
- Asymmetric layouts are encouraged; the reviews wall and about-page stat wall both lean into this.

---

## 3. Data model

### 3.1 `reviews` table

```sql
create table reviews (
  id             uuid primary key default gen_random_uuid(),
  author_name    text not null,
  author_context text,
  avatar_url     text,
  rating         smallint not null check (rating between 1 and 5),
  content        text not null check (char_length(content) <= 400),
  published      boolean not null default true,
  display_order  int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index reviews_published_order_idx
  on reviews (published, display_order, created_at desc);

alter table reviews enable row level security;
```

- `author_context` is a short tagline shown beneath the name, e.g. "First-year Commerce, Monash". Optional.
- `content` capped at 400 chars at the database level so homepage cards stay visually uniform.
- `display_order` lets admins manually pin order. Ties broken by `created_at desc`.
- `updated_at` kept in sync via existing `handle_updated_at` trigger function (or a fresh trigger — match whatever pattern the existing migrations use).

### 3.2 RLS policies

```sql
-- Public can read only published reviews
create policy "reviews_public_read"
  on reviews for select
  using (published = true);

-- Admins see everything
create policy "reviews_admin_read"
  on reviews for select
  using (public.is_admin(auth.uid()));

create policy "reviews_admin_insert"
  on reviews for insert
  with check (public.is_admin(auth.uid()));

create policy "reviews_admin_update"
  on reviews for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "reviews_admin_delete"
  on reviews for delete
  using (public.is_admin(auth.uid()));
```

Reuses the existing `is_admin(uuid)` helper used by the mentor admin surface. If that helper doesn't exist under that exact name, mirror whatever pattern `app/(admin)/admin/**` RLS already uses (confirm during implementation).

### 3.3 Storage — `reviews` bucket

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reviews', 'reviews', true, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "reviews_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'reviews');

create policy "reviews_bucket_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'reviews' and public.is_admin(auth.uid()));

create policy "reviews_bucket_admin_update"
  on storage.objects for update
  using (bucket_id = 'reviews' and public.is_admin(auth.uid()));

create policy "reviews_bucket_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'reviews' and public.is_admin(auth.uid()));
```

Path convention: `reviews/{review_id}/avatar.{ext}`. On edit, old object is deleted before new upload (or overwritten via `upsert: true` — implementer's choice; document either way).

### 3.4 Migration

Single new migration file: `supabase/migrations/20260419000001_reviews.sql` containing table, index, RLS, and storage bucket + bucket RLS.

### 3.5 Generated types

After applying migration, regenerate types:
```
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

---

## 4. Validation — Zod schemas

`lib/validation/reviews.ts`:

```ts
export const reviewInputSchema = z.object({
  authorName: z.string().trim().min(1).max(120),
  authorContext: z.string().trim().max(160).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().trim().min(10).max(400),
  published: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
  avatarFile: z.instanceof(File).optional(),
  removeAvatar: z.boolean().optional(), // edit only
});
```

Shared between the `/admin/reviews/new` and `/admin/reviews/[id]/edit` forms.

---

## 5. Admin UX

### 5.1 `/admin` dashboard

Add one new card to the existing grid in `app/(admin)/admin/page.tsx`:

- `href`: `/admin/reviews`
- `icon`: `MessageSquareQuote` (lucide)
- `label`: `"Reviews"`
- `description`: `"Manage platform testimonials shown on the homepage."`
- `badge`: count of **unpublished** reviews (if any) — so admins see drafts needing attention. Use `select('id', { count: 'exact', head: true }).eq('published', false)`. If zero, no badge.
- `badgeLabel`: `"unpublished"`

### 5.2 `/admin/reviews` — list

New route `app/(admin)/admin/reviews/page.tsx`.

Layout: page header ("Reviews" / "Platform testimonials shown on the homepage.") + top-right `<Button variant="primary" asChild><Link href="/admin/reviews/new">New review</Link></Button>`, then a vertical list of review cards.

Each list row (reuses the existing `bg-surface-container rounded-xl p-6` admin-card pattern):
- Left: 56×56 rounded avatar thumb (initials fallback on `bg-primary-container`).
- Middle: name · context · star row · truncated content (`line-clamp-2`).
- Right: published pill (`bg-secondary-container text-on-secondary-container` if published, else `bg-outline-variant/40 text-on-surface-variant` with "Draft" label), small display-order number, `Edit` link, `Delete` server-action form button.

Empty state: editorial hero block with `MessageSquareQuote` icon, "No reviews yet" + primary CTA to `/admin/reviews/new`.

### 5.3 `/admin/reviews/new` and `/admin/reviews/[id]/edit`

Both routes render a shared `<ReviewForm mode="create" | "edit" defaults={...} />` client component (follows the `AdminMentorForm` pattern).

Form fields, in order:
1. **Author name** (text input, required).
2. **Author context** (text input, optional, placeholder "First-year Commerce, Monash").
3. **Photo** — file picker with live preview. Accepts webp/jpeg/png ≤ 2 MB. In edit mode, shows current avatar with "Remove" toggle.
4. **Rating** — custom star picker: 5 `lucide-react` `Star` icons rendered as buttons. Hover = preview, click = set. Keyboard accessible (radiogroup ARIA pattern).
5. **Content** — textarea, 400-char counter visible under the field.
6. **Display order** — number input, default 0 (lower = earlier).
7. **Published** — checkbox, default true.

Submit = server action in `app/(admin)/admin/reviews/actions.ts`:
- Validate with `reviewInputSchema`.
- Insert/update row.
- If `avatarFile` present: upload to `reviews/{id}/avatar.{ext}`, store public URL on `avatar_url`.
- If `removeAvatar` and edit mode: delete object, null out `avatar_url`.
- Revalidate `/` (homepage), `/admin/reviews`, and `/admin/reviews/{id}` on edit.
- Return `{ ok: true, data: { id } } | { ok: false, error }` (matches repo convention).

Delete: separate form-POST server action, redirects back to `/admin/reviews`.

### 5.4 Admin access control

Every `/admin/reviews*` route re-uses the admin guard already in `app/(admin)/layout.tsx`. No new guards needed.

---

## 6. Homepage — reviews section

### 6.1 Placement

File: `app/page.tsx`. Insert **between** the existing `#how-it-works` section (closes `bg-surface`) and the "Members unlock" section (`bg-primary`).

The emotional arc becomes:
Hero → Priya narrative → **mini survey strip** → Mentor preview → How it works → **Reviews** → Members unlock → Final CTA.

### 6.2 Data fetch

In the `Promise.all` at the top of `HomePage`, add:

```ts
supabase
  .from("reviews")
  .select("id, author_name, author_context, avatar_url, rating, content")
  .eq("published", true)
  .order("display_order", { ascending: true })
  .order("created_at", { ascending: false })
  .limit(6)
```

If fewer than 3 reviews are returned, render nothing (section is hidden). Below 3 looks sparse and undermines the "wall of proof" effect.

### 6.3 Component

New file `components/patterns/reviews-wall.tsx` — server component. Takes `reviews: Review[]`. Renders:

```
<section className="py-16 sm:py-28 bg-surface-container-low">
  <div className={C}>
    <div className="max-w-2xl mb-12 sm:mb-16">
      <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
        What students say
      </p>
      <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight leading-[1.1]">
        The proof is in the students&rsquo; words.
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(0,auto)]">
      {reviews.map((review, i) => (
        <ReviewCard key={review.id} review={review} variant={rhythm[i % 6]} />
      ))}
    </div>
  </div>
</section>
```

Where `rhythm = ["short", "tall", "short", "tall", "short", "short"]` — an asymmetric pattern that breaks the grid into an editorial rather than template layout. `"tall"` cards get extra vertical padding (`py-10`) so they become visually dominant; `"short"` cards use `py-8`.

### 6.4 `ReviewCard`

```tsx
<article className={`bg-surface-container-lowest rounded-[var(--radius-md)] p-8 shadow-ambient flex flex-col gap-6 ${variant === "tall" ? "md:py-10" : ""}`}>
  <StarRow rating={review.rating} />
  <blockquote className="font-body text-base sm:text-lg text-on-surface leading-relaxed italic">
    &ldquo;{review.content}&rdquo;
  </blockquote>
  <footer className="flex items-center gap-3 mt-auto">
    {review.avatar_url ? (
      <Image src={review.avatar_url} alt={review.author_name}
             width={40} height={40}
             className="w-10 h-10 rounded-full object-cover" />
    ) : (
      <span className="w-10 h-10 rounded-full bg-primary-container
                       font-display font-bold text-sm text-primary
                       flex items-center justify-center select-none">
        {initials(review.author_name)}
      </span>
    )}
    <div>
      <p className="font-body font-semibold text-sm text-on-surface">
        {review.author_name}
      </p>
      {review.author_context && (
        <p className="font-body text-xs text-on-surface-variant">
          {review.author_context}
        </p>
      )}
    </div>
  </footer>
</article>
```

### 6.5 `StarRow`

New primitive `components/ui/star-row.tsx`. Renders 5 `Star` icons (`lucide-react`), size 16, `strokeWidth={1.5}`. Filled stars: `className="fill-primary text-primary"`. Empty stars: `className="text-outline-variant"`. Includes an `aria-label="Rated {n} out of 5"` on the wrapping `<div>`.

Reused by the admin list, the admin form preview, and the homepage review cards.

---

## 7. Homepage — mini survey strip

### 7.1 Placement

File: `app/page.tsx`. Insert **between** the "Priya at 2am" narrative section and the "Verified mentors" section. Keep `bg-surface` so the tonal continuity from the narrative section is preserved — this is the emotional handoff from story → data → proof.

### 7.2 Layout

```tsx
<section className="py-20 bg-surface">
  <div className={`${C} text-center`}>
    <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-primary mb-10">
      It&rsquo;s not just Priya
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
      {[
        { n: "72%", copy: "of students would trust a high-achieving peer over a professor or advisor." },
        { n: "58%", copy: "have tried to approach another student for guidance — many got nowhere." },
        { n: "39%", copy: "say what&rsquo;s missing most is honest advice from someone who&rsquo;s succeeded here." },
      ].map(({ n, copy }) => (
        <div key={n} className="flex flex-col items-center">
          <span className="font-display font-extrabold text-6xl sm:text-7xl text-primary leading-none mb-5">
            {n}
          </span>
          <div className="h-px w-8 bg-outline-variant mb-5" aria-hidden="true" />
          <p className="font-body text-base text-on-surface-variant leading-relaxed max-w-[240px]">
            {copy}
          </p>
        </div>
      ))}
    </div>

    <p className="mt-14 font-body text-xs uppercase tracking-widest text-on-surface-variant">
      Independent research · 80+ first-year international students · 4 Melbourne universities
    </p>
  </div>
</section>
```

Static — not fetched from Supabase. The numbers come straight from the survey and are hard-coded in the component. If the research is re-run later, the values get edited in code. This is deliberate — it's editorial copy, not CMS data.

---

## 8. About page — full survey stat wall

### 8.1 Placement

File: `app/(marketing)/about/page.tsx`. Insert a new section **between** the existing "The problem" narrative and "How it works" card row.

### 8.2 Layout

Two-column asymmetric, mirroring the `problem` section above it:

```
bg-surface-container-low
py-28

lg:col-span-5 (sticky)                  lg:col-span-7 (cards)
─────────────────────                   ─────────────────────
THE RESEARCH                            [stat card 1]  — bg-surface-container
Built on what                           [stat card 2]  — bg-secondary-container
students actually                       [stat card 3]  — bg-primary-container
told us.                                [stat card 4]  — bg-surface-container-highest

Intro copy...
```

### 8.3 Left column

```tsx
<div className="lg:col-span-5 lg:sticky lg:top-28">
  <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
    The research
  </p>
  <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight leading-[1.1] mb-6">
    Built on what students<br />actually told us.
  </h2>
  <p className="font-body text-lg text-on-surface-variant leading-relaxed">
    We spent two semesters listening. Eighty first-year international
    students. Four Melbourne universities. Dozens of repeating patterns —
    all pointing to the same missing piece.
  </p>
</div>
```

No "Read the full report →" link in v1 (no report to link to yet). Can be added later.

### 8.4 Right column — four stat cards

Each card is its own tonal container. Pattern:

```tsx
<div className={`${bg} rounded-2xl p-10`}>
  <p className={`font-display font-extrabold text-6xl lg:text-7xl ${numColor} leading-none mb-4`}>
    {stat}
  </p>
  <div className={`h-1 w-12 ${ruleColor} rounded-full mb-5`} aria-hidden="true" />
  <p className={`font-body text-lg ${copyColor} leading-relaxed`}>
    {interpretation}
  </p>
</div>
```

Cards:

| # | `bg` | `numColor` / `ruleColor` / `copyColor` | Stat | Interpretation |
|---|---|---|---|---|
| 1 | `bg-surface-container` | `text-primary` / `bg-primary` / `text-on-surface-variant` | **72%** | of international students would trust a high-achieving peer over any professor, advisor, or counsellor. |
| 2 | `bg-secondary-container` | `text-on-secondary-container` / `bg-secondary` / `text-on-secondary-container/80` | **58% + 9.7%** | have tried approaching another student for guidance — one in ten got nowhere. |
| 3 | `bg-primary-container` | `text-on-primary-container` / `bg-primary` / `text-on-primary-container/80` | **39%** | say the missing piece is honest advice from someone who has already succeeded here. |
| 4 | `bg-surface-container-highest` | `text-primary` / `bg-primary` / `text-on-surface-variant` | **Career. Academics.** | the two goals tied for #1 in every cohort we spoke to — everything else came second. |

Card 4 deliberately uses a **word** instead of a percentage (reflects the bar-chart qualitative finding — no single number). Prevents monotony and breaks reader rhythm.

### 8.5 Attribution footer (full width, under the grid)

```tsx
<p className="mt-12 font-body text-xs uppercase tracking-widest text-on-surface-variant">
  Methodology · 80 semi-structured interviews · Feb–Oct 2025 · UniMelb, Monash, RMIT, Deakin
</p>
```

Adjust dates/universities during implementation if the actual research spec differs.

---

## 9. Components inventory (new files)

| File | Purpose |
|---|---|
| `supabase/migrations/20260419000001_reviews.sql` | Table, RLS, storage bucket, bucket RLS |
| `lib/validation/reviews.ts` | Zod schemas shared by form and server action |
| `components/ui/star-row.tsx` | Reusable 5-star renderer (Hoddle Blue filled, outline-variant empty) |
| `components/patterns/reviews-wall.tsx` | Homepage reviews section (+ ReviewCard sub-component) |
| `components/patterns/survey-strip.tsx` | Homepage 3-up mini survey strip |
| `components/patterns/survey-stat-wall.tsx` | About page asymmetric stat wall |
| `app/(admin)/admin/reviews/page.tsx` | Admin list |
| `app/(admin)/admin/reviews/new/page.tsx` | Create route |
| `app/(admin)/admin/reviews/[id]/edit/page.tsx` | Edit route |
| `app/(admin)/admin/reviews/review-form.tsx` | Shared form client component |
| `app/(admin)/admin/reviews/actions.ts` | `createReview`, `updateReview`, `deleteReview` server actions |

Modified files:
- `app/(admin)/admin/page.tsx` — add Reviews card to dashboard grid.
- `app/page.tsx` — fetch reviews; mount `<SurveyStrip />` and `<ReviewsWall reviews={reviews} />`.
- `app/(marketing)/about/page.tsx` — mount `<SurveyStatWall />`.
- `lib/supabase/database.types.ts` — regenerated after migration.

## 10. Accessibility

- `StarRow` has `role="img"` + `aria-label="Rated N out of 5"` on wrapper. Icons are `aria-hidden`.
- Admin star picker uses `role="radiogroup"` with 5 `role="radio"` buttons, full keyboard support (Arrow keys cycle, Space/Enter selects).
- Every avatar `<Image>` has a non-empty `alt` derived from `author_name`.
- Color contrast on stat numbers (`text-primary` on `surface-container-low`, `text-on-secondary-container` on `secondary-container`, etc.) meets WCAG AA — verify against the tokens in `app/globals.css` during implementation.
- Every homepage copy variant is keyboard-reachable; nothing new introduces focus traps.

## 11. Error handling

- Server actions return `{ ok: true, data } | { ok: false, error }` — never throw.
- Avatar upload failures surface as form-level errors; the DB row still persists (avatar can be added later).
- Homepage review query is wrapped in `Promise.all`; if it fails or returns nothing, the reviews section is silently hidden (no error shown to public visitors).
- About-page survey content is static, so no runtime error surface.

## 12. Out of scope (explicitly)

- User-submitted reviews, moderation queue, reporting.
- Tying reviews to specific mentors.
- Importing reviews from external sources.
- A "full research report" page (left column CTA omitted for v1).
- Localisation of review content.
- A/B testing of different copy variants.
- Phase 3 items from `CLAUDE.md` §5.

## 13. Rollout

1. Apply migration locally, regenerate types.
2. Build admin surface first; create 6 seed reviews via the UI.
3. Build homepage + about sections against the seeded data.
4. Manual QA:
   - Create / edit / delete a review; verify homepage updates after `revalidatePath`.
   - Unpublish a review; verify it disappears from homepage but stays in admin list.
   - Homepage renders with 0 / 2 / 3 / 6+ reviews (0–2 should hide section).
   - All sections pass WCAG AA against `surface-container-low` and tonal backgrounds.
   - Admin non-user visits `/admin/reviews` → 403 via existing layout guard.
5. Add a line to `docs/changelog.md` under `## [Unreleased]`.
6. Add a shipped entry in `todo.md` once merged.
