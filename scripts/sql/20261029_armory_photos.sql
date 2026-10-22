-- Armory photos. Approved by the owner. Run once in the Supabase SQL editor for the PRODUCTION project (after 20261028_armory_items.sql), with ARMORY_KEY already set in Vercel (docs/ARMORY-SETUP.md).
-- It adds ONE new table and ONE new private storage area; nothing existing changes. Every photo is encrypted by the website (AES-256-GCM, a different key per member, tied to its owner and item) BEFORE it is
-- stored, so the storage area only ever holds unreadable data. The table holds only ids, the owner, the item, a key version, where the encrypted file is, an encrypted small preview and its size.
-- Deleting an item or an account deletes its photo rows (the website also removes the stored files when an item is deleted). Staff have no route to any of it.
create table if not exists public.armory_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.armory_items(id) on delete cascade,
  key_version smallint not null default 1 check (key_version between 1 and 99),
  storage_path text not null check (char_length(storage_path) between 40 and 200),
  thumb text not null check (char_length(thumb) between 40 and 90000),
  size_bytes integer not null check (size_bytes between 1000 and 2000000),
  created_at timestamptz not null default now()
);
create index if not exists armory_photos_user_item_idx on public.armory_photos (user_id, item_id, created_at);

-- Server only: the website reads and writes this through its service role. A member reaches only their own rows, through the website.
alter table public.armory_photos enable row level security;
revoke all on public.armory_photos from anon, authenticated;
grant select, insert, delete on public.armory_photos to service_role;

-- The private storage area for the encrypted photo files (not public; the largest file allowed is 2 MB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('armory', 'armory', false, 2097152, null)
on conflict (id) do nothing;
