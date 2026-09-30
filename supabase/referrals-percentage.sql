-- Referral payouts move from a flat ₦5,000 (Builder 1/2/Pro only, one payout
-- per referred student, ever) to 10% of every qualifying payment, on any
-- product the referrer is enrolled in (2026-09-30, founder-confirmed).
-- Run after referrals-setup.sql. Safe to re-run.
--
-- What changes:
--   * referral_earnings.referral_id is no longer UNIQUE — a referred student
--     can now earn their referrer a commission on each qualifying purchase.
--     payment_id stays UNIQUE, so a retried webhook delivery still can't
--     double-credit the same charge.
--   * plan check widened to vibecoding + aimastery; `amount` no longer
--     defaults to 5000 (the webhook now writes the computed 10%).
--   * "Enrolled" is defined once, in referrer_owned_plans(), and used by both
--     the code-minting gate and paystack-webhook.
--
-- Existing ₦5,000 rows are left exactly as they were.

-- 1. Ledger constraints.
alter table public.referral_earnings drop constraint if exists referral_earnings_referral_id_key;
alter table public.referral_earnings drop constraint if exists referral_earnings_plan_check;
alter table public.referral_earnings
  add constraint referral_earnings_plan_check
  check (plan in ('builder1', 'builder2', 'pro', 'vibecoding', 'aimastery'));
alter table public.referral_earnings alter column amount drop default;

create index if not exists referral_earnings_referral_id_idx on public.referral_earnings (referral_id);

-- 2. Which products has this person ever bought? "Ever", not "currently
--    active": a cohort student whose 6-month window lapsed is still a real
--    student (same rule as has_community_membership). `pro` counts when they
--    hold either Builder tier, since Pro is just both bundled. Admins get
--    everything so they can test the flow.
--
--    Service-role only when called directly (paystack-webhook); the
--    SECURITY DEFINER code-minting function below calls it internally.
create or replace function public.referrer_owned_plans(p_user uuid)
returns text[]
language plpgsql
stable
security definer set search_path = public
as $$
declare
  ent public.entitlements%rowtype;
  has_b1 boolean;
  has_b2 boolean;
  plans text[] := '{}';
begin
  select * into ent from public.entitlements where user_id = p_user;
  if not found then
    return plans;
  end if;

  if ent.is_admin = true then
    return array['builder1', 'builder2', 'pro', 'vibecoding', 'aimastery'];
  end if;

  has_b1 := ent.builder1_expires_at is not null
    or exists (select 1 from public.guide_purchases g where g.user_id = p_user and g.tier = 'builder1');
  has_b2 := ent.builder2_expires_at is not null
    or exists (select 1 from public.guide_purchases g where g.user_id = p_user and g.tier = 'builder2');

  if has_b1 then plans := plans || 'builder1'; end if;
  if has_b2 then plans := plans || 'builder2'; end if;
  if has_b1 or has_b2 then plans := plans || 'pro'; end if;
  if ent.vibecoding_expires_at is not null then plans := plans || 'vibecoding'; end if;
  if ent.aimastery_expires_at is not null then plans := plans || 'aimastery'; end if;

  return plans;
end;
$$;

revoke execute on function public.referrer_owned_plans(uuid) from public;
revoke execute on function public.referrer_owned_plans(uuid) from anon;
revoke execute on function public.referrer_owned_plans(uuid) from authenticated;
grant execute on function public.referrer_owned_plans(uuid) to service_role;

-- 3. Code-minting gate: any purchased product now qualifies, not just
--    Builder 1/2. Body is otherwise identical to referrals-setup.sql.
create or replace function public.get_or_create_my_referral_code()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  existing text;
  base text;
  candidate text;
  attempt int := 0;
  inserted_code text;
begin
  select code into existing from public.referral_codes where user_id = auth.uid();
  if existing is not null then
    return existing;
  end if;

  if cardinality(public.referrer_owned_plans(auth.uid())) = 0 then
    raise exception 'Only enrolled students can get a referral code';
  end if;

  select upper(regexp_replace(coalesce(display_name, ''), '[^a-zA-Z0-9]', '', 'g'))
    into base
  from public.profiles where id = auth.uid();
  base := left(nullif(base, ''), 8);
  if base is null or base = '' then
    base := 'STUDENT';
  end if;

  loop
    attempt := attempt + 1;
    candidate := base || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
    begin
      insert into public.referral_codes (user_id, code)
      values (auth.uid(), candidate)
      on conflict (user_id) do nothing
      returning code into inserted_code;
    exception when unique_violation then
      inserted_code := null;
    end;

    if inserted_code is not null then
      return inserted_code;
    end if;

    select code into existing from public.referral_codes where user_id = auth.uid();
    if existing is not null then
      return existing;
    end if;

    if attempt >= 10 then
      raise exception 'Could not generate a unique referral code, please try again';
    end if;
  end loop;
end;
$$;

-- 4. get_my_referrals — one row per referred person, with their commissions
--    rolled up (a person can now have several). The return type
--    changes, so the function has to be dropped and re-created.
drop function if exists public.get_my_referrals();

create function public.get_my_referrals()
returns table (
  referred_display_name text,
  signed_up_at timestamptz,
  earned_pending numeric,
  earned_paid numeric
)
language plpgsql
security definer set search_path = public
as $$
begin
  return query
  select
    p.display_name,
    r.created_at,
    coalesce(sum(e.amount) filter (where e.status = 'pending'), 0),
    coalesce(sum(e.amount) filter (where e.status = 'paid'), 0)
  from public.referrals r
  join public.profiles p on p.id = r.referred_user_id
  left join public.referral_earnings e on e.referral_id = r.id
  where r.referrer_id = auth.uid()
  group by r.id, p.display_name, r.created_at
  order by r.created_at desc;
end;
$$;

revoke execute on function public.get_my_referrals() from public;
revoke execute on function public.get_my_referrals() from anon;
grant execute on function public.get_my_referrals() to authenticated;

-- Verify (all three should show no anon / PUBLIC grantee):
-- select p.proname, a.grantee::regrole, a.privilege_type
-- from pg_proc p, aclexplode(p.proacl) a
-- where p.proname in ('referrer_owned_plans', 'get_my_referrals', 'get_or_create_my_referral_code');
