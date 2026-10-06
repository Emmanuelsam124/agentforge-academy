-- Community assistant test mode (2026-10-06). The assistant ignores staff messages
-- by default, so an admin can't try it from their own account. With test_mode on,
-- staff messages are treated like a student's. Replaces admin_get/set_community_bot
-- (the setter gains p_test_mode). Applied as the migration community_bot_test_mode.
alter table public.community_bot_settings
  add column if not exists test_mode boolean not null default false;
-- admin_get_community_bot() now also returns 'test_mode';
-- admin_set_community_bot(p_enabled, p_support_enabled, p_test_mode, p_instructions).
-- Both keep the standard revoke-from-public/anon + grant-to-authenticated.
