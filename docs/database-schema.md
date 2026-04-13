# Database Schema — Hoddle Melbourne

Supabase Postgres. Row Level Security is **always on**. Every table listed here has RLS enabled and explicit policies. If a policy is missing, the table is broken — not open.

Phase 1 tables only. Phase 2 tables (`mentors`, `content_items`, `forum_threads`, etc.) will be added when that phase begins.

---

## Conventions

- Primary keys are `uuid` using `gen_random_uuid()`.
- Every table has `created_at timestamptz default now()` and (where mutable) `updated_at timestamptz default now()`.
- Foreign keys use `on delete cascade` when the child row is meaningless without the parent.
- Enums live in Postgres, not in application code, so the type generator picks them up.
- Array columns (`text[]`) are used for small unordered multi-selects. Anything with its own lifecycle gets a join table instead.

---

## Tables

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

## Phase 2 preview (not yet created)

These tables are intentionally not in the Phase 1 migration. Listed here so nothing drifts when Phase 2 starts:

- `mentors` — extended mentor profile, verification status, expertise tags
- `content_items` — articles, videos, advice sessions authored by mentors
- `forum_threads` + `forum_posts` — community discussion
- `success_stories` — student-submitted wins
- `mentor_badges` — achievement recognition
- `live_sessions` — scheduled Q&A events

Each will arrive with its own migration, RLS policies, and generated types.

---

## Regenerating types

After every migration:

```
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

Commit the regenerated file in the same PR as the migration. A PR that changes the schema without regenerating types should not be merged.