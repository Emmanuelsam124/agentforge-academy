import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bot, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { invokeWithRetry } from '../../lib/invokeFunction';

const MAX_INSTRUCTIONS = 1000;

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const cardClass = 'rounded-2xl border border-border-soft bg-white dark:bg-[#181818] p-5 sm:p-6';
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40';

// Community welcome assistant. When a student posts their FIRST message in a
// community room, Gemini replies with a short welcome and encouragement as the
// "Social Dev Assistant" account (once per student per room). It doesn't answer
// questions otherwise. Settings live in community_bot_settings; the reply itself is
// written by the community-welcome Edge Function (supabase/community-welcome-bot.sql).
export default function AdminCommunityBot() {
  const { showToast } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [stats, setStats] = useState({ total: 0, recent: [] });

  const [previewMessage, setPreviewMessage] = useState('Hi everyone, just joined today. Excited to start building!');
  const [previewing, setPreviewing] = useState(false);
  const [previewText, setPreviewText] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('admin_get_community_bot').then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message || 'Failed to load settings.');
      else if (data) {
        setEnabled(!!data.enabled);
        setInstructions(data.extra_instructions || '');
        setStats({ total: data.total_welcomes ?? 0, recent: data.recent || [] });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (nextEnabled = enabled) => {
    setSaving(true);
    setError('');
    const { error: err } = await supabase.rpc('admin_set_community_bot', {
      p_enabled: nextEnabled,
      p_instructions: instructions,
    });
    if (err) setError(err.message || 'Could not save.');
    else {
      setEnabled(nextEnabled);
      showToast(nextEnabled ? 'Saved — the assistant is on.' : 'Saved — the assistant is off.');
    }
    setSaving(false);
  };

  const preview = async () => {
    setPreviewing(true);
    setPreviewText('');
    setError('');
    const { data, error: err } = await invokeWithRetry('community-welcome', {
      body: { preview: { message: previewMessage, channel: 'General', name: 'Amaka', instructions } },
    });
    if (err || !data?.text) setError('Could not generate a preview.');
    else setPreviewText(data.text);
    setPreviewing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-ink flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-brand" /> Community assistant
        </h1>
        <p className="text-sm text-body mt-1.5 max-w-2xl">
          When a student posts their first message in a community room, Gemini replies with a short welcome and
          encouragement as “Social Dev Assistant” — once per student per room, in every room. It doesn't answer
          questions otherwise, and it never mentions prices, access or deadlines.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <div className={cardClass}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-bold text-ink">Welcome new students</p>
            <p className="text-[13px] text-body">
              {enabled ? 'On — new students are welcomed automatically.' : 'Off — nothing is posted.'}
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(!enabled)}
            className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-colors disabled:opacity-60 ${
              enabled ? 'bg-[#FDEEF4] text-rose hover:bg-rose/20' : 'bg-brand text-white hover:bg-brand-deep'
            }`}
          >
            {saving ? 'Saving…' : enabled ? 'Turn off' : 'Turn on'}
          </button>
        </div>
      </div>

      <div className={`${cardClass} space-y-3`}>
        <label htmlFor="bot-instructions" className="block font-bold text-ink">
          Extra guidance <span className="font-normal text-body">(optional)</span>
        </label>
        <p className="text-[13px] text-body">
          Anything you'd like it to keep in mind — for example “always end by inviting them to share what they're building.”
        </p>
        <textarea
          id="bot-instructions"
          rows={4}
          maxLength={MAX_INSTRUCTIONS}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className={inputClass}
        />
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-gray-400">{instructions.length}/{MAX_INSTRUCTIONS}</span>
          <button
            type="button"
            disabled={saving}
            onClick={() => save()}
            className="px-5 py-2.5 rounded-xl text-sm font-extrabold bg-brand hover:bg-brand-deep text-white disabled:opacity-60"
          >
            Save guidance
          </button>
        </div>
      </div>

      <div className={`${cardClass} space-y-3`}>
        <p className="font-bold text-ink flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand" /> Try it</p>
        <p className="text-[13px] text-body">See what it would say to a sample first message. Nothing is posted.</p>
        <textarea
          rows={2}
          maxLength={300}
          value={previewMessage}
          onChange={(e) => setPreviewMessage(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          disabled={previewing || !previewMessage.trim()}
          onClick={preview}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold border border-brand text-brand hover:bg-[#F3EBFF] dark:hover:bg-brand/15 disabled:opacity-60"
        >
          {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {previewing ? 'Writing…' : 'Preview reply'}
        </button>
        {previewText && (
          <div className="rounded-xl bg-[#FAF8FF] dark:bg-white/5 border border-border-soft px-4 py-3 text-[13.5px] text-body-strong">
            <span className="font-bold text-ink">Social Dev Assistant: </span>{previewText}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <p className="font-bold text-ink mb-3">Welcomes sent: {stats.total}</p>
        {stats.recent.length === 0 ? (
          <p className="text-[13px] text-body">None yet.</p>
        ) : (
          <ul className="divide-y divide-border-soft text-[13px]">
            {stats.recent.map((r) => (
              <li key={`${r.created_at}-${r.student}`} className="flex items-center justify-between gap-3 py-2">
                <span className="text-body-strong truncate">{r.student || 'Student'} · {r.channel_id}</span>
                <span className="text-gray-400 flex-shrink-0">{fmtDate(r.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
