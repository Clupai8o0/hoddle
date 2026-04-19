-- ─────────────────────────────────────────────────────────────────
-- Platform reviews (admin-curated testimonials)
-- ─────────────────────────────────────────────────────────────────

create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  author_name    text not null check (char_length(author_name) between 1 and 120),
  author_context text check (author_context is null or char_length(author_context) <= 160),
  avatar_url     text,
  rating         smallint not null check (rating between 1 and 5),
  content        text not null check (char_length(content) between 10 and 400),
  published      boolean not null default true,
  display_order  int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index reviews_published_order_idx
  on public.reviews (published, display_order, created_at desc);

-- updated_at trigger (reuses the project convention of in-migration trigger)
create or replace function public.reviews_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.reviews_set_updated_at();

-- RLS
alter table public.reviews enable row level security;

create policy "reviews_public_read"
  on public.reviews for select
  using (published = true);

create policy "reviews_admin_read"
  on public.reviews for select
  using (public.is_admin());

create policy "reviews_admin_insert"
  on public.reviews for insert
  with check (public.is_admin());

create policy "reviews_admin_update"
  on public.reviews for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "reviews_admin_delete"
  on public.reviews for delete
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────
-- Reviews storage bucket + RLS
-- ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reviews', 'reviews', true, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "reviews_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'reviews');

create policy "reviews_bucket_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'reviews' and public.is_admin());

create policy "reviews_bucket_admin_update"
  on storage.objects for update
  using (bucket_id = 'reviews' and public.is_admin());

create policy "reviews_bucket_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'reviews' and public.is_admin());
