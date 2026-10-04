-- ============================================================
-- Checkout recovery v2 (2026-10-04)
--
-- Replaces the one-shot "email anyone with an unresolved checkout attempt
-- 2-26h after it started" job with a two-stage sequence that only ever
-- contacts people who still don't own the product. Problems with the old
-- job, all verified against production data on 2026-10-04:
--   * it deduped per ATTEMPT, so someone who opened checkout three times got
--     three emails;
--   * the webhook only resolves the attempt whose reference was paid, so a
--     person who retried and then paid kept getting "you didn't finish"
--     emails for their earlier attempts;
--   * it had no upper age bound on candidates;
--   * it didn't know the vibecoding / aimastery product names.
--
-- Apply BEFORE deploying the new send-abandoned-checkout-emails function
-- (it calls service_get_checkout_recovery_candidates).
-- ============================================================

-- 1. email_log.email_type — add every type the new/changed jobs write.
--    'welcome' has been written by paystack-webhook since launch but was never
--    in this constraint, so every welcome-email audit row failed to insert.
--    The lead_* types are used by supabase/email-capture.sql's function.
alter table public.email_log drop constraint if exists email_log_email_type_check;
alter table public.email_log add constraint email_log_email_type_check
  check (email_type = any (array[
    'broadcast', 'winback', 'abandoned_checkout', 'cohort_reminder',
    'class_reminder', 'news_digest', 'welcome', 'lead_confirm', 'lead_drip'
  ]));

-- 2. "Does this person already have this product?" — one definition, used by
--    the recovery query. Mirrors usePro.js: a permanent guide_purchases row for
--    the tier, or an unexpired entitlement. Admins count as owning everything.
--    'proupgrade' (see pro-upgrade.sql) is "owned" once nothing is left to
--    upgrade, i.e. both guide tiers are held.
create or replace function public.recovery_user_owns_plan(p_user uuid, p_plan text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with o as (
    select
      coalesce(e.is_admin, false) as is_admin,
      (exists (select 1 from guide_purchases g where g.user_id = p_user and g.tier = 'builder1')
        or coalesce(e.builder1_expires_at > now(), false)) as b1,
      (exists (select 1 from guide_purchases g where g.user_id = p_user and g.tier = 'builder2')
        or coalesce(e.builder2_expires_at > now(), false)) as b2,
      coalesce(e.vibecoding_expires_at > now(), false) as vc,
      coalesce(e.aimastery_expires_at > now(), false) as am
    from (select 1) one
    left join entitlements e on e.user_id = p_user
  )
  select o.is_admin or case p_plan
    when 'builder1' then o.b1
    when 'builder2' then o.b2
    when 'pro' then o.b1 and o.b2
    when 'proupgrade' then o.b1 and o.b2
    when 'vibecoding' then o.vc
    when 'aimastery' then o.am
    else false
  end
  from o;
$$;

revoke execute on function public.recovery_user_owns_plan(uuid, text) from public;
revoke execute on function public.recovery_user_owns_plan(uuid, text) from anon;
revoke execute on function public.recovery_user_owns_plan(uuid, text) from authenticated;

-- 3. The candidate list. At most ONE row per person (their most recent
--    unresolved attempt in the last 72h), and at most two emails per attempt:
--      stage 1: attempt is >= 1h old, nothing sent for it yet
--      stage 2: attempt is >= 24h old, exactly one email sent, >= 12h ago
--    Anyone who already owns the product is skipped.
--
--    The recipient is auth.users.email (and only when it is confirmed), NOT
--    profiles.email: profiles UPDATE RLS is row-level, so a signed-in user can
--    rewrite their own profiles.email to anyone's address and start a checkout
--    to have reminders sent to that stranger (found in the 2026-10-04 security
--    review). The auth email can only be changed through a confirmation flow,
--    so with this a reminder can only ever reach an address its owner has proven
--    they control — the same address create-paystack-checkout hands to Paystack.
create or replace function public.service_get_checkout_recovery_candidates()
returns table (
  attempt_id uuid,
  user_id uuid,
  email text,
  display_name text,
  plan text,
  created_at timestamptz,
  stage integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    with latest as (
      select distinct on (ca.user_id) ca.id, ca.user_id, ca.plan, ca.created_at
      from checkout_attempts ca
      where ca.resolved_at is null
        and ca.created_at > now() - interval '72 hours'
      order by ca.user_id, ca.created_at desc
    )
    select l.id, l.user_id, u.email::text, p.display_name, l.plan, l.created_at,
           case when s.n = 0 then 1 else 2 end
    from latest l
    join auth.users u on u.id = l.user_id
    left join profiles p on p.id = l.user_id
    cross join lateral (
      select count(*)::integer as n, max(el.sent_at) as last_sent
      from email_log el
      where el.user_id = l.user_id
        and el.email_type = 'abandoned_checkout'
        and el.metadata ->> 'plan' = l.plan
        and el.sent_at > l.created_at
    ) s
    where u.email is not null
      and u.email_confirmed_at is not null
      and not recovery_user_owns_plan(l.user_id, l.plan)
      and (
        (s.n = 0 and l.created_at <= now() - interval '1 hour')
        or (s.n = 1 and l.created_at <= now() - interval '24 hours' and s.last_sent <= now() - interval '12 hours')
      )
    order by l.created_at asc;
end;
$$;

revoke execute on function public.service_get_checkout_recovery_candidates() from public;
revoke execute on function public.service_get_checkout_recovery_candidates() from anon;
revoke execute on function public.service_get_checkout_recovery_candidates() from authenticated;

-- 4. Run hourly instead of daily at 10:00 UTC — a 1-hour first touch is
--    pointless on a once-a-day schedule — but only during waking hours:
--    07:20–19:20 UTC is 08:20–20:20 WAT (Nigeria is UTC+1 all year, and
--    pg_cron runs in UTC). Around the clock would put a reminder in someone's
--    inbox at 3 AM; the old daily job ran at 11 AM WAT. An attempt abandoned at
--    night is simply picked up on the first run of the next morning.
--    (Job 2 in cron.job on the live project, still named
--    'abandoned-checkout-daily'; looked up by name rather than id.)
do $$
declare v_id bigint;
begin
  select jobid into v_id from cron.job where jobname = 'abandoned-checkout-daily';
  if v_id is not null then
    perform cron.alter_job(v_id, schedule := '20 7-19 * * *');
  end if;
end $$;
