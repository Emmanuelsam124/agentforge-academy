import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CalendarDays, Save, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function CohortDateRow({ label, value, onChange, onSave, saving }) {
  return (
    <div className="flex items-center gap-3 flex-wrap px-5 py-4 border-b border-border-soft last:border-b-0">
      <span className="font-semibold text-ink text-sm w-28 flex-shrink-0">{label}</span>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
      />
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-40 text-white transition-colors"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save
      </button>
      {value && (
        <span className="text-xs text-body">
          Shown to students as: <strong>{new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
        </span>
      )}
    </div>
  );
}

export default function AdminCohorts() {
  const { showToast } = useOutletContext();
  const [cohortDates, setCohortDates] = useState({ builder1: '', builder2: '', vibecoding: '', aimastery: '' });
  const [cohortSaving, setCohortSaving] = useState(null);
  const [error, setError] = useState('');

  const fetchCohortSchedule = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.from('cohort_schedule').select('tier, start_date');
      if (err) throw err;
      const next = { builder1: '', builder2: '', vibecoding: '', aimastery: '' };
      for (const row of data || []) {
        next[row.tier] = row.start_date || '';
      }
      setCohortDates(next);
    } catch (err) {
      setError(err.message || 'Failed to load cohort schedule.');
    }
  }, []);

  useEffect(() => {
    fetchCohortSchedule();
  }, [fetchCohortSchedule]);

  const saveCohortDate = async (tier) => {
    setCohortSaving(tier);
    try {
      const { error: err } = await supabase
        .from('cohort_schedule')
        .update({ start_date: cohortDates[tier] || null })
        .eq('tier', tier);
      if (err) throw err;
      const tierLabels = { builder1: 'Builder 1', builder2: 'Builder 2', vibecoding: 'Vibe Coding', aimastery: 'AI Agent Mastery' };
      showToast(`${tierLabels[tier] || tier} cohort date saved.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCohortSaving(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
          <CalendarDays className="w-7 h-7 text-link" />
          Cohort Schedule
        </h1>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#131E2F] mb-4">
        <CohortDateRow
          label="Builder 1"
          value={cohortDates.builder1}
          onChange={(v) => setCohortDates((prev) => ({ ...prev, builder1: v }))}
          onSave={() => saveCohortDate('builder1')}
          saving={cohortSaving === 'builder1'}
        />
        <CohortDateRow
          label="Builder 2"
          value={cohortDates.builder2}
          onChange={(v) => setCohortDates((prev) => ({ ...prev, builder2: v }))}
          onSave={() => saveCohortDate('builder2')}
          saving={cohortSaving === 'builder2'}
        />
        <CohortDateRow
          label="Vibe Coding"
          value={cohortDates.vibecoding}
          onChange={(v) => setCohortDates((prev) => ({ ...prev, vibecoding: v }))}
          onSave={() => saveCohortDate('vibecoding')}
          saving={cohortSaving === 'vibecoding'}
        />
        <CohortDateRow
          label="AI Agent Mastery"
          value={cohortDates.aimastery}
          onChange={(v) => setCohortDates((prev) => ({ ...prev, aimastery: v }))}
          onSave={() => saveCohortDate('aimastery')}
          saving={cohortSaving === 'aimastery'}
        />
      </div>
      <p className="text-xs text-gray-400 mb-2">
        Clear a date and save to hide it. Builder 1/Builder 2 are permanent, guides-only products now (no live
        cohort) — their dates here no longer show anywhere public. Vibe Coding and AI Agent Mastery still
        show theirs on their own pricing page.
      </p>
    </div>
  );
}
