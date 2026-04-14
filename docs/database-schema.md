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

## Phase 3 tables

Phase 3 adds badges, graduation, i18n preferences, PWA push, calendars, matching telemetry, resource hub, extended anonymity, and the admin audit log. Every table ships with RLS; the audit log is additionally append-only via a policy that denies `update` and `delete` to everyone including admins.

### `mentor_badges`

Canonical badge catalog. Seeded from `lib/badges/catalog.ts`, one row per badge definition.

| Column | Type | Notes |
|---|---|---|
| `slug` | `text` PK | E.g. `'founding_mentor'` |
| `label` | `text` | Display name |
| `tier` | `badge_tier` enum | `'bronze'` \| `'silver'` \| `'gold'` |
| `description` | `text` | Editorial explanation shown on the badge page |
| `icon_slug` | `text` | References an organic-shape SVG, not a Lucide icon |
| `criteria` | `jsonb` | Machine-readable criteria used by `evaluateBadgeCriteria()` |
| `created_at` | `timestamptz` | |

**Enum:** `badge_tier as enum ('bronze', 'silver', 'gold')`

**RLS:** read open to all authenticated users. Writes admin only.

---

### `mentor_badge_awards`

The badges a mentor has actually earned. Composite PK prevents duplicates.

| Column | Type | Notes |
|---|---|---|
| `mentor_id` | `uuid` | FK → `mentors(profile_id)` on delete cascade |
| `badge_slug` | `text` | FK → `mentor_badges(slug)` |
| `awarded_at` | `timestamptz` | default `now()` |
| `awarded_by` | `uuid` | FK → `profiles(id)`. Null for auto-awarded. |
| `reason` | `text` | Optional human-written citation for manual awards |
| Composite PK on (`mentor_id`, `badge_slug`) | | |

**RLS:** read open to authenticated users. Writes via server function (service role) or admin.

---

### `graduation_applications`

Student applications to become a mentor.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid` | FK → `profiles(id)` on delete cascade |
| `submitted_at` | `timestamptz` | |
| `status` | `graduation_status` enum | `'pending'` \| `'approved'` \| `'rejected'` \| `'withdrawn'` |
| `why_mentor` | `text` | Essay field |
| `who_would_you_mentor` | `text` | Essay field |
| `short_bio` | `text` | Used to seed the `mentors` row on approval |
| `mentor_reference_id` | `uuid` | FK → `mentors(profile_id)`. The mentor vouching for this applicant. |
| `milestones_snapshot` | `jsonb` | Captured at submission time: sessions attended, stories published, forum helpful count. Source of truth for eligibility review. |
| `decision_note` | `text` | Admin's written decision rationale |
| `decided_at` | `timestamptz` | |
| `decided_by` | `uuid` | FK → `profiles(id)` |

**Enum:** `graduation_status as enum ('pending', 'approved', 'rejected', 'withdrawn')`

**RLS:**
- `select`: applicant, the reference mentor, and admin.
- `insert`: applicant only (`auth.uid() = profile_id`), and only if they pass server-side eligibility check.
- `update`: status transitions and decision fields are admin only. Applicant can update essay fields while `status = 'pending'`.
- `delete`: blocked.

---

### `university_calendars`

Registry of ICS feeds pulled nightly.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `university` | `text` | E.g. `'University of Melbourne'` |
| `term` | `text` | E.g. `'2026 Semester 1'` |
| `name` | `text` | Human-friendly calendar name |
| `feed_url` | `text` | The ICS URL (admin-only visibility) |
| `last_synced_at` | `timestamptz` | |
| `last_sync_status` | `text` | `'ok'` or error message |
| `created_at` | `timestamptz` | |

**RLS:** read open for `university` + `name` + `term` fields; `feed_url` visible to admin only (enforced via a view or column-level policy). Writes admin only.

---

### `university_events`

Parsed events from ICS feeds.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `calendar_id` | `uuid` | FK → `university_calendars(id)` on delete cascade |
| `source_uid` | `text` | ICS UID, used for upsert-idempotency |
| `title` | `text` | |
| `description` | `text` | |
| `starts_at` | `timestamptz` | |
| `ends_at` | `timestamptz` | |
| `category` | `text` | `'academic'` \| `'admin'` \| `'social'` \| `'deadline'` |
| Unique on (`calendar_id`, `source_uid`) | | |

**RLS:** read open to authenticated users. Writes via sync cron using service role.

---

### `user_calendar_subscriptions`

Which students follow which calendars. Auto-subscribed on onboarding based on `profiles.university`.

| Column | Type | Notes |
|---|---|---|
| `profile_id` | `uuid` | FK → `profiles(id)` on delete cascade |
| `calendar_id` | `uuid` | FK → `university_calendars(id)` on delete cascade |
| Composite PK on both | | |
| `created_at` | `timestamptz` | |

**RLS:** user reads/writes their own rows only.

---

### `recommendation_clicks`

Telemetry for matching algorithm v2.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid` | FK → `profiles(id)` |
| `mentor_id` | `uuid` | FK → `mentors(profile_id)` |
| `recommendation_rank` | `int` | The rank shown at click time |
| `algorithm_version` | `text` | `'v1'` or `'v2'` |
| `clicked_at` | `timestamptz` | |
| `source` | `text` | `'dashboard'` \| `'directory'` \| `'email'` |
| `downstream_actions` | `jsonb` | Populated post-click: `{ viewed_content: true, registered_session: false, followed: true }` |

**RLS:** user reads their own rows. Admin reads all. Writes via server action.

---

### `mentor_impact_daily`

Materialised view powering the mentor analytics dashboard. Refreshed nightly.

```sql
create materialized view mentor_impact_daily as
  select
    mentor_id,
    date_trunc('day', event_at) as date,
    count(*) filter (where event_type = 'content_view') as content_views,
    count(distinct viewer_id) filter (where event_type = 'content_view') as unique_readers,
    count(*) filter (where event_type = 'new_follower') as new_followers,
    count(*) filter (where event_type = 'forum_reply') as forum_replies,
    count(*) filter (where event_type = 'session_registration') as session_registrations,
    count(*) filter (where event_type = 'question_received') as questions_received
  from mentor_events
  group by 1, 2;
```

Requires a simple `mentor_events` append-only event table written by Phase 3 server actions. Refresh via `refresh materialized view concurrently mentor_impact_daily` on nightly cron.

**RLS:** mentor reads their own rows only. Admin reads all.

---

### `resources`

Curated external resource hub.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `title` | `text` | |
| `url` | `text` | |
| `description` | `text` | Why this resource is worth linking to |
| `category` | `text` | `'visa'` \| `'housing'` \| `'health'` \| `'transport'` \| `'finance'` \| `'academic'` \| `'career'` |
| `university` | `text` | Nullable — null means "applies to all" |
| `tags` | `text[]` | Free-form tags for search |
| `curated_by` | `uuid` | FK → `profiles(id)` (the admin who added it) |
| `added_at` | `timestamptz` | |
| `last_verified_at` | `timestamptz` | Updated by link-health cron |
| `status` | `resource_status` enum | `'active'` \| `'broken'` \| `'retired'` |
| `notes` | `text` | Internal admin notes |

**Enum:** `resource_status as enum ('active', 'broken', 'retired')`

**RLS:** read open for `status = 'active'`. Admin reads all. Writes admin only.

---

### `push_subscriptions`

Web Push endpoints for the PWA.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid` | FK → `profiles(id)` on delete cascade |
| `endpoint` | `text` unique | The browser-issued push endpoint URL |
| `keys` | `jsonb` | `{ p256dh, auth }` |
| `created_at` | `timestamptz` | |
| `last_used_at` | `timestamptz` | Touched on every successful send |

**RLS:** user reads/writes their own rows only. Service role reads for sending.

---

### `admin_actions`

Append-only audit log. No updates. No deletes. Ever.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `actor_id` | `uuid` | FK → `profiles(id)` |
| `action` | `text` | E.g. `'verify_mentor'`, `'reveal_anonymous_author'`, `'retire_resource'` |
| `target_table` | `text` | |
| `target_id` | `text` | Text to handle composite PKs |
| `diff` | `jsonb` | Before/after snapshot of the changed row |
| `reason` | `text` | Required for reveal / delete actions, enforced at helper level |
| `created_at` | `timestamptz` | default `now()` |

**RLS:**
- `select`: admin only.
- `insert`: server role only (via `logAdminAction()` helper).
- `update` / `delete`: **policy explicitly denies these for every role, including `authenticated` and `service_role`.** The only way to "correct" the log is to append another row noting the correction.

This is the one table in the system where the database schema itself enforces append-only semantics, rather than relying on application code.

---

### Table alterations

Phase 3 also alters three existing tables:

**`profiles`** — add `preferred_locale text default 'en'`. Used by middleware and email templates.

**`mentors`** — add `tier mentor_tier default 'community'`. Computed by a trigger after every `mentor_badge_awards` insert/delete. Enum: `mentor_tier as enum ('community', 'verified', 'distinguished', 'elder')`.

**`session_questions`** — add `anonymity_level anonymity_level default 'identified'` and `pseudonym text`. The `profile_id` column stays so moderation is always possible, but API layer strips it for non-admin reads when anonymity is not `'identified'`. Enum: `anonymity_level as enum ('identified', 'pseudonym', 'fully_anonymous')`.

---

### Storage buckets (Phase 3 additions)

| Bucket | Visibility | Notes |
|---|---|---|
| `badge-art` | Public read | Organic-shape SVGs for mentor badges. Admin write only. |
| `pwa-assets` | Public read | Manifest icons, splash screens, offline fallback imagery. |

---

## Regenerating types

After every migration:

```
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

Commit the regenerated file in the same PR as the migration. A PR that changes the schema without regenerating types should not be merged.
