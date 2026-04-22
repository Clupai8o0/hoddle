-- Add is_hidden flag to mentors table.
-- Hidden mentors are excluded from public listings and profile pages
-- but can still log in and manage their own content.

alter table public.mentors
  add column is_hidden boolean not null default false;

-- Update select policy: hidden mentors are invisible to everyone except themselves.
drop policy if exists "mentors: select verified or own" on public.mentors;

create policy "mentors: select verified or own"
  on public.mentors
  for select
  using (
    auth.uid() is not null
    and (
      (verified_at is not null and is_hidden = false)
      or auth.uid() = profile_id
    )
  );
