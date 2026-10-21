-- Private range journal (students and clients). NOT RUN YET: waiting for the owner's approval. Run once in the Supabase SQL editor for the PRODUCTION project.
-- It only adds two new tables; nothing existing changes. Each row belongs to one login. It holds what the member typed: the day, an optional range name, round count, a short focus,
-- an optional score they wrote down, and notes. No firearm make, model or serial number, and no storage or home-security details (the screen says so). Deleting an account deletes its rows.
create table if not exists public.range_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_on date not null,
  range_name text check (range_name is null or char_length(range_name) <= 80),
  rounds integer not null default 0 check (rounds between 0 and 5000),
  focus text check (focus is null or char_length(focus) <= 60),
  score_text text check (score_text is null or char_length(score_text) <= 40),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists range_sessions_user_idx on public.range_sessions (user_id, session_on desc);

create table if not exists public.range_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null check (char_length(goal) between 1 and 140),
  target_on date,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists range_goals_user_idx on public.range_goals (user_id, created_at desc);

-- Server only: the website reads and writes these through its service role. A member reaches only their own rows, through the website. Staff have no access to them.
alter table public.range_sessions enable row level security;
alter table public.range_goals enable row level security;
revoke all on public.range_sessions from anon, authenticated;
revoke all on public.range_goals from anon, authenticated;
grant select, insert, update, delete on public.range_sessions to service_role;
grant select, insert, update, delete on public.range_goals to service_role;
