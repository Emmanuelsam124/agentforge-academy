// AI Agent Mastery runs as a rolling weekly cohort: every Friday, Saturday and
// Monday at 7:00 PM WAT (changed from Sunday on 2026-10-06; flip CLASS_DAY_OFFSETS
// back to [0, 1, 2] to undo), with the first cohort starting Friday 2026-10-09
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

// Days after the Friday start that each class evening falls on: Fri, Sat, Mon.
const CLASS_DAY_OFFSETS = [0, 1, 3];

// The three class evenings (Fri, Sat, Mon) of the cohort starting at `start`.
export function aiMasteryCohortDays(start) {
  return CLASS_DAY_OFFSETS.map((i) => new Date(start.getTime() + i * DAY_MS));
}

const fmtDay = (d, opts) => d.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', ...opts });

// e.g. "Fri 9, Sat 10 & Mon 12 October". The days aren't consecutive any more, so
// they're listed rather than shown as a range; when the cohort spans two months
// every day carries its own month ("Fri 30 October, Sat 31 October & Mon 2 November").
export function formatCohortRange(start) {
  const days = aiMasteryCohortDays(start);
  const months = days.map((d) => fmtDay(d, { month: 'long' }));
  const sameMonth = months.every((m) => m === months[0]);
  const parts = days.map((d, i) =>
    fmtDay(d, { weekday: 'short', day: 'numeric', ...(sameMonth && i < days.length - 1 ? {} : { month: 'long' }) }),
  );
  return `${parts.slice(0, -1).join(', ')} & ${parts[parts.length - 1]}`;
}

// The cohort a signed-in student should see on their dashboard: the one
// currently running (from its Friday 7 PM WAT start until the Monday
// evening's class is over, ~4 days), otherwise the next one.
const RUNNING_MS = 3 * DAY_MS + 5 * 60 * 60 * 1000; // through Monday midnight WAT
export function dashboardCohortStart(now = Date.now()) {
  if (now >= FIRST_START_UTC) {
    const weeks = Math.floor((now - FIRST_START_UTC) / WEEK_MS);
    const current = FIRST_START_UTC + weeks * WEEK_MS;
    if (now < current + RUNNING_MS) return new Date(current);
  }
  return nextAiMasteryCohortStart(now);
}

export function formatClassDay(date) {
  return date.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long' });
}
