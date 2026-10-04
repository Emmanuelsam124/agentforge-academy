-- ============================================================
-- Pro upgrade-by-difference (2026-10-04)
--
-- Someone who owns one permanent guide tier can buy the other for the
-- difference between Pro and what they already paid:
--   owns Builder 1 (₦5,000) -> pays ₦5,000 (Pro ₦10,000 - ₦5,000), gets Builder 2
--   owns Builder 2 (₦7,000) -> pays ₦3,000 (Pro ₦10,000 - ₦7,000), gets Builder 1
-- The amount is decided server-side by create-paystack-checkout from the
-- caller's guide_purchases rows and re-verified by paystack-webhook; the client
-- never supplies a price. Payments are stored as plan 'pro' (the end state), so
-- payments_plan_check / referral_earnings_plan_check need no change.
--
-- The only schema change: checkout_attempts must accept the new plan key so
-- an upgrade attempt can be logged (and recovered if abandoned).
--
-- Apply BEFORE deploying create-paystack-checkout.
-- ============================================================

alter table public.checkout_attempts drop constraint if exists checkout_attempts_plan_check;
alter table public.checkout_attempts add constraint checkout_attempts_plan_check
  check (plan = any (array[
    'builder1', 'builder2', 'pro', 'vibecoding', 'aimastery', 'agentslive', 'proupgrade'
  ]));
