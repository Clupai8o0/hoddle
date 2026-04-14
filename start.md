# Hoddle Melbourne — Fresh Start Guide

Use this guide when you want to wipe all test users/mentors and rebuild the app from scratch with real accounts.

---

## Part 1 — Clear all user data from production

This removes every auth user and all their associated data (profiles, mentor records, content, forum posts, stories, sessions, notifications, follows, recommendations). Forum categories are **not** removed — they are schema-level seed data and should stay.

### Step 1 — Open the Supabase SQL editor

Go to your Supabase project dashboard → **SQL Editor** → **New query**.

### Step 2 — Wipe user-generated data

Several tables reference `profiles(id)` without `on delete cascade` (e.g. `forum_posts.author_id`, `forum_threads.author_id`, `success_stories.author_id`), so deleting from `auth.users` directly hits a foreign key violation. Delete in dependency order instead — paste and run this entire block in one query:

```sql
-- ⚠️  IRREVERSIBLE — wipes every user and all their data.
-- Delete leaf tables first (no-cascade FKs), then parents.

-- Forum reactions → posts → threads
delete from public.forum_reactions;
delete from public.forum_posts;
delete from public.forum_threads;

-- Session children → sessions
delete from public.session_questions;
delete from public.session_registrations;
delete from public.live_sessions;

-- Stories
delete from public.success_stories;

-- Content children → content items
delete from public.content_item_tags;
delete from public.content_resources;
delete from public.content_items;

-- Notifications + preferences
delete from public.notifications;
delete from public.notification_preferences;

-- Matching + follows
delete from public.mentor_recommendations;
delete from public.mentor_follows;

-- Mentor invites (references profiles.created_by without cascade)
delete from public.mentor_invites;

-- Mentors + onboarding (have cascade, but safe to be explicit)
delete from public.mentors;
delete from public.onboarding_responses;

-- Now profiles is safe to clear, which cascades to auth.users
delete from public.profiles;

-- Finally wipe auth — any remaining orphan auth records
delete from auth.users;
```

> After running this the `auth.users` table is empty, which means no one can log in. The next step is to create fresh accounts.

### Step 3 — Verify the wipe

Run these checks to confirm everything is empty:

```sql
select count(*) from auth.users;              -- should be 0
select count(*) from public.profiles;         -- should be 0
select count(*) from public.mentors;          -- should be 0
select count(*) from public.content_items;    -- should be 0
select count(*) from public.forum_threads;    -- should be 0
select count(*) from public.success_stories;  -- should be 0
select count(*) from public.mentor_invites;   -- should be 0
```

Forum categories should still be present:

```sql
select slug from public.forum_categories order by sort_order;
-- should return 5 rows
```

### Step 4 — Clear storage (optional)

If you uploaded any avatars, content images, or story hero images during testing, clear them in **Storage** in the Supabase dashboard:

- `avatars` bucket — delete all folders
- `content-media` bucket — delete all files
- `story-images` bucket — delete all files

---

## Part 2 — Set up the app from scratch

### 1. Create the admin account

1. Go to **Authentication → Users** in the Supabase dashboard.
2. Click **Invite user** (or **Add user → Create new user**) and enter the admin email address.
3. The user receives a magic link and signs in — this auto-creates a `profiles` row.
4. Once the profile exists, promote it to admin in the SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'your-admin-email@example.com'
);
```

5. Sign in to the app with that email. Complete the onboarding wizard (required before the dashboard loads).
6. Confirm you can access `/admin` — you should see the admin dashboard.

---

### 2. Invite the first mentor

Mentors are invite-only. The admin sends an invite from inside the app.

1. Sign in as admin and go to `/admin/mentors/invite`.
2. Enter the mentor's email and an optional note, then submit.
3. The mentor receives an email with a link to `/mentor-signup/[token]`.
4. The mentor follows the link, signs in via magic link, and completes their profile (headline, bio, expertise, hometown, current position).

---

### 3. Verify the mentor

After the mentor completes their profile it appears in the admin list as unverified (no `verified_at` timestamp). Unverified mentors are invisible to students.

1. Go to `/admin/mentors` as admin.
2. Click the mentor's name to open their review page.
3. Click **Verify mentor** — this sets `verified_at` and makes them visible to students.

---

### 4. Mentor completes their profile

Ask the mentor to:

1. Sign in and go to their dashboard (`/mentor-dashboard`).
2. Fill out or update: headline, bio, expertise tags, hometown, current position.
3. Upload a profile photo.

---

### 5. Mentor publishes their first content

1. From the mentor dashboard, go to **Content → New article** (or video/resource).
2. Write the title, excerpt, and body.
3. Add tags.
4. Click **Publish** (sets `published_at`).

Published content appears in the content library at `/content` and on the mentor's profile.

---

### 6. Sign up the first student

Students sign up via the main auth flow at `/login` or `/signup`.

1. Student enters their email and receives a magic link.
2. They complete the onboarding wizard:
   - **Step 1:** Full name
   - **Step 2:** University, country of origin
   - **Step 3:** Goals, challenges, fields of interest (multi-select)
3. After onboarding, the matching algorithm runs and populates `mentor_recommendations` for this student.
4. The student lands on their dashboard with mentor recommendations.

---

### 7. Repeat for additional mentors and students

- Each new mentor goes through the invite → signup → verify flow (steps 2–4 above).
- Each new student signs up directly via `/signup` (steps in step 6).

---

## Reference — table ownership summary

| Table | Who creates rows | How |
|---|---|---|
| `auth.users` | Supabase Auth | Magic link sign-in |
| `profiles` | DB trigger | Auto on `auth.users` insert |
| `mentors` | `inviteMentor` server action | Admin invite → mentor signup |
| `mentor_invites` | Admin via `/admin/mentors/invite` | Form submission |
| `content_items` | Mentor via mentor dashboard | Publish flow |
| `forum_categories` | Migration seed | Already present — do not recreate |
| `forum_threads` | Any authenticated user | Forum UI |
| `success_stories` | Any student | Story submission → admin approval |
| `live_sessions` | Mentor | Session scheduler in dashboard |
| `mentor_recommendations` | Matching algorithm (server action) | Runs on student onboarding |
| `notifications` | Server-side `notify()` helper | Triggered by app events |

---

## Troubleshooting

**Mentor link expired**
Invite tokens expire after 14 days. Delete the old `mentor_invites` row and send a new invite from `/admin/mentors/invite`.

**Student stuck on onboarding**
If `profiles.onboarded_at` is null, middleware forces the wizard on every load. In the SQL editor:
```sql
-- Force-complete onboarding for a stuck user (use sparingly)
update public.profiles
set onboarded_at = now()
where id = '<profile-uuid>';
```

**Mentor not appearing to students**
Check that `mentors.verified_at` is not null:
```sql
select slug, verified_at from public.mentors;
```
If null, go to `/admin/mentors/[id]` and click **Verify mentor**.

**No mentor recommendations for a student**
The matching algorithm runs as a server action on onboarding completion. Trigger it manually from the SQL editor or re-submit the student's onboarding if needed.
