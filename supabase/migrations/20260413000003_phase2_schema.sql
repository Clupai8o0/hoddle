-- Phase 2 schema: mentors, content, forums, stories, sessions, notifications, matching
-- Apply with: npx supabase db push

-- ─────────────────────────────────────────
-- Security-definer helper functions
-- These let RLS policies check role without triggering recursive lookups.
-- ─────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_mentor()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'mentor'
  );
$$;

-- ─────────────────────────────────────────
-- mentors
-- ─────────────────────────────────────────

create table public.mentors (
  profile_id          uuid primary key references public.profiles(id) on delete cascade,
  slug                text unique not null,
  headline            text,
  bio                 text,
  expertise           text[] not null default '{}',
  hometown            text,
  current_position    text,
  verified_at         timestamptz,
  accepting_questions boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger mentors_set_updated_at
  before update on public.mentors
  for each row execute function public.set_updated_at();

alter table public.mentors enable row level security;

-- Any authenticated user can read verified mentors; mentors can read their own row
create policy "mentors: select verified or own"
  on public.mentors
  for select
  using (
    auth.uid() is not null
    and (verified_at is not null or auth.uid() = profile_id)
  );

-- Mentors can update their own row (not verified_at — that is admin-only)
create policy "mentors: update own"
  on public.mentors
  for update
  using (auth.uid() = profile_id and public.is_mentor())
  with check (auth.uid() = profile_id);

-- Admin may delete
create policy "mentors: delete admin"
  on public.mentors
  for delete
  using (public.is_admin());

-- Insert is handled by the inviteMentor server action via service role — no client insert

-- ─────────────────────────────────────────
-- mentor_invites
-- ─────────────────────────────────────────

create table public.mentor_invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  token       text unique not null,
  created_by  uuid references public.profiles(id),
  accepted_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '14 days'),
  created_at  timestamptz not null default now()
);

alter table public.mentor_invites enable row level security;

-- Admin only for all operations
create policy "mentor_invites: admin all"
  on public.mentor_invites
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────
-- Enums — content
-- ─────────────────────────────────────────

create type public.content_type as enum ('article', 'video', 'resource');

-- ─────────────────────────────────────────
-- content_items
-- ─────────────────────────────────────────

create table public.content_items (
  id             uuid primary key default gen_random_uuid(),
  mentor_id      uuid not null references public.mentors(profile_id) on delete cascade,
  type           public.content_type not null,
  title          text not null,
  slug           text unique not null,
  excerpt        text,
  body           jsonb,
  video_url      text,
  hero_image_url text,
  view_count     int not null default 0,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();

alter table public.content_items enable row level security;

-- Published items: any authenticated user. Drafts: author only.
create policy "content_items: select published or own"
  on public.content_items
  for select
  using (
    auth.uid() is not null
    and (published_at is not null or auth.uid() = mentor_id)
  );

-- Mentor can insert/update their own content
create policy "content_items: insert own mentor"
  on public.content_items
  for insert
  with check (auth.uid() = mentor_id and public.is_mentor());

create policy "content_items: update own mentor"
  on public.content_items
  for update
  using (auth.uid() = mentor_id and public.is_mentor())
  with check (auth.uid() = mentor_id);

-- Author or admin can delete
create policy "content_items: delete own or admin"
  on public.content_items
  for delete
  using (auth.uid() = mentor_id or public.is_admin());

-- ─────────────────────────────────────────
-- content_resources
-- ─────────────────────────────────────────

create table public.content_resources (
  id               uuid primary key default gen_random_uuid(),
  content_item_id  uuid not null references public.content_items(id) on delete cascade,
  label            text not null,
  file_path        text not null,
  file_size_bytes  bigint not null,
  created_at       timestamptz not null default now()
);

alter table public.content_resources enable row level security;

-- Visibility mirrors the parent content_item
create policy "content_resources: select via parent"
  on public.content_resources
  for select
  using (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id
        and (ci.published_at is not null or auth.uid() = ci.mentor_id)
    )
  );

-- Mentor can write resources for their own content
create policy "content_resources: insert own mentor"
  on public.content_resources
  for insert
  with check (
    public.is_mentor()
    and exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id and ci.mentor_id = auth.uid()
    )
  );

create policy "content_resources: delete own mentor or admin"
  on public.content_resources
  for delete
  using (
    public.is_admin()
    or exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id and ci.mentor_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- content_tags + content_item_tags
-- ─────────────────────────────────────────

create table public.content_tags (
  slug  text primary key,
  label text not null
);

alter table public.content_tags enable row level security;

create policy "content_tags: select authenticated"
  on public.content_tags
  for select
  using (auth.uid() is not null);

create policy "content_tags: write admin"
  on public.content_tags
  for all
  using (public.is_admin())
  with check (public.is_admin());

create table public.content_item_tags (
  content_item_id uuid references public.content_items(id) on delete cascade,
  tag_slug        text references public.content_tags(slug) on delete cascade,
  primary key (content_item_id, tag_slug)
);

alter table public.content_item_tags enable row level security;

create policy "content_item_tags: select authenticated"
  on public.content_item_tags
  for select
  using (auth.uid() is not null);

create policy "content_item_tags: write own mentor"
  on public.content_item_tags
  for all
  using (
    public.is_mentor()
    and exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id and ci.mentor_id = auth.uid()
    )
  )
  with check (
    public.is_mentor()
    and exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id and ci.mentor_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- forum_categories
-- ─────────────────────────────────────────

create table public.forum_categories (
  slug        text primary key,
  name        text not null,
  description text,
  sort_order  int not null default 0
);

alter table public.forum_categories enable row level security;

create policy "forum_categories: select authenticated"
  on public.forum_categories
  for select
  using (auth.uid() is not null);

create policy "forum_categories: write admin"
  on public.forum_categories
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed initial categories
insert into public.forum_categories (slug, name, description, sort_order) values
  ('first-semester-struggles', 'First Semester Struggles', 'You''re not alone — share what hit hardest and how you got through it.', 1),
  ('career-and-internships',   'Career & Internships',     'Résumés, applications, interviews, and landing your first Melbourne role.', 2),
  ('living-in-melbourne',      'Living in Melbourne',       'Neighbourhoods, transport, food, cost of living, and everything in between.', 3),
  ('academic-writing',         'Academic Writing',          'Essays, citations, critical thinking — the stuff they don''t teach you before you arrive.', 4),
  ('visa-and-admin',           'Visa & Admin',              'Student visas, Medicare, bank accounts, and the paperwork jungle.', 5);

-- ─────────────────────────────────────────
-- forum_threads
-- ─────────────────────────────────────────

create table public.forum_threads (
  id               uuid primary key default gen_random_uuid(),
  category_slug    text not null references public.forum_categories(slug),
  author_id        uuid not null references public.profiles(id),
  title            text not null,
  slug             text unique not null,
  body             text not null,
  pinned           boolean not null default false,
  locked           boolean not null default false,
  deleted_at       timestamptz,
  last_activity_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger forum_threads_set_updated_at
  before update on public.forum_threads
  for each row execute function public.set_updated_at();

alter table public.forum_threads enable row level security;

create policy "forum_threads: select authenticated"
  on public.forum_threads
  for select
  using (auth.uid() is not null and deleted_at is null);

create policy "forum_threads: insert authenticated"
  on public.forum_threads
  for insert
  with check (auth.uid() = author_id);

-- Author may update within 30 minutes; admin always
create policy "forum_threads: update own within window or admin"
  on public.forum_threads
  for update
  using (
    (auth.uid() = author_id and created_at > now() - interval '30 minutes')
    or public.is_admin()
  )
  with check (
    (auth.uid() = author_id and created_at > now() - interval '30 minutes')
    or public.is_admin()
  );

-- Soft delete only — enforce in server action (set deleted_at)
-- Hard delete admin only
create policy "forum_threads: delete admin"
  on public.forum_threads
  for delete
  using (public.is_admin());

-- ─────────────────────────────────────────
-- forum_posts
-- ─────────────────────────────────────────

create table public.forum_posts (
  id             uuid primary key default gen_random_uuid(),
  thread_id      uuid not null references public.forum_threads(id) on delete cascade,
  author_id      uuid not null references public.profiles(id),
  parent_post_id uuid references public.forum_posts(id),
  body           text not null,
  edited_at      timestamptz,
  deleted_at     timestamptz,
  created_at     timestamptz not null default now()
);

alter table public.forum_posts enable row level security;

create policy "forum_posts: select authenticated"
  on public.forum_posts
  for select
  using (auth.uid() is not null and deleted_at is null);

create policy "forum_posts: insert authenticated"
  on public.forum_posts
  for insert
  with check (auth.uid() = author_id);

create policy "forum_posts: update own within window or admin"
  on public.forum_posts
  for update
  using (
    (auth.uid() = author_id and created_at > now() - interval '30 minutes')
    or public.is_admin()
  )
  with check (
    (auth.uid() = author_id and created_at > now() - interval '30 minutes')
    or public.is_admin()
  );

create policy "forum_posts: delete admin"
  on public.forum_posts
  for delete
  using (public.is_admin());

-- Trigger: bump thread last_activity_at on new post
create or replace function public.bump_thread_activity()
returns trigger
language plpgsql
as $$
begin
  update public.forum_threads
  set last_activity_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

create trigger forum_posts_bump_thread
  after insert on public.forum_posts
  for each row execute function public.bump_thread_activity();

-- ─────────────────────────────────────────
-- Enum + forum_reactions
-- ─────────────────────────────────────────

create type public.reaction_type as enum ('heart', 'thanks', 'helpful');

create table public.forum_reactions (
  post_id    uuid references public.forum_posts(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  reaction   public.reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id, reaction)
);

alter table public.forum_reactions enable row level security;

create policy "forum_reactions: select authenticated"
  on public.forum_reactions
  for select
  using (auth.uid() is not null);

create policy "forum_reactions: insert own"
  on public.forum_reactions
  for insert
  with check (auth.uid() = profile_id);

create policy "forum_reactions: delete own"
  on public.forum_reactions
  for delete
  using (auth.uid() = profile_id);

-- ─────────────────────────────────────────
-- Enum + success_stories
-- ─────────────────────────────────────────

create type public.story_status as enum ('draft', 'pending', 'published', 'rejected');

create table public.success_stories (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references public.profiles(id),
  title          text not null,
  slug           text unique not null,
  body           text not null,
  hero_image_url text,
  milestones     text[] not null default '{}',
  status         public.story_status not null default 'draft',
  featured       boolean not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger success_stories_set_updated_at
  before update on public.success_stories
  for each row execute function public.set_updated_at();

alter table public.success_stories enable row level security;

-- Published: any authenticated user. Own drafts/pending: author. All: admin.
create policy "success_stories: select"
  on public.success_stories
  for select
  using (
    (status = 'published' and auth.uid() is not null)
    or auth.uid() = author_id
    or public.is_admin()
  );

create policy "success_stories: insert own"
  on public.success_stories
  for insert
  with check (auth.uid() = author_id);

-- Authors may update non-status fields; status transitions are admin-only (enforced in server action)
create policy "success_stories: update own or admin"
  on public.success_stories
  for update
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

-- ─────────────────────────────────────────
-- Enum + live_sessions
-- ─────────────────────────────────────────

create type public.session_status as enum ('scheduled', 'live', 'completed', 'cancelled');

create table public.live_sessions (
  id               uuid primary key default gen_random_uuid(),
  mentor_id        uuid not null references public.mentors(profile_id),
  title            text not null,
  description      text,
  scheduled_at     timestamptz not null,
  duration_minutes int not null default 60,
  max_attendees    int,
  meeting_url      text,
  recording_url    text,
  status           public.session_status not null default 'scheduled',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger live_sessions_set_updated_at
  before update on public.live_sessions
  for each row execute function public.set_updated_at();

alter table public.live_sessions enable row level security;

create policy "live_sessions: select authenticated"
  on public.live_sessions
  for select
  using (auth.uid() is not null);

create policy "live_sessions: insert mentor"
  on public.live_sessions
  for insert
  with check (auth.uid() = mentor_id and public.is_mentor());

create policy "live_sessions: update own mentor or admin"
  on public.live_sessions
  for update
  using (
    (auth.uid() = mentor_id and public.is_mentor())
    or public.is_admin()
  )
  with check (
    (auth.uid() = mentor_id and public.is_mentor())
    or public.is_admin()
  );

-- "no registrations" guard is enforced in the server action, not RLS
create policy "live_sessions: delete own mentor or admin"
  on public.live_sessions
  for delete
  using (
    public.is_admin()
    or (auth.uid() = mentor_id and public.is_mentor())
  );

-- ─────────────────────────────────────────
-- session_registrations
-- ─────────────────────────────────────────

create table public.session_registrations (
  session_id    uuid references public.live_sessions(id) on delete cascade,
  profile_id    uuid references public.profiles(id),
  registered_at timestamptz not null default now(),
  attended      boolean not null default false,
  primary key (session_id, profile_id)
);

alter table public.session_registrations enable row level security;

-- Registrant, the session's mentor, and admin can select
create policy "session_registrations: select"
  on public.session_registrations
  for select
  using (
    auth.uid() = profile_id
    or public.is_admin()
    or exists (
      select 1 from public.live_sessions ls
      where ls.id = session_id and ls.mentor_id = auth.uid()
    )
  );

create policy "session_registrations: insert own"
  on public.session_registrations
  for insert
  with check (auth.uid() = profile_id);

create policy "session_registrations: delete own"
  on public.session_registrations
  for delete
  using (auth.uid() = profile_id);

-- Mentor can update attended flag
create policy "session_registrations: update attended by mentor"
  on public.session_registrations
  for update
  using (
    exists (
      select 1 from public.live_sessions ls
      where ls.id = session_id and ls.mentor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.live_sessions ls
      where ls.id = session_id and ls.mentor_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- session_questions
-- ─────────────────────────────────────────

create table public.session_questions (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  body       text not null,
  anonymous  boolean not null default false,
  answered   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.session_questions enable row level security;

-- Mentor of the session and question author can select
create policy "session_questions: select"
  on public.session_questions
  for select
  using (
    auth.uid() = profile_id
    or exists (
      select 1 from public.live_sessions ls
      where ls.id = session_id and ls.mentor_id = auth.uid()
    )
  );

create policy "session_questions: insert authenticated"
  on public.session_questions
  for insert
  with check (auth.uid() = profile_id);

-- Mentor can flip answered; no client edits to body
create policy "session_questions: update answered by mentor"
  on public.session_questions
  for update
  using (
    exists (
      select 1 from public.live_sessions ls
      where ls.id = session_id and ls.mentor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.live_sessions ls
      where ls.id = session_id and ls.mentor_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- Enum + notifications
-- ─────────────────────────────────────────

create type public.notification_type as enum (
  'mentor_replied_to_your_question',
  'new_content_from_mentor_you_follow',
  'forum_reply_to_your_thread',
  'session_reminder_24h',
  'session_starting_soon',
  'success_story_approved'
);

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id),
  type         public.notification_type not null,
  payload      jsonb not null default '{}',
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications: select own"
  on public.notifications
  for select
  using (auth.uid() = recipient_id);

-- Recipient may set read_at only
create policy "notifications: update own read_at"
  on public.notifications
  for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Insert via service role only — no client insert policy

-- ─────────────────────────────────────────
-- notification_preferences
-- ─────────────────────────────────────────

create table public.notification_preferences (
  profile_id     uuid primary key references public.profiles(id) on delete cascade,
  email_enabled  boolean not null default true,
  in_app_enabled boolean not null default true,
  types_muted    public.notification_type[] not null default '{}',
  updated_at     timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

create policy "notification_preferences: owner all"
  on public.notification_preferences
  for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ─────────────────────────────────────────
-- mentor_recommendations
-- ─────────────────────────────────────────

create table public.mentor_recommendations (
  profile_id  uuid references public.profiles(id) on delete cascade,
  mentor_id   uuid references public.mentors(profile_id) on delete cascade,
  rank        int not null,
  score       int not null,
  reasoning   text,
  computed_at timestamptz not null default now(),
  primary key (profile_id, mentor_id)
);

alter table public.mentor_recommendations enable row level security;

create policy "mentor_recommendations: select own"
  on public.mentor_recommendations
  for select
  using (auth.uid() = profile_id);

-- Writes via service role only (matching function)

-- ─────────────────────────────────────────
-- mentor_follows
-- ─────────────────────────────────────────

create table public.mentor_follows (
  follower_id uuid references public.profiles(id),
  mentor_id   uuid references public.mentors(profile_id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, mentor_id)
);

alter table public.mentor_follows enable row level security;

create policy "mentor_follows: select authenticated"
  on public.mentor_follows
  for select
  using (auth.uid() is not null);

create policy "mentor_follows: insert own"
  on public.mentor_follows
  for insert
  with check (auth.uid() = follower_id);

create policy "mentor_follows: delete own"
  on public.mentor_follows
  for delete
  using (auth.uid() = follower_id);

-- ─────────────────────────────────────────
-- Storage buckets (Phase 2)
-- ─────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('content-media',     'content-media',     true,  5242880,  array['image/webp','image/jpeg','image/png']),
  ('content-resources', 'content-resources', false, 26214400, null),
  ('session-recordings','session-recordings',false, null,     null),
  ('story-images',      'story-images',      true,  5242880,  array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

-- Storage RLS: content-media (public read, mentor write to own folder)
create policy "content-media: public read"
  on storage.objects for select
  using (bucket_id = 'content-media');

create policy "content-media: mentor insert own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'content-media'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.is_mentor()
  );

create policy "content-media: mentor delete own folder"
  on storage.objects for delete
  using (
    bucket_id = 'content-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: content-resources (signed URLs, mentor write)
create policy "content-resources: authenticated read"
  on storage.objects for select
  using (
    bucket_id = 'content-resources'
    and auth.uid() is not null
  );

create policy "content-resources: mentor insert own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'content-resources'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.is_mentor()
  );

create policy "content-resources: mentor delete own folder"
  on storage.objects for delete
  using (
    bucket_id = 'content-resources'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: story-images (public read, author write)
create policy "story-images: public read"
  on storage.objects for select
  using (bucket_id = 'story-images');

create policy "story-images: author insert own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'story-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "story-images: author delete own folder"
  on storage.objects for delete
  using (
    bucket_id = 'story-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: session-recordings (private, mentor write to own folder)
create policy "session-recordings: authenticated read"
  on storage.objects for select
  using (
    bucket_id = 'session-recordings'
    and auth.uid() is not null
  );

create policy "session-recordings: mentor insert own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'session-recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.is_mentor()
  );
