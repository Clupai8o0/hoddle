-- Add social_links column to mentors table.
-- Stored as JSONB to allow flexible link types without schema migrations.
-- Shape: { linkedin?: string, twitter?: string, instagram?: string, website?: string }

alter table public.mentors
  add column if not exists social_links jsonb not null default '{}';
