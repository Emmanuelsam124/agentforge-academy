-- Weekly AI Agent Mastery class reminder (2026-09-29). Fires every Friday at
-- 09:00 UTC (10:00 WAT), nine hours before that week's 7 PM WAT cohort start.
-- The function itself re-checks that a cohort starts within 24h, so a
-- misfire on another day is a harmless no-op, and it dedups per cohort via
-- email_log, so a retry never double-sends.
-- Same cron_secret vault pattern as the other reminder jobs.
select cron.schedule(
  'aimastery-class-reminder-weekly',
  '0 9 * * 5',
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/send-aimastery-class-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);

-- One-hour-before reminder (added 2026-09-29): Fridays 17:00 UTC (18:00 WAT),
-- one hour before the 19:00 WAT start. Same function; it picks the short
-- "starts in 1 hour" email when the start is within 90 minutes.
select cron.schedule(
  'aimastery-class-reminder-1h-weekly',
  '0 17 * * 5',
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/send-aimastery-class-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
