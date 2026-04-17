-- Forum flexible interactions:
--   1. Add 'insightful' reaction (for standout mentor answers).
--   2. Add view_count column to forum_threads.
--   3. Add bump_thread_view() RPC so clients can atomically increment.

-- 1. Expand reaction enum
alter type public.reaction_type add value if not exists 'insightful';

-- 2. Thread view counter
alter table public.forum_threads
  add column if not exists view_count integer not null default 0;

-- 3. Atomic view increment function (SECURITY DEFINER: bypasses
--    RLS, since an unauthenticated viewer couldn't update the row
--    otherwise, and a view increment must always succeed regardless
--    of who is looking).
create or replace function public.bump_thread_view(thread_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.forum_threads
  set view_count = view_count + 1
  where slug = thread_slug
    and deleted_at is null;
end;
$$;

revoke all on function public.bump_thread_view(text) from public;
grant execute on function public.bump_thread_view(text) to authenticated, anon;
