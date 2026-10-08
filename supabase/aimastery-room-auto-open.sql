-- ============================================================
-- Open the AI Agent Mastery "Join class" buttons automatically (2026-10-08)
--
-- aimastery_room.join_enabled (supabase/aimastery-room.sql) used to be flipped by
-- hand. This job turns it on 15 minutes before every class: Friday, Saturday and
-- Sunday at 18:45 WAT = 17:45 UTC (WAT is UTC+1 all year; pg_cron is UTC). Classes
-- start at 19:00 WAT, so it matches the cohort schedule in
-- src/data/aiMasteryCohort.js. cron day-of-week: 5 = Friday, 6 = Saturday, 0 = Sunday.
--
-- It only OPENS the buttons. Nothing closes them again, so they stay open until an
-- admin runs:  update public.aimastery_room set join_enabled = false, updated_at = now() where id = 1;
-- (the same manual switch as before). The one-hour email (send-aimastery-class-reminders)
-- carries the Zoom link itself and does not depend on this flag.
--
-- Runs straight in the database - no Edge Function, no HTTP, so nothing to time out.
-- Re-running this file just re-points the same named job.
-- ============================================================

select cron.schedule(
  'aimastery-room-open-before-class',
  '45 17 * * 5,6,0',
  $$
  update public.aimastery_room
     set join_enabled = true, updated_at = now()
   where id = 1 and join_enabled = false;
  $$
);
