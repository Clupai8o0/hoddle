# TODO — Hoddle Melbourne

Phase 2 scope: **Mentor profiles + dashboard, Content library, Forums, Success stories, Live Q&A, Notifications, Matching algorithm v1.** All seven surfaces ship together as the full mentorship experience. See `CLAUDE.md` §5.

Format: `- [ ] task` for pending, `- [x] task` for done. Move completed items to `## Shipped` at the bottom and mirror in `docs/changelog.md`.

---

## 0. Phase 2 foundations

- [ ] Install dependencies: `@tanstack/react-query` (interactive dashboards), `date-fns`, `@tiptap/react` + `@tiptap/starter-kit` (rich-text editor), `react-day-picker` (Q&A scheduling), `resend` (transactional email)
- [ ] Add Resend API key to `.env.local.example` and Vercel envs
- [ ] Set up `lib/email/` with typed email-sending wrapper around Resend
- [ ] Add `RESEND_FROM_EMAIL`, `RESEND_API_KEY` env vars
- [ ] Create new route segments: `app/(app)/mentors`, `app/(app)/content`, `app/(app)/forums`, `app/(app)/stories`, `app/(app)/sessions`, `app/(app)/inbox`, `app/(admin)`
- [ ] Add `(admin)` route group with admin-only middleware check (`profiles.role = 'admin'`)
- [ ] Update `MarketingShell` and `AuthenticatedShell` nav to expose new top-level destinations

## 1. Schema migrations

See `docs/database-schema.md` for full table definitions, RLS policies, and triggers. Each migration ships with regenerated TypeScript types.

- [ ] Migration: `mentors` table (profile_id PK, headline, bio, expertise[], verified_at, accepting_questions, hometown, current_role)
- [ ] Migration: `mentor_invites` table (email, token, created_by, accepted_at, expires_at)
- [ ] Migration: `content_items` table (id, mentor_id, type enum, title, slug, body, video_url, hero_image_url, published_at, view_count)
- [ ] Migration: `content_resources` table (id, content_item_id, label, file_path, file_size_bytes)
- [ ] Migration: `content_tags` and `content_item_tags` join table
- [ ] Migration: `forum_categories` table (slug, name, description, sort_order)
- [ ] Migration: `forum_threads` table (id, category_id, author_id, title, body, pinned, locked, last_activity_at)
- [ ] Migration: `forum_posts` table (id, thread_id, author_id, body, parent_post_id, edited_at)
- [ ] Migration: `forum_reactions` table (post_id, profile_id, reaction enum)
- [ ] Migration: `success_stories` table (id, author_id, title, body, hero_image_url, milestones[], featured, published_at)
- [ ] Migration: `live_sessions` table (id, mentor_id, title, description, scheduled_at, duration_minutes, max_attendees, meeting_url, status)
- [ ] Migration: `session_registrations` table (session_id, profile_id, registered_at, attended)
- [ ] Migration: `session_questions` table (session_id, profile_id, body, anonymous, answered)
- [ ] Migration: `notifications` table (id, recipient_id, type, payload jsonb, read_at, created_at)
- [ ] Migration: `notification_preferences` table (profile_id, email_enabled, in_app_enabled, types_muted[])
- [ ] Migration: `mentor_recommendations` materialised view or table (profile_id, mentor_id, score, reasoning, computed_at)
- [ ] Enable RLS on every new table; document each policy in `docs/database-schema.md`
- [ ] Storage buckets: `content-media` (mentor-uploaded images, public read), `content-resources` (downloadable files, signed URLs), `session-recordings` (private)
- [ ] Regenerate `lib/supabase/database.types.ts` after each migration batch

## 2. Admin: mentor invitation flow

- [ ] `app/(admin)/page.tsx` — admin home with quick links and pending counts
- [ ] `app/(admin)/mentors/page.tsx` — list of all mentors with verification status
- [ ] `app/(admin)/mentors/invite/page.tsx` — form to send a mentor invite (email, optional note)
- [ ] Server action `inviteMentor` — generates token row in `mentor_invites`, sends Resend email with signup link
- [ ] `app/(auth)/mentor-signup/[token]/page.tsx` — token-gated mentor signup (validates token, runs magic-link auth, sets `profiles.role = 'mentor'`, creates `mentors` row)
- [ ] `app/(admin)/mentors/[id]/page.tsx` — review mentor profile, mark `verified_at`
- [ ] `app/(admin)/mentors/[id]/unverify/route.ts` — server action to revoke verification
- [ ] Admin-only middleware guard on `(admin)` route group
- [ ] Audit log: write to a simple `admin_actions` table on every verify/unverify (Phase 2.5 nice-to-have, parked)

## 3. Mentor onboarding & dashboard

- [ ] Mentor onboarding wizard (separate from student wizard): headline, expertise tags, bio, photo upload, hometown, current role
- [ ] `app/(app)/mentor` — mentor dashboard home with content stats (views, recent comments) and upcoming sessions
- [ ] `app/(app)/mentor/profile/edit` — edit mentor profile
- [ ] `app/(app)/mentor/content` — list of mentor's authored content (drafts + published)
- [ ] `app/(app)/mentor/sessions` — list of upcoming and past Q&A sessions
- [ ] `app/(app)/mentor/inbox` — questions submitted to upcoming sessions
- [ ] Role-based redirect from `/dashboard` — students see student dashboard, mentors see mentor dashboard
- [ ] Reference screen: `docs/design/mentor_dashboard_raj_sharma/screen.png`

## 4. Mentor profiles (public-to-students)

- [ ] `app/(app)/mentors/page.tsx` — browse all verified mentors with expertise filters
- [ ] `app/(app)/mentors/[slug]/page.tsx` — single mentor profile (hero photo, story, expertise chips, published content list, upcoming sessions)
- [ ] Mentor card pattern updated with real data (no more placeholders)
- [ ] "Ask a question" CTA on profile → routes to next live session question form
- [ ] Reference screen: `docs/design/mentor_profile_raj_sharma/screen.png`

## 5. Content library + article reader

- [ ] `app/(app)/content/page.tsx` — content library index with filters (type, expertise, mentor)
- [ ] `app/(app)/content/[slug]/page.tsx` — article reader with editorial layout, hero image, byline, body, downloadable resources, related content
- [ ] Tiptap-based rich-text editor for mentor content authoring
- [ ] `app/(app)/mentor/content/new` — create new content item (article / video / resource)
- [ ] `app/(app)/mentor/content/[id]/edit` — edit existing content
- [ ] Content publish/unpublish server actions with `published_at` timestamp
- [ ] View counter — increment on article load (server action, debounced per session)
- [ ] Video content type — embed YouTube/Vimeo via URL parsing, no custom player
- [ ] Downloadable resources — Supabase Storage signed URLs, file size limit 25MB
- [ ] Reference screen: `docs/design/article_decoding_academic_writing/screen.png`

## 5b. Photography — swap gradient placeholders with generated images

All prompts are inline in code as `IMAGE NEEDED` comments. Generate with Midjourney / DALL-E / Flux, apply post-processing from `docs/design.md §7`, then drop into `public/images/` and replace the gradient `<div>` with `<Image>`.

- [x] `public/images/hero-laneway-cafe.webp` — hero panel, `app/page.tsx`
      Prompt in code. Alt: "A student working at a Melbourne laneway café"
- [x] `public/images/mentor-portrait-raj.webp` — Raj card, `app/page.tsx`
      Prompt in code. Male, Indian background, smart-casual, café bokeh.
- [x] `public/images/mentor-portrait-sarah.webp` — Sarah card, `app/page.tsx`
      Prompt in code. Female, Chinese background, smart-casual, café bokeh.
- [x] `public/images/mentor-portrait-minh.webp` — Minh card, `app/page.tsx`
      Prompt in code. Male, Vietnamese background, smart-casual, café bokeh.
- [x] `public/images/auth-tram-portrait.webp` — auth shell left panel, `components/layout/auth-shell.tsx`
      Prompt in code. Student on Melbourne tram, rain on window.
- [x] `public/images/onboarding-step-illustration.webp` — onboarding sidebar, `app/(auth)/onboarding/page.tsx`
      Prompt in code. Hands holding coffee mug, city map on table.
- [x] `public/images/empty-state-journal.webp` — content library empty state, `app/(app)/dashboard/page.tsx`
      Prompt in code. Open journal on desk, flat white, potted succulent. Overhead shot.
- [ ] `public/images/empty-state-botanic.webp` — forums empty state, `app/(app)/dashboard/page.tsx`
      Prompt in code. Empty bench, Royal Botanic Gardens Melbourne, dappled sunlight.
- [ ] `public/images/empty-state-library.webp` — success stories empty state, `app/(app)/dashboard/page.tsx`
      Prompt in code. Students at State Library of Victoria reading room timber table.

Post-generation checklist (per `docs/design.md §7`):
- [ ] Colour grade: highlights → cream `#fef8f1`, shadows → Hoddle Blue `#001842`
- [ ] Crop asymmetrically (subjects on editorial thirds)
- [ ] Export WebP at quality 80 — hero max 200 KB, mentor cards max 80 KB
- [ ] Replace gradient `<div>` placeholders with `<Image>` (next/image) + correct alt text

## 6. Community forums

- [ ] `app/(app)/forums/page.tsx` — category index with last-activity preview
- [ ] `app/(app)/forums/[category]/page.tsx` — thread list within a category, sorted by `last_activity_at`
- [ ] `app/(app)/forums/[category]/[thread]/page.tsx` — thread view with nested replies
- [ ] `app/(app)/forums/[category]/new` — new thread form (title, body, optional tags)
- [ ] Reply form on thread page (no nested replies deeper than 2 levels in Phase 2)
- [ ] Reactions: heart, thanks, helpful — toggleable per user
- [ ] Edit own post (within 30 minutes of posting); soft-delete after
- [ ] Empty states for each category
- [ ] Seed initial categories: "First Semester Struggles", "Career & Internships", "Living in Melbourne", "Academic Writing", "Visa & Admin"
- [ ] Reference screens: `docs/design/community_forums/screen.png`, `docs/design/forum_thread_myki_fine_help/screen.png`

## 7. Success stories gallery

- [ ] `app/(app)/stories/page.tsx` — gallery of published success stories (editorial grid, photography-led)
- [ ] `app/(app)/stories/[slug]/page.tsx` — single story reader
- [ ] `app/(app)/stories/new` — submission form for students (title, body, milestones multi-select, optional photo)
- [ ] Server action `submitSuccessStory` — saves as draft, queues admin moderation notification
- [ ] Admin moderation queue at `app/(admin)/stories` — approve/reject submissions
- [ ] Featured story slot on student dashboard
- [ ] Reference screen: `docs/design/success_stories_gallery/screen.png`

## 8. Live Q&A scheduling

- [ ] `app/(app)/sessions/page.tsx` — upcoming sessions calendar/list
- [ ] `app/(app)/sessions/[id]/page.tsx` — session detail with mentor info, register button, question submission
- [ ] `app/(app)/mentor/sessions/new` — mentor schedules a session (date picker, duration, capacity, meeting URL)
- [ ] Server action `registerForSession` — creates `session_registrations` row, enforces capacity
- [ ] Server action `submitSessionQuestion` — anonymous toggle, saves to `session_questions`
- [ ] Pre-session reminder email (24h before) via scheduled function
- [ ] Post-session attendance tracking (mentor marks attendees)
- [ ] Past sessions show recording link if uploaded

## 9. Notifications

- [ ] In-app notification bell in `AuthenticatedShell` nav with unread count
- [ ] `app/(app)/inbox/page.tsx` — full notification list with mark-read actions
- [ ] Notification types (Phase 2 set):
  - [ ] `mentor_replied_to_your_question`
  - [ ] `new_content_from_mentor_you_follow`
  - [ ] `forum_reply_to_your_thread`
  - [ ] `session_reminder_24h`
  - [ ] `session_starting_soon`
  - [ ] `success_story_approved`
- [ ] Email template per notification type using a shared editorial layout (Hoddle blue header, cream body, Plus Jakarta Sans)
- [ ] `app/(app)/settings/notifications` — preference toggles (per-type, channel)
- [ ] Server-side helper `notify(recipientId, type, payload)` writes row + dispatches email if enabled
- [ ] Realtime subscription on `notifications` table for the bell badge (Supabase realtime, browser client only)
- [ ] Background job for scheduled reminders (Supabase Edge Function or Vercel cron) — Phase 2 ships with Vercel cron

## 10. Matching algorithm v1

Goal: surface 3–5 mentor recommendations per student based on onboarding answers. Phase 2 uses a simple weighted-score approach, not ML.

- [ ] Define scoring rules in `lib/matching/score.ts`:
  - country_of_origin match → +30
  - field_of_interest overlap → +15 per overlap
  - challenges overlap with mentor expertise → +10 per overlap
  - goals overlap with mentor expertise → +10 per overlap
  - verified mentor → required (filter, not score)
- [ ] Server function `computeRecommendationsForProfile(profileId)` — runs the score, returns top 5 with reasoning strings
- [ ] Persist results in `mentor_recommendations` table; recompute on onboarding update or nightly via cron
- [ ] Recommendation card with "why this mentor" line ("Also from India, also studying engineering")
- [ ] Recommended mentors section on student dashboard (replaces Phase 1 placeholder)
- [ ] Fallback: if fewer than 3 matches score above threshold, fill with most-recently-active verified mentors
- [ ] Log click-throughs from recommendation → mentor profile for future ranking improvements (Phase 3)

## 11. Cross-cutting

- [ ] Update student dashboard to surface: recommended mentors, latest content, upcoming sessions you're registered for, recent forum activity in your interest areas
- [ ] Update `EmptyState` pattern usages — replace Phase 1 placeholders across the dashboard with real data
- [ ] Search: basic full-text search across content, mentors, and forums using Postgres `tsvector`
- [ ] Image uploads via Supabase Storage with client-side resize before upload
- [ ] Slug generation helper for content, mentors, threads, stories
- [ ] Pagination pattern for list pages (cursor-based on `created_at`)
- [ ] Rate limiting on user-generated content endpoints (forum posts, questions, story submissions) — Vercel KV or Supabase row-based
- [ ] Add `useFollow(mentorId)` hook + `mentor_follows` join table for "follow a mentor" interactions

## 12. Pre-ship checks

- [ ] `pnpm build` passes with no TS errors
- [ ] All Phase 2 routes work end-to-end as a student: dashboard → recommendations → mentor profile → content → register for session → ask question → receive notification
- [ ] All Phase 2 routes work end-to-end as a mentor: invite email → signup → onboarding → publish content → schedule session → answer questions
- [ ] All Phase 2 routes work end-to-end as an admin: invite mentor → verify → moderate stories
- [ ] RLS verified for every new table (cross-user isolation tests)
- [ ] Admin role enforcement verified (non-admin cannot reach `(admin)` routes)
- [ ] Notification emails render correctly in Gmail, Outlook web, and Apple Mail
- [ ] Matching algorithm produces sensible results for at least 5 seed student profiles
- [ ] Mobile responsive at 375px, 768px, 1280px across all new pages
- [ ] No hardcoded hex values, no `#ffffff`, no `#000000`, no decorative icons (grep checks)
- [ ] Update `docs/changelog.md` for Phase 2 release
- [ ] Tag release `v0.2.0` and update `docs/architecture.md` if any architectural decisions changed during the build

---

## Phase 3 (parked — do not start)

- Mentor verification badges and achievement tiers
- Mentee → mentor graduation program
- Multi-language support (Mandarin, Hindi, Vietnamese, Korean)
- Mobile app shell (React Native or PWA install prompts)
- University calendar integrations
- Click-through telemetry feeding back into matching algorithm
- Anonymous question submission for sensitive topics
- Mentor analytics dashboard (reach, impact, sentiment)
- Resource hub with curated external links

---

## Shipped

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
