-- Run this once in Supabase → SQL Editor → New query → paste → Run. Safe to run again.

-- Link previews on achievements: the title, text and picture of the page he links to.
alter table public.achievements add column if not exists link_site text not null default '';
alter table public.achievements add column if not exists link_title text not null default '';
alter table public.achievements add column if not exists link_description text not null default '';
alter table public.achievements add column if not exists link_image text not null default '';
