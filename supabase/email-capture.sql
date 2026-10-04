-- ============================================================
-- Email capture + starter drip (2026-10-04)
--
-- Anonymous visitors on /news, /guides and article pages can leave an email
-- address for a free 3-part starter series. Double opt-in: the form only
-- creates a 'pending' row and sends a confirmation email; nothing else is sent
-- until the link in it is used (protects the sender domain from someone typing
-- a stranger's address, and is the consent record).
--
-- All access is through the email-leads Edge Function (service role). The table
-- has RLS enabled with NO policies and no grants to anon/authenticated, so it
-- is unreachable from the REST API directly.
--
-- Requires checkout-recovery.sql's email_log constraint change first
-- (lead_confirm / lead_drip types). Apply BEFORE deploying email-leads.
-- ============================================================

create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'site',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'unsubscribed')),
  confirm_token uuid not null default gen_random_uuid(),
  unsubscribe_token uuid not null default gen_random_uuid(),
  confirm_sent_at timestamptz,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  -- Number of drip emails already sent (0 = none yet, 3 = series finished).
  drip_step integer not null default 0 check (drip_step between 0 and 3),
  last_drip_at timestamptz,
  -- Set when the address turned out to belong to a paying customer: the drip
  -- stops (no point selling them what they bought).
  converted_at timestamptz,
  constraint email_subscribers_email_format
    check (email = lower(email) and char_length(email) between 5 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create unique index if not exists email_subscribers_email_key on public.email_subscribers (email);
create unique index if not exists email_subscribers_confirm_token_key on public.email_subscribers (confirm_token);
create unique index if not exists email_subscribers_unsubscribe_token_key on public.email_subscribers (unsubscribe_token);
-- Backs the "confirmation emails sent in the last hour" flood guard in email-leads.
create index if not exists email_subscribers_confirm_sent_idx
  on public.email_subscribers (confirm_sent_at)
  where confirm_sent_at is not null;
create index if not exists email_subscribers_due_idx
  on public.email_subscribers (confirmed_at)
  where status = 'confirmed' and drip_step < 3 and converted_at is null;

alter table public.email_subscribers enable row level security;
revoke all on public.email_subscribers from anon, authenticated;

-- Kill switch for the drip (the confirmation/welcome path is unaffected).
alter table public.email_settings
  add column if not exists lead_drip_automation_enabled boolean not null default true;

-- Which confirmed subscribers are due their next email. Step 1 (the welcome) is
-- normally sent by the confirm action itself; it is listed here too (drip_step
-- = 0) so a send that failed at confirm time is retried by the next cron run.
-- is_customer: the address matches a confirmed account (auth.users, not the
-- user-writable profiles.email) that has a granted payment.
-- Service-role only — never grant to anon/authenticated.
create or replace function public.service_get_due_lead_drips()
returns table (
  id uuid,
  email text,
  unsubscribe_token uuid,
  next_step integer,
  is_customer boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select s.id, s.email, s.unsubscribe_token, s.drip_step + 1,
           exists (
             select 1
             from auth.users u
             join payments pay on pay.user_id = u.id and pay.status like 'granted%'
             where lower(u.email) = s.email
               and u.email_confirmed_at is not null
           )
    from email_subscribers s
    where s.status = 'confirmed'
      and s.converted_at is null
      and (
        s.drip_step = 0
        or (s.drip_step = 1 and s.confirmed_at <= now() - interval '2 days')
        or (s.drip_step = 2 and s.confirmed_at <= now() - interval '5 days')
      )
    order by s.confirmed_at asc
    limit 200;
end;
$$;

revoke execute on function public.service_get_due_lead_drips() from public;
revoke execute on function public.service_get_due_lead_drips() from anon;
revoke execute on function public.service_get_due_lead_drips() from authenticated;

-- Funnel numbers for the admin / for a quick SQL look. Admin-gated, with the
-- three revoke/grant statements this project requires for any admin_* RPC.
create or replace function public.admin_get_lead_funnel()
returns table (status text, subscribers bigint, converted bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select s.status, count(*), count(*) filter (where s.converted_at is not null)
    from email_subscribers s
    group by s.status
    order by s.status;
end;
$$;

revoke execute on function public.admin_get_lead_funnel() from public;
revoke execute on function public.admin_get_lead_funnel() from anon;
grant execute on function public.admin_get_lead_funnel() to authenticated;

-- Hourly drip run. Same shared cron secret as every other email job.
select cron.schedule(
  'lead-drip-hourly',
  '40 * * * *',
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/email-leads',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
)
where not exists (select 1 from cron.job where jobname = 'lead-drip-hourly');
