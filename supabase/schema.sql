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

-- ---------- Journal, achievements, gear, About (also in content.sql) ----------
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

-- ---------- Accounts (also in accounts.sql) ----------
-- ---------- Admins ----------
-- The only two accounts allowed to manage the website. The website's code checks the same list.
create or replace function public.is_admin_email(email text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(email, '')) in ('agniv333@gmail.com', 'bumbarana.1111@gmail.com');
$$;

-- ---------- Profiles (sign-up details) ----------
-- Private: each person can only read and change their own row. Phone numbers are never public.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  country text not null check (char_length(country) between 2 and 60),
  state text not null default '' check (char_length(state) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- No insert or delete policy: rows are made only by the trigger below.

-- Every new account must come from the sign-up form with all its details.
-- If the details are missing (for example someone calls Supabase directly), the account
-- is not created at all. The two admin emails are allowed through so they can always get in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if public.is_admin_email(new.email) and coalesce(m ->> 'first_name', '') = '' then
    return new;
  end if;
  insert into public.profiles (id, first_name, last_name, phone, country, state)
  values (
    new.id,
    nullif(trim(m ->> 'first_name'), ''),
    nullif(trim(m ->> 'last_name'), ''),
    nullif(trim(m ->> 'phone'), ''),
    nullif(trim(m ->> 'country'), ''),
    coalesce(trim(m ->> 'state'), '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Likes and comments need a finished sign-up ----------
drop policy if exists "like as yourself" on public.likes;
create policy "like as yourself" on public.likes
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and (exists (select 1 from public.profiles p where p.id = auth.uid()) or public.is_admin_email(auth.jwt() ->> 'email'))
  );

drop policy if exists "comment as yourself" on public.comments;
create policy "comment as yourself" on public.comments
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and hidden = false
    and (exists (select 1 from public.profiles p where p.id = auth.uid()) or public.is_admin_email(auth.jwt() ->> 'email'))
  );
