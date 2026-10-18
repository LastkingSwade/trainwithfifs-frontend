-- Daily Range Quiz (Client Portal): each client's progress and earned renewal reward. Run once in the Supabase SQL editor for the PRODUCTION project.
-- It only adds a new table; nothing existing changes. It holds which quiz questions a client answered (and when), their points, and which renewal booking the
-- reward was applied to. No personal details, and no answers or questions: those stay in the website's server code.
create table if not exists public.quiz_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  answered jsonb not null default '[]'::jsonb,
  points integer not null default 0 check (points >= 0 and points <= 825),
  last_answered_on date,
  redeemed_invoice text,
  redeemed_percent numeric(5,2) check (redeemed_percent is null or (redeemed_percent >= 0 and redeemed_percent <= 30)),
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Server only: the website reads and writes this through its service role. A client reaches only their own row, through the website.
alter table public.quiz_progress enable row level security;
revoke all on public.quiz_progress from anon, authenticated;
grant select, insert, update on public.quiz_progress to service_role;
