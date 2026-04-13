-- Phase 1 schema: profiles + onboarding_responses
-- Run: supabase db push (or apply via supabase migration up)

-- ─────────────────────────────────────────
-- Enum
-- ─────────────────────────────────────────

create type public.user_role as enum ('student', 'mentor', 'admin');

-- ─────────────────────────────────────────
-- Shared updated_at trigger function
-- ─────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────

create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text,
  country_of_origin text,
  university       text,
  year_of_study    int,
  role             public.user_role not null default 'student',
  onboarded_at     timestamptz,
  avatar_url       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profiles row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "profiles: select own"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "profiles: update own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert is handled exclusively by the trigger (no client insert)
-- Delete is blocked (no policy created → default deny)

-- ─────────────────────────────────────────
-- onboarding_responses
-- ─────────────────────────────────────────

create table public.onboarding_responses (
  profile_id          uuid primary key references public.profiles(id) on delete cascade,
  goals               text[] not null default '{}',
  challenges          text[] not null default '{}',
  fields_of_interest  text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger onboarding_responses_set_updated_at
  before update on public.onboarding_responses
  for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.onboarding_responses enable row level security;

-- Users can select, insert, and update their own row
create policy "onboarding_responses: select own"
  on public.onboarding_responses
  for select
  using (auth.uid() = profile_id);

create policy "onboarding_responses: insert own"
  on public.onboarding_responses
  for insert
  with check (auth.uid() = profile_id);

create policy "onboarding_responses: update own"
  on public.onboarding_responses
  for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Delete is blocked (no policy created → default deny)
