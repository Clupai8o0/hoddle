-- supabase/migrations/20260416000001_profiles_is_admin.sql

-- 1. Add is_admin capability flag
alter table public.profiles
  add column is_admin boolean not null default false;

-- 2. Backfill: existing admin-role users become is_admin = true
update public.profiles
  set is_admin = true
  where role = 'admin';

-- 3. Demote their role to 'student' (admins didn't have a journey role)
update public.profiles
  set role = 'student'
  where role = 'admin';

-- 4. Update the is_admin() security-definer function
--    (all RLS policies call this function, so no policy changes needed)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;
