-- Add anonymous posting to forums
alter table public.forum_threads
  add column if not exists is_anonymous boolean not null default false;

alter table public.forum_posts
  add column if not exists is_anonymous boolean not null default false;
