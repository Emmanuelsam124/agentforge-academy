-- Database cleanup migration, prepared 2026-09-26 from a read-only security/
-- performance audit (get_advisors + pg_policies/pg_extension/list_tables
-- inspection via the Supabase MCP against project qkrfpuckvymjpewcszgs).
-- NOT YET APPLIED. Review before running — see the notes on each section,
-- especially section (a) which found the literal fix requested for pg_net
-- is not achievable with a plain ALTER EXTENSION statement.
--
-- Idempotent: safe to run more than once. Wrapped in one transaction.

begin;

-- =====================================================================
-- (a) Move pg_net out of the public schema
-- =====================================================================
-- get_advisors(security) flags "Extension `pg_net` is installed in the
-- public schema. Move it to another schema." However:
--
--   select extname, extrelocatable, extnamespace::regnamespace
--   from pg_extension where extname = 'pg_net';
--   -> pg_net | extrelocatable = false | extnamespace = public
--
-- pg_net ships as a NON-relocatable extension (confirmed against Supabase's
-- own docs: "The extension creates its own schema/namespace named `net` to
-- avoid naming conflicts" — supabase.com/docs/guides/database/extensions/pg_net).
-- Every object pg_net owns (net.http_post, net.http_get, net.http_delete,
-- net.http_request_queue, net._http_response, etc. — checked via pg_depend
-- against the extension's oid) already lives in the `net` schema, not
-- `public`. Nothing pg_net actually exposes sits in the public schema; the
-- advisory is only about the extension's own catalog pointer
-- (pg_extension.extnamespace), which is cosmetic for a non-relocatable
-- extension.
--
-- Because it's non-relocatable, `ALTER EXTENSION pg_net SET SCHEMA ...`
-- is rejected by Postgres outright ("extension ... does not support SET
-- SCHEMA"). The only real ways to change that pointer are:
--   1. Ask Supabase support to temporarily flip pg_extension.extrelocatable
--      to true, run the ALTER EXTENSION, then flip it back — the same
--      workaround Supabase documents for PostGIS pre-2.3.
--   2. `DROP EXTENSION pg_net CASCADE; CREATE EXTENSION pg_net SCHEMA
--      extensions;` — but since the schema is hardcoded in pg_net's install
--      script (not `@extschema@`-templated), the functions land back in
--      `net` regardless of the SCHEMA clause; this would only reset the
--      catalog pointer, while also dropping net.http_request_queue /
--      net._http_response (unlogged, no data loss risk there) and briefly
--      breaking every pg_cron job that calls net.http_post until the
--      extension is recreated in the same migration — real risk for zero
--      functional change to what's actually reachable in `public`.
--
-- Given that, this migration does NOT attempt the move — it creates the
-- `extensions` schema if missing (it already exists on this project) and
-- guards a best-effort ALTER EXTENSION so it degrades to a harmless NOTICE
-- instead of erroring, rather than skipping the statement silently.
-- Recommend closing this specific advisory finding as "acknowledged, no
-- action" or opening a Supabase support ticket for option 1 above if the
-- catalog pointer must be corrected for compliance reasons.

create schema if not exists extensions;

do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pg_net'
      and n.nspname = 'public'
      and e.extrelocatable
  ) then
    execute 'alter extension pg_net set schema extensions';
  else
    raise notice 'Skipping pg_net schema move: extension is not relocatable (or already moved) — see migration comment for the real remediation path.';
  end if;
end $$;

-- =====================================================================
-- (b) Drop the superseded course_content backup table
-- =====================================================================
-- Confirmed via list_tables (2026-09-26) that course_content_backup_20260831
-- (44 rows, full course_content column set) predates the entire 2026-09-25/
-- 09-26 "real tested Python" guide rewrite, and that every backup table the
-- rewrite created along the way has data:
--   course_content_backup_20260925              25 rows
--   course_content_backup_20260925_services       9 rows
--   course_content_backup_20260925_setup_b1      11 rows
--   course_content_backup_20260925_setup_b2      13 rows
--   course_content_backup_20260926_b1_fixes       9 rows
--   course_content_backup_20260926_b2_fixes       5 rows
--   course_content_backup_20260926_publish       24 rows
-- course_content_backup_20260926_publish in particular is the full,
-- same-shape pre-publish snapshot (course_id/what_you_build/.../tier) that
-- most directly supersedes course_content_backup_20260831 — it's the more
-- recent "last known state before the current live rows" backup, so
-- 20260831 has no remaining reference value.
drop table if exists public.course_content_backup_20260831;

-- =====================================================================
-- (c) Missing indexes on foreign-key columns
-- =====================================================================
-- Confirmed via get_advisors(performance) "unindexed_foreign_keys" and
-- cross-checked column names against list_tables(verbose):
--   payments.user_id            (payments_user_id_fkey -> auth.users.id)
--   referral_earnings.paid_by   (referral_earnings_paid_by_fkey -> auth.users.id)
--   testimonials.user_id        (testimonials_user_id_fkey -> auth.users.id)
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists referral_earnings_paid_by_idx on public.referral_earnings(paid_by);
create index if not exists testimonials_user_id_idx on public.testimonials(user_id);

-- =====================================================================
-- (d) RLS performance: wrap bare auth.uid() in (select auth.uid())
-- =====================================================================
-- get_advisors(performance) "auth_rls_initplan" flagged exactly 33 policies
-- across the project (queried pg_policies directly to get every qual/
-- with_check verbatim). Of those 33, 25 are a single, unambiguous
-- `auth.uid() = <column>` comparison (optionally AND'd with an unrelated,
-- non-auth.uid() condition) and are rewritten below. The remaining 8 all
-- embed auth.uid() inside an `EXISTS (... entitlements ...)` subquery used
-- for admin/tier checks, which this pass treats as "more complex than a
-- simple direct comparison" per instructions and leaves untouched:
--   cohort_schedule            "Admins can update cohort schedule"
--   course_content             "Tiered course content requires matching active entitlement or a[n unexpired ...]"
--   course_content_draft       "Only admins can read course content drafts"
--   ai_platform_settings       "Only admins can read AI platform settings"
--   ai_models                  "Only admins can read AI models"
--   vibecoding_prompts         "Vibe Coding prompt library requires active entitlement or admin"
--   live_sessions              "Live sessions require matching active entitlement or admin"
--   course_content_backup_20260831 "Only admins can read the course content backup" (moot: table dropped above)
-- These 8 are good candidates for the same (select auth.uid()) treatment on
-- a follow-up pass, but should be eyeballed one at a time rather than
-- batch-rewritten with a script.
--
-- A pg_temp helper keeps the 25 rewrites DRY and each one existence-guarded
-- (skips with a NOTICE instead of erroring if a policy was renamed/dropped
-- between this audit and when this migration is applied).
create or replace function pg_temp.safe_alter_policy(
  p_table regclass,
  p_policy text,
  p_using text,
  p_check text default null
) returns void as $fn$
begin
  if not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    where c.oid = p_table and pol.polname = p_policy
  ) then
    raise notice 'Skipping policy % on % — not found (renamed or dropped since this migration was written?)', p_policy, p_table::text;
    return;
  end if;

  if p_check is not null and p_using is not null then
    execute format('alter policy %I on %s using (%s) with check (%s)', p_policy, p_table, p_using, p_check);
  elsif p_using is not null then
    execute format('alter policy %I on %s using (%s)', p_policy, p_table, p_using);
  else
    execute format('alter policy %I on %s with check (%s)', p_policy, p_table, p_check);
  end if;
end;
$fn$ language plpgsql;

-- profiles
select pg_temp.safe_alter_policy('public.profiles', 'Users can view their own profile', '(select auth.uid()) = id');
select pg_temp.safe_alter_policy('public.profiles', 'Users can update their own profile', '(select auth.uid()) = id');
select pg_temp.safe_alter_policy('public.profiles', 'Users can insert their own profile', null, '(select auth.uid()) = id');

-- progress
select pg_temp.safe_alter_policy('public.progress', 'Users can view their own progress', '(select auth.uid()) = user_id');
select pg_temp.safe_alter_policy('public.progress', 'Users can insert their own progress', null, '(select auth.uid()) = user_id');
select pg_temp.safe_alter_policy('public.progress', 'Users can update their own progress', '(select auth.uid()) = user_id');

-- entitlements
select pg_temp.safe_alter_policy('public.entitlements', 'Users can view their own entitlements', '(select auth.uid()) = user_id');

-- payments
select pg_temp.safe_alter_policy('public.payments', 'Users can view their own payments', '(select auth.uid()) = user_id');

-- testimonials
select pg_temp.safe_alter_policy('public.testimonials', 'Users can view their own testimonial', '(select auth.uid()) = user_id');
select pg_temp.safe_alter_policy('public.testimonials', 'Users can submit their own testimonial', null, '((select auth.uid()) = user_id) AND (approved = false)');

-- certificates
select pg_temp.safe_alter_policy('public.certificates', 'Users can view their own certificates', '(select auth.uid()) = user_id');

-- checkout_attempts
select pg_temp.safe_alter_policy('public.checkout_attempts', 'Users can view their own checkout attempts', '(select auth.uid()) = user_id');

-- project_submissions
select pg_temp.safe_alter_policy('public.project_submissions', 'Users can view their own submissions', '(select auth.uid()) = user_id');
select pg_temp.safe_alter_policy('public.project_submissions', 'Users can insert their own submissions', null, '(select auth.uid()) = user_id');
select pg_temp.safe_alter_policy('public.project_submissions', 'Users can update their own submissions', '(select auth.uid()) = user_id');

-- notifications
select pg_temp.safe_alter_policy('public.notifications', 'Users can view their own notifications', '(select auth.uid()) = user_id');
select pg_temp.safe_alter_policy('public.notifications', 'Users can mark their own notifications read', '(select auth.uid()) = user_id', '(select auth.uid()) = user_id');

-- referral_codes
select pg_temp.safe_alter_policy('public.referral_codes', 'Users can view their own referral code', '(select auth.uid()) = user_id');

-- referrals
select pg_temp.safe_alter_policy('public.referrals', 'Referrers can view their own referrals', '(select auth.uid()) = referrer_id');

-- referral_earnings
select pg_temp.safe_alter_policy('public.referral_earnings', 'Referrers can view their own earnings', '(select auth.uid()) = referrer_id');

-- ai_credit_wallets
select pg_temp.safe_alter_policy('public.ai_credit_wallets', 'Users can view their own wallet', '(select auth.uid()) = user_id');

-- ai_credit_transactions
select pg_temp.safe_alter_policy('public.ai_credit_transactions', 'Users can view their own credit transactions', '(select auth.uid()) = user_id');

-- ai_usage_logs
select pg_temp.safe_alter_policy('public.ai_usage_logs', 'Users can view their own AI usage', '(select auth.uid()) = user_id');

-- ai_student_keys
select pg_temp.safe_alter_policy('public.ai_student_keys', 'Users can view their own API keys', '(select auth.uid()) = user_id');

-- guide_purchases
select pg_temp.safe_alter_policy('public.guide_purchases', 'Users can view their own guide purchases', '(select auth.uid()) = user_id');

drop function if exists pg_temp.safe_alter_policy(regclass, text, text, text);

-- =====================================================================
-- (e) Document the 14 zero-policy RLS tables as deliberate default-deny
-- =====================================================================
-- Exact list confirmed via get_advisors(security) "rls_enabled_no_policy"
-- (count: 14).
comment on table public.course_content_backup_20260925 is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.course_content_backup_20260925_services is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.course_content_backup_20260925_setup_b1 is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.course_content_backup_20260925_setup_b2 is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.course_content_backup_20260926_b1_fixes is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.course_content_backup_20260926_b2_fixes is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.course_content_backup_20260926_publish is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.course_content_draft_backup_20260926 is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.course_content_draft_backup_20260926_publish is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.email_log is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.email_settings is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.news_sources is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.whatsapp_escalations is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';
comment on table public.whatsapp_messages is 'RLS enabled, no policies — service-role/admin-only access by default-deny design, not an oversight.';

-- =====================================================================
-- (f) testimonials' two SELECT policies — NOT consolidated
-- =====================================================================
-- Read both conditions from pg_policies before deciding:
--   "Anyone can view approved testimonials"  ->  USING (approved = true)
--   "Users can view their own testimonial"   ->  USING (auth.uid() = user_id)
-- These are not equivalent (one is a public approved-only filter with no
-- ownership check, the other lets an owner see their own row regardless of
-- approval status), and both are already scoped to `public`/all roles
-- rather than split anon-vs-authenticated as originally assumed — a plain
-- OR-merge would be a faithful combination of the two, but the task's
-- explicit rule is to only consolidate when the two conditions are truly
-- identical, so this migration leaves both policies as-is. (They're also
-- what get_advisors(performance) "multiple_permissive_policies" flags for
-- testimonials — that finding is left open by design here.)

commit;
