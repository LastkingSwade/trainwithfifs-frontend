-- Portal chat: a private, constant chat between each student or client and their instructor (Coach Kai). Run once in the Supabase SQL editor for the PRODUCTION project.
-- It only adds a new table; nothing existing changes. One row per message. It holds the member's login ID (the same one the portal already uses), who wrote the message,
-- the text, and when it was read or pushed. No firearm details and no storage information. Messages are removed automatically after 12 months.
create table if not exists public.portal_messages (
  id uuid primary key default gen_random_uuid(),
  member_user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null check (sender in ('member', 'staff')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  notified_at timestamptz
);
create index if not exists portal_messages_member_idx on public.portal_messages (member_user_id, created_at);

-- Server only: the website reads and writes this through its service role. A member reaches only their own rows, through the website; staff reach them through the Admin Hub.
alter table public.portal_messages enable row level security;
revoke all on public.portal_messages from anon, authenticated;
grant select, insert, update, delete on public.portal_messages to service_role;
