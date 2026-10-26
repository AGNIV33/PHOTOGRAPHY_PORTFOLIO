-- Run this once in Supabase → SQL Editor → New query → paste → Run. Safe to run again.

-- Categories for photos (Black & white, Colour, Street, Nature, ...). A photo can have several.
alter table public.photos add column if not exists tags text[] not null default '{}';
create index if not exists photos_tags_idx on public.photos using gin (tags);
