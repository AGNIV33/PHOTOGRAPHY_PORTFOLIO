-- Journal, achievements, gear, About text and links.
-- Run this once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again: it only creates what is missing.
-- (The same lines are also at the end of schema.sql, for a fresh project.)

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  -- Plain text. A blank line starts a new paragraph.
  body text not null default '',
  -- Optional cover photo in Cloudinary (delivery type "authenticated").
  cover_public_id text,
  cover_width int,
  cover_height int,
  published_on date not null default current_date,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create index if not exists posts_date_idx on public.posts (published_on desc, created_at desc);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  year text not null default '',
  title text not null,
  detail text not null default '',
  link text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gear (
  id uuid primary key default gen_random_uuid(),
  -- Camera, Lens, Other ... used to group the list.
  kind text not null default 'Camera',
  name text not null,
  note text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- One row only (id = 1): About text, city, email and social links.
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  about text not null default '',
  city text not null default '',
  email text not null default '',
  instagram text not null default '',
  facebook text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- Visitors can only read. Changes go through the server after the admin check.
alter table public.posts enable row level security;
alter table public.achievements enable row level security;
alter table public.gear enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "published posts readable" on public.posts;
create policy "published posts readable" on public.posts
  for select using (status = 'published');

drop policy if exists "achievements readable" on public.achievements;
create policy "achievements readable" on public.achievements for select using (true);

drop policy if exists "gear readable" on public.gear;
create policy "gear readable" on public.gear for select using (true);

drop policy if exists "settings readable" on public.site_settings;
create policy "settings readable" on public.site_settings for select using (true);

-- Link previews on achievements: the title, text and picture of the page he links to.
alter table public.achievements add column if not exists link_site text not null default '';
alter table public.achievements add column if not exists link_title text not null default '';
alter table public.achievements add column if not exists link_description text not null default '';
alter table public.achievements add column if not exists link_image text not null default '';

-- Footer: a WhatsApp link next to Instagram and Facebook.
alter table public.site_settings add column if not exists whatsapp text not null default '';
