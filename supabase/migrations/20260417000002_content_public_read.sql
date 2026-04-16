-- Make published content publicly readable (no login required).
-- Reverses the "Content/Library stays auth-gated" decision from 20260414000002.
-- Creation, editing, and deletion remain auth-gated as before.

-- content_items: published items are visible to everyone; unpublished drafts only to their mentor
alter policy "content_items: select published or own"
  on public.content_items
  using (
    published_at is not null
    or (auth.uid() is not null and auth.uid() = mentor_id)
  );

-- content_resources: resources attached to published items are visible to everyone
alter policy "content_resources: select via parent"
  on public.content_resources
  using (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id
      and (
        ci.published_at is not null
        or (auth.uid() is not null and auth.uid() = ci.mentor_id)
      )
    )
  );

-- content_item_tags: tags on published items are visible to everyone
alter policy "content_item_tags: select authenticated"
  on public.content_item_tags
  using (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_item_id
      and (
        ci.published_at is not null
        or (auth.uid() is not null and auth.uid() = ci.mentor_id)
      )
    )
  );
