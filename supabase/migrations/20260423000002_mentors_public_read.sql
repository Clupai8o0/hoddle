-- Allow anonymous (unauthenticated) visitors to read verified, non-hidden mentors.
-- 20260423000001_mentor_hidden_flag.sql re-created "mentors: select verified or own"
-- with auth.uid() is not null, which blocked public browsing on /mentors.
-- This migration drops that requirement while preserving the hidden-flag logic.

drop policy if exists "mentors: select verified or own" on public.mentors;

create policy "mentors: select verified or own"
  on public.mentors
  for select
  using (
    (verified_at is not null and is_hidden = false)
    or auth.uid() = profile_id
  );
