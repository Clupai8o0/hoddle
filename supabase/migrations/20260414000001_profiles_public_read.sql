-- Allow any authenticated user to read any profile's public fields.
-- Without this, joins from mentors, forum_threads, success_stories, and
-- content_items to profiles return null for all rows except the viewer's own,
-- because the original "profiles: select own" policy only grants self-access.
--
-- This is intentional: profiles contain only public-facing data (name, university,
-- country, avatar). Sensitive fields (email, password) live in auth.users, not here.

create policy "profiles: select any authenticated"
  on public.profiles
  for select
  using (auth.uid() is not null);
