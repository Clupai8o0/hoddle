# Reviews + Survey Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship admin-curated platform reviews on the homepage, a 3-up survey proof strip on the homepage, and an asymmetric survey stat wall on the about page — all aligned with the Hoddle design system.

**Architecture:** Supabase-backed `reviews` table with admin-only write RLS (using the existing `public.is_admin()` helper) and a public `reviews` storage bucket for avatars. Admin CRUD lives under `/admin/reviews`, reusing the server-action pattern from `lib/actions/admin-mentors.ts`. Public sections are server-rendered — homepage fetches live reviews and renders an asymmetric wall plus a hard-coded survey strip; about page mounts a hard-coded stat wall. Stars render via a shared `StarRow` primitive (Hoddle Blue filled, outline-variant empty — **never yellow**).

**Tech Stack:** Next.js (App Router, RSC), TypeScript strict, Supabase Postgres + Storage + RLS, Zod v4 validation, Tailwind CSS v4 tokens, lucide-react icons.

**Spec reference:** `docs/superpowers/specs/2026-04-19-reviews-and-survey-data-design.md`.

**Testing note:** The repo has no automated test framework. Each task therefore verifies via `npm run lint`, TypeScript via `npm run build` (or `tsc --noEmit` if added), and manual interaction against the local dev server / Supabase. Treat the QA checklist in Task 11 as the acceptance gate.

---

## File Structure

**New files:**
| Path | Responsibility |
|---|---|
| `supabase/migrations/20260419000001_reviews.sql` | `reviews` table + RLS + storage bucket + bucket RLS |
| `lib/validation/reviews.ts` | `adminReviewCreateSchema`, `adminReviewEditSchema`, types |
| `lib/actions/admin-reviews.ts` | `createReview`, `updateReview`, `deleteReview`, `uploadReviewAvatar` server actions |
| `components/ui/star-row.tsx` | Accessible 5-star renderer (display + interactive modes) |
| `components/patterns/review-card.tsx` | Single card in the reviews wall |
| `components/patterns/reviews-wall.tsx` | Homepage reviews section — server component |
| `components/patterns/survey-strip.tsx` | Homepage 3-up proof band (static) |
| `components/patterns/survey-stat-wall.tsx` | About page asymmetric stat wall (static) |
| `app/(admin)/admin/reviews/page.tsx` | Admin list route |
| `app/(admin)/admin/reviews/new/page.tsx` | Admin "new" route |
| `app/(admin)/admin/reviews/[id]/edit/page.tsx` | Admin "edit" route |
| `app/(admin)/admin/reviews/admin-review-form.tsx` | Shared client form (create + edit) |
| `app/(admin)/admin/reviews/delete-review-button.tsx` | Inline delete confirm + server action caller |

**Modified files:**
| Path | Change |
|---|---|
| `app/(admin)/admin/page.tsx` | Add "Reviews" card to dashboard grid; add unpublished-count query |
| `app/page.tsx` | Fetch reviews; mount `<SurveyStrip />` and `<ReviewsWall reviews={…} />` |
| `app/(marketing)/about/page.tsx` | Mount `<SurveyStatWall />` between "The problem" and "How it works" |
| `lib/supabase/database.types.ts` | Regenerated after migration |
| `docs/changelog.md` | Add `[Unreleased]` entry |
| `todo.md` | Add shipped entry (after merge) |

---

## Task 1 — Migration: reviews table, RLS, storage bucket

**Files:**
- Create: `supabase/migrations/20260419000001_reviews.sql`
- Modify: `lib/supabase/database.types.ts` (regen)

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260419000001_reviews.sql`:

```sql
-- ─────────────────────────────────────────────────────────────────
-- Platform reviews (admin-curated testimonials)
-- ─────────────────────────────────────────────────────────────────

create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  author_name    text not null check (char_length(author_name) between 1 and 120),
  author_context text check (author_context is null or char_length(author_context) <= 160),
  avatar_url     text,
  rating         smallint not null check (rating between 1 and 5),
  content        text not null check (char_length(content) between 10 and 400),
  published      boolean not null default true,
  display_order  int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index reviews_published_order_idx
  on public.reviews (published, display_order, created_at desc);

-- updated_at trigger (reuses the project convention of in-migration trigger)
create or replace function public.reviews_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.reviews_set_updated_at();

-- RLS
alter table public.reviews enable row level security;

create policy "reviews_public_read"
  on public.reviews for select
  using (published = true);

create policy "reviews_admin_read"
  on public.reviews for select
  using (public.is_admin());

create policy "reviews_admin_insert"
  on public.reviews for insert
  with check (public.is_admin());

create policy "reviews_admin_update"
  on public.reviews for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "reviews_admin_delete"
  on public.reviews for delete
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────
-- Reviews storage bucket + RLS
-- ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reviews', 'reviews', true, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "reviews_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'reviews');

create policy "reviews_bucket_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'reviews' and public.is_admin());

create policy "reviews_bucket_admin_update"
  on storage.objects for update
  using (bucket_id = 'reviews' and public.is_admin());

create policy "reviews_bucket_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'reviews' and public.is_admin());
```

- [ ] **Step 2: Reset the local database**

Run: `npm run db:reset`
Expected: migration applies cleanly, no errors, all previous seed data re-applied.

- [ ] **Step 3: Regenerate types**

Run: `npm run db:types`
Expected: `lib/supabase/database.types.ts` now contains `reviews: { Row/Insert/Update }` with all 10 columns.

- [ ] **Step 4: Verify the table visually**

Run: `npx supabase db dump --data-only --schema public -f /tmp/hoddle-schema.sql`
Then check `/tmp/hoddle-schema.sql` or open Studio at `http://127.0.0.1:54323` → Table editor → confirm `reviews` table exists with correct columns and RLS policies.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260419000001_reviews.sql lib/supabase/database.types.ts
git commit -m "feat(db): add reviews table, RLS, and storage bucket"
```

---

## Task 2 — Zod validation schemas

**Files:**
- Create: `lib/validation/reviews.ts`

- [ ] **Step 1: Write the schemas**

Create `lib/validation/reviews.ts`:

```ts
import { z } from "zod";

export const adminReviewCreateSchema = z.object({
  author_name: z
    .string()
    .trim()
    .min(1, "Author name is required.")
    .max(120, "Keep the name to 120 characters or fewer."),
  author_context: z
    .string()
    .trim()
    .max(160, "Keep context to 160 characters or fewer.")
    .optional()
    .default(""),
  rating: z.coerce
    .number()
    .int("Rating must be a whole number.")
    .min(1, "Rating must be at least 1 star.")
    .max(5, "Rating can't exceed 5 stars."),
  content: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters.")
    .max(400, "Keep the review to 400 characters or fewer."),
  published: z.boolean().optional().default(true),
  display_order: z.coerce.number().int().optional().default(0),
});

export const adminReviewEditSchema = adminReviewCreateSchema;

export type AdminReviewCreateInput = z.infer<typeof adminReviewCreateSchema>;
export type AdminReviewEditInput = z.infer<typeof adminReviewEditSchema>;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors related to `lib/validation/reviews.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/validation/reviews.ts
git commit -m "feat(validation): add admin review create/edit schemas"
```

---

## Task 3 — Server actions

**Files:**
- Create: `lib/actions/admin-reviews.ts`

- [ ] **Step 1: Write the server actions module**

Create `lib/actions/admin-reviews.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminReviewCreateSchema,
  adminReviewEditSchema,
} from "@/lib/validation/reviews";

const uuidSchema = z.string().uuid("Invalid review ID.");
const ALLOWED_MIME = ["image/webp", "image/jpeg", "image/png"] as const;
const MAX_BYTES = 2 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Helper: verify caller is admin (mirrors lib/actions/admin-mentors.ts)
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false, error: "Insufficient permissions." };
  }
  return { ok: true, userId: user.id };
}

function revalidateReviewSurfaces(id?: string) {
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  if (id) revalidatePath(`/admin/reviews/${id}/edit`);
}

// ---------------------------------------------------------------------------
// createReview
// ---------------------------------------------------------------------------

export async function createReview(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = adminReviewCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      author_name: parsed.data.author_name,
      author_context: parsed.data.author_context || null,
      rating: parsed.data.rating,
      content: parsed.data.content,
      published: parsed.data.published,
      display_order: parsed.data.display_order,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create review." };
  }

  revalidateReviewSurfaces(data.id);
  return { ok: true, id: data.id };
}

// ---------------------------------------------------------------------------
// updateReview
// ---------------------------------------------------------------------------

export async function updateReview(
  id: string,
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { ok: false, error: idParsed.error.issues[0]?.message ?? "Invalid ID." };
  }

  const parsed = adminReviewEditSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({
      author_name: parsed.data.author_name,
      author_context: parsed.data.author_context || null,
      rating: parsed.data.rating,
      content: parsed.data.content,
      published: parsed.data.published,
      display_order: parsed.data.display_order,
    })
    .eq("id", idParsed.data);

  if (error) return { ok: false, error: error.message };

  revalidateReviewSurfaces(idParsed.data);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// deleteReview
// ---------------------------------------------------------------------------

export async function deleteReview(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) {
    return { ok: false, error: idParsed.error.issues[0]?.message ?? "Invalid ID." };
  }

  const admin = createAdminClient();

  // Best-effort avatar cleanup — ignore individual errors so delete still proceeds.
  const { data: files } = await admin.storage
    .from("reviews")
    .list(idParsed.data);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${idParsed.data}/${f.name}`);
    await admin.storage.from("reviews").remove(paths);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", idParsed.data);

  if (error) return { ok: false, error: error.message };

  revalidateReviewSurfaces();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// uploadReviewAvatar — FormData { file: File }
// Requires the review row to already exist (so we have a stable id for the path).
// ---------------------------------------------------------------------------

export async function uploadReviewAvatar(
  reviewId: string,
  formData: FormData,
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const idParsed = uuidSchema.safeParse(reviewId);
  if (!idParsed.success) {
    return { ok: false, error: idParsed.error.issues[0]?.message ?? "Invalid ID." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File must be 2 MB or smaller." };
  }
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    return { ok: false, error: "File must be JPEG, PNG, or WebP." };
  }

  const admin = createAdminClient();
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const path = `${idParsed.data}/avatar.${ext}`;

  // Clear any prior avatar objects for this review (different extensions).
  const { data: prior } = await admin.storage
    .from("reviews")
    .list(idParsed.data);
  if (prior && prior.length > 0) {
    const stale = prior
      .filter((f) => f.name !== `avatar.${ext}`)
      .map((f) => `${idParsed.data}/${f.name}`);
    if (stale.length) await admin.storage.from("reviews").remove(stale);
  }

  const { error: uploadError } = await admin.storage
    .from("reviews")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: publicUrlData } = admin.storage
    .from("reviews")
    .getPublicUrl(path);
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("reviews")
    .update({ avatar_url: avatarUrl })
    .eq("id", idParsed.data);
  if (dbError) return { ok: false, error: dbError.message };

  revalidateReviewSurfaces(idParsed.data);
  return { ok: true, avatarUrl };
}

// ---------------------------------------------------------------------------
// removeReviewAvatar
// ---------------------------------------------------------------------------

export async function removeReviewAvatar(
  reviewId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const idParsed = uuidSchema.safeParse(reviewId);
  if (!idParsed.success) {
    return { ok: false, error: idParsed.error.issues[0]?.message ?? "Invalid ID." };
  }

  const admin = createAdminClient();
  const { data: prior } = await admin.storage
    .from("reviews")
    .list(idParsed.data);
  if (prior && prior.length > 0) {
    const paths = prior.map((f) => `${idParsed.data}/${f.name}`);
    await admin.storage.from("reviews").remove(paths);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ avatar_url: null })
    .eq("id", idParsed.data);
  if (error) return { ok: false, error: error.message };

  revalidateReviewSurfaces(idParsed.data);
  return { ok: true };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint -- lib/actions/admin-reviews.ts`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/admin-reviews.ts
git commit -m "feat(actions): add admin review CRUD and avatar upload"
```

---

## Task 4 — `StarRow` primitive

**Files:**
- Create: `components/ui/star-row.tsx`

- [ ] **Step 1: Write the component**

Create `components/ui/star-row.tsx`:

```tsx
"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StarRowDisplayProps {
  rating: number;
  size?: number;
  className?: string;
}

interface StarRowInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
  id?: string;
}

/**
 * Read-only star display — Hoddle Blue filled + outline-variant empty.
 * Never uses yellow/gold (design system rule: no warm colours).
 */
export function StarRow({ rating, size = 16, className }: StarRowDisplayProps) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      role="img"
      aria-label={`Rated ${clamped} out of 5`}
      className={cn("flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= clamped;
        return (
          <Star
            key={n}
            size={size}
            strokeWidth={1.5}
            aria-hidden="true"
            className={cn(filled ? "fill-primary text-primary" : "text-outline-variant")}
          />
        );
      })}
    </div>
  );
}

/**
 * Interactive star picker — radiogroup pattern, keyboard accessible.
 * Arrow keys move between stars, Space/Enter selects.
 */
export function StarRowInput({
  value,
  onChange,
  size = 24,
  className,
  id,
}: StarRowInputProps) {
  const clamped = Math.max(1, Math.min(5, Math.round(value)));

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      id={id}
      className={cn("flex items-center gap-1", className)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(Math.min(5, clamped + 1));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(Math.max(1, clamped - 1));
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= clamped;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === clamped}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            tabIndex={n === clamped ? 0 : -1}
            onClick={() => onChange(n)}
            className={cn(
              "rounded-sm p-1 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            )}
          >
            <Star
              size={size}
              strokeWidth={1.5}
              aria-hidden="true"
              className={cn(filled ? "fill-primary text-primary" : "text-outline-variant")}
            />
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint -- components/ui/star-row.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/star-row.tsx
git commit -m "feat(ui): add StarRow display + input primitives (Hoddle Blue)"
```

---

## Task 5 — Admin dashboard card + list page

**Files:**
- Modify: `app/(admin)/admin/page.tsx`
- Create: `app/(admin)/admin/reviews/page.tsx`
- Create: `app/(admin)/admin/reviews/delete-review-button.tsx`

- [ ] **Step 1: Add the dashboard card**

In `app/(admin)/admin/page.tsx`:

- Add `MessageSquareQuote` to the lucide imports.
- Add a new parallel query to the `Promise.all`:

```ts
supabase
  .from("reviews")
  .select("id", { count: "exact", head: true })
  .eq("published", false),
```

- Destructure `{ count: unpublishedReviews }` from the added promise.
- Append a new object to the `cards` array:

```ts
{
  href: "/admin/reviews",
  icon: MessageSquareQuote,
  label: "Reviews",
  description: "Manage platform testimonials shown on the homepage.",
  badge: unpublishedReviews ?? 0,
  badgeLabel: "unpublished",
},
```

- [ ] **Step 2: Create the delete button component**

Create `app/(admin)/admin/reviews/delete-review-button.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteReview } from "@/lib/actions/admin-reviews";

export function DeleteReviewButton({ id, authorName }: { id: string; authorName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteReview(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="font-body text-sm text-on-surface-variant hover:text-error inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
        aria-label={`Delete review by ${authorName}`}
      >
        <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="font-body text-sm font-semibold text-error hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm disabled:opacity-60"
      >
        {isPending ? "Deleting..." : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="font-body text-sm text-on-surface-variant hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
      >
        Cancel
      </button>
      {error && (
        <span className="font-body text-xs text-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the list page**

Create `app/(admin)/admin/reviews/page.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import { MessageSquareQuote, Plus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { StarRow } from "@/components/ui/star-row";
import { createClient } from "@/lib/supabase/server";
import { DeleteReviewButton } from "./delete-review-button";

export const metadata = { title: "Reviews — Admin" };
export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, author_name, author_context, avatar_url, rating, content, published, display_order, created_at")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = reviews ?? [];

  return (
    <Container className="py-10 sm:py-16">
      <nav className="font-body text-sm text-on-surface-variant mb-3">
        <Link href="/admin" className="hover:text-primary transition-colors">
          Admin
        </Link>
        {" / "}
        <span className="text-on-surface">Reviews</span>
      </nav>

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
            Reviews
          </h1>
          <p className="font-body text-on-surface-variant text-base sm:text-lg">
            Platform testimonials shown on the homepage.
          </p>
        </div>
        <Button variant="primary" size="default" asChild>
          <Link href="/admin/reviews/new" className="gap-2">
            <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
            New review
          </Link>
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="bg-surface-container rounded-xl p-10 sm:p-16 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-5">
            <MessageSquareQuote size={22} strokeWidth={1.5} className="text-primary" aria-hidden="true" />
          </div>
          <h2 className="font-display font-bold text-xl text-on-surface mb-2">
            No reviews yet
          </h2>
          <p className="font-body text-on-surface-variant max-w-sm mb-6">
            Add your first student testimonial. It will appear on the homepage once published.
          </p>
          <Button variant="primary" size="default" asChild>
            <Link href="/admin/reviews/new">Add the first review</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="bg-surface-container rounded-xl p-6 flex flex-col md:flex-row md:items-start gap-5"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-primary-container flex items-center justify-center shrink-0">
                {r.avatar_url ? (
                  <Image
                    src={r.avatar_url}
                    alt={r.author_name}
                    width={56}
                    height={56}
                    className="w-14 h-14 object-cover"
                  />
                ) : (
                  <span className="font-display font-bold text-sm text-primary select-none">
                    {initials(r.author_name)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-display font-semibold text-on-surface text-base">
                    {r.author_name}
                  </p>
                  {r.published ? (
                    <span className="font-body text-xs font-semibold text-on-secondary-container bg-secondary-container px-2 py-0.5 rounded-full">
                      Published
                    </span>
                  ) : (
                    <span className="font-body text-xs font-semibold text-on-surface-variant bg-outline-variant/40 px-2 py-0.5 rounded-full">
                      Draft
                    </span>
                  )}
                  <span className="font-body text-xs text-on-surface-variant">
                    order: {r.display_order}
                  </span>
                </div>
                {r.author_context && (
                  <p className="font-body text-sm text-on-surface-variant mb-2">
                    {r.author_context}
                  </p>
                )}
                <StarRow rating={r.rating} className="mb-2" />
                <p className="font-body text-sm text-on-surface leading-relaxed line-clamp-2">
                  “{r.content}”
                </p>
              </div>

              <div className="flex md:flex-col md:items-end gap-3 md:gap-2 shrink-0">
                <Link
                  href={`/admin/reviews/${r.id}/edit`}
                  className="font-body text-sm font-semibold text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
                >
                  Edit →
                </Link>
                <DeleteReviewButton id={r.id} authorName={r.author_name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Visual verification**

Run: `npm run dev`
Visit `http://localhost:3000/admin/reviews` as an admin user. Expected: empty state renders. Dashboard at `/admin` shows the new "Reviews" card.

- [ ] **Step 6: Commit**

```bash
git add app/(admin)/admin/page.tsx app/(admin)/admin/reviews/page.tsx app/(admin)/admin/reviews/delete-review-button.tsx
git commit -m "feat(admin): add reviews list, dashboard card, and delete button"
```

---

## Task 6 — Admin review form (shared create + edit)

**Files:**
- Create: `app/(admin)/admin/reviews/admin-review-form.tsx`

- [ ] **Step 1: Write the form component**

Create `app/(admin)/admin/reviews/admin-review-form.tsx`:

```tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, CheckCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StarRowInput } from "@/components/ui/star-row";
import {
  createReview,
  updateReview,
  uploadReviewAvatar,
  removeReviewAvatar,
} from "@/lib/actions/admin-reviews";

interface AdminReviewFormProps {
  mode: "create" | "edit";
  reviewId?: string;
  defaultValues?: {
    author_name: string;
    author_context: string;
    rating: number;
    content: string;
    published: boolean;
    display_order: number;
  };
  currentAvatarUrl?: string | null;
}

export function AdminReviewForm({
  mode,
  reviewId,
  defaultValues,
  currentAvatarUrl,
}: AdminReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl ?? null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  // Fields
  const [authorName, setAuthorName] = useState(defaultValues?.author_name ?? "");
  const [authorContext, setAuthorContext] = useState(defaultValues?.author_context ?? "");
  const [rating, setRating] = useState<number>(defaultValues?.rating ?? 5);
  const [content, setContent] = useState(defaultValues?.content ?? "");
  const [published, setPublished] = useState(defaultValues?.published ?? true);
  const [displayOrder, setDisplayOrder] = useState<number>(defaultValues?.display_order ?? 0);

  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!authorName.trim()) errs.author_name = "Name is required.";
    if (authorName.length > 120) errs.author_name = "Max 120 characters.";
    if (authorContext.length > 160) errs.author_context = "Max 160 characters.";
    if (rating < 1 || rating > 5) errs.rating = "Pick 1–5 stars.";
    if (content.trim().length < 10) errs.content = "At least 10 characters.";
    if (content.length > 400) errs.content = "Max 400 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAvatarChangeEdit(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !reviewId) return;

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarError(null);
    setAvatarUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadReviewAvatar(reviewId, formData);
    setAvatarUploading(false);

    if (!result.ok) {
      setAvatarError(result.error);
      setAvatarPreview(null);
      return;
    }
    setAvatarUrl(result.avatarUrl);
  }

  function handleAvatarChangeCreate(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarError(null);
  }

  async function handleRemoveAvatar() {
    if (!reviewId) return;
    setAvatarError(null);
    setAvatarUploading(true);
    const result = await removeReviewAvatar(reviewId);
    setAvatarUploading(false);
    if (!result.ok) {
      setAvatarError(result.error);
      return;
    }
    setAvatarUrl(null);
    setAvatarPreview(null);
  }

  function handleSubmit() {
    if (!validate()) return;
    setServerError(null);
    setSaved(false);

    const payload = {
      author_name: authorName.trim(),
      author_context: authorContext.trim(),
      rating,
      content: content.trim(),
      published,
      display_order: displayOrder,
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createReview(payload);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }
        if (pendingAvatarFile) {
          const formData = new FormData();
          formData.append("file", pendingAvatarFile);
          const avatarResult = await uploadReviewAvatar(result.id, formData);
          if (!avatarResult.ok) {
            setAvatarError(`Review created but photo upload failed: ${avatarResult.error}`);
          }
        }
        router.push("/admin/reviews");
      } else {
        if (!reviewId) {
          setServerError("Missing review ID.");
          return;
        }
        const result = await updateReview(reviewId, payload);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }
        setSaved(true);
        router.refresh();
      }
    });
  }

  const displayAvatar = avatarPreview ?? avatarUrl;

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display font-semibold text-lg text-on-surface">Photo</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-container-high flex-shrink-0">
            {displayAvatar ? (
              <Image
                src={displayAvatar}
                alt={`${authorName || "Reviewer"} avatar`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                <Camera size={28} strokeWidth={1.5} aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={mode === "edit" ? handleAvatarChangeEdit : handleAvatarChangeCreate}
              aria-label="Upload review photo"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="default"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUploading ? "Uploading..." : displayAvatar ? "Replace photo" : "Upload photo"}
              </Button>
              {mode === "edit" && avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="font-body text-sm text-on-surface-variant hover:text-error inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
                >
                  <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
            <p className="font-body text-xs text-on-surface-variant">
              JPEG, PNG or WebP · max 2 MB
            </p>
            {avatarError && (
              <p className="font-body text-xs text-error" role="alert">
                {avatarError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-6">
        <h2 className="font-display font-semibold text-lg text-on-surface">Identity</h2>

        <Input
          label="Author name"
          placeholder="e.g. Priya Sharma"
          value={authorName}
          onChange={(e) => {
            setAuthorName(e.target.value);
            clearError("author_name");
            setSaved(false);
          }}
          error={errors.author_name}
          autoFocus
        />

        <div>
          <Input
            label="Context"
            placeholder="e.g. First-year Commerce, Monash"
            value={authorContext}
            onChange={(e) => {
              setAuthorContext(e.target.value);
              clearError("author_context");
              setSaved(false);
            }}
            error={errors.author_context}
          />
          <p className="font-body text-xs text-on-surface-variant mt-1.5 text-right">
            {authorContext.length}/160
          </p>
        </div>
      </div>

      {/* Review content */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-6">
        <h2 className="font-display font-semibold text-lg text-on-surface">Review</h2>

        <div>
          <p className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase mb-2">
            Rating
          </p>
          <StarRowInput value={rating} onChange={setRating} />
          {errors.rating && (
            <p className="font-body text-sm text-error mt-1" role="alert">
              {errors.rating}
            </p>
          )}
        </div>

        <div>
          <Textarea
            label="Content"
            placeholder="What did this student say about Hoddle?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              clearError("content");
              setSaved(false);
            }}
            error={errors.content}
            rows={5}
          />
          <p className="font-body text-xs text-on-surface-variant mt-1.5 text-right">
            {content.length}/400
          </p>
        </div>
      </div>

      {/* Publishing */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-6">
        <h2 className="font-display font-semibold text-lg text-on-surface">Publishing</h2>

        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => {
              setPublished(e.target.checked);
              setSaved(false);
            }}
            className="mt-1 w-5 h-5 rounded accent-primary cursor-pointer"
          />
          <div>
            <p className="font-body font-medium text-on-surface">Published</p>
            <p className="font-body text-sm text-on-surface-variant">
              Published reviews appear on the homepage. Drafts are hidden from the public.
            </p>
          </div>
        </label>

        <div>
          <label
            htmlFor="display_order"
            className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
          >
            Display order
          </label>
          <input
            id="display_order"
            type="number"
            value={displayOrder}
            onChange={(e) => {
              setDisplayOrder(Number.parseInt(e.target.value, 10) || 0);
              setSaved(false);
            }}
            className="mt-2 w-32 min-h-[48px] px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none border-none focus:ring-2 focus:ring-tertiary"
          />
          <p className="font-body text-xs text-on-surface-variant mt-1.5">
            Lower numbers appear first. Ties break by newest.
          </p>
        </div>
      </div>

      {serverError && (
        <p className="font-body text-sm text-error" role="alert">
          {serverError}
        </p>
      )}

      {saved && (
        <div className="flex items-center gap-2 font-body text-sm text-secondary" role="status">
          <CheckCircle size={16} strokeWidth={1.5} aria-hidden="true" />
          Changes saved.
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="primary" size="lg" onClick={handleSubmit} disabled={isPending}>
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create review"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push("/admin/reviews")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint -- app/(admin)/admin/reviews/admin-review-form.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/(admin)/admin/reviews/admin-review-form.tsx
git commit -m "feat(admin): add shared review form (create + edit)"
```

---

## Task 7 — Admin new + edit routes

**Files:**
- Create: `app/(admin)/admin/reviews/new/page.tsx`
- Create: `app/(admin)/admin/reviews/[id]/edit/page.tsx`

- [ ] **Step 1: Write the "new" page**

Create `app/(admin)/admin/reviews/new/page.tsx`:

```tsx
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { AdminReviewForm } from "../admin-review-form";

export const metadata = { title: "New review — Admin" };

export default function NewReviewPage() {
  return (
    <Container className="py-10 sm:py-16">
      <div className="max-w-2xl">
        <nav className="font-body text-sm text-on-surface-variant mb-3">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
          {" / "}
          <Link href="/admin/reviews" className="hover:text-primary transition-colors">
            Reviews
          </Link>
          {" / "}
          <span className="text-on-surface">New</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
          New review
        </h1>
        <p className="font-body text-on-surface-variant text-base sm:text-lg mb-8 sm:mb-10">
          Add a student testimonial to display on the homepage.
        </p>

        <AdminReviewForm mode="create" />
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Write the "edit" page**

Create `app/(admin)/admin/reviews/[id]/edit/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { AdminReviewForm } from "../../admin-review-form";

export const metadata = { title: "Edit review — Admin" };
export const dynamic = "force-dynamic";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: review } = await supabase
    .from("reviews")
    .select("id, author_name, author_context, avatar_url, rating, content, published, display_order")
    .eq("id", id)
    .single();

  if (!review) notFound();

  return (
    <Container className="py-10 sm:py-16">
      <div className="max-w-2xl">
        <nav className="font-body text-sm text-on-surface-variant mb-3">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
          {" / "}
          <Link href="/admin/reviews" className="hover:text-primary transition-colors">
            Reviews
          </Link>
          {" / "}
          <span className="text-on-surface">Edit</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
          Edit review
        </h1>
        <p className="font-body text-on-surface-variant text-base sm:text-lg mb-8 sm:mb-10">
          Update the testimonial for {review.author_name}.
        </p>

        <AdminReviewForm
          mode="edit"
          reviewId={review.id}
          defaultValues={{
            author_name: review.author_name,
            author_context: review.author_context ?? "",
            rating: review.rating,
            content: review.content,
            published: review.published,
            display_order: review.display_order,
          }}
          currentAvatarUrl={review.avatar_url}
        />
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

With `npm run dev` running and signed in as an admin:
- Visit `/admin/reviews/new`. Fill in name, rating 5, context, content, upload a photo, click Create. Verify redirect to `/admin/reviews` and the row appears with avatar + stars.
- Click Edit → change rating to 4 → Save. Verify `Changes saved.` appears and the list shows 4 stars.
- Create a second review with "Published" unchecked (draft). Verify the dashboard `Reviews` card shows `1 unpublished`.
- Delete one review; verify the avatar object is also removed (check Storage in Supabase Studio).

- [ ] **Step 5: Commit**

```bash
git add app/(admin)/admin/reviews/new/page.tsx "app/(admin)/admin/reviews/[id]/edit/page.tsx"
git commit -m "feat(admin): add review create and edit routes"
```

---

## Task 8 — Public `ReviewCard` + `ReviewsWall`

**Files:**
- Create: `components/patterns/review-card.tsx`
- Create: `components/patterns/reviews-wall.tsx`

- [ ] **Step 1: Write `ReviewCard`**

Create `components/patterns/review-card.tsx`:

```tsx
import Image from "next/image";
import { StarRow } from "@/components/ui/star-row";
import { cn } from "@/lib/utils/cn";

export interface Review {
  id: string;
  author_name: string;
  author_context: string | null;
  avatar_url: string | null;
  rating: number;
  content: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ReviewCard({
  review,
  variant = "short",
}: {
  review: Review;
  variant?: "short" | "tall";
}) {
  return (
    <article
      className={cn(
        "bg-surface-container-lowest rounded-[var(--radius-md)] p-8 shadow-ambient flex flex-col gap-6",
        variant === "tall" && "md:py-10",
      )}
    >
      <StarRow rating={review.rating} />
      <blockquote className="font-body text-base sm:text-lg text-on-surface leading-relaxed italic">
        &ldquo;{review.content}&rdquo;
      </blockquote>
      <footer className="flex items-center gap-3 mt-auto">
        {review.avatar_url ? (
          <Image
            src={review.avatar_url}
            alt={review.author_name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <span
            className="w-10 h-10 rounded-full bg-primary-container font-display font-bold text-sm text-primary flex items-center justify-center select-none"
            aria-hidden="true"
          >
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
  );
}
```

- [ ] **Step 2: Write `ReviewsWall`**

Create `components/patterns/reviews-wall.tsx`:

```tsx
import { ReviewCard, type Review } from "./review-card";

const C = "max-w-7xl mx-auto px-4 sm:px-10 lg:px-16";

// Asymmetric rhythm breaks grid monotony — editorial, not template.
const RHYTHM: Array<"short" | "tall"> = ["short", "tall", "short", "tall", "short", "short"];

export function ReviewsWall({ reviews }: { reviews: Review[] }) {
  if (reviews.length < 3) return null;

  return (
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
          {reviews.map((review, i) => (
            <ReviewCard
              key={review.id}
              review={review}
              variant={RHYTHM[i % RHYTHM.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/patterns/review-card.tsx components/patterns/reviews-wall.tsx
git commit -m "feat(patterns): add ReviewCard and ReviewsWall for homepage"
```

---

## Task 9 — `SurveyStrip` (homepage) + `SurveyStatWall` (about)

**Files:**
- Create: `components/patterns/survey-strip.tsx`
- Create: `components/patterns/survey-stat-wall.tsx`

- [ ] **Step 1: Write `SurveyStrip`**

Create `components/patterns/survey-strip.tsx`:

```tsx
const C = "max-w-7xl mx-auto px-4 sm:px-10 lg:px-16";

const STATS = [
  {
    n: "72%",
    copy: "of students would trust a high-achieving peer over a professor or advisor.",
  },
  {
    n: "58%",
    copy: "have tried to approach another student for guidance — many got nowhere.",
  },
  {
    n: "39%",
    copy: "say what's missing most is honest advice from someone who's succeeded here.",
  },
] as const;

export function SurveyStrip() {
  return (
    <section className="py-20 bg-surface">
      <div className={`${C} text-center`}>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-primary mb-10">
          It&rsquo;s not just Priya
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {STATS.map(({ n, copy }) => (
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
  );
}
```

- [ ] **Step 2: Write `SurveyStatWall`**

Create `components/patterns/survey-stat-wall.tsx`:

```tsx
const C = "max-w-7xl mx-auto px-4 sm:px-10 lg:px-16";

type StatCard = {
  stat: string;
  interpretation: string;
  bg: string;
  numColor: string;
  ruleColor: string;
  copyColor: string;
};

const STATS: StatCard[] = [
  {
    stat: "72%",
    interpretation:
      "of international students would trust a high-achieving peer over any professor, advisor, or counsellor.",
    bg: "bg-surface-container",
    numColor: "text-primary",
    ruleColor: "bg-primary",
    copyColor: "text-on-surface-variant",
  },
  {
    stat: "58% + 9.7%",
    interpretation:
      "have tried approaching another student for guidance — and one in ten got nowhere.",
    bg: "bg-secondary-container",
    numColor: "text-on-secondary-container",
    ruleColor: "bg-secondary",
    copyColor: "text-on-secondary-container/80",
  },
  {
    stat: "39%",
    interpretation:
      "say the missing piece is honest advice from someone who has already succeeded here.",
    bg: "bg-primary-container",
    numColor: "text-on-primary-container",
    ruleColor: "bg-primary",
    copyColor: "text-on-primary-container/80",
  },
  {
    stat: "Career. Academics.",
    interpretation:
      "the two goals tied for #1 in every cohort we spoke to — everything else came second.",
    bg: "bg-surface-container-highest",
    numColor: "text-primary",
    ruleColor: "bg-primary",
    copyColor: "text-on-surface-variant",
  },
];

export function SurveyStatWall() {
  return (
    <section className="py-28 bg-surface-container-low">
      <div className={`${C} grid lg:grid-cols-12 gap-10 sm:gap-16 items-start`}>
        {/* Left column — sticky intro */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
            The research
          </p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight leading-[1.1] mb-6">
            Built on what students
            <br />
            actually told us.
          </h2>
          <p className="font-body text-lg text-on-surface-variant leading-relaxed">
            We spent two semesters listening. Eighty first-year international
            students. Four Melbourne universities. Dozens of repeating patterns
            — all pointing to the same missing piece.
          </p>
        </div>

        {/* Right column — stat cards */}
        <div className="lg:col-span-7 grid grid-cols-1 gap-5">
          {STATS.map(({ stat, interpretation, bg, numColor, ruleColor, copyColor }) => (
            <div key={stat} className={`${bg} rounded-2xl p-8 lg:p-10`}>
              <p className={`font-display font-extrabold text-5xl lg:text-6xl ${numColor} leading-none mb-4`}>
                {stat}
              </p>
              <div className={`h-1 w-12 ${ruleColor} rounded-full mb-5`} aria-hidden="true" />
              <p className={`font-body text-base lg:text-lg ${copyColor} leading-relaxed`}>
                {interpretation}
              </p>
            </div>
          ))}

          <p className="mt-4 font-body text-xs uppercase tracking-widest text-on-surface-variant">
            Methodology · 80 semi-structured interviews · 4 Melbourne universities
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/patterns/survey-strip.tsx components/patterns/survey-stat-wall.tsx
git commit -m "feat(patterns): add SurveyStrip and SurveyStatWall"
```

---

## Task 10 — Mount on homepage + about page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/(marketing)/about/page.tsx`

- [ ] **Step 1: Wire the homepage**

In `app/page.tsx`:

1. Add imports at the top:

```tsx
import { SurveyStrip } from "@/components/patterns/survey-strip";
import { ReviewsWall } from "@/components/patterns/reviews-wall";
import type { Review } from "@/components/patterns/review-card";
```

2. In the `Promise.all` at the start of `HomePage`, add a third parallel query:

```ts
supabase
  .from("reviews")
  .select("id, author_name, author_context, avatar_url, rating, content")
  .eq("published", true)
  .order("display_order", { ascending: true })
  .order("created_at", { ascending: false })
  .limit(6),
```

   Destructure `{ data: reviews }` as the third element.

3. Cast once:

```ts
const typedReviews = (reviews ?? []) as unknown as Review[];
```

4. Mount `<SurveyStrip />` **between** the "Priya at 2am" narrative section and the "Mentor preview strip" section (immediately after the closing `</section>` of the narrative section):

```tsx
<SurveyStrip />
```

5. Mount `<ReviewsWall reviews={typedReviews} />` **between** the `#how-it-works` section and the "Members unlock" (`bg-primary`) section:

```tsx
<ReviewsWall reviews={typedReviews} />
```

- [ ] **Step 2: Wire the about page**

In `app/(marketing)/about/page.tsx`:

1. Add the import:

```tsx
import { SurveyStatWall } from "@/components/patterns/survey-stat-wall";
```

2. Mount `<SurveyStatWall />` immediately after the closing `</section>` of the "The problem" narrative section and before the "How it works" section:

```tsx
<SurveyStatWall />
```

- [ ] **Step 3: Type-check, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: build succeeds with no errors or type issues.

- [ ] **Step 4: Visual verification**

With `npm run dev` running:
- Seed at least 3 published reviews via `/admin/reviews`.
- Visit `/` — confirm the survey strip renders after the Priya narrative, and the reviews wall renders after "How it works". Stars are Hoddle Blue (not yellow). Layout is asymmetric.
- With only 2 published reviews, confirm the reviews wall is hidden entirely.
- Visit `/about` — confirm the stat wall renders between "The problem" and "How it works". Sticky left column scrolls correctly.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx "app/(marketing)/about/page.tsx"
git commit -m "feat(web): mount reviews wall, survey strip, and stat wall"
```

---

## Task 11 — Manual QA + changelog

**Files:**
- Modify: `docs/changelog.md`
- Modify: `todo.md`

- [ ] **Step 1: Manual QA checklist**

With a clean local DB (`npm run db:reset`) and `npm run dev` running, work through the full acceptance checklist. Check each box only when the behaviour is confirmed:

- [ ] **Admin gate** — as a non-admin logged-in user, visit `/admin/reviews`. Expected: redirect to `/dashboard`.
- [ ] **Anonymous gate** — logged out, visit `/admin/reviews`. Expected: redirect to `/login`.
- [ ] **Create flow** — as admin, create a review with 5 stars, 150-char content, uploaded photo. Expected: redirected to `/admin/reviews`, row appears with the photo and 5 filled Hoddle Blue stars.
- [ ] **Validation — too short** — attempt to submit content of 5 chars. Expected: inline error "At least 10 characters.", no server call.
- [ ] **Validation — too long** — paste 500 chars into content. Expected: counter shows 500/400, inline error "Max 400 characters." on submit.
- [ ] **Validation — missing name** — clear name and submit. Expected: inline error "Name is required."
- [ ] **Photo — oversize** — upload a 3 MB file. Expected: `File must be 2 MB or smaller.` error, no upload occurs.
- [ ] **Photo — wrong type** — upload a `.gif`. Expected: `File must be JPEG, PNG, or WebP.` error.
- [ ] **Edit flow** — change rating from 5→4, save. Expected: `Changes saved.` appears; list view shows 4 filled stars.
- [ ] **Remove photo (edit)** — click Remove. Expected: avatar falls back to initials; Supabase Studio shows the object deleted from the bucket.
- [ ] **Draft toggle** — uncheck Published, save. Expected: row shows `Draft` pill; homepage no longer shows this review.
- [ ] **Dashboard badge** — with 1 draft + 2 published, visit `/admin`. Expected: Reviews card badge reads `1 unpublished`; with 0 drafts the badge is hidden.
- [ ] **Delete flow** — delete a review, confirm. Expected: row removed; storage folder for that review removed in Supabase Studio.
- [ ] **Homepage — 0 reviews** — delete all published reviews. Visit `/`. Expected: reviews wall section is hidden entirely; rest of page layout is uninterrupted.
- [ ] **Homepage — 2 published** — seed exactly 2 published reviews. Visit `/`. Expected: reviews wall section still hidden (threshold is 3).
- [ ] **Homepage — 6 published** — seed 6. Visit `/`. Expected: wall renders with asymmetric short/tall rhythm; cards alternate heights.
- [ ] **Homepage — survey strip** — visit `/`. Expected: 3 bold percentages (72%, 58%, 39%) in Hoddle Blue between Priya narrative and mentor preview; attribution line below.
- [ ] **About page — stat wall** — visit `/about`. Expected: 4 stat cards in right column (tonal rotation: `surface-container`, `secondary-container`, `primary-container`, `surface-container-highest`); sticky left column remains visible while scrolling the cards.
- [ ] **Star colours** — inspect any `Star` icon on `/` and `/admin/reviews`. Expected: filled stars are Hoddle Blue (`#001842` via `text-primary`), empty stars are `text-outline-variant`. **No yellow/gold anywhere.**
- [ ] **Keyboard — admin form** — tab through the form. Focus rings render (`ring-tertiary`). Star picker: ← → cycle rating, Space/Enter selects. Textarea counter updates live.
- [ ] **Keyboard — homepage** — tab through. Review cards are not focusable (they are non-interactive `<article>`s). This is expected.
- [ ] **Contrast** — with devtools, verify `text-primary` on `bg-surface-container-low` (reviews wall title), `text-on-secondary-container` on `bg-secondary-container` (stat wall card 2), and `text-on-primary-container` on `bg-primary-container` (stat wall card 3) all pass WCAG AA at the rendered font size.
- [ ] **Revalidation** — open `/` in one tab, `/admin/reviews/new` in another. Create a new published review. Return to `/` and hard-refresh. Expected: new review appears.
- [ ] **Build passes** — run `npm run build`. Expected: no type or lint errors.

- [ ] **Step 2: Update changelog**

In `docs/changelog.md`, add under `## [Unreleased]`:

```markdown
### Added
- Homepage platform reviews — admin-curated testimonials stored in Supabase with star ratings, author photos, and context. Rendered as an asymmetric editorial wall on the homepage when at least three reviews are published.
- Homepage survey proof strip — 3-up bold statistics ("72% / 58% / 39%") sourced from the founding student needs research, placed between the Priya narrative and the mentor preview.
- About page research stat wall — four tonal stat cards between "The problem" and "How it works", anchored by a sticky intro column.
- Admin Reviews CRUD — `/admin/reviews` list, create, edit, delete with photo upload, Hoddle Blue star rating input, publish/draft toggle, and display-order control. New dashboard card with unpublished-count badge.
```

- [ ] **Step 3: Update todo.md**

Add a line under `## Shipped` in `todo.md`:

```markdown
- Reviews section (homepage) + survey data treatments (homepage strip, about stat wall); admin CRUD at `/admin/reviews`.
```

- [ ] **Step 4: Commit**

```bash
git add docs/changelog.md todo.md
git commit -m "docs: log reviews + survey data shipping"
```

---

## Self-review results

Ran the three-pass check against the spec and the plan:

1. **Spec coverage** — every section of `docs/superpowers/specs/2026-04-19-reviews-and-survey-data-design.md` maps to a task:
   - §3 Data model → Task 1.
   - §4 Zod → Task 2.
   - §5 Admin UX → Tasks 5, 6, 7.
   - §6 Reviews section → Task 8 + Task 10.
   - §7 Mini survey strip → Task 9 + Task 10.
   - §8 Full stat wall → Task 9 + Task 10.
   - §9 Components inventory → covered across Tasks 1–10.
   - §10 Accessibility → Tasks 4, 6, 11 (QA).
   - §11 Error handling → Task 3 (action return shape) + Task 11 (QA).
   - §13 Rollout → Task 11.

2. **Placeholder scan** — no TBDs, no "implement later" stubs, no "similar to earlier". One deliberate adjustment vs spec: the spec referenced `is_admin(auth.uid())`; the actual helper in `supabase/migrations/20260413000003_phase2_schema.sql` is `public.is_admin()` (no arg). Plan uses the correct no-arg form.

3. **Type consistency** — the `Review` type defined in `components/patterns/review-card.tsx` (Task 8) is imported verbatim in `app/page.tsx` (Task 10). `StarRow` display + `StarRowInput` picker names used consistently by Tasks 5, 6, 8. Action names (`createReview`, `updateReview`, `deleteReview`, `uploadReviewAvatar`, `removeReviewAvatar`) defined in Task 3 and referenced identically in Tasks 5 and 6.
