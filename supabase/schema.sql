-- Run this once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again: it only creates what is missing.

-- ---------- Tables ----------

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  story text not null default '',
  cover_photo_id uuid,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  -- Cloudinary public id of the stored image (delivery type "authenticated").
  public_id text not null unique,
  width int not null,
  height int not null,
  caption text not null default '',
  place text not null default '',
  taken_at date,
  camera text not null default '',
  lens text not null default '',
  focal_length text not null default '',
  aperture text not null default '',
  shutter text not null default '',
  iso text not null default '',
  album_id uuid references public.albums (id) on delete set null,
  visibility text not null default 'public' check (visibility in ('public', 'members')),
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create index if not exists photos_album_idx on public.photos (album_id);
create index if not exists photos_created_idx on public.photos (created_at desc);

do $$ begin
  alter table public.albums
    add constraint albums_cover_fk foreign key (cover_photo_id)
    references public.photos (id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.likes (
  photo_id uuid not null references public.photos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 1000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists comments_photo_idx on public.comments (photo_id, created_at);

-- ---------- Row level security ----------
-- Visitors can only read. All admin changes go through the server with the secret key,
-- after the server checks the signed-in email is on ADMIN_EMAILS.

alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

drop policy if exists "albums readable" on public.albums;
create policy "albums readable" on public.albums for select using (true);

-- Everyone sees published photo records (so locked tiles can show), but the image link
-- for members-only photos is only made by the server for signed-in visitors.
drop policy if exists "published photos readable" on public.photos;
create policy "published photos readable" on public.photos
  for select using (status = 'published');

drop policy if exists "likes readable" on public.likes;
create policy "likes readable" on public.likes for select using (true);

drop policy if exists "like as yourself" on public.likes;
create policy "like as yourself" on public.likes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "unlike your own" on public.likes;
create policy "unlike your own" on public.likes
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "visible comments readable" on public.comments;
create policy "visible comments readable" on public.comments
  for select using (hidden = false);

drop policy if exists "comment as yourself" on public.comments;
create policy "comment as yourself" on public.comments
  for insert to authenticated with check (auth.uid() = user_id and hidden = false);

drop policy if exists "delete your own comment" on public.comments;
create policy "delete your own comment" on public.comments
  for delete to authenticated using (auth.uid() = user_id);
