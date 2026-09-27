-- AI Agents Live — data model for the new 2-day live-workshop product.
-- Run via the Supabase MCP / CLI, per CLAUDE.md's documented workflow.
-- Run AFTER supabase/guide-purchases-setup.sql and
-- supabase/ai-agent-mastery-setup.sql (this repeats their same shape one
-- more tier later, and admin_get_all_profiles here supersedes both).
--
-- Adds a 6th plan ('agentslive') alongside builder1/builder2/pro/
-- vibecoding/aimastery. Distinct from AI Agent Mastery ('aimastery') on
-- purpose: AI Agents Live is a 2-day workshop with 7 days of post-workshop
-- access, not a 6-month cohort — same underlying live_sessions/entitlements
-- pattern, different price and duration, sold on its own page.
--
-- Public-facing name is "AI Agents Live" everywhere — 'agentslive' is
-- purely an internal key (entitlements column / plan value / tier value),
-- never shown to a student.

-- 1. Entitlement column.
alter table public.entitlements
  add column if not exists agentslive_expires_at timestamptz;

-- 2. Widen the three independent plan CHECK constraints to add 'agentslive'.
alter table public.payments drop constraint if exists payments_plan_check;
alter table public.payments add constraint payments_plan_check
  check (plan in ('builder1', 'builder2', 'pro', 'vibecoding', 'aimastery', 'agentslive'));

alter table public.checkout_attempts drop constraint if exists checkout_attempts_plan_check;
alter table public.checkout_attempts add constraint checkout_attempts_plan_check
  check (plan in ('builder1', 'builder2', 'pro', 'vibecoding', 'aimastery', 'agentslive'));

alter table public.referral_earnings drop constraint if exists referral_earnings_plan_check;
alter table public.referral_earnings add constraint referral_earnings_plan_check
  check (plan in ('builder1', 'builder2', 'pro', 'vibecoding', 'aimastery', 'agentslive'));

-- 3. cohort_schedule — widen tier CHECK, add the agentslive row (start_date
--    left null; an admin fills it in via AdminCohorts.jsx once a date is set).
alter table public.cohort_schedule drop constraint if exists cohort_schedule_tier_check;
alter table public.cohort_schedule add constraint cohort_schedule_tier_check
  check (tier in ('builder1', 'builder2', 'vibecoding', 'aimastery', 'agentslive'));

insert into public.cohort_schedule (tier, start_date)
values ('agentslive', null)
on conflict (tier) do nothing;

-- 4. live_sessions — widen tier CHECK and RLS so AI Agents Live class
--    links/recordings can reuse this existing table.
alter table public.live_sessions drop constraint if exists live_sessions_tier_check;
alter table public.live_sessions add constraint live_sessions_tier_check
  check (tier in ('builder1', 'builder2', 'vibecoding', 'aimastery', 'agentslive'));

drop policy if exists "Live sessions require matching active entitlement or admin" on public.live_sessions;
create policy "Live sessions require matching active entitlement or admin"
  on public.live_sessions for select
  using (
    exists (select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true)
    or (tier = 'builder1' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.builder1_expires_at is not null and e.builder1_expires_at > now()
    ))
    or (tier = 'builder2' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.builder2_expires_at is not null and e.builder2_expires_at > now()
    ))
    or (tier = 'vibecoding' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.vibecoding_expires_at is not null and e.vibecoding_expires_at > now()
    ))
    or (tier = 'aimastery' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.aimastery_expires_at is not null and e.aimastery_expires_at > now()
    ))
    or (tier = 'agentslive' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.agentslive_expires_at is not null and e.agentslive_expires_at > now()
    ))
  );

-- 5. admin_get_all_profiles — needs agentslive_expires_at to display/toggle
--    status, same as it already does for vibecoding_expires_at/
--    aimastery_expires_at. Postgres can't CREATE OR REPLACE a function
--    whose RETURNS TABLE shape changes — drop first, which resets the
--    ACL to the default (EXECUTE to PUBLIC, and separately to
--    anon/authenticated via this project's ALTER DEFAULT PRIVILEGES), so
--    the 3-statement revoke/grant dance must be re-applied after.
drop function if exists public.admin_get_all_profiles();

create function public.admin_get_all_profiles()
returns table (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  builder1_expires_at timestamptz,
  builder2_expires_at timestamptz,
  vibecoding_expires_at timestamptz,
  aimastery_expires_at timestamptz,
  agentslive_expires_at timestamptz,
  has_builder1_guides boolean,
  has_builder2_guides boolean,
  payment_provider text,
  is_admin boolean,
  is_byu_student boolean,
  xp integer,
  streak integer,
  completed jsonb
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select
      p.id, p.email, p.display_name, p.created_at,
      e.builder1_expires_at, e.builder2_expires_at, e.vibecoding_expires_at, e.aimastery_expires_at, e.agentslive_expires_at,
      exists (select 1 from guide_purchases gp where gp.user_id = p.id and gp.tier = 'builder1'),
      exists (select 1 from guide_purchases gp where gp.user_id = p.id and gp.tier = 'builder2'),
      e.payment_provider, e.is_admin, p.is_byu_student,
      coalesce(pr.xp, 0), coalesce(pr.streak, 0), coalesce(pr.completed, '[]'::jsonb)
    from profiles p
    join entitlements e on e.user_id = p.id
    left join progress pr on pr.user_id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_get_all_profiles() from public;
revoke execute on function public.admin_get_all_profiles() from anon;
grant execute on function public.admin_get_all_profiles() to authenticated;

-- 6. Admin RPC — exact copy of admin_set_user_aimastery's shape (self-check
--    + mandatory 3-statement revoke/grant dance documented in CLAUDE.md),
--    except the grant window is 7 days, not 182 — this is a workshop, not
--    a 6-month cohort.
create or replace function public.admin_set_user_agentslive(target_user_id uuid, set_active boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  update entitlements
  set agentslive_expires_at = case when set_active then now() + interval '7 days' else null end
  where user_id = target_user_id;
end;
$$;

revoke execute on function public.admin_set_user_agentslive(uuid, boolean) from public;
revoke execute on function public.admin_set_user_agentslive(uuid, boolean) from anon;
grant execute on function public.admin_set_user_agentslive(uuid, boolean) to authenticated;
