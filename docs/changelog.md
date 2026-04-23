# Changelog

All notable changes to Hoddle Melbourne are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

When you finish a task in `todo.md`, add a line here under `## [Unreleased]` in the appropriate category (`Added`, `Changed`, `Fixed`, `Removed`, `Security`). When a phase ships, cut a version and move the entries under a dated heading.

---

## [Unreleased]

### Added
- Homepage platform reviews — admin-curated testimonials stored in Supabase with star ratings, author photos, and context. Rendered as an asymmetric editorial wall on the homepage when at least three reviews are published.
- Homepage survey proof strip — 3-up bold statistics (72% / 58% / 39%) sourced from the founding student needs research, placed between the Priya narrative and the mentor preview.
- About page research stat wall — four tonal stat cards between "The problem" and "How it works", anchored by a sticky intro column.
- Admin Reviews CRUD — `/admin/reviews` list, create, edit, delete with photo upload, Hoddle Blue star rating input, publish/draft toggle, and display-order control. New dashboard card with unpublished-count badge.
- Forum flexible interactions: `insightful` reaction type for standout mentor answers; emoji+label reaction buttons (Helpful ❤️, Thanks 👍, Hugs 👋, Insightful ⭐) with a `+` picker that shows only reactions already in use
- Forum thread view counter: `forum_threads.view_count` column, `bump_thread_view(slug)` RPC (SECURITY DEFINER) to atomically increment on every thread load; view count rendered in thread header and listing rows
- Forum post body rendering (`lib/utils/post-body.tsx`): `> quoted line` → styled blockquote, `@Mention` tokens → highlighted span
- `quote-reply-button.tsx` — per-post "Quote reply" and "Tag @author" shortcuts that prefill the sticky reply form via a `hoddle:quote-reply` custom event, focusing the textarea and scrolling it into view
- Anonymous posting option for forum threads and replies (students only; mentors always post as identified)
- `app/(auth)/confirm/page.tsx` — client-side auth confirm page that handles implicit-flow magic link redirects (hash fragment `#access_token=…`); routes mentor invites through `acceptMentorInvite` and students to `/dashboard`
- `lib/actions/mentor-magic-link.ts` — `sendMentorMagicLink` server action: generates magic link via admin API and sends via nodemailer, bypassing Supabase SMTP entirely
- Full name field added to mentor onboarding step 1 (input, validation, payload) and persisted to `profiles.full_name`
- Avatar upload added to mentor edit profile page: uploads to `avatars/{uid}/avatar.{ext}` in Supabase Storage and updates `profiles.avatar_url`
- Full name field added to mentor edit profile form: fetched from `profiles.full_name`, editable and saved via `updateMentorProfile`
- Google OAuth sign-in (`signInWithGoogle` server action in `lib/actions/auth.ts`); `OAuthButtons` UI primitive renders the "Continue with Google" button on the login/signup pages
- `(browse)` route group — `/mentors`, `/content`, `/forums`, `/sessions`, `/stories` pages moved here; auth is optional, write actions (post, reply, submit story) redirect to login; shares `BrowseNav` + `FeedbackWidget` layout
- `components/layout/browse-nav.tsx` (`BrowseNav`) — sticky nav for the browse group; shows user avatar + notification badge when authenticated, sign-in CTA when not
- `components/patterns/feedback-widget.tsx` (`FeedbackWidget`) — floating feedback panel (Bug / Suggestion / Confusion / Other categories) backed by Airtable via `lib/actions/feedback.ts`; shown to authenticated users in the browse layout
- `components/patterns/review-card.tsx` (`ReviewCard`) — editorial card: star row, quote body, author name/context, optional author photo
- `components/patterns/reviews-wall.tsx` (`ReviewsWall`) — asymmetric grid of `ReviewCard`s; only renders when ≥ 3 published reviews exist
- `components/patterns/survey-stat-wall.tsx` (`SurveyStatWall`) — four tonal stat cards for the About page research section
- `components/patterns/survey-strip.tsx` (`SurveyStrip`) — inline 3-stat proof strip (homepage)
- `components/patterns/markdown-renderer.tsx` (`MarkdownRenderer`) — renders plain-text markdown with blockquote and `@mention` token support
- `components/ui/star-row.tsx` (`StarRow`) — filled/empty star display, read-only
- `components/ui/publish-success-modal.tsx` (`PublishSuccessModal`) — confirmation modal displayed after a mentor publishes a content item
- `components/ui/markdown-editor.tsx` (`MarkdownEditor`) — client-side Tiptap-based markdown editor with toolbar, used in content authoring and forum forms
- `components/ui/oauth-buttons.tsx` (`OAuthButtons`) — Google sign-in button with SVG brand icon
- Direct messaging — students and mentors can exchange private messages: `app/(app)/messages/` (list, conversation, new); `conversations`, `messages`, `conversation_read_cursors` tables; server actions in `lib/actions/messages.ts`; types in `lib/types/messages.ts`; `new_chat_message` notification type (debounced per conversation, 5-min cooldown); rate-limited to 30 messages / 10 min; `MessageMentorButton` pattern on mentor profile pages
- `components/patterns/messages/` sub-components: `MessagesShell`, `ConversationList`, `ConversationClient`, `MessageThread`, `MessageBubble`, `ComposeInput`, `NewConversationPage`, `MessageMentorButton`
- `app/(app)/profile/edit/page.tsx` + `profile-edit-form.tsx` — student profile editing (full name, avatar URL, university, country of origin)
- `app/(admin)/admin/mentors/new/page.tsx` + `admin-mentor-form.tsx` — admin can directly create a mentor record without the invite-email flow
- `app/(admin)/admin/mentors/[id]/edit/page.tsx` + `edit-mentor-client.tsx` — admin can edit any mentor's profile fields (headline, bio, expertise, hometown, current role)
- `lib/actions/admin-reviews.ts` — `createReview`, `updateReview`, `deleteReview`, `uploadReviewAvatar`, `removeReviewAvatar` server actions
- `lib/actions/feedback.ts` — `submitFeedback` server action; forwards to Airtable base defined by `AIRTABLE_API_KEY` + `AIRTABLE_BASE_ID` env vars
- `lib/validation/feedback.ts` + `lib/validation/reviews.ts` — Zod schemas for feedback submission and admin review CRUD

### Changed
- `lib/actions/auth.ts` — `sendMagicLink` now generates link server-side via `admin.auth.admin.generateLink` and sends via nodemailer; removes dependency on Supabase SMTP configuration
- `lib/actions/mentor-invites.ts` — removed "active invite already exists" guard; re-inviting an email now replaces the old pending invite; invite lookup uses admin client to bypass admin-only RLS; `siteUrl` derived from request headers instead of `NEXT_PUBLIC_SITE_URL`
- `lib/email/index.ts` — replaced Resend with nodemailer + Gmail SMTP (`GMAIL_USER` + `GMAIL_APP_PASSWORD`)
- `app/(auth)/mentor-signup/[token]/page.tsx` — invite lookup uses admin client (bypasses admin-only RLS so unauthenticated visitors can view their invite)
- Magic link `redirect_to` updated to `/auth/confirm` (and `/auth/confirm?token=…` for mentor flow) to handle implicit OAuth flow on the client
- Mentors, content, forums, sessions, stories pages moved from `app/(app)/` to `app/(browse)/` — URLs unchanged

### Fixed
- Magic links landed at `/?code=…` because `NEXT_PUBLIC_SITE_URL` was absent from `.env.example` and Vercel; `sendMagicLink` now reads origin from request headers
- `invalid_invite` error on mentor signup page and `acceptMentorInvite` caused by admin-only RLS blocking reads from non-admin users
- `missing_params` error caused by implicit-flow hash fragment never reaching the server callback route handler

---

## [0.2.0] — 2026-04-14

### Added
- `app/(app)/content/page.tsx` — browse content library with type filter chips (article/video/resource)
- `app/(app)/content/[slug]/page.tsx` — editorial article reader: hero, byline, Tiptap body, video embed, downloadable resources sidebar, "Continue Learning" section
- `app/(app)/content/[slug]/view-tracker.tsx` — client component, increments view count once per page load
- `app/(app)/mentor/content/new/page.tsx` + `content-form.tsx` — create drafts with Tiptap editor, excerpt, hero URL, video URL
- `app/(app)/mentor/content/[id]/edit/page.tsx` — edit + publish/unpublish existing content
- `app/(app)/mentor/content/page.tsx` — updated: "New article" button and edit links now active
- `components/patterns/content-card.tsx` — `ContentCard` pattern with hero image, type badge, author byline, view count
- `components/patterns/tiptap-editor.tsx` — Tiptap rich-text editor client component with toolbar
- `components/patterns/tiptap-renderer.tsx` — read-only Tiptap JSON renderer, styled via Tailwind
- `lib/actions/content-items.ts` — `createContentItem`, `updateContentItem`, `publishContentItem`, `unpublishContentItem`, `incrementViewCount` server actions
- `lib/utils/video-embed.ts` — `getVideoEmbedUrl` (YouTube + Vimeo, privacy-enhanced embed URLs)
- `lib/validation/content-item.ts` — Zod schema for content creation/editing
- `app/(app)/mentors/page.tsx` — browse verified mentors with expertise filter chips
- `app/(app)/mentors/[slug]/page.tsx` — full mentor profile: avatar, headline, bio, expertise tags, published content grid, upcoming session sidebar with question form
- `app/(app)/mentors/[slug]/question-form.tsx` — client question form (react-hook-form + Zod, anonymous toggle, char count)
- `components/patterns/mentor-card.tsx` — `MentorCard` pattern component with real DB data, avatar/initials fallback, verified badge, expertise tags
- `lib/actions/session-questions.ts` — `submitSessionQuestion` server action (validates session is upcoming + scheduled)
- `lib/validation/session-question.ts` — Zod schema for question submission
- Phase 2 dependencies installed: `@tanstack/react-query`, `date-fns`, `@tiptap/react`, `@tiptap/starter-kit`, `react-day-picker`, `resend`
- `lib/email/index.ts` — typed `sendEmail` wrapper around Resend SDK
- `.env.local.example` with `RESEND_API_KEY` and `RESEND_FROM_EMAIL` vars
- `app/(app)/forums/page.tsx` — forums index: all threads with category filter chips, upcoming Q&A sidebar
- `app/(app)/forums/new/page.tsx` + `new-thread-form.tsx` — standalone new thread form with category selector
- `app/(app)/forums/[category]/page.tsx` — thread list filtered to category, pinned-first ordering
- `app/(app)/forums/[category]/new/page.tsx` — category-prefilled new thread form
- `app/(app)/forums/[category]/[thread]/page.tsx` — editorial thread detail: original post, mentor-highlighted replies, nested replies (max 2 levels), sticky reply input
- `app/(app)/forums/[category]/[thread]/reply-form.tsx` — sticky reply textarea with send button (client, locked-thread guard)
- `app/(app)/forums/[category]/[thread]/reaction-buttons.tsx` — optimistic heart/thanks/helpful toggle buttons (client)
- `app/(app)/forums/[category]/[thread]/edit-post-form.tsx` — inline edit + soft-delete for own posts within 30-min window (client)
- `lib/actions/forums.ts` — `createThread`, `createPost`, `toggleReaction`, `editPost`, `deletePost` server actions
- `lib/validation/forum.ts` — Zod schemas for thread/post creation, editing, and reactions
- `lib/utils/format-time.ts` — `formatRelativeTime` utility (relative timestamps with en-AU fallback)
- `components/providers/query-provider.tsx` — `QueryClientProvider` client wrapper; mounted in `app/(app)/layout.tsx`
- Route stubs for all Phase 2 surfaces: `/mentors`, `/content`, `/forums`, `/stories`, `/sessions`, `/inbox`
- `app/(app)/stories/page.tsx` — success stories gallery: featured editorial cards, regular story grid, empty state, submit CTA strip
- `app/(app)/stories/[slug]/page.tsx` — story reader: hero image, author byline, body paragraphs, milestone tags sidebar, "More stories" section
- `app/(app)/stories/new/page.tsx` + `story-form.tsx` — submission form: title, body, milestone multi-select (12 predefined options), optional hero image URL
- `app/(admin)/stories/page.tsx` — admin moderation queue: pending stories list with approve/reject actions, recently moderated history
- `app/(admin)/stories/moderation-buttons.tsx` — approve/reject client component with optimistic feedback
- `lib/actions/success-stories.ts` — `submitSuccessStory` (saves as pending, revalidates paths), `moderateStory` (admin approve/reject) server actions
- `lib/validation/success-story.ts` — Zod schemas and `MILESTONE_OPTIONS` constant for story submission and moderation
- `app/(admin)/admin/page.tsx` — added "Success stories" card with pending-count badge
- `app/(app)/dashboard/page.tsx` — featured story slot: shows featured published story (or falls back to placeholder), links to `/stories`
- `app/(app)/sessions/page.tsx` — upcoming sessions grid (date block, capacity, mentor row) + past sessions list with recording badge
- `app/(app)/sessions/[id]/page.tsx` — session detail: status badge, meta, register/unregister button, question submission, mentor sidebar, recording link for completed sessions
- `app/(app)/sessions/[id]/register-button.tsx` — register/unregister toggle with capacity guard
- `app/(app)/mentor/sessions/page.tsx` — updated: "Schedule session" button active, session cards link to management page
- `app/(app)/mentor/sessions/new/page.tsx` + `session-form.tsx` — schedule session (title, description, datetime-local, duration select, optional capacity and meeting URL)
- `app/(app)/mentor/sessions/[id]/page.tsx` — session management: questions list (unanswered first), attendance checkboxes, recording URL input
- `app/(app)/mentor/sessions/[id]/attendance-form.tsx` — mark attended students + complete session client component
- `app/(app)/mentor/sessions/[id]/recording-form.tsx` — add/update recording URL client component
- `lib/actions/sessions.ts` — `scheduleSession`, `registerForSession`, `unregisterFromSession`, `completeSession`, `setRecordingUrl` server actions
- `lib/validation/session.ts` — Zod schemas for session creation, recording URL, and attendance
- `lib/email/templates/session-reminder.ts` — branded HTML email template for 24h session reminders
- `app/api/cron/session-reminders/route.ts` — Vercel cron route: finds sessions 24h out, sends reminder emails via Resend to all registrants
- `vercel.json` — cron schedules: `session-reminders` hourly, `session-starting-soon` every 5 min
- `lib/actions/notifications.ts` — `notify(recipientId, type, payload)` server helper: writes `notifications` row + dispatches email if prefs allow; `markNotificationRead`, `markAllNotificationsRead`, `updateNotificationPreferences` server actions
- `lib/email/templates/notification-emails.ts` — editorial HTML email templates for all 6 notification types (`forum_reply_to_your_thread`, `success_story_approved`, `mentor_replied_to_your_question`, `new_content_from_mentor_you_follow`, `session_reminder_24h`, `session_starting_soon`)
- `lib/validation/notifications.ts` — Zod schema for notification preference updates
- `components/layout/notification-bell.tsx` — client bell icon with Supabase Realtime subscription for live unread count badge
- `app/(app)/inbox/page.tsx` — full notification list: unread/earlier sections, per-item dismiss, mark-all-read, link to preferences
- `app/(app)/settings/notifications/page.tsx` + `preferences-form.tsx` — channel toggles (email/in-app) + per-type mute toggles
- `app/api/cron/session-starting-soon/route.ts` — Vercel cron (every 5 min): sends `session_starting_soon` notifications 10–20 min before sessions
- `lib/utils/slug.ts` — `generateSlug(title)` utility extracted from inline slug logic used across actions
- `lib/utils/rate-limit.ts` — `checkRateLimit()` DB row-count rate limiter; applied to `createPost` (10/10 min), `submitSuccessStory` (3/60 min), `submitSessionQuestion` (5/60 min)
- `lib/actions/mentor-follows.ts` — `toggleFollow`, `getFollowStatus`, `notifyFollowersOfContent` server actions
- `lib/actions/content-items.ts` — `publishContentItem` now notifies all followers via `notifyFollowersOfContent()`
- `components/patterns/follow-button.tsx` — `FollowButton` client component with optimistic follow/unfollow toggle
- `components/ui/pagination.tsx` — `Pagination` component with ellipsis window; applied to content library page
- `app/(app)/mentors/[slug]/page.tsx` — `FollowButton` added to mentor hero; shows only when authenticated
- `app/(app)/content/page.tsx` — added offset pagination (18 per page)
- `app/(app)/search/page.tsx` — search across mentors, content, and forum threads using ILIKE; max 8 results per type with "View all" overflow links
- `components/layout/app-nav.tsx` — search icon link to `/search`
- `app/(app)/dashboard/page.tsx` — replaced Phase 1 "coming soon" placeholders with live sections: latest content, upcoming registered sessions, recent forum threads, featured story; welcome text updated for Phase 2
- `lib/actions/forums.ts` — `createPost` now calls `notify()` for `forum_reply_to_your_thread` when replying to another user's thread
- `lib/actions/success-stories.ts` — `moderateStory` now calls `notify()` for `success_story_approved` on approval
- `lib/matching/score.ts` — pure `scoreMentor(student, mentor)` function: country_of_origin +30, field_of_interest overlap +15 each, challenges/goals overlap +10 each; generates human-readable reasoning string
- `lib/matching/compute.ts` — `computeRecommendationsForProfile(profileId)` and `computeRecommendationsForAllStudents()` using admin client; deletes stale rows, inserts ranked top-5 results
- `app/api/cron/recompute-recommendations/route.ts` — nightly Vercel cron (02:00 AEST) recomputes recommendations for all onboarded students
- `vercel.json` — added nightly `recompute-recommendations` cron
- `lib/actions/onboarding.ts` — `submitOnboarding` now fires `computeRecommendationsForProfile()` after save (fire-and-forget)
- `app/(app)/dashboard/page.tsx` — replaces Phase 1 placeholder mentors with live `mentor_recommendations` rows; on first load with no pre-computed results, computes inline; reasoning line rendered below each `MentorCard`
- `app/(admin)/layout.tsx` — admin-only layout; redirects non-admin users to `/dashboard`
- `app/(admin)/admin/page.tsx` — admin home with live pending-invite and unverified-mentor counts
- `app/(admin)/admin/mentors/page.tsx` — mentor list with verification status; pending-invites tab
- `app/(admin)/admin/mentors/invite/page.tsx` — send mentor invite (email + optional note, 7-day expiry)
- `app/(admin)/admin/mentors/[id]/page.tsx` — mentor profile review with verify/unverify action
- `app/(auth)/mentor-signup/[token]/page.tsx` — token-gated mentor signup (server-validates invite before render)
- `app/api/auth/mentor-callback/route.ts` — post-magic-link callback: accepts invite, sets `profiles.role = 'mentor'`, creates `mentors` row
- `lib/actions/mentor-invites.ts` — `inviteMentor`, `verifyMentor`, `unverifyMentor`, `acceptMentorInvite` server actions
- `lib/supabase/admin.ts` — service-role Supabase client (server-only) for privileged mutations
- `lib/validation/mentor-invite.ts` — Zod schema for invite form
- `app/(auth)/mentor-onboarding/page.tsx` — 4-step mentor onboarding wizard (identity, story, expertise, background)
- `app/(app)/mentor/layout.tsx` — mentor sub-layout with `MentorSidebar` (Dashboard, My Content, Sessions, Inbox, Edit Profile) + verified badge
- `app/(app)/mentor/page.tsx` — mentor dashboard: impact stats, content list, upcoming sessions, inbox preview
- `app/(app)/mentor/content/page.tsx` — content list grouped by draft/published, editing stub
- `app/(app)/mentor/sessions/page.tsx` — upcoming/past session list, scheduling stub
- `app/(app)/mentor/inbox/page.tsx` — session questions grouped unanswered/answered
- `app/(app)/mentor/profile/edit/page.tsx` + `edit-profile-form.tsx` — full inline edit form with instant save
- `components/layout/mentor-sidebar.tsx` — sticky sidebar nav with active-path highlighting
- `lib/actions/mentor-onboarding.ts` — `submitMentorOnboarding` + `updateMentorProfile` server actions
- `lib/validation/mentor-onboarding.ts` — Zod schema for mentor onboarding + profile edit

### Changed
- `app/(app)/layout.tsx` — mentor role without `onboarded_at` now redirects to `/mentor-onboarding` instead of `/onboarding`
- `app/(app)/dashboard/page.tsx` — mentors redirected to `/mentor` on dashboard load

### Fixed
- `lib/email/templates/notification-emails.ts`, `session-reminder.ts` — email body background corrected from `#ffffff` to `#fef8f1` (cream) for brand consistency in email clients
- `app/(app)/mentor/page.tsx` — removed hardcoded `#002060` CSS var fallback in gradient; uses `--color-primary` throughout
- `lib/email/index.ts` — lazy-initialize Resend client to prevent build-time failure when `RESEND_API_KEY` is not set
- `AppNav` updated: Mentors, Library, Forums, Sessions links are now live `NavLink`s (replaced Phase 1 placeholder spans)
- `supabase/migrations/20260413000003_phase2_schema.sql` — full Phase 2 schema: `mentors`, `mentor_invites`, `content_items`, `content_resources`, `content_tags`, `content_item_tags`, `forum_categories` (seeded), `forum_threads`, `forum_posts`, `forum_reactions`, `success_stories`, `live_sessions`, `session_registrations`, `session_questions`, `notifications`, `notification_preferences`, `mentor_recommendations`, `mentor_follows`; new enums `content_type`, `reaction_type`, `story_status`, `session_status`, `notification_type`; `is_admin()`/`is_mentor()` security-definer helpers; storage buckets `content-media`, `content-resources`, `session-recordings`, `story-images` with full RLS; trigger `bump_thread_activity` on `forum_posts` insert

---

## [0.1.0] — 2026-04-13

### Added
- `CLAUDE.md` master briefing covering stack, design non-negotiables, conventions, and the documentation map.
- `docs/architecture.md` describing route groups, Supabase integration, auth flow, and component tiers.
- `docs/database-schema.md` documenting `profiles` and `onboarding_responses` tables with RLS policies.
- `docs/component-library.md` inventory of primitives, patterns, and layout shells.
- `docs/design.md` visual design system with Hoddle Blue primary palette.
- `docs/product-one-pager.md` product context reference.
- Project foundations: Next.js App Router + TypeScript + Tailwind, design tokens wired through Tailwind v4 `@theme`, Plus Jakarta Sans + Be Vietnam Pro via `next/font`.
- Supabase clients (server + browser) with `@supabase/ssr`, middleware-based session refresh, env scaffolding.
- Design system primitives: `Button`, `Input`, `Textarea`, `Card`, `Tag`, `ProgressPill`, `GlassNav`, `Container`, `Avatar`, `SectionDivider`.
- Schema: `profiles` and `onboarding_responses` tables with full RLS, auto-create trigger on `auth.users` insert, generated TypeScript types.
- Auth: magic-link signup and login, `/api/auth/callback` handler, protected route group middleware.
- Onboarding: 5-step wizard with Zod validation and `submitOnboarding` server action.
- Landing page at `/` with editorial hero, narrative section, mentor preview placeholders, value props, footer.
- Student dashboard at `/dashboard` with welcome block, goals summary, recommended mentors placeholder, progress pill, and empty states for Phase 2 sections.
- `app/not-found.tsx` — global 404 page styled on-brand with back-to-home and dashboard CTAs.
- `app/error.tsx`, `app/(app)/error.tsx`, `app/(auth)/error.tsx`, `app/(marketing)/error.tsx` — per-route-group error boundaries with try-again and navigation fallbacks.
- `app/(app)/dashboard/loading.tsx` — dashboard loading skeleton using tonal surface layering with `animate-pulse`; no shimmer.
- `app/opengraph-image.tsx` — edge-rendered 1200×630 OG image using Hoddle Blue and cream palette.
- `lib/analytics.ts` — analytics stub (`trackEvent`, `identifyUser`, `trackPageView`) ready for Phase 2 provider wiring.
- Root layout metadata extended with `openGraph`, `twitter`, `robots`, `metadataBase`, and `title.template`.
- Design tokens `--color-primary-dark`, `--color-primary-mid`, `--color-primary-elevated` added to `@theme` for editorial gradient ramp.

### Changed
- Primary brand colour from terracotta `#a63c26` to Hoddle Blue `#1e3a5f`. Ambient shadows re-tinted to match.
- `middleware.ts` renamed to `proxy.ts` and export renamed to `proxy` (Next.js 16 convention).
- All hardcoded hex values in components replaced with CSS custom properties; `opengraph-image.tsx` exempted (Satori limitation).
- Icon policy: `lucide-react` permitted for functional UI only (`strokeWidth={1.5}`). Decorative/illustrative use remains photography-led.

### Security
- Row Level Security enabled on `profiles` and `onboarding_responses`. Cross-user isolation verified.
- `SUPABASE_SERVICE_ROLE_KEY` confined to server-only admin scripts; never exposed with `NEXT_PUBLIC_` prefix.
- RLS verified in migration: `onboarding_responses` select/insert/update policies all use `auth.uid() = profile_id`; no policy for delete (default deny).

---

## Template for future entries

```
## [0.2.0] — YYYY-MM-DD  ← Phase 2 ship

### Added
- Mentor profiles, mentor dashboard, admin invite flow
- Content library, article reader, Tiptap editor
- Community forums with categories, threads, replies, reactions
- Success stories gallery with admin moderation
- Live Q&A scheduling with registration and question submission
- Notifications (in-app bell + email via Resend)
- Matching algorithm v1 with weighted scoring

### Changed
- Student dashboard now surfaces real recommendations, content, and session activity (replaces Phase 1 placeholders)

### Security
- RLS enabled on all new tables; admin role enforcement on `(admin)` route group
```
