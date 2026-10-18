-- Payments received outside the website (cash, check, Zelle, a card on the day, and so on), recorded by staff in the Admin Hub.
-- Run once in the Supabase SQL editor for the PRODUCTION project. It only adds a new table; nothing existing changes.
-- Every row says who recorded it, how it was paid and when. A mistake is never deleted: it is voided (the row stays, marked), so the money trail is complete.
create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null references public.invoices(invoice_number) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  method text not null check (method in ('cash', 'check', 'money_order', 'zelle', 'venmo', 'cash_app', 'card_in_person', 'other')),
  received_on date not null,
  note text check (note is null or char_length(note) <= 200),
  recorded_by text not null,
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by text,
  void_reason text check (void_reason is null or char_length(void_reason) <= 200)
);
create index if not exists invoice_payments_invoice_idx on public.invoice_payments (invoice_number, created_at);

-- Server only: the website reads and writes this through its service role. Students never read it directly (the portal shows only the method, amount and date).
alter table public.invoice_payments enable row level security;
revoke all on public.invoice_payments from anon, authenticated;
grant select, insert, update on public.invoice_payments to service_role;
