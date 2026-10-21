-- Student safety & liability waiver: one signed record per student. Run once in the Supabase SQL editor for the PRODUCTION project.
-- It only adds a new table; nothing existing changes. It holds what the student typed on the waiver form (their name, initials, typed signature, emergency contact),
-- the waiver version they agreed to and when. No firearm details and no storage information.
create table if not exists public.student_waivers (
  student_id text primary key references public.students(student_id) on delete cascade,
  signed_name text not null,
  initials text not null,
  signature text not null,
  emergency_name text not null,
  emergency_relation text,
  emergency_phone text not null,
  phone text,
  email text,
  under_18 boolean not null default false,
  waiver_version text not null default '2026',
  signed_at timestamptz not null default now()
);

-- Server only: the website reads and writes this through its service role. A student reaches only their own row, through the website.
alter table public.student_waivers enable row level security;
revoke all on public.student_waivers from anon, authenticated;
grant select, insert, update on public.student_waivers to service_role;
