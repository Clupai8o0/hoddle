-- Make browsable content readable without authentication.
-- Stories, forums, and sessions are public (read). Creation remains members-only.
-- Content/Library stays auth-gated (separate decision).

-- profiles: drop the "authenticated only" version, allow fully public read
drop policy if exists "profiles: select any authenticated" on public.profiles;
create policy "profiles: select public" on public.profiles for select using (true);

-- mentors: verified profiles visible without login
alter policy "mentors: select verified or own"
  on public.mentors
  using (verified_at is not null or auth.uid() = profile_id);

-- forum_categories
alter policy "forum_categories: select authenticated"
  on public.forum_categories
  using (true);

-- forum_threads
alter policy "forum_threads: select authenticated"
  on public.forum_threads
  using (deleted_at is null);

-- forum_posts
alter policy "forum_posts: select authenticated"
  on public.forum_posts
  using (deleted_at is null);

-- forum_reactions
alter policy "forum_reactions: select authenticated"
  on public.forum_reactions
  using (true);

-- success_stories: published stories are public; drafts/pending only for author/admin
alter policy "success_stories: select"
  on public.success_stories
  using (
    status = 'published'
    or auth.uid() = author_id
    or public.is_admin()
  );

-- live_sessions: all sessions visible without login
alter policy "live_sessions: select authenticated"
  on public.live_sessions
  using (true);
