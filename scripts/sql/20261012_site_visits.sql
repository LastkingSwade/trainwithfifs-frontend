-- Website telemetry: one row per page load. Run once in the Supabase SQL editor for the PRODUCTION project (it only adds a new table; nothing existing changes).
-- No IP address, email, query string or full referrer is stored. visitor_hash is a one-way, per-day hash used only to estimate unique visitors.
create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor_hash text,
  device text not null check (device in ('Mobile Phone', 'Tablet / iPad', 'Desktop / Laptop', 'Handheld PC')),
  browser text,
  os text,
  path text not null check (path like '/%' and length(path) <= 120),
  referrer_host text,
  country text,
  region text,
  city text
);
create index if not exists site_visits_created_idx on public.site_visits (created_at desc);

-- Server only: the website writes and reads this through its service role. No one else can see it.
alter table public.site_visits enable row level security;
revoke all on public.site_visits from anon, authenticated;
grant select, insert, delete on public.site_visits to service_role;

-- Optional housekeeping (not run automatically): keep only the last 12 months.
-- delete from public.site_visits where created_at < now() - interval '12 months';
