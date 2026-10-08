-- ============================================================
-- Scholarship "you're approved, you haven't paid yet" reminder (2026-10-08)
--
-- send-scholarship-reminder-emails emails each approved, unredeemed applicant at
-- most once and stamps reminder_email_sent_at here. The stamp is the "already
-- sent" guard (a retry or a second run can't email the same person twice).
--
-- Apply BEFORE deploying send-scholarship-reminder-emails. Idempotent. Additive:
-- one nullable column on a table that already has RLS on and no client grants.
-- ============================================================

alter table public.scholarship_applications
  add column if not exists reminder_email_sent_at timestamptz;
