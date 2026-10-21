-- Armory: each member's private equipment records. Approved by the owner. Run once in the Supabase SQL editor for the PRODUCTION project, together with adding ARMORY_KEY in Vercel (docs/ARMORY-SETUP.md).
-- It only adds one new table; nothing existing changes. Each row is ONE item, kept as a single encrypted blob: the make, model, caliber, serial number, notes and maintenance log are all INSIDE the blob and
-- are readable only by the website after it decrypts them for the signed-in owner. The database itself holds only the row id, the owner's login id, a key version number, the encrypted blob and two timestamps.
-- Deleting an account deletes its rows. Staff have no route to read them.
create table if not exists public.armory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key_version smallint not null default 1 check (key_version between 1 and 99),
  payload text not null check (char_length(payload) between 40 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists armory_items_user_idx on public.armory_items (user_id, created_at);

-- Server only: the website reads and writes this through its service role. A member reaches only their own rows, through the website.
alter table public.armory_items enable row level security;
revoke all on public.armory_items from anon, authenticated;
grant select, insert, update, delete on public.armory_items to service_role;
