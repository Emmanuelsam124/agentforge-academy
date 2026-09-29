-- Removal of the AI Agents Live product (2026-09-29).
--
-- Dropped: the two functions only that product used. agentslive_seats_taken()
-- was deliberately callable by anon (it powered the public "seats left"
-- counter); with the page gone it is just an unneeded anonymous entry point.
--
-- Deliberately NOT dropped: entitlements.agentslive_expires_at and the
-- agentslive references inside live_sessions' RLS policy and
-- has_community_membership() — inert without the product, and removing the
-- column would erase the one test payment's history. The community room row
-- is removed below only if nobody ever posted in it.

drop function if exists public.agentslive_seats_taken();
drop function if exists public.admin_set_user_agentslive(uuid, boolean);

delete from public.community_channels c
where c.id = 'agentslive'
  and not exists (select 1 from public.community_messages m where m.channel_id = c.id);
