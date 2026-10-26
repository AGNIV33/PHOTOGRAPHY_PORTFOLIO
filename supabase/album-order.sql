-- Run this once in Supabase → SQL Editor → New query → paste → Run. Safe to run again.

-- The order of the photos inside an album (you can drag them into any order).
alter table public.photos add column if not exists album_position integer;
create index if not exists photos_album_position_idx on public.photos (album_id, album_position);

-- Photos already in an album keep the order they have now (newest first).
update public.photos p
set album_position = s.pos
from (
  select id, row_number() over (partition by album_id order by created_at desc) - 1 as pos
  from public.photos
  where album_id is not null
) s
where p.id = s.id and p.album_position is null;
