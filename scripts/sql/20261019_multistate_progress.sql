-- Mid-Atlantic Multi-State application guide: where each student is in the steps. Run once in the Supabase SQL editor for the PRODUCTION project.
-- It only adds a new table; nothing existing changes. It holds only the step ids a student has checked (with the time) and up to three mail tracking numbers:
-- no Social Security number, driver license number, fingerprint or date of birth is ever stored.
create table if not exists public.multistate_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  steps jsonb not null default '{}'::jsonb,
  tracking jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Server only: the website reads and writes this through its service role. A student reaches only their own row, through the website.
alter table public.multistate_progress enable row level security;
revoke all on public.multistate_progress from anon, authenticated;
grant select, insert, update on public.multistate_progress to service_role;
