import { useEffect, useState, useMemo, useCallback } from 'react';
import { ClipboardList, Loader2, AlertCircle, Star, Mail, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'attended', label: 'Attended' },
  { id: 'not_attended', label: "Didn't attend" },
  { id: 'has_email', label: 'Left an email' },
];

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-border-soft bg-white dark:bg-[#131E2F] px-4 py-3.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-body mb-1">{label}</div>
      <div className="font-display text-2xl font-extrabold text-ink">{value}</div>
      {sub && <div className="text-[11px] text-body mt-0.5">{sub}</div>}
    </div>
  );
}

// Simple horizontal-bar breakdown — no charting library in this repo, and a
// handful of CSS bars is enough for "why didn't they sign up" at this scale.
function BreakdownBars({ title, counts, total }) {
  if (counts.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#131E2F] p-5">
      <div className="font-bold text-sm text-ink mb-4">{title}</div>
      <div className="flex flex-col gap-3">
        {counts.map(([label, count]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-[12.5px] mb-1">
              <span className="text-body-strong font-semibold">{label}</span>
              <span className="text-body">{count} · {Math.round((count / total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#E8EDF3] dark:bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.max((count / total) * 100, 3)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResponseRow({ r }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-soft last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
              r.attended_webinar
                ? 'bg-[#EAFAF1] dark:bg-green/10 text-green'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400'
            }`}
          >
            {r.attended_webinar ? 'Attended' : "Didn't attend"}
          </span>
          <span className="text-sm font-semibold text-ink truncate">{r.no_signup_reason}</span>
          {r.willingness_to_pay && (
            <span className="text-[11px] font-bold text-link bg-[#E8EDF3] dark:bg-brand/15 px-2 py-0.5 rounded-full flex-shrink-0">
              {r.willingness_to_pay}
            </span>
          )}
          {r.contact_email && <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] text-gray-400">
            {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-body space-y-2">
          {r.attended_webinar && r.webinar_rating > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < r.webinar_rating ? 'fill-yellow text-yellow' : 'fill-gray-200 text-gray-200'}`} />
              ))}
            </div>
          )}
          {!r.attended_webinar && r.no_join_reason && (
            <p><span className="font-semibold text-ink">Didn't join because:</span> {r.no_join_reason}</p>
          )}
          {r.webinar_feedback && (
            <p><span className="font-semibold text-ink">Webinar feedback:</span> {r.webinar_feedback}</p>
          )}
          {r.no_signup_reason_other && (
            <p><span className="font-semibold text-ink">"Other" reason:</span> {r.no_signup_reason_other}</p>
          )}
          {r.change_mind_feedback && (
            <p><span className="font-semibold text-ink">What would change their mind:</span> {r.change_mind_feedback}</p>
          )}
          {r.contact_email && (
            <p><span className="font-semibold text-ink">Email:</span> {r.contact_email}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSurvey() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('admin_list_webinar_survey_responses');
      if (err) throw err;
      setResponses(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load survey responses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const stats = useMemo(() => {
    const total = responses.length;
    const attended = responses.filter((r) => r.attended_webinar).length;
    const withEmail = responses.filter((r) => r.contact_email).length;
    const priceIsBlocker = responses.filter((r) => r.no_signup_reason === 'Price / cost').length;

    const reasonCounts = Object.entries(
      responses.reduce((acc, r) => {
        acc[r.no_signup_reason] = (acc[r.no_signup_reason] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]);

    const priceBandCounts = Object.entries(
      responses
        .filter((r) => r.willingness_to_pay)
        .reduce((acc, r) => {
          const band = r.willingness_to_pay.split(' — ')[0];
          acc[band] = (acc[band] || 0) + 1;
          return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]);

    return { total, attended, withEmail, priceIsBlocker, reasonCounts, priceBandCounts };
  }, [responses]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'attended': return responses.filter((r) => r.attended_webinar);
      case 'not_attended': return responses.filter((r) => !r.attended_webinar);
      case 'has_email': return responses.filter((r) => r.contact_email);
      default: return responses;
    }
  }, [responses, filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-link" />
          Webinar Survey
        </h1>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="px-5 py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-link mx-auto" />
        </div>
      ) : responses.length === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#131E2F] px-5 py-12 text-center text-gray-400 text-sm">
          No responses yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Responses" value={stats.total} />
            <StatCard label="Attended webinar" value={`${Math.round((stats.attended / stats.total) * 100)}%`} sub={`${stats.attended} of ${stats.total}`} />
            <StatCard label="Cited price" value={`${Math.round((stats.priceIsBlocker / stats.total) * 100)}%`} sub={`${stats.priceIsBlocker} responses`} />
            <StatCard label="Left an email" value={stats.withEmail} sub="warm leads to follow up" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <BreakdownBars title="Why they didn't sign up for Builder 1" counts={stats.reasonCounts} total={stats.total} />
            <BreakdownBars title="What they'd pay (of those citing price)" counts={stats.priceBandCounts} total={stats.priceIsBlocker || 1} />
          </div>

          <div className="flex gap-2 mb-4">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-[13px] font-semibold px-4 py-2 rounded-full border transition-colors ${
                  filter === f.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-[#131E2F] text-body-strong border-border hover:border-brand/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#131E2F]">
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">Nothing matches this filter.</div>
            ) : (
              filtered.map((r) => <ResponseRow key={r.id} r={r} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
