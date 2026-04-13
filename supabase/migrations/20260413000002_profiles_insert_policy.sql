-- Allow users to insert their own profiles row directly.
-- Required so the onboarding server action can upsert (INSERT ... ON CONFLICT DO UPDATE)
-- as a fallback when the handle_new_user trigger hasn't fired yet.

create policy "profiles: insert own"
  on public.profiles
  for insert
  with check (auth.uid() = id);
