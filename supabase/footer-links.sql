-- Run this once in Supabase → SQL Editor → New query → paste → Run. Safe to run again.

-- Footer: a WhatsApp link next to Instagram and Facebook.
alter table public.site_settings add column if not exists whatsapp text not null default '';
