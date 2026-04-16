-- Change body from jsonb to text for Markdown storage.
-- Existing jsonb content becomes NULL (Tiptap JSON is not valid Markdown).
alter table public.content_items
  alter column body drop default,
  alter column body type text using null;

-- content-images storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-images',
  'content-images',
  true,
  5242880,
  array['image/webp','image/jpeg','image/png','image/gif']
)
on conflict (id) do nothing;

create policy "content_images_public_read"
  on storage.objects for select
  using (bucket_id = 'content-images');

create policy "content_images_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "content_images_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "content_images_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
