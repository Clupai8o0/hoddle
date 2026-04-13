# Database Schema — Hoddle Melbourne

Supabase Postgres. Row Level Security is **always on**. Every table listed here has RLS enabled and explicit policies. If a policy is missing, the table is broken — not open.

---

## Conventions

- Primary keys are `uuid` using `gen_random_uuid()`.
- Every table has `created_at timestamptz default now()` and (where mutable) `updated_at timestamptz default now()`.
- Foreign keys use `on delete cascade` when the child row is meaningless without the parent.
- Enums live in Postgres, not in application code, so the type generator picks them up.
- Array columns (`text[]`) are used for small unordered multi-selects. Anything with its own lifecycle gets a join table instead.

---

## Phase 1 tables

### `profiles`

Extends `auth.users` with application-level data. One row per authenticated user. Auto-created by a trigger on `auth.users` insert.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | FK → `auth.users(id)` on delete cascade |
| `full_name` | `text` | Nullable until onboarding step 1 |
| `country_of_origin` | `text` | Nullable until onboarding step 2 |
| `university` | `text` | Nullable until onboarding step 2 |
| `year_of_study` | `int` | `1` for Phase 1 (all first-years) |
| `role` | `user_role` enum | `'student'` \| `'mentor'` \| `'admin'`. Default `'student'`. |
| `onboarded_at` | `timestamptz` | Null until onboarding submitted; used by middleware to force the wizard |
| `avatar_url` | `text` | Nullable. Points to Supabase Storage. |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, touched by trigger |

**Enum:** `user_role as enum ('student', 'mentor', 'admin')`

**Trigger:** `on auth.users insert → insert into profiles (id) values (new.id)`

**RLS policies:**
- `select`: `auth.uid() = id` — users read only their own profile.
- `update`: `auth.uid() = id` — users update only their own profile.
- `insert`: blocked from the client; the trigger is the only writer.
- `delete`: blocked from the client.

---

### `onboarding_responses`

Captures the onboarding wizard's multi-select answers. One row per profile; rewriting the onboarding overwrites the row.

| Column | Type | Notes |
|---|---|---|
| `profile_id` | `uuid` PK | FK → `profiles(id)` on delete cascade |
| `goals` | `text[]` | E.g. `{'improve_gpa','land_internship','build_network'}` |
| `challenges` | `text[]` | E.g. `{'time_management','academic_writing','homesickness'}` |
| `fields_of_interest` | `text[]` | E.g. `{'engineering','finance','design'}` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, touched by trigger |

The allowed values for each array are enforced in the Zod schema in `lib/validation/onboarding.ts`, not in the database, so the vocabulary can evolve without migrations during Phase 1. When the vocabulary stabilises, promote each to an enum.

**RLS policies:**
- `select`: `auth.uid() = profile_id`
- `insert`: `auth.uid() = profile_id`
- `update`: `auth.uid() = profile_id`
- `delete`: blocked

**Side effect:** inserting/updating this row should also set `profiles.onboarded_at = now()`. Done in the server action, not in the database, so the wizard controls the moment of "onboarded."

---

## Storage buckets

### `avatars` (Phase 1)

Public bucket for profile photos. File path: `avatars/{profile_id}/{filename}`.

**Policies:**
- `select`: public (anyone can read).
- `insert` / `update` / `delete`: `auth.uid()::text = (storage.foldername(name))[1]` — users can only write to their own folder.

---

## Phase 2 tables

The tables below land in Phase 2 migrations. Each ships with RLS enabled and explicit policies. Where a policy depends on the user's role, it reads from `profiles.role` via a `security definer` helper function `is_admin()` / `is_mentor()` to avoid recursive RLS.

### `mentors`

Extended profile for users with `profiles.role = 'mentor'`. One row per mentor.

| Column | Type | Notes |
|---|---|---|
| `profile_id` | `uuid` PK | FK → `profiles(id)` on delete cascade |
| `slug` | `text` unique | URL slug, generated from full_name |
| `headline` | `text` | One-line tagline (e.g. "From Delhi to Deloitte in 3 years") |
| `bio` | `text` | Long-form mentor story, markdown |
| `expertise` | `text[]` | Tags for matching algorithm (`'academic_writing'`, `'internships'`, etc.) |
| `hometown` | `text` | Country/city of origin |
| `current_position` | `text` | Job title and company |
| `verified_at` | `timestamptz` | Null until admin verifies. Mentors with null `verified_at` are not surfaced to students. |
| `accepting_questions` | `boolean` | Default `true` |
| `created_at` / `updated_at` | `timestamptz` | |

**RLS:**
- `select`: anyone authenticated can read mentors with `verified_at is not null`. Mentors can also read their own row regardless of verification.
- `update`: mentor can update their own row (except `verified_at`).
- `insert`: blocked from client; created by `inviteMentor` server action via service role.
- `delete`: admin only.

---

### `mentor_invites`

Tokens for the admin invite-only mentor signup flow.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `email` | `text` | Recipient email |
| `token` | `text` unique | Cryptographically random, used in signup URL |
| `created_by` | `uuid` | FK → `profiles(id)` (the admin) |
| `accepted_at` | `timestamptz` | Null until used |
| `expires_at` | `timestamptz` | Default `now() + interval '14 days'` |
| `created_at` | `timestamptz` | |

**RLS:** admin only for all operations. Token validation in the signup route uses the service role client.

---

### `content_items`

Articles, videos, and downloadable resource posts authored by mentors.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `mentor_id` | `uuid` | FK → `mentors(profile_id)` on delete cascade |
| `type` | `content_type` enum | `'article'` \| `'video'` \| `'resource'` |
| `title` | `text` | |
| `slug` | `text` unique | |
| `excerpt` | `text` | Card-level summary |
| `body` | `jsonb` | Tiptap document JSON for articles; null for video/resource |
| `video_url` | `text` | YouTube/Vimeo URL for `type = 'video'` |
| `hero_image_url` | `text` | Supabase Storage path |
| `view_count` | `int` | Default `0`, debounced increments |
| `published_at` | `timestamptz` | Null = draft |
| `created_at` / `updated_at` | `timestamptz` | |

**Enum:** `content_type as enum ('article', 'video', 'resource')`

**RLS:**
- `select`: published items readable by any authenticated user. Drafts readable only by the author.
- `insert` / `update`: `auth.uid() = mentor_id and is_mentor()`.
- `delete`: author or admin.

---

### `content_resources`

Downloadable files attached to a `content_items` row.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `content_item_id` | `uuid` | FK → `content_items(id)` on delete cascade |
| `label` | `text` | Display name |
| `file_path` | `text` | Path in `content-resources` storage bucket |
| `file_size_bytes` | `bigint` | Enforced ≤ 25MB at upload time |
| `created_at` | `timestamptz` | |

**RLS:** inherits visibility from the parent `content_items` row via a join policy. Only mentors can write rows for their own content.

---

### `content_tags` and `content_item_tags`

Tag vocabulary for filtering. `content_tags` is the canonical list; `content_item_tags` is the join table.

| `content_tags` | Type |
|---|---|
| `slug` | `text` PK |
| `label` | `text` |

| `content_item_tags` | Type |
|---|---|
| `content_item_id` | `uuid` FK |
| `tag_slug` | `text` FK |
| Composite PK on both | |

**RLS:** read open to authenticated users. Writes mentor-only on their own content.

---

### `forum_categories`

Seeded categories for the community forums.

| Column | Type | Notes |
|---|---|---|
| `slug` | `text` PK | |
| `name` | `text` | |
| `description` | `text` | |
| `sort_order` | `int` | |

**RLS:** read open to authenticated users. Write admin only.

---

### `forum_threads`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `category_slug` | `text` | FK → `forum_categories(slug)` |
| `author_id` | `uuid` | FK → `profiles(id)` |
| `title` | `text` | |
| `slug` | `text` unique | |
| `body` | `text` | Initial post body (markdown) |
| `pinned` | `boolean` | Default `false`, admin only |
| `locked` | `boolean` | Default `false`, admin only |
| `last_activity_at` | `timestamptz` | Touched by trigger on new post or reaction |
| `created_at` / `updated_at` | `timestamptz` | |

**RLS:**
- `select`: any authenticated user.
- `insert`: any authenticated user.
- `update`: author within 30 minutes of creation, or admin.
- `delete`: author (soft delete via `deleted_at`) or admin.

---

### `forum_posts`

Replies within a thread. Two-level nesting only — `parent_post_id` may reference another post but that post may not itself have a parent.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `thread_id` | `uuid` | FK → `forum_threads(id)` on delete cascade |
| `author_id` | `uuid` | FK → `profiles(id)` |
| `parent_post_id` | `uuid` | Nullable, FK → `forum_posts(id)` |
| `body` | `text` | Markdown |
| `edited_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |
| `created_at` | `timestamptz` | |

**RLS:** same shape as `forum_threads`.

**Trigger:** on insert, update parent thread's `last_activity_at = now()`.

---

### `forum_reactions`

| Column | Type | Notes |
|---|---|---|
| `post_id` | `uuid` | FK → `forum_posts(id)` on delete cascade |
| `profile_id` | `uuid` | FK → `profiles(id)` |
| `reaction` | `reaction_type` enum | `'heart'` \| `'thanks'` \| `'helpful'` |
| Composite PK on (`post_id`, `profile_id`, `reaction`) | | |
| `created_at` | `timestamptz` | |

**Enum:** `reaction_type as enum ('heart', 'thanks', 'helpful')`

**RLS:** any authenticated user can insert/delete their own reactions. Read open.

---

### `success_stories`

Student-submitted wins. Moderation is required before publication.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `author_id` | `uuid` | FK → `profiles(id)` |
| `title` | `text` | |
| `slug` | `text` unique | |
| `body` | `text` | Markdown |
| `hero_image_url` | `text` | |
| `milestones` | `text[]` | E.g. `{'first_hd','first_internship','first_apartment'}` |
| `status` | `story_status` enum | `'draft'` \| `'pending'` \| `'published'` \| `'rejected'`. Default `'draft'`. |
| `featured` | `boolean` | Default `false`, admin only |
| `published_at` | `timestamptz` | Set when status flips to `'published'` |
| `created_at` / `updated_at` | `timestamptz` | |

**Enum:** `story_status as enum ('draft', 'pending', 'published', 'rejected')`

**RLS:**
- `select`: published stories readable by anyone authenticated. Authors can read their own drafts. Admins can read everything.
- `insert` / `update`: `auth.uid() = author_id` for non-status fields. Status transitions to `'published'`/`'rejected'` are admin-only.

---

### `live_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `mentor_id` | `uuid` | FK → `mentors(profile_id)` |
| `title` | `text` | |
| `description` | `text` | |
| `scheduled_at` | `timestamptz` | |
| `duration_minutes` | `int` | Default `60` |
| `max_attendees` | `int` | Nullable = uncapped |
| `meeting_url` | `text` | External meeting link (Zoom/Meet/etc.) |
| `recording_url` | `text` | Nullable, set after session |
| `status` | `session_status` enum | `'scheduled'` \| `'live'` \| `'completed'` \| `'cancelled'` |
| `created_at` / `updated_at` | `timestamptz` | |

**Enum:** `session_status as enum ('scheduled', 'live', 'completed', 'cancelled')`

**RLS:**
- `select`: any authenticated user.
- `insert` / `update`: mentor on their own sessions, or admin.
- `delete`: mentor (only if no registrations) or admin.

---

### `session_registrations`

| Column | Type | Notes |
|---|---|---|
| `session_id` | `uuid` | FK → `live_sessions(id)` on delete cascade |
| `profile_id` | `uuid` | FK → `profiles(id)` |
| Composite PK on both | | |
| `registered_at` | `timestamptz` | |
| `attended` | `boolean` | Set post-session by mentor |

**RLS:**
- `select`: registrant, the session's mentor, and admin.
- `insert`: `auth.uid() = profile_id`. Capacity check enforced in the server action, not RLS.
- `delete`: registrant.

---

### `session_questions`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `session_id` | `uuid` | FK → `live_sessions(id)` on delete cascade |
| `profile_id` | `uuid` | FK → `profiles(id)`. Stored even when `anonymous = true` for moderation; never exposed to mentor when anonymous. |
| `body` | `text` | |
| `anonymous` | `boolean` | |
| `answered` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | |

**RLS:**
- `select`: the session's mentor and the question author. When `anonymous = true`, the API layer strips `profile_id` before sending to the mentor.
- `insert`: any authenticated user.
- `update`: mentor can flip `answered`. Author cannot edit.

---

### `notifications`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `recipient_id` | `uuid` | FK → `profiles(id)` |
| `type` | `notification_type` enum | See enum below |
| `payload` | `jsonb` | Type-specific data (mentor_id, thread_id, session_id, etc.) |
| `read_at` | `timestamptz` | Null = unread |
| `created_at` | `timestamptz` | |

**Enum:** `notification_type as enum ('mentor_replied_to_your_question', 'new_content_from_mentor_you_follow', 'forum_reply_to_your_thread', 'session_reminder_24h', 'session_starting_soon', 'success_story_approved')`

**RLS:**
- `select`: `auth.uid() = recipient_id`.
- `update`: recipient may set `read_at` only.
- `insert`: blocked from client; written via the server-side `notify()` helper using the service role.

---

### `notification_preferences`

| Column | Type | Notes |
|---|---|---|
| `profile_id` | `uuid` PK | FK → `profiles(id)` on delete cascade |
| `email_enabled` | `boolean` | Default `true` |
| `in_app_enabled` | `boolean` | Default `true` |
| `types_muted` | `notification_type[]` | Per-type opt-out |
| `updated_at` | `timestamptz` | |

**RLS:** owner read/write only.

---

### `mentor_recommendations`

Materialised results of the matching algorithm. Recomputed on onboarding update or nightly via cron.

| Column | Type | Notes |
|---|---|---|
| `profile_id` | `uuid` | FK → `profiles(id)` on delete cascade |
| `mentor_id` | `uuid` | FK → `mentors(profile_id)` on delete cascade |
| `rank` | `int` | 1–5 |
| `score` | `int` | Raw weighted score |
| `reasoning` | `text` | Human-readable "why this mentor" line |
| `computed_at` | `timestamptz` | |
| Composite PK on (`profile_id`, `mentor_id`) | | |

**RLS:** read by the student only (`auth.uid() = profile_id`). Writes via service role from the matching function.

---

### `mentor_follows`

| Column | Type | Notes |
|---|---|---|
| `follower_id` | `uuid` | FK → `profiles(id)` |
| `mentor_id` | `uuid` | FK → `mentors(profile_id)` on delete cascade |
| Composite PK on both | | |
| `created_at` | `timestamptz` | |

**RLS:** any authenticated user can insert/delete their own follows. Read open (used for "X students follow this mentor" counts).

---

## Storage buckets (Phase 2 additions)

| Bucket | Visibility | Notes |
|---|---|---|
| `content-media` | Public read | Mentor-uploaded hero images for content items |
| `content-resources` | Private (signed URLs) | Downloadable files attached to content. Mentors can write to their own folder. |
| `session-recordings` | Private (signed URLs) | Session recording uploads, owner-only writes |
| `story-images` | Public read | Hero images for success stories |

---

## Helper functions

Two `security definer` functions to keep RLS policies clean and avoid recursive lookups:

- `is_admin()` → `boolean` — returns `true` if the calling user has `profiles.role = 'admin'`
- `is_mentor()` → `boolean` — returns `true` if the calling user has `profiles.role = 'mentor'`

Both functions are owned by the database role, not the authenticated role, so they can read `profiles` without triggering the table's own RLS.

---

## Regenerating types

After every migration:

```
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

Commit the regenerated file in the same PR as the migration. A PR that changes the schema without regenerating types should not be merged.
