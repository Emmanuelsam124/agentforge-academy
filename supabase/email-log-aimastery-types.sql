-- ============================================================
-- email_log: allow the AI Agent Mastery email types (2026-10-08)
--
-- send-aimastery-class-reminders has always logged 'aimastery_class_reminder' and
-- 'aimastery_class_reminder_1h', but email_log_email_type_check never allowed them,
-- so every insert failed silently and the function's per-cohort dedupe (it reads
-- these rows) could never work: a retry or a manual re-run on a cohort day would
-- email every registrant again. 'aimastery_onboarding' is the new catch-up email
-- (send-aimastery-onboarding-emails).
--
-- Same drop-and-re-add as supabase/checkout-recovery.sql; every type that was
-- allowed before is still allowed. Idempotent.
-- ============================================================

alter table public.email_log
  drop constraint if exists email_log_email_type_check;

alter table public.email_log
  add constraint email_log_email_type_check
  check (email_type = any (array[
    'broadcast',
    'winback',
    'abandoned_checkout',
    'cohort_reminder',
    'class_reminder',
    'news_digest',
    'welcome',
    'lead_confirm',
    'lead_drip',
    'aimastery_class_reminder',
    'aimastery_class_reminder_1h',
    'aimastery_onboarding'
  ]::text[]));
