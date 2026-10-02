-- Additive FIFS portal support. Does not alter existing clients, invoices, or students tables.
-- Permit files are private and stored under permits/<auth.uid()>/<filename>.

create table if not exists public.fifs_client_permit_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text,
  storage_path text not null unique,
  original_file_name text not null,
  content_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create index if not exists fifs_client_permit_documents_user_created_idx
  on public.fifs_client_permit_documents (user_id, created_at desc);

alter table public.fifs_client_permit_documents enable row level security;
revoke all on public.fifs_client_permit_documents from anon;
grant select, insert, update, delete on public.fifs_client_permit_documents to authenticated;

drop policy if exists "FIFS users manage own permit document references" on public.fifs_client_permit_documents;
create policy "FIFS users manage own permit document references"
  on public.fifs_client_permit_documents for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "FIFS admins read permit document references" on public.fifs_client_permit_documents;
create policy "FIFS admins read permit document references"
  on public.fifs_client_permit_documents for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'instructor'));

-- Server-written visitor events. No IP address, email, or full referrer is stored.
create table if not exists public.fifs_site_page_views (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique,
  visitor_id uuid not null,
  page_path text not null check (page_path like '/%'),
  created_at timestamptz not null default now()
);

create index if not exists fifs_site_page_views_created_idx
  on public.fifs_site_page_views (created_at desc);
create index if not exists fifs_site_page_views_visitor_created_idx
  on public.fifs_site_page_views (visitor_id, created_at desc);

alter table public.fifs_site_page_views enable row level security;
revoke all on public.fifs_site_page_views from anon, authenticated;
-- Use the server-side service role only for inserts and Admin Hub reads.
grant select, insert, delete on public.fifs_site_page_views to service_role;

-- Create a private permit bucket if absent; fail rather than silently making an existing public bucket private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('permits', 'permits', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

do $$
begin
  if exists (select 1 from storage.buckets where id = 'permits' and public = true) then
    raise exception 'The existing permits bucket is public. Set it private and review its policies before using permit uploads.';
  end if;
end $$;

drop policy if exists "FIFS users manage own permit files" on storage.objects;
create policy "FIFS users manage own permit files"
  on storage.objects for all to authenticated
  using (bucket_id = 'permits' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'permits' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "FIFS admins manage permit files" on storage.objects;
create policy "FIFS admins manage permit files"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'permits'
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'instructor')
  )
  with check (
    bucket_id = 'permits'
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'instructor')
  );
