import { useSyncExternalStore } from 'react';
import { nextAiMasteryCohortStart } from '../data/aiMasteryCohort';

// The next AI Agent Mastery cohort start, computed in the browser (see
// src/data/aiMasteryCohort.js). Null on the server snapshot, and the elements
// that show it carry data-client-only, so a prerendered page never keeps
// advertising a date that has passed. Re-checks once a minute.
function subscribe(onChange) {
  const id = setInterval(onChange, 60 * 1000);
  return () => clearInterval(id);
}
const getStartMs = () => nextAiMasteryCohortStart().getTime();

export function useNextAiMasteryCohortStart() {
  const ms = useSyncExternalStore(subscribe, getStartMs, () => null);
  return ms === null ? null : new Date(ms);
}

// "9 October"
export const formatCohortDay = (date) =>
  date.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'long' });
