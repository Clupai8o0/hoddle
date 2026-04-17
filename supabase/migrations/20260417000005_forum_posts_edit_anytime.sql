-- Allow post authors to edit their own posts at any time (remove 30-minute window).
-- Admins retain unrestricted update access.

drop policy "forum_posts: update own within window or admin" on public.forum_posts;

create policy "forum_posts: update own or admin"
  on public.forum_posts
  for update
  using (
    auth.uid() = author_id
    or public.is_admin()
  )
  with check (
    auth.uid() = author_id
    or public.is_admin()
  );
