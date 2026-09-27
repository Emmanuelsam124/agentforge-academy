-- AI Agents Live — seat-based scarcity pricing (added 2026-09-27, matching
-- founder decision: first 100 paid seats at ₦10,000, ₦15,000 after).
--
-- `agentslive_seats_taken()` exposes ONLY a count (no PII, no amounts, no
-- user_ids) so the public marketing page can show an accurate "X seats left
-- at this price" without exposing the `payments` table, which is RLS-locked
-- to "view your own rows only". This is the same "deliberately public"
-- pattern as `get_certificate_by_id` (see CLAUDE.md) — SECURITY DEFINER,
-- and explicitly GRANTed to anon rather than revoked, since an
-- unauthenticated visitor deciding whether to buy is exactly who needs it.
--
-- The actual charged amount is decided server-side in
-- create-paystack-checkout (same threshold, same count query) — this
-- function is for display only and is never used to grant anything.
create or replace function public.agentslive_seats_taken()
returns integer
language sql
security definer
set search_path to 'public'
stable
as $$
  select count(*)::integer from payments where plan = 'agentslive' and status = 'granted';
$$;

revoke execute on function public.agentslive_seats_taken() from public;
grant execute on function public.agentslive_seats_taken() to anon;
grant execute on function public.agentslive_seats_taken() to authenticated;
