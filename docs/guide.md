# Hoddle — Operator Guide

Step-by-step reference for setting up, deploying, and running Hoddle Melbourne. Covers local development, production Supabase configuration, Vercel deployment, and day-to-day platform management.

---

## Contents

1. [Local development setup](#1-local-development-setup)
2. [Supabase project setup (production)](#2-supabase-project-setup-production)
3. [Vercel deployment](#3-vercel-deployment)
4. [First admin user](#4-first-admin-user)
5. [Admin dashboard](#5-admin-dashboard)
6. [Inviting and verifying mentors](#6-inviting-and-verifying-mentors)
7. [Mentor onboarding and dashboard](#7-mentor-onboarding-and-dashboard)
8. [Publishing content as a mentor](#8-publishing-content-as-a-mentor)
9. [Scheduling and running a live session](#9-scheduling-and-running-a-live-session)
10. [Student experience](#10-student-experience)
11. [Community forums](#11-community-forums)
12. [Success stories — submission and moderation](#12-success-stories--submission-and-moderation)
13. [Notifications](#13-notifications)
14. [Cron jobs](#14-cron-jobs)
15. [Storage buckets](#15-storage-buckets)
16. [Resetting or re-running the matching algorithm](#16-resetting-or-re-running-the-matching-algorithm)

---

## 1. Local development setup

### Prerequisites

- **Node.js 20+** — verify with `node -v`
- **pnpm** — install with `npm install -g pnpm`
- **Docker Desktop** — must be running for Supabase's local Postgres
- **Supabase CLI** — install with `npm install -g supabase`

### Steps

```bash
# 1. Clone the repo
git clone <repo-url> hoddle
cd hoddle

# 2. Install dependencies
pnpm install

# 3. Copy the env template
cp .env.local.example .env.local
```

Open `.env.local`. You will fill it in with the values from the next two steps.

```bash
# 4. Start the local Supabase stack (Docker must be running)
npx supabase start
```

This prints output like:

```
API URL: http://127.0.0.1:54321
anon key: eyJhbGci...
service_role key: eyJhbGci...
```

Copy the `API URL`, `anon key`, and `service_role key` into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from above>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from above>
```

Also fill in your Resend credentials (get a free API key at resend.com):

```bash
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=hello@hoddle.com.au
```

```bash
# 5. Apply all database migrations
npx supabase db push

# 6. Generate TypeScript types from the schema
npx supabase gen types typescript --local > lib/supabase/database.types.ts

# 7. Start the dev server
pnpm dev
```

Open `http://localhost:3000`. The landing page should load.

### Local Supabase dashboard

While `supabase start` is running, the local Supabase Studio is at `http://127.0.0.1:54323`. Use it to inspect tables, run SQL, manage users, and browse storage — same as the cloud dashboard but local.

---

## 2. Supabase project setup (production)

### Create the project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to Melbourne (Sydney `ap-southeast-2` is ideal)
3. Save the database password somewhere safe

### Copy credentials

In the project dashboard → **Settings → API**:

- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server only)

### Run migrations

Option A — via the SQL editor in the dashboard:

Open `supabase/migrations/` and run each `.sql` file in filename order:
1. `20260413000001_phase1_schema.sql`
2. `20260413000002_profiles_insert_policy.sql`
3. `20260413000003_phase2_schema.sql`
4. `20260414000001_profiles_public_read.sql`
5. `20260414000002_public_read_policies.sql`

Option B — via the CLI (link your project first):

```bash
npx supabase login                              # uses SUPABASE_ACCESS_TOKEN or browser
npx supabase link --project-ref <your-ref>     # ref is in Settings → General
npx supabase db push
```

### Auth configuration

In the dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://hoddle.com.au` (your production domain)
- **Redirect URLs:** add `https://hoddle.com.au/api/auth/callback` and `https://hoddle.com.au/api/auth/mentor-callback`

In **Authentication → Email Templates**, customise the magic link email to match Hoddle branding (Hoddle Blue header, cream body, Plus Jakarta Sans).

### Realtime

Enable Realtime on the `notifications` table so the notification bell badge updates live:

Dashboard → **Database → Replication** → find `supabase_realtime` → **Add table** → select `notifications` → Save.

---

## 3. Vercel deployment

1. Push the repo to GitHub (or GitLab/Bitbucket)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Framework preset: **Next.js** (auto-detected)
4. Under **Environment Variables**, add all variables from `.env.local` — use the **production** Supabase URL and keys, not the local ones:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role key |
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender address |

5. Click **Deploy**

### Custom domain

In Vercel → **Project → Settings → Domains** → add `hoddle.com.au`. Follow the DNS instructions. Once the domain is live, update **Supabase → Authentication → URL Configuration → Site URL** to match.

### Cron jobs

`vercel.json` defines three cron jobs. They activate automatically on the **Vercel Pro plan**:

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/session-reminders` | Every hour | 24-hour session reminder emails |
| `/api/cron/session-starting-soon` | Every 5 minutes | 10–20-minute session start notifications |
| `/api/cron/recompute-recommendations` | Daily at 4 PM UTC | Rebuild mentor recommendations for all students |

On the free Hobby plan, cron jobs do not run. Trigger them manually with `curl` if needed during testing.

---

## 4. First admin user

There is no admin sign-up UI — the role must be set directly in the database. Do this once after first deploying.

1. Go to `https://hoddle.com.au/signup` and sign up with your email (you'll get a magic link)
2. Click the magic link and complete the student onboarding wizard (you can skip the content, it just needs to complete)
3. In Supabase dashboard → **Authentication → Users** — find your user and copy the UUID
4. In **SQL editor**, run:

```sql
update profiles
set role = 'admin'
where id = '<your-user-uuid>';
```

5. Refresh the app — navigate to `/admin` — the admin panel should now be accessible

You can promote additional admins the same way.

---

## 5. Admin dashboard

The admin panel lives at `/admin`. It is only accessible to users with `profiles.role = 'admin'`. Non-admin users who navigate to any `/admin` URL are redirected to `/dashboard`.

### Admin home (`/admin/admin`)

Shows at-a-glance counts:
- Mentors pending verification
- Stories pending moderation
- Quick links to each admin section

### Mentor list (`/admin/admin/mentors`)

All mentor accounts in the system, with their verification status (Verified / Unverified). Click any mentor's name to open their detail page.

### Story moderation queue (`/admin/admin/stories`)

All pending success stories submitted by students. See [§12](#12-success-stories--submission-and-moderation) for the moderation workflow.

---

## 6. Mentor applications and invites

### Mentor application form (`/apply`)

Prospective mentors can express interest via the public application form at `/apply`. The form collects:
- Name, email, university, field of study
- Country of origin (used for matching)
- Time in Melbourne
- Motivation statement (80–1000 characters)
- LinkedIn or personal website (optional)

On submission, a formatted email is sent to the address in `ADMIN_EMAIL` (falls back to `RESEND_FROM_EMAIL`). The admin reviews the application and decides whether to send an invite. Applications are **not stored in the database** — they exist only in the admin's inbox.

To add `ADMIN_EMAIL` to your Vercel env vars:

```
ADMIN_EMAIL=admin@hoddle.com.au
```

### Inviting and verifying mentors

Mentors are **invite-only**. Students cannot self-select as mentors. The flow is:

1. Admin sends an invite
2. Mentor accepts via email and completes sign-up
3. Admin reviews and verifies the profile

### Step 1 — Send the invite

1. Go to `/admin/admin/mentors/invite`
2. Enter the mentor's email address
3. Optionally add a personal note (included in the invite email)
4. Submit

Hoddle sends a magic-link email with a unique token valid for **7 days**. The invite record is stored in the `mentor_invites` table.

### Step 2 — Mentor accepts

The mentor clicks the link in their email. This:
- Verifies the token against `mentor_invites`
- Creates a Supabase auth session for the mentor
- Sets `profiles.role = 'mentor'`
- Creates a row in the `mentors` table
- Redirects the mentor to the mentor onboarding wizard

If the token has expired, the mentor sees an error and should contact the admin to re-send.

### Step 3 — Admin verifies

After the mentor completes onboarding:

1. Go to `/admin/admin/mentors`
2. Find the mentor (they appear as "Unverified")
3. Click their name to review the profile — check the headline, bio, expertise tags, and photo
4. Click **Verify mentor**

Once verified:
- The mentor appears in the public mentor directory at `/mentors`
- They show up in student recommendations
- Students can follow them and register for their sessions

### Unverifying a mentor

On the mentor's admin detail page, click **Unverify**. This removes them from the public directory and recommendations but does not delete their account or content. Use this if a mentor becomes inactive or their profile needs major corrections.

---

## 7. Mentor onboarding and dashboard

### Onboarding wizard

After accepting an invite, mentors complete a wizard with:
- **Headline** — one-line tagline shown on their profile card (e.g. "From Delhi to Deloitte in 3 years")
- **Bio** — long-form story in plain text (markdown rendering is planned)
- **Expertise tags** — multi-select; used by the matching algorithm to recommend this mentor to students whose goals/challenges align
- **Hometown** — country or city of origin
- **Current role** — job title and company

The wizard can be re-visited anytime via **Edit profile** at `/mentor/profile/edit`.

### Mentor dashboard (`/mentor`)

The mentor home shows:
- **Content stats** — total published items, total views across all content
- **Upcoming sessions** — sessions they have scheduled with attendee counts
- **Question inbox preview** — most recent unanswered questions from upcoming sessions

Navigation links in the mentor sidebar: Content, Sessions, Inbox, Edit profile.

---

## 8. Publishing content as a mentor

Mentors publish three content types: **articles**, **videos**, and **resources** (downloadable files).

### Create content

1. Go to `/mentor/content` → click **New**
2. Choose a type:
   - **Article** — rich text editor (Tiptap), supports headings, bold, italic, lists, links
   - **Video** — paste a YouTube or Vimeo URL; Hoddle embeds it automatically
   - **Resource** — upload a file from Supabase Storage (max 25 MB), set a display label
3. Fill in title, excerpt (shown on cards), and optionally a hero image URL from Supabase Storage
4. Save as draft → **Publish** when ready

### Edit and unpublish

1. Go to `/mentor/content`
2. Click the title of any item to open its edit page
3. Edit any field → save
4. Use **Unpublish** to move a published item back to draft — it disappears from the public library immediately

### Where content appears

- The public content library at `/content` (filters by type, expertise, mentor)
- The mentor's public profile page under "From [Mentor]"
- The student dashboard "Latest from your mentors" section (for students who follow the mentor)
- Students who follow the mentor receive a `new_content_from_mentor_you_follow` notification when an item is published

---

## 9. Scheduling and running a live session

### Schedule a session

1. Go to `/mentor/sessions/new`
2. Fill in:
   - **Title** — e.g. "CV Review for Engineering Students"
   - **Description** — what students should expect
   - **Date and time** — datetime picker, displays in the user's local timezone
   - **Duration** — in minutes (default 60)
   - **Max attendees** — leave blank for uncapped
   - **Meeting URL** — Zoom, Google Meet, Teams, or any external link
3. Submit → session appears in the public sessions list at `/sessions`

### Before the session

Students register via the session detail page. On registration, they can submit questions (optionally anonymous). The mentor sees all questions at `/mentor/sessions/[id]` — they can mark questions answered to keep track of what they've covered.

Registered students receive a `session_reminder_24h` email 24 hours before and a `session_starting_soon` in-app notification approximately 1 hour before (both fired by the daily cron — see [§14](#14-cron-jobs)).

### During and after the session

On the session management page (`/mentor/sessions/[id]`):
- The meeting link is shown to registered students on the session detail page
- After the session, mark the **session as completed** — this flips `status = 'completed'`
- Mark which students attended using the attendance form
- Optionally add a **recording URL** — students see a "Watch recording" link on the session page

---

## 10. Student experience

### Sign up

Students go to `/signup`, enter their email, and receive a magic link. No password required. Clicking the link logs them in and redirects to the onboarding wizard.

### Onboarding wizard

Five steps:
1. Full name
2. Country of origin, university, year of study
3. Goals — multi-select (e.g. improve GPA, land internship, build network)
4. Challenges — multi-select (e.g. time management, academic writing, homesickness)
5. Fields of interest — multi-select (e.g. engineering, finance, design)

On completion, the matching algorithm runs and surfaces 3–5 mentor recommendations on the dashboard. Students can re-visit onboarding settings to update their answers — recommendations rebuild automatically.

### Dashboard (`/dashboard`)

- **Recommended mentors** — top matches with "why this mentor" reasoning lines
- **Latest content** — newest published articles, videos, and resources
- **Your sessions** — upcoming sessions you're registered for
- **Forum activity** — recent threads in your fields of interest

### Browsing mentors (`/mentors`)

- Filter by expertise tag chips
- Click a mentor card to open their full profile
- Follow a mentor to see their content on the dashboard and receive notifications when they publish
- "Ask a question" CTA links to the mentor's next scheduled session

### Mentor profile (`/mentors/[slug]`)

Shows the mentor's headline, hometown, current role, bio, expertise chips, published content, and upcoming sessions. Students can follow/unfollow from this page.

### Settings

`/settings/notifications` — toggle email and in-app notifications on/off per notification type.

---

## 11. Community forums

Forums are at `/forums` and open to all authenticated users (both students and mentors).

### Categories

Five seeded categories (set at migration time):
- First Semester Struggles
- Career & Internships
- Living in Melbourne
- Academic Writing
- Visa & Admin

### Creating a thread

From any category page, click **New thread**. Fill in a title and body (markdown). The thread slug is auto-generated from the title.

### Replies and nesting

Replies support two levels of nesting only — a reply to a reply is the deepest. Reply forms appear inline on the thread page.

### Editing and deleting

Authors can edit their own posts within 30 minutes of posting. After 30 minutes, the edit option disappears. Admins can delete any post at any time. Posts are soft-deleted (`deleted_at` is set) — the placeholder "[deleted]" is shown in place of the content.

### Reactions

Three reaction types: **heart**, **thanks**, **helpful**. Each is a toggle — click once to add, click again to remove. Any authenticated user can react to any post.

### Activity sorting

Thread lists are sorted by `last_activity_at`, which updates whenever a new reply is posted or a reaction is added. Pinned threads (admin-only toggle) always appear first.

---

## 12. Success stories — submission and moderation

### Student submission

Students submit success stories from `/stories/new`:
- **Title** and **body** (markdown)
- **Milestones** — multi-select (e.g. first HD, first internship, first apartment)
- **Hero image** — optional, uploaded to Supabase Storage

Submission sets `status = 'pending'`. The story is invisible to other students until approved.

### Admin moderation

1. Go to `/admin/admin/stories`
2. Each pending story shows the title, author name, and submission date
3. Click the title to read the full story in a new tab
4. **Approve** — sets `status = 'published'`, sets `published_at`, sends the author a `success_story_approved` notification and email
5. **Reject** — sets `status = 'rejected'`, sends the author a rejection notification

### Published stories

Published stories appear in the gallery at `/stories` and the single-story reader at `/stories/[slug]`. Admin can toggle a story's **featured** flag — featured stories appear in the highlighted slot on the student dashboard.

---

## 13. Notifications

### In-app

The notification bell in the app nav shows a live unread count using Supabase Realtime. Clicking it opens the `/inbox` page where all notifications are listed. Clicking a notification marks it read.

**Mark all read** is available on the inbox page.

### Email

Emails are sent via Resend. Templates use the Hoddle Blue header and cool gray body. Each notification type has its own email:

| Type | Trigger |
|---|---|
| `mentor_replied_to_your_question` | Mentor marks a question as answered |
| `new_content_from_mentor_you_follow` | Mentor publishes new content |
| `forum_reply_to_your_thread` | Someone replies in a thread you started |
| `session_reminder_24h` | 24 hours before a session you registered for |
| `session_starting_soon` | ~1 hour before a session you registered for (fired by the daily cron) |
| `success_story_approved` | Admin approves your submitted story |

### Preferences

Students control notification preferences at `/settings/notifications`:
- Toggle all email on/off
- Toggle all in-app on/off
- Mute specific notification types individually

The `notification_preferences` table stores these preferences. Defaults are: all email on, all in-app on, nothing muted. A row is created on first save; until then the defaults apply.

---

## 14. Cron jobs

Two cron jobs are configured in `vercel.json`. Both are compatible with the **Vercel Hobby plan** (daily schedule). Set `CRON_SECRET` in your Vercel environment variables — the routes will return 401 if it is not set.

### Session reminders (`/api/cron/session-reminders`)

**Schedule:** daily at 08:00 UTC (`0 8 * * *`)

Two tasks in one run:
1. **24-hour reminder emails** — finds sessions scheduled 23–25 hours from now and sends each registered attendee a reminder email.
2. **Starting-soon in-app notifications** — finds sessions starting 50–70 minutes from now and sends each registrant a `session_starting_soon` in-app notification. The 20-minute window is non-overlapping across daily runs.

### Recompute recommendations (`/api/cron/recompute-recommendations`)

**Schedule:** daily at 16:00 UTC (`0 16 * * *`)

Runs the matching algorithm for every student profile and upserts the top 5 recommendations into `mentor_recommendations`. Also triggers automatically when a student updates their onboarding answers.

### Triggering manually

All cron routes require the `CRON_SECRET` header. To trigger manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://hoddle.com.au/api/cron/session-reminders
curl -H "Authorization: Bearer $CRON_SECRET" https://hoddle.com.au/api/cron/recompute-recommendations
```

---

## 15. Storage buckets

Create these buckets in Supabase Storage (Dashboard → Storage → New bucket):

| Bucket | Visibility | Used for |
|---|---|---|
| `avatars` | Public | Profile photos — path: `avatars/{profile_id}/{filename}` |
| `content-media` | Public | Mentor-uploaded hero images for content items |
| `content-resources` | Private (signed URLs) | Downloadable files attached to content items |
| `session-recordings` | Private (signed URLs) | Session recording uploads |
| `story-images` | Public | Hero images for success stories |

### Bucket policies

Each bucket's RLS policies are defined in the migration SQL. The pattern for public write-protected buckets (e.g. `avatars`) is:

- **Read:** public (anyone)
- **Write:** `auth.uid()::text = (storage.foldername(name))[1]` — users can only write to their own folder

For private buckets, access is via signed URLs generated server-side. Files are never directly linked with a permanent public URL.

### Uploading files

Currently, file uploads use the Supabase Storage SDK client-side with the browser client. The mentor profile avatar upload is deferred (listed in `todo.md §3`) — for now, avatar URLs must be set directly in the database via the Supabase dashboard or SQL:

```sql
update profiles
set avatar_url = 'https://<project>.supabase.co/storage/v1/object/public/content-media/mentor-photo.webp'
where id = '<profile-uuid>';
```

---

## 16. Resetting or re-running the matching algorithm

### Re-run for one student

This happens automatically when a student submits or updates their onboarding responses. The `submitOnboarding` server action calls `computeRecommendationsForProfile(profileId)` at the end.

To trigger manually via SQL (useful for seeding or fixing data):

```sql
-- The matching function runs server-side via the cron route.
-- To force a full recompute now, call the cron endpoint:
-- GET /api/cron/recompute-recommendations
```

### Clear stale recommendations

If a mentor is deleted or unverified, their rows in `mentor_recommendations` are cascade-deleted automatically (FK on `mentors.profile_id`). The next nightly cron will rebuild fresh recommendations without them.

### Seed mentor data for local testing

To test recommendations locally, you need at least one verified mentor in the `mentors` table. Use Supabase Studio (`http://127.0.0.1:54323`) to insert seed rows directly, or run seed SQL via:

```bash
npx supabase db reset  # resets and re-applies all migrations + any seed.sql if present
```

See the migration files for the seed mentor data included in Phase 2 (`20260413000003_phase2_schema.sql`).
