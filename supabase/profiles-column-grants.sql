-- profiles: only display_name and industry are client-writable (2026-10-04).
--
-- The RLS policies limit a user to their own row, but not to particular
-- columns, and Supabase's default grants gave anon/authenticated INSERT and
-- UPDATE on every column. So a signed-in user could rewrite their own
-- profiles.email — and paystack-webhook resolves the account for BYU
-- pay-first purchases (and manual Paystack-dashboard charges) by
-- profiles.email. Pointing your profile at a student's @byupathway.edu
-- address would have diverted that student's purchase to your account.
-- Audited before this ran: no profile's email differed from its
-- auth.users email, so it was never used.
--
-- The app only ever writes display_name and industry (Account.jsx,
-- ProfileInfoModal.jsx). Rows are created by handle_new_user() (SECURITY
-- DEFINER, runs as the table owner), so clients need no INSERT at all —
-- the "Users can insert their own profile" policy stays but is now
-- unreachable. Server code uses service_role, which keeps its full grants.
--
-- A column added to profiles later is NOT client-writable unless it's added
-- to the grant below. Keep it that way for anything server code trusts.
--
-- Verified with a role-simulation probe (set local role authenticated +
-- request.jwt.claims, real user id, rolled back): email, is_byu_student and
-- INSERT -> "permission denied for table profiles"; display_name + industry
-- update -> 1 row; reading your own row unaffected.

revoke insert, update on table public.profiles from anon, authenticated;
grant update (display_name, industry) on table public.profiles to authenticated;
