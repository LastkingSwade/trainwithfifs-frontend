-- Push notifications for the Admin Hub: lets staff devices register. Run once in the Supabase SQL editor for the PRODUCTION project, AFTER 20261022_push_subscriptions.sql.
-- It only widens one rule on the table you already have (the "role" column may now also be 'staff'). Nothing else changes and no data is touched.
alter table public.push_subscriptions drop constraint if exists push_subscriptions_role_check;
alter table public.push_subscriptions add constraint push_subscriptions_role_check check (role in ('student', 'client', 'staff'));
