// AI Agent Mastery runs as a rolling weekly cohort: every Friday, Saturday and
// Sunday at 7:00 PM WAT, with the first cohort starting Friday 2026-10-09
// (founder-confirmed 2026-09-29). A cohort "begins" at its Friday 7 PM WAT
// start; anyone who registers after that joins the following week's, so the
// next cohort is always the first Friday-7PM at or after now, never a stale
// past date and never something an admin has to keep editing.
//
// WAT is UTC+1 all year (no DST), so a cohort start is a fixed weekly UTC
// offset from the first one. The reminder Edge Function
// (supabase/functions/send-aimastery-class-reminders) carries a copy of
// this arithmetic — keep FIRST_START_UTC in step in both places.
const FIRST_START_UTC = Date.UTC(2026, 9, 9, 18, 0, 0); // Fri 9 Oct 2026, 19:00 WAT
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Start (a Date) of the next cohort that hasn't begun yet.
export function nextAiMasteryCohortStart(now = Date.now()) {
  if (now < FIRST_START_UTC) return new Date(FIRST_START_UTC);
  const weeks = Math.floor((now - FIRST_START_UTC) / WEEK_MS) + 1;
  return new Date(FIRST_START_UTC + weeks * WEEK_MS);
}

// The three class evenings (Fri, Sat, Sun) of the cohort starting at `start`.
export function aiMasteryCohortDays(start) {
  return [0, 1, 2].map((i) => new Date(start.getTime() + i * DAY_MS));
}

const fmtDay = (d, opts) => d.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', ...opts });

// e.g. "Fri 9 – Sun 11 October" (handles a cohort that spans two months).
export function formatCohortRange(start) {
  const [first, , last] = aiMasteryCohortDays(start);
  const sameMonth = fmtDay(first, { month: 'long' }) === fmtDay(last, { month: 'long' });
  const a = fmtDay(first, { weekday: 'short', day: 'numeric', ...(sameMonth ? {} : { month: 'long' }) });
  const b = fmtDay(last, { weekday: 'short', day: 'numeric', month: 'long' });
  return `${a} – ${b}`;
}
