-- Push notifications: one row per device that turned on reminders. Run once in the Supabase SQL editor for the PRODUCTION project.
-- It only adds a new table; nothing existing changes. A row holds the browser's push address for that device (an address only the push service understands) and the
-- two public keys that browser made for it, plus which kind of account it belongs to. It never holds a name, an email, a phone number, a payment or anything about firearms.
-- A person removes their device from the portal (or the browser forgets it) and the row is deleted; a device the push service says is gone is deleted automatically.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null constraint push_subscriptions_role_check check (role in ('student', 'client', 'staff')),
  endpoint text not null unique check (endpoint like 'https://%' and char_length(endpoint) <= 600),
  p256dh text not null check (char_length(p256dh) between 80 and 100),
  auth text not null check (char_length(auth) between 20 and 30),
  topics text[] not null default array['class', 'permit', 'payment', 'news'],
  created_at timestamptz not null default now(),
  last_sent_at timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Server only: the website reads and writes this through its service role. A person reaches only their own devices, through the website.
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to service_role;
