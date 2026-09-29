import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// scripts/prerender.mjs snapshots the fully-loaded DOM, so a prerendered
// page's static HTML always reflects the real cohort dates — and that same
// static HTML is what every visitor's browser hydrates on top of, not just
// crawlers. Without embedding the fetched result, the client's first
// hydration pass would start from `{ builder1: null, builder2: null }` and
// mismatch against the already-populated markup (React #418). See
// useTestimonials.js, which this mirrors.
const EMBED_ID = '__cohort_schedule_data__';

function readEmbedded() {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById(EMBED_ID);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

/**
 * Public "next cohort starts" dates for Builder 1 / Builder 2, managed by
 * admins on /admin. Purely informational — it doesn't gate content access,
 * which stays self-paced/instant on purchase.
 */
export function useCohortSchedule() {
  const embedded = readEmbedded();
  const [dates, setDates] = useState(() => embedded ?? { builder1: null, builder2: null, vibecoding: null, aimastery: null });
  const [loading, setLoading] = useState(() => embedded === null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase
      .from('cohort_schedule')
      .select('tier, start_date')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          const next = { builder1: null, builder2: null, vibecoding: null, aimastery: null };
          for (const row of data) next[row.tier] = row.start_date;
          setDates(next);
          let script = document.getElementById(EMBED_ID);
          if (!script) {
            script = document.createElement('script');
            script.id = EMBED_ID;
            script.type = 'application/json';
            document.body.appendChild(script);
          }
          script.textContent = JSON.stringify(next);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...dates, loading };
}
