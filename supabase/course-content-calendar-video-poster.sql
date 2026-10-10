-- ============================================================================
-- 2026-10-10  Course 11 (Calendar & Task Prioritizer): the walkthrough video now
-- plays inside the guide (SessionGuide VideoPlayer). Adds session.video.poster,
-- the cover frame shown before play, so nothing downloads until the student
-- presses play.
--
-- Source of truth: supabase/course-content-drafts/11-calendar-task-prioritizer-agent.sql
-- Guarded on the live session md5, end state checked, one transaction, backup
-- (RLS on, anon/authenticated revoked): course_content_backup_20261010_calendar_poster
--
-- Harmless before the player deploys (the old link card ignores poster).
--
-- Rollback:
--   update public.course_content c set session = b.session, updated_at = now()
--   from public.course_content_backup_20261010_calendar_poster b
--   where c.course_id = 11 and b.course_id = 11;
-- ============================================================================

do $mig$
declare
  n int;
begin
  if to_regclass('public.course_content_backup_20261010_calendar_poster') is not null then
    raise exception 'course_content_backup_20261010_calendar_poster already exists - has this already run?';
  end if;
  if (select md5(session::text) from public.course_content where course_id = 11) is distinct from '24f9d64e9b9148924560afb44fdc4326' then
    raise exception 'live row 11 session is not the 2026-10-09 version - nothing was changed';
  end if;

  create table public.course_content_backup_20261010_calendar_poster as
    select * from public.course_content where course_id = 11;
  alter table public.course_content_backup_20261010_calendar_poster enable row level security;
  revoke all on public.course_content_backup_20261010_calendar_poster from anon, authenticated;

  update public.course_content set
    session    = jsonb_set(session, '{video,poster}', to_jsonb('/videos/calendar-task-prioritizer-walkthrough-poster.jpg'::text), true),
    updated_at = now()
  where course_id = 11;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'expected to update exactly 1 row, updated %', n; end if;

  if (select md5(session::text) from public.course_content where course_id = 11) <> 'c35525f3274b4ae49149d4ca4a8e576c' then
    raise exception 'course 11 session is not the reviewed content plus the poster';
  end if;
end
$mig$;
