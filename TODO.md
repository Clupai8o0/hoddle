# TODO — Hoddle Melbourne

Phase 2 scope: **Mentor profiles + dashboard, Content library, Forums, Success stories, Live Q&A, Notifications, Matching algorithm v1.** All seven surfaces ship together as the full mentorship experience. See `CLAUDE.md` §5.

Format: `- [ ] task` for pending, `- [x] task` for done. Move completed items to `## Shipped` at the bottom and mirror in `docs/changelog.md`.

---

## 0. Phase 2 foundations

- [x] Install dependencies: `@tanstack/react-query` (interactive dashboards), `date-fns`, `@tiptap/react` + `@tiptap/starter-kit` (rich-text editor), `react-day-picker` (Q&A scheduling), `resend` (transactional email)
- [x] Add Resend API key to `.env.local.example` and Vercel envs
- [x] Set up `lib/email/` with typed email-sending wrapper around Resend
- [x] Add `RESEND_FROM_EMAIL`, `RESEND_API_KEY` env vars
- [x] Create new route segments: `app/(app)/mentors`, `app/(app)/content`, `app/(app)/forums`, `app/(app)/stories`, `app/(app)/sessions`, `app/(app)/inbox`, `app/(admin)`
- [x] Add `(admin)` route group with admin-only middleware check (`profiles.role = 'admin'`)
- [x] Update `MarketingShell` and `AuthenticatedShell` nav to expose new top-level destinations

## 1. Schema migrations

See `docs/database-schema.md` for full table definitions, RLS policies, and triggers. Each migration ships with regenerated TypeScript types.

- [x] Migration: `mentors` table (profile_id PK, headline, bio, expertise[], verified_at, accepting_questions, hometown, current_role)
- [x] Migration: `mentor_invites` table (email, token, created_by, accepted_at, expires_at)
- [x] Migration: `content_items` table (id, mentor_id, type enum, title, slug, body, video_url, hero_image_url, published_at, view_count)
- [x] Migration: `content_resources` table (id, content_item_id, label, file_path, file_size_bytes)
- [x] Migration: `content_tags` and `content_item_tags` join table
- [x] Migration: `forum_categories` table (slug, name, description, sort_order)
- [x] Migration: `forum_threads` table (id, category_id, author_id, title, body, pinned, locked, last_activity_at)
- [x] Migration: `forum_posts` table (id, thread_id, author_id, body, parent_post_id, edited_at)
- [x] Migration: `forum_reactions` table (post_id, profile_id, reaction enum)
- [x] Migration: `success_stories` table (id, author_id, title, body, hero_image_url, milestones[], featured, published_at)
- [x] Migration: `live_sessions` table (id, mentor_id, title, description, scheduled_at, duration_minutes, max_attendees, meeting_url, status)
- [x] Migration: `session_registrations` table (session_id, profile_id, registered_at, attended)
- [x] Migration: `session_questions` table (session_id, profile_id, body, anonymous, answered)
- [x] Migration: `notifications` table (id, recipient_id, type, payload jsonb, read_at, created_at)
- [x] Migration: `notification_preferences` table (profile_id, email_enabled, in_app_enabled, types_muted[])
- [x] Migration: `mentor_recommendations` materialised view or table (profile_id, mentor_id, score, reasoning, computed_at)
- [x] Enable RLS on every new table; document each policy in `docs/database-schema.md`
- [x] Storage buckets: `content-media` (mentor-uploaded images, public read), `content-resources` (downloadable files, signed URLs), `session-recordings` (private)
- [x] Regenerate `lib/supabase/database.types.ts` after each migration batch

## 2. Admin: mentor invitation flow

- [x] `app/(admin)/admin/page.tsx` — admin home with quick links and pending counts
- [x] `app/(admin)/admin/mentors/page.tsx` — list of all mentors with verification status
- [x] `app/(admin)/admin/mentors/invite/page.tsx` — form to send a mentor invite (email, optional note)
- [x] Server action `inviteMentor` — generates token row in `mentor_invites`, sends Resend email with signup link
- [x] `app/(auth)/mentor-signup/[token]/page.tsx` — token-gated mentor signup (validates token, runs magic-link auth, sets `profiles.role = 'mentor'`, creates `mentors` row)
- [x] `app/(admin)/admin/mentors/[id]/page.tsx` — review mentor profile, mark `verified_at`
- [x] `app/(admin)/admin/mentors/[id]/verify-mentor-button.tsx` — server action to verify/revoke verification
- [x] Admin-only middleware guard on `(admin)` route group
- [ ] Audit log: write to a simple `admin_actions` table on every verify/unverify (Phase 2.5 nice-to-have, parked)

## 3. Mentor onboarding & dashboard

- [x] Mentor onboarding wizard (separate from student wizard): headline, expertise tags, bio, hometown, current role
- [x] `app/(app)/mentor` — mentor dashboard home with content stats (views, published count, upcoming sessions) and inbox preview
- [x] `app/(app)/mentor/profile/edit` — edit mentor profile (inline form, saves via server action + router.refresh)
- [x] `app/(app)/mentor/content` — list of mentor's authored content (drafts + published); authoring stub for next sprint
- [x] `app/(app)/mentor/sessions` — list of upcoming and past Q&A sessions; scheduling stub for next sprint
- [x] `app/(app)/mentor/inbox` — questions submitted to upcoming sessions, grouped unanswered/answered
- [x] Role-based redirect from `/dashboard` — students stay, mentors redirect to `/mentor`
- [x] Reference screen consulted: `docs/design/mentor_dashboard_raj_sharma/screen.png`
- [ ] Photo upload in mentor onboarding (deferred — requires Supabase Storage client + resize pipeline)

## 4. Mentor profiles (public-to-students)

- [x] `app/(app)/mentors/page.tsx` — browse all verified mentors with expertise filters
- [x] `app/(app)/mentors/[slug]/page.tsx` — single mentor profile (hero photo, story, expertise chips, published content list, upcoming sessions)
- [x] Mentor card pattern updated with real data (no more placeholders)
- [x] "Ask a question" CTA on profile → routes to next live session question form
- [ ] Reference screen: `docs/design/mentor_profile_raj_sharma/screen.png`

## 5. Content library + article reader

- [x] `app/(app)/content/page.tsx` — content library index with filters (type, expertise, mentor)
- [x] `app/(app)/content/[slug]/page.tsx` — article reader with editorial layout, hero image, byline, body, downloadable resources, related content
- [x] Tiptap-based rich-text editor for mentor content authoring
- [x] `app/(app)/mentor/content/new` — create new content item (article / video / resource)
- [x] `app/(app)/mentor/content/[id]/edit` — edit existing content
- [x] Content publish/unpublish server actions with `published_at` timestamp
- [x] View counter — increment on article load (server action, debounced per session)
- [x] Video content type — embed YouTube/Vimeo via URL parsing, no custom player
- [x] Downloadable resources — Supabase Storage signed URLs, file size limit 25MB
- [ ] Reference screen: `docs/design/article_decoding_academic_writing/screen.png`

## 5b. Photography — swap gradient placeholders with generated images

All prompts are inline in code as `IMAGE NEEDED` comments. Generate with Midjourney / DALL-E / Flux, apply post-processing from `docs/design.md §7`, then drop into `public/images/` and replace the gradient `<div>` with `<Image>`.

- [x] `public/images/hero-laneway-cafe.webp` — hero panel, `app/page.tsx`
      Prompt in code. Alt: "A student working at a Melbourne laneway café"
- [ ] Upload portrait photos for seed mentors via Supabase Studio → Storage → `content-media` bucket, then save the public URL to `profiles.avatar_url` for each:
  - Raj Patel (`11111111-0000-0000-0000-000000000004`) — male, Indian background, smart-casual, Melbourne café bokeh
  - Sarah Chen (`11111111-0000-0000-0000-000000000005`) — female, Chinese background, smart-casual, Melbourne café bokeh
  - Minh Tran (`11111111-0000-0000-0000-000000000006`) — male, Vietnamese background, smart-casual, Melbourne café bokeh
  - Wei Lin, Priya Sharma, Anh Nguyen (existing seed mentors m1–m3) — same style
  - URL pattern: `https://{project}.supabase.co/storage/v1/object/public/content-media/{filename}.webp`
  - SQL to update: `update profiles set avatar_url = '...' where id = '...';`
  - Homepage and mentor cards fall back to initials until photos are uploaded
- [x] `public/images/auth-tram-portrait.webp` — auth shell left panel, `components/layout/auth-shell.tsx`
      Prompt in code. Student on Melbourne tram, rain on window.
- [x] `public/images/onboarding-step-illustration.webp` — onboarding sidebar, `app/(auth)/onboarding/page.tsx`
      Prompt in code. Hands holding coffee mug, city map on table.
- [x] `public/images/empty-state-journal.webp` — content library empty state, `app/(app)/dashboard/page.tsx`
      Prompt in code. Open journal on desk, flat white, potted succulent. Overhead shot.
- [x] `public/images/empty-state-botanic.webp` — forums empty state, `app/(app)/dashboard/page.tsx`
      Prompt in code. Empty bench, Royal Botanic Gardens Melbourne, dappled sunlight.
- [x] `public/images/empty-state-library.webp` — success stories empty state, `app/(app)/dashboard/page.tsx`
      Prompt in code. Students at State Library of Victoria reading room timber table.

- [x] `public/images/mentor-avatar-placeholder.webp` — mentor profile fallback, `app/(app)/mentors/[slug]/page.tsx`
- [x] `public/images/content-card-placeholder.webp` — content card fallback, `components/patterns/content-card.tsx`
- [x] `public/images/content-hero-placeholder.webp` — article hero fallback, `app/(app)/content/[slug]/page.tsx`
- [x] `public/images/story-hero-placeholder.webp` — story reader + featured card fallback, `app/(browse)/stories/[slug]/page.tsx` + `app/(browse)/stories/page.tsx`
- [x] `public/images/story-card-placeholder.webp` — story grid card fallback, `app/(browse)/stories/page.tsx`

Post-generation checklist (per `docs/design.md §7`):
- [x] Colour grade: highlights → cream `#fef8f1`, shadows → Hoddle Blue `#001842`
- [x] Crop asymmetrically (subjects on editorial thirds)
- [x] Export WebP at quality 80 — hero max 200 KB, mentor cards max 80 KB
- [x] Replace gradient `<div>` placeholders with `<Image>` (next/image) + correct alt text

## 6. Community forums

- [x] `app/(app)/forums/page.tsx` — category index with last-activity preview
- [x] `app/(app)/forums/[category]/page.tsx` — thread list within a category, sorted by `last_activity_at`
- [x] `app/(app)/forums/[category]/[thread]/page.tsx` — thread view with nested replies
- [x] `app/(app)/forums/[category]/new` — new thread form (title, body, optional tags)
- [x] `app/(app)/forums/new` — standalone new thread form with category selector
- [x] Reply form on thread page (no nested replies deeper than 2 levels in Phase 2)
- [x] Reactions: heart, thanks, helpful — toggleable per user
- [x] Edit own post (within 30 minutes of posting); soft-delete after
- [x] Empty states for each category
- [x] Seed initial categories: "First Semester Struggles", "Career & Internships", "Living in Melbourne", "Academic Writing", "Visa & Admin" — already in `20260413000003_phase2_schema.sql`
- [x] Reference screens: `docs/design/community_forums/screen.png`, `docs/design/forum_thread_myki_fine_help/screen.png`

## 7. Success stories gallery

- [x] `app/(app)/stories/page.tsx` — gallery of published success stories (editorial grid, photography-led)
- [x] `app/(app)/stories/[slug]/page.tsx` — single story reader
- [x] `app/(app)/stories/new` — submission form for students (title, body, milestones multi-select, optional photo)
- [x] Server action `submitSuccessStory` — saves as pending, queues admin moderation notification
- [x] Admin moderation queue at `app/(admin)/stories` — approve/reject submissions
- [x] Featured story slot on student dashboard
- [ ] Reference screen: `docs/design/success_stories_gallery/screen.png`

## 8. Live Q&A scheduling

- [x] `app/(app)/sessions/page.tsx` — upcoming sessions list + past sessions with recording badge
- [x] `app/(app)/sessions/[id]/page.tsx` — session detail: mentor card, register button, question form, recording link
- [x] `app/(app)/sessions/[id]/register-button.tsx` — register/unregister toggle with capacity enforcement
- [x] `app/(app)/mentor/sessions/new` — schedule session form (datetime-local, duration, capacity, meeting URL)
- [x] `app/(app)/mentor/sessions/[id]/page.tsx` — session management: questions list, attendance form, recording URL input
- [x] Server action `scheduleSession` — mentor-only, creates session row
- [x] Server action `registerForSession` — creates `session_registrations` row, enforces capacity
- [x] Server action `unregisterFromSession` — removes registration
- [x] Server action `completeSession` — marks status completed + records attendance
- [x] Server action `setRecordingUrl` — mentor adds recording URL post-session
- [x] Server action `submitSessionQuestion` — already existed (§4); question form reused on session detail page
- [x] Pre-session reminder email (24h before) via Vercel cron — `app/api/cron/session-reminders/route.ts` + `vercel.json`
- [x] Post-session attendance tracking — mentor marks attendees via `AttendanceForm` on session detail
- [x] Past sessions show recording link if uploaded

## 9. Notifications

- [x] In-app notification bell in `AppNav` with unread count (`components/layout/notification-bell.tsx`)
- [x] `app/(app)/inbox/page.tsx` — full notification list with mark-read actions
- [x] Notification types (Phase 2 set):
  - [x] `mentor_replied_to_your_question`
  - [x] `new_content_from_mentor_you_follow`
  - [x] `forum_reply_to_your_thread`
  - [x] `session_reminder_24h`
  - [x] `session_starting_soon`
  - [x] `success_story_approved`
- [x] Email template per notification type using a shared editorial layout (Hoddle blue header, cream body, Plus Jakarta Sans)
- [x] `app/(app)/settings/notifications/page.tsx` — preference toggles (per-type, channel)
- [x] Server-side helper `notify(recipientId, type, payload)` writes row + dispatches email if enabled
- [x] Realtime subscription on `notifications` table for the bell badge (Supabase realtime, browser client only)
- [x] Background job for scheduled reminders (Supabase Edge Function or Vercel cron) — ships with two Vercel crons: `session-reminders` (hourly, 24h window) + `session-starting-soon` (every 5 min, 10–20 min window)

## 10. Matching algorithm v1

Goal: surface 3–5 mentor recommendations per student based on onboarding answers. Phase 2 uses a simple weighted-score approach, not ML.

- [x] Define scoring rules in `lib/matching/score.ts`:
  - country_of_origin match → +30
  - field_of_interest overlap → +15 per overlap
  - challenges overlap with mentor expertise → +10 per overlap
  - goals overlap with mentor expertise → +10 per overlap
  - verified mentor → required (filter, not score)
- [x] Server function `computeRecommendationsForProfile(profileId)` — runs the score, persists top 5 to `mentor_recommendations` with rank, score, reasoning
- [x] Persist results in `mentor_recommendations` table; recompute on onboarding update or nightly via cron
- [x] Recommendation card with "why this mentor" reasoning line shown below `MentorCard` on dashboard
- [x] Recommended mentors section on student dashboard (replaces Phase 1 placeholder)
- [x] Fallback: if fewer than 3 matches score above threshold (10), fill with top-ranked verified mentors; empty state if no verified mentors exist
- [ ] Log click-throughs from recommendation → mentor profile for future ranking improvements (Phase 3)

## 11. Cross-cutting

- [x] Update student dashboard to surface: recommended mentors, latest content, upcoming sessions you're registered for, recent forum activity in your interest areas
- [x] Update `EmptyState` pattern usages — replace Phase 1 placeholders across the dashboard with real live-data sections
- [x] Search: `app/(app)/search/page.tsx` — full-text search across content, mentors, and forum threads using ILIKE; search icon in AppNav
- [ ] Image uploads via Supabase Storage with client-side resize before upload (Phase 3 — requires resize pipeline)
- [x] Slug generation helper — `lib/utils/slug.ts` with `generateSlug(title)`
- [x] Pagination pattern — `components/ui/pagination.tsx` (offset-based, ellipsis page window); applied to content library
- [x] Rate limiting on UGC endpoints — `lib/utils/rate-limit.ts` (DB row-count in window); applied to `createPost` (10/10 min), `submitSuccessStory` (3/60 min), `submitSessionQuestion` (5/60 min)
- [x] `FollowButton` component + `toggleFollow`/`getFollowStatus` server actions + `notifyFollowersOfContent` — follow button on mentor profile page; `publishContentItem` notifies followers via `new_content_from_mentor_you_follow`

## 12. Pre-ship checks

- [x] `pnpm build` passes with no TS errors — 45 routes, zero errors
- [ ] All Phase 2 routes work end-to-end as a student: dashboard → recommendations → mentor profile → content → register for session → ask question → receive notification
- [ ] All Phase 2 routes work end-to-end as a mentor: invite email → signup → onboarding → publish content → schedule session → answer questions
- [ ] All Phase 2 routes work end-to-end as an admin: invite mentor → verify → moderate stories
- [ ] RLS verified for every new table (cross-user isolation tests)
- [ ] Admin role enforcement verified (non-admin cannot reach `(admin)` routes)
- [ ] Notification emails render correctly in Gmail, Outlook web, and Apple Mail
- [ ] Matching algorithm produces sensible results for at least 5 seed student profiles
- [ ] Mobile responsive at 375px, 768px, 1280px across all new pages
- [x] No hardcoded hex values, no `#ffffff`, no `#000000`, no decorative icons (grep checks + fixes applied)
- [x] Update `docs/changelog.md` for Phase 2 release
- [x] Update `docs/architecture.md` with Phase 2 architectural decisions

---

## Phase 3

Scope: **Badges & tiers, Mentee→mentor graduation, i18n (UI only), PWA, University calendars, Matching v2, Mentor analytics, Resource hub, Anonymous questions, Admin audit log.** Do not start until Phase 2 is shipped and has two weeks of production telemetry.

### 3.0 Foundations

- [ ] Install dependencies: `next-intl` (i18n routing), `@serwist/next` (PWA + service worker), `ical.js` (calendar feed parsing), `recharts` (analytics charts)
- [ ] Add `ANALYZE_WINDOW_DAYS`, `PWA_ENABLED`, `DEFAULT_LOCALE` env vars
- [ ] Set up `lib/i18n/` with locale config and message loaders
- [ ] Add `messages/` directory at repo root with `en.json`, `zh.json`, `hi.json`, `vi.json`, `ko.json`
- [ ] Add `public/manifest.webmanifest` and icon set (192, 512, maskable)
- [ ] Add `app/sw.ts` service worker entry via Serwist

### 3.1 Schema migrations

Full table definitions in `docs/database-schema.md` §"Phase 3 tables".

- [ ] Migration: `mentor_badges` table (id, slug, label, tier, description, icon_slug, criteria jsonb)
- [ ] Migration: `mentor_badge_awards` table (mentor_id, badge_slug, awarded_at, awarded_by, reason)
- [ ] Migration: `graduation_applications` table (profile_id, submitted_at, status, milestones_snapshot, mentor_reference_id, decision_note, decided_at, decided_by)
- [ ] Migration: `university_calendars` table (id, university, term, name, feed_url, last_synced_at)
- [ ] Migration: `university_events` table (id, calendar_id, title, description, starts_at, ends_at, category, source_uid)
- [ ] Migration: `user_calendar_subscriptions` table (profile_id, calendar_id, created_at)
- [ ] Migration: `recommendation_clicks` table (profile_id, mentor_id, recommendation_rank, clicked_at, source)
- [ ] Migration: `mentor_impact_daily` materialised view (mentor_id, date, content_views, new_followers, forum_replies, session_registrations, questions_received)
- [ ] Migration: `resources` table (id, title, url, description, category, university, tags, curated_by, added_at, last_verified_at, status)
- [ ] Migration: `admin_actions` audit log table (id, actor_id, action, target_table, target_id, diff jsonb, reason, created_at)
- [ ] Update `session_questions` — add `anonymity_level` enum (`'identified'` \| `'pseudonym'` \| `'fully_anonymous'`) and `pseudonym` text column
- [ ] Update `mentors` — add `tier` enum (`'community'` \| `'verified'` \| `'distinguished'` \| `'elder'`), computed from `mentor_badge_awards`
- [ ] Update `profiles` — add `preferred_locale` text, default `'en'`
- [ ] RLS on every new table; admin audit log is append-only (no updates, no deletes)
- [ ] Regenerate `lib/supabase/database.types.ts`

### 3.2 Mentor verification badges & achievement tiers

- [ ] Define badge catalog in `lib/badges/catalog.ts`:
  - `founding_mentor` — first 20 verified mentors
  - `voice_of_experience` — 10+ published content items
  - `community_pillar` — 50+ helpful forum replies
  - `signal_in_the_noise` — 90%+ "helpful" reaction rate over 30 days
  - `session_veteran` — 5+ completed live sessions
  - `graduation_guide` — mentored a student who became a mentor (links to 3.3)
  - `culture_keeper` — mentor for 3+ students from their home country
- [ ] Admin UI at `app/(admin)/badges` — list awards, revoke, award manually
- [ ] Server function `evaluateBadgeCriteria(mentorId)` — runs on a nightly cron, awards auto-qualifying badges
- [ ] Mentor tier computation: `community` (any verified) → `verified` (1+ badge) → `distinguished` (3+ badges) → `elder` (5+ badges including `graduation_guide`)
- [ ] Tier reflected on mentor profile card, mentor directory filter, and in matching score (+5 per tier above community)
- [ ] Notification: `badge_awarded` — email + in-app when a badge is earned
- [ ] Public badge explainer page at `app/(marketing)/badges` — editorial layout, each badge gets a story

### 3.3 Mentee → mentor graduation program

- [ ] `app/(app)/graduation` — landing page explaining the program, criteria, and application
- [ ] Eligibility criteria (checked server-side before allowing application):
  - onboarded ≥ 6 months ago
  - published success story in approved state
  - completed ≥ 3 sessions as attendee or authored ≥ 5 helpful forum replies
  - has mentor reference from a verified mentor
- [ ] `app/(app)/graduation/apply` — application form (why you, who'd you mentor, reference mentor picker, short bio)
- [ ] Server action `submitGraduationApplication` — validates eligibility, stores snapshot of milestones
- [ ] `app/(admin)/graduation` — review queue with approve/reject actions
- [ ] Approval flow: on approve, flip `profiles.role = 'mentor'`, create `mentors` row from application data, trigger mentor onboarding wizard, award `founding_mentor` to the referring mentor if applicable, send welcome email
- [ ] Notifications: `graduation_application_received`, `graduation_application_approved`, `graduation_application_rejected`
- [ ] Public celebration: approved graduations featured on the landing page "Our Story" section

### 3.4 Multi-language UI support

- [ ] Configure `next-intl` middleware for locale routing (`/en/...`, `/zh/...`, `/hi/...`, `/vi/...`, `/ko/...`)
- [ ] Extract every hardcoded string from Phase 1 + 2 into `messages/en.json` using `next-intl` namespaces
- [ ] Seed translations for zh, hi, vi, ko — start with machine translation, flag every string for human review, commit behind a `translations_reviewed_at` metadata key
- [ ] Locale switcher component in `GlassNav` footer area (flag-free, label only)
- [ ] Persist preference to `profiles.preferred_locale`; middleware reads from cookie → profile → Accept-Language
- [ ] Respect locale in email templates (Resend) — same subject lines, translated bodies
- [ ] Content stays English — articles, forum posts, mentor bios are not translated. Display a small locale-aware badge on content cards reading "English content" so non-English users aren't surprised
- [ ] `docs/i18n.md` — translation workflow, review process, how to add a locale
- [ ] Pre-ship check: every route renders correctly in all five locales at 375px width (longest translations are usually the ones that break layouts)

### 3.5 PWA — installable, offline shell, push notifications

- [ ] Configure Serwist with a runtime caching strategy:
  - static assets: `CacheFirst`
  - Supabase API reads: `NetworkFirst` with 5s timeout, 24h max age
  - Supabase mutations: network-only, queue for retry when offline
- [ ] `public/manifest.webmanifest` — name, short_name, description, icons, theme_color `#1e3a5f`, background_color `#fef8f1`, display `standalone`
- [ ] Install prompt component — shown once per user after 2 sessions, dismissible, never shown again if declined
- [ ] Offline fallback page at `app/offline/page.tsx` — on-brand editorial "You're offline" message
- [ ] Service worker precaches: landing page, dashboard shell, mentor directory shell, offline page
- [ ] Web Push notifications for notification types that matter when the app is closed: `session_starting_soon`, `forum_reply_to_your_thread`, `mentor_replied_to_your_question`
- [ ] Push subscription storage in a `push_subscriptions` table (profile_id, endpoint, keys jsonb, created_at, last_used_at)
- [ ] Server helper: `sendWebPush(recipientId, payload)` — called from `notify()` when user has an active subscription and push is enabled
- [ ] Permission prompt pattern — never on first load. Ask after the user takes a high-intent action (registers for a session, posts in a forum)
- [ ] Add `badge` and `shortcuts` to manifest so dashboard/inbox/mentors are one-tap from the home screen
- [ ] Lighthouse PWA audit passes (installable, offline, fast)

### 3.6 University calendar integrations

- [ ] Admin UI at `app/(admin)/calendars` — add university calendar by ICS feed URL, set name + term
- [ ] Nightly cron job `syncUniversityCalendars` — fetches each ICS feed, parses with `ical.js`, upserts into `university_events`
- [ ] Student-facing calendar page at `app/(app)/calendar` — see events from subscribed universities, filter by category (academic, admin, social)
- [ ] Subscribe/unsubscribe to a university's calendar from profile settings; auto-subscribe on onboarding based on `profiles.university`
- [ ] Key-date surfacing on dashboard: "Census date for your university is in 8 days" with contextual link
- [ ] Key-date reminders via notifications: census date, exam period start, enrolment deadline, break start/end
- [ ] Add to calendar button on event detail: generates per-event ICS file for Apple/Google Calendar
- [ ] Fallback when an ICS feed is unreachable: show last synced data with a small "last updated X days ago" line, never a hard error
- [ ] Seed 3 Melbourne universities: Unimelb, Monash, RMIT — feed URLs captured in a separate doc (not committed to repo, stored in Vercel env or admin UI)

### 3.7 Matching algorithm v2 — telemetry-driven

- [ ] Wire `recommendation_clicks` logging in the Phase 2 recommendation card (was parked as "log click-throughs for Phase 3")
- [ ] Wire post-click engagement tracking: after clicking a recommendation, did the student also (a) view content by that mentor, (b) register for a session, (c) follow the mentor? Store in `recommendation_clicks.downstream_actions jsonb`
- [ ] Build `lib/matching/v2/score.ts` — weighted score combining:
  - Phase 2 base weights (country, field, challenges, goals)
  - mentor tier bonus (§3.2)
  - collaborative-filter signal: mentors that students-like-you (similar onboarding) engaged with
  - recency: active mentors (content or session in last 30 days) get +10
  - freshness guard: cap on how often the same mentor appears in a given student's recommendations (no #1 slot two weeks in a row)
- [ ] A/B test harness: `lib/matching/experiments.ts` — assigns users to `v1` or `v2` cohort on onboarding, persists in profile
- [ ] Admin dashboard at `app/(admin)/matching` — cohort comparison: click-through rate, follow-through rate, session registrations per cohort
- [ ] Promotion criteria: v2 ships as default when it beats v1 on click-through **and** session-registration rate over a 4-week window
- [ ] Keep v1 available as a fallback via env flag

### 3.8 Mentor analytics dashboard

- [ ] `app/(app)/mentor/analytics` — editorial-layout dashboard, not a grid of metric boxes
- [ ] Headline metrics, shown as "this month vs last month" narratives:
  - content views
  - unique student readers
  - forum replies and reactions-received ratio
  - session registrations and attendance rate
  - questions received (answered vs unanswered)
  - new followers
- [ ] Content-level breakdown: which of my articles are landing, which are ignored
- [ ] Student-origin chart: breakdown of readers by country of origin (informs what to write next)
- [ ] Reaction sentiment: `helpful` / `thanks` / `heart` ratios across a mentor's content and forum replies
- [ ] "Your reach" narrative block: "Your advice reached 412 students this month from 14 countries. Here's the post that did the most."
- [ ] Recharts for the two time-series charts; everything else is typography-led
- [ ] Data source: `mentor_impact_daily` materialised view, refreshed nightly
- [ ] Export: "email me a monthly summary" toggle — sent first of each month via Resend

### 3.9 Resource hub — curated external links

- [ ] `app/(app)/resources/page.tsx` — browsable hub, grouped by category (visa, housing, health, transport, finance, academic support, career services)
- [ ] `app/(app)/resources/[category]/page.tsx` — category detail with all resources
- [ ] Admin UI at `app/(admin)/resources` — add, edit, retire resources; assign category and university
- [ ] Link health check: nightly cron pings each resource URL, flips `status` to `'broken'` if 4xx/5xx, notifies admin inbox
- [ ] Curation metadata: `curated_by` (which admin added it), `last_verified_at`, `notes` (why this is worth linking to)
- [ ] Student-requested resources: `app/(app)/resources/request` — submit a resource suggestion, lands in admin queue
- [ ] Resource cards use the same no-border, tonal-layered pattern as content cards — no external-link icons except a small Lucide `arrow-up-right` on hover
- [ ] Search across resource title, description, and tags via Postgres `tsvector`

### 3.10 Anonymous question submission for sensitive topics

- [ ] Extend `session_questions` to support three anonymity levels (see schema migration in §3.1):
  - `identified` — question shows user's name
  - `pseudonym` — question shows a stable per-session pseudonym ("Lotus-7"), generated on first anonymous question in that session
  - `fully_anonymous` — no identifier at all; backing `profile_id` stored only for moderation, never exposed to the mentor
- [ ] Submission UI — radio selector for anonymity level with a clear explainer line per option
- [ ] Pseudonym generator in `lib/anonymity/pseudonyms.ts` — adjective + noun + number, deterministic from `(session_id, profile_id)` so the same user gets the same pseudonym across multiple questions in one session
- [ ] Update forum posts to support the same pattern for designated sensitive categories (`Mental Health`, `Visa Problems`, `Family`) — off by default, opt-in per category
- [ ] Moderation tools: admin can reveal the author of an anonymous question only with a logged reason (writes to `admin_actions`)
- [ ] Auto-detection warning: if an anonymous post contains what looks like personally identifying information (name, phone, email), show a soft warning before submission. Never block.
- [ ] Crisis-resource footer: anonymous questions in sensitive categories always append a Lifeline Australia / Beyond Blue / university counselling line at the bottom of the submission confirmation. See `docs/sensitive-topics.md` (to be created in this phase)
- [ ] Create `docs/sensitive-topics.md` — policy for handling mental health, visa issues, abuse disclosures, and safeguarding procedures

### 3.11 Admin audit log

- [ ] `admin_actions` table used as append-only log for every sensitive admin action:
  - mentor verify / unverify
  - badge award / revoke
  - graduation approve / reject
  - success story approve / reject
  - forum post admin-delete
  - anonymous author reveal
  - resource retire
- [ ] Server helper `logAdminAction(actorId, action, targetTable, targetId, diff, reason)` — wraps every admin server action
- [ ] `app/(admin)/audit` — searchable audit log view with filters by actor, action, date range
- [ ] `reason` field is required for any reveal/delete action; enforced at the helper level
- [ ] Monthly audit export to CSV for governance records
- [ ] RLS: admins can read; no updates, no deletes from anyone (the table is append-only at the database level via a policy that denies `update` and `delete`)

### 3.12 Cross-cutting & pre-ship

- [ ] Dashboard updates: surface badges on mentor cards, university events on the student dashboard, tier on mentor profile hero
- [ ] Update matching algorithm display: show the mentor tier visually in the recommendation card
- [ ] Mentor profile: dedicated "Badges & recognition" section, editorial-styled
- [ ] Full responsive audit at 320px, 375px, 768px, 1024px, 1280px, 1920px — PWA standalone mode tested on iOS and Android
- [ ] Lighthouse scores: PWA ≥ 100, Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 on the landing page
- [ ] Translation review complete for at least the UI strings on landing, auth, onboarding, dashboard in all 5 locales
- [ ] Calendar sync has been running for 14 days without intervention on a staging environment before production enable
- [ ] Matching v2 cohort reports show at least directional improvement over v1 before promotion
- [ ] RLS verified for every new table, including the append-only guarantee on `admin_actions`
- [ ] Update `docs/architecture.md` with PWA service worker flow and i18n routing
- [ ] Update `docs/changelog.md` for Phase 3 release (`v0.3.0`)

---

## Phase 4 (not scoped)

Deliberately empty. Phase 3 is large enough that we don't pre-commit to Phase 4 work until Phase 3 telemetry tells us where the platform should go next.

---

## Shipped

### Unreleased

- [x] Anonymous forum posts — shipped 2026-04-17

### Phase 1 — v0.1.0

- [x] Foundations: dependencies, fonts, design tokens, Supabase clients, env scaffolding, route groups
- [x] Design system primitives: Button, Input, Textarea, Card, Tag, ProgressPill, GlassNav, Container
- [x] Schema: `profiles`, `onboarding_responses`, RLS policies, auto-create trigger on `auth.users` insert, generated types
- [x] Auth: magic-link signup, login, callback handler, middleware session refresh, protected route helper
- [x] Onboarding: 5-step wizard with Zod validation and `submitOnboarding` server action
- [x] Landing page: hero, narrative, mentor preview placeholders, value props, CTA, glass nav, footer
- [x] Student dashboard: welcome, goals summary, recommended mentors placeholder, progress pill, empty states
- [x] Cross-cutting: error boundaries, loading skeletons, OG metadata, accessibility audit
- [x] Pre-ship: build clean, end-to-end flows working, RLS verified, mobile responsive, no hardcoded hex
