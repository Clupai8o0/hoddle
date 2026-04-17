-- Allow thread authors to edit their own threads at any time (remove 30-minute window).
-- Admins retain unrestricted update access.

drop policy "forum_threads: update own within window or admin" on public.forum_threads;

create policy "forum_threads: update own or admin"
  on public.forum_threads
  for update
  using (
    auth.uid() = author_id
    or public.is_admin()
  )
  with check (
    auth.uid() = author_id
    or public.is_admin()
  );
