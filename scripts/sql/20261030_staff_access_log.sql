-- Staff access log (approved by the owner). Run once in the Supabase SQL editor for the PRODUCTION project. It only adds ONE new table; nothing existing changes.
-- It records who on the staff opened the waiver list, opened one student's waiver, or sent a waiver reminder, and when. It never stores what a waiver says, any password, or anything from the Armory.
-- Only the Admin Hub (administrator login) can read it; students and clients cannot. Entries older than 12 months are removed whenever the administrator opens the log.
create table if not exists public.staff_access_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  staff_user_id uuid,
  staff_label text check (staff_label is null or char_length(staff_label) <= 120),
  action text not null check (action in ('waiver_list', 'waiver_view', 'waiver_remind')),
  student_id text check (student_id is null or char_length(student_id) <= 80),
  outcome text not null default 'ok' check (char_length(outcome) <= 40)
);
create index if not exists staff_access_log_at_idx on public.staff_access_log (at desc);
-- No policies on purpose: only the website's server (service role) reaches this table.
alter table public.staff_access_log enable row level security;
revoke all on public.staff_access_log from anon, authenticated;
