-- Accounts: sign-up details, and only the two admin emails can manage the website.
-- Run this once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again. (The same lines are also at the end of schema.sql, for a fresh project.)

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
