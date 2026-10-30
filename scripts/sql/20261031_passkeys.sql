-- Passkeys: sign in with Face ID, Touch ID or a fingerprint (approved by the owner). Run once in the Supabase SQL editor for the PRODUCTION project. It only adds TWO new tables; nothing existing changes.
-- passkeys: one row per registered device. It holds only the device's PUBLIC key (useless to anyone who steals it), a counter, and a name the person chose (for example "iPhone").
-- passkey_challenges: short-lived one-time requests (each lives 5 minutes and works once) so a captured sign-in request can never be replayed. Rows are removed when used or expired.
-- Both tables are for the website's server only: nobody can read or change them from a browser. A person's passkeys are deleted automatically when their account is deleted.
create table if not exists public.passkeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique check (char_length(credential_id) between 8 and 1400),
  public_key text not null check (char_length(public_key) between 20 and 4000),
  counter bigint not null default 0 check (counter >= 0),
  transports text[],
  device_name text not null default 'This device' check (char_length(device_name) between 1 and 40),
  backed_up boolean not null default false,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists passkeys_user_idx on public.passkeys (user_id);

create table if not exists public.passkey_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge text not null check (char_length(challenge) between 16 and 200),
  purpose text not null check (purpose in ('register', 'login')),
  user_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists passkey_challenges_expires_idx on public.passkey_challenges (expires_at);

alter table public.passkeys enable row level security;
alter table public.passkey_challenges enable row level security;
revoke all on public.passkeys from anon, authenticated;
revoke all on public.passkey_challenges from anon, authenticated;
