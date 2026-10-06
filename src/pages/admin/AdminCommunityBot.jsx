import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Bot, Loader2, AlertCircle, Sparkles, LifeBuoy, CheckCircle2, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { invokeWithRetry } from '../../lib/invokeFunction';

const MAX_INSTRUCTIONS = 1000;

const TICKET_TABS = [
  { id: 'open', label: 'Open' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
];

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const cardClass = 'rounded-2xl border border-border-soft bg-white dark:bg-[#181818] p-5 sm:p-6';
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40';

function Switch({ label, hint, on, busy, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <p className="font-bold text-ink">{label}</p>
        <p className="text-[13px] text-body">{hint}</p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onToggle}
        className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-colors disabled:opacity-60 ${
          on ? 'bg-[#FDEEF4] text-rose hover:bg-rose/20' : 'bg-brand text-white hover:bg-brand-deep'
        }`}
      >
        {busy ? 'Saving…' : on ? 'Turn off' : 'Turn on'}
      </button>
    </div>
  );
}

// Community assistant. Two independent jobs (settings in community_bot_settings; the
// replies themselves are written by the community-welcome Edge Function):
//  - Welcome: a student's first message in a room gets a short welcome from Gemini.
//  - Support: a message asking for help gets "someone will respond" and becomes a
//    ticket below. The assistant never tries to solve the problem.
export default function AdminCommunityBot() {
  const { showToast } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [supportEnabled, setSupportEnabled] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [stats, setStats] = useState({ total: 0, recent: [], openTickets: 0 });

  const [ticketTab, setTicketTab] = useState('open');
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketBusy, setTicketBusy] = useState(null);

  const [previewMessage, setPreviewMessage] = useState('Hi, I paid yesterday but I still cannot see my course. Please help.');
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('admin_get_community_bot').then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message || 'Failed to load settings.');
      else if (data) {
        setEnabled(!!data.enabled);
        setSupportEnabled(!!data.support_enabled);
        setTestMode(!!data.test_mode);
        setInstructions(data.extra_instructions || '');
        setStats({ total: data.total_welcomes ?? 0, recent: data.recent || [], openTickets: data.open_tickets ?? 0 });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('admin_list_community_tickets', { p_status: ticketTab }).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message || 'Failed to load tickets.');
      else setTickets(data || []);
      setTicketsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ticketTab]);

  const pickTicketTab = (id) => {
    if (id === ticketTab) return;
    setTicketsLoading(true);
    setTicketTab(id);
  };

  const save = async (next = {}) => {
    const nextEnabled = next.enabled ?? enabled;
    const nextSupport = next.supportEnabled ?? supportEnabled;
    const nextTest = next.testMode ?? testMode;
    setSaving(true);
    setError('');
    const { error: err } = await supabase.rpc('admin_set_community_bot', {
      p_enabled: nextEnabled,
      p_support_enabled: nextSupport,
      p_test_mode: nextTest,
      p_instructions: instructions,
    });
    if (err) setError(err.message || 'Could not save.');
    else {
      setEnabled(nextEnabled);
      setSupportEnabled(nextSupport);
      setTestMode(nextTest);
      showToast('Saved.');
    }
    setSaving(false);
  };

  const runPreview = async () => {
    setPreviewing(true);
    setPreview(null);
    setError('');
    const { data, error: err } = await invokeWithRetry('community-welcome', {
      body: { preview: { message: previewMessage, channel: 'General', name: 'Amaka', instructions } },
    });
    if (err || !data?.text) setError('Could not generate a preview.');
    else setPreview(data);
    setPreviewing(false);
  };

  const setTicketStatus = async (ticket, status) => {
    setTicketBusy(ticket.id);
    setError('');
    const { error: err } = await supabase.rpc('admin_set_community_ticket_status', { p_id: ticket.id, p_status: status });
    if (err) setError(err.message || 'Could not update the ticket.');
    else {
      setTickets((prev) =>
        prev
          .map((t) => (t.id === ticket.id ? { ...t, status, resolved_at: status === 'resolved' ? new Date().toISOString() : null } : t))
          .filter((t) => ticketTab === 'all' || t.status === ticketTab),
      );
      setStats((s) => ({ ...s, openTickets: Math.max(0, s.openTickets + (status === 'resolved' ? -1 : 1)) }));
    }
    setTicketBusy(null);
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
          “Social Dev Assistant” can welcome students on their first message and acknowledge anyone asking for help — it
          tells them someone will respond and logs a ticket here for you. It never tries to solve a problem, and never
          mentions prices, access or deadlines.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <div className={`${cardClass} space-y-5`}>
        <Switch
          label="Support tickets"
          hint={supportEnabled ? 'On — help requests get “someone will respond” and a ticket below.' : 'Off — help requests are not picked up.'}
          on={supportEnabled}
          busy={saving}
          onToggle={() => save({ supportEnabled: !supportEnabled })}
        />
        <div className="border-t border-border-soft" />
        <Switch
          label="Welcome new students"
          hint={enabled ? 'On — first messages in each room get a welcome.' : 'Off — no welcomes.'}
          on={enabled}
          busy={saving}
          onToggle={() => save({ enabled: !enabled })}
        />
        <div className="border-t border-border-soft" />
        <Switch
          label="Test mode"
          hint={testMode ? 'On — your own (staff) messages are treated like a student’s, so you can try it. Turn off when done.' : 'Off — staff messages are ignored.'}
          on={testMode}
          busy={saving}
          onToggle={() => save({ testMode: !testMode })}
        />
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <p className="font-bold text-ink flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-brand" /> Support tickets
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
              {stats.openTickets} open
            </span>
          </p>
          <div className="flex gap-1.5">
            {TICKET_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTicketTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold transition-colors ${
                  ticketTab === t.id ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand' : 'text-body hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {ticketsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-brand" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-[13px] text-body">No tickets here.</p>
        ) : (
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-xl border border-border-soft p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-bold text-ink text-[14px]">
                      {t.student_name || 'Student'}
                      <span className="font-normal text-body"> · {t.channel_name || t.channel_id}</span>
                    </p>
                    {t.student_email && <p className="text-[12px] text-gray-400 break-all">{t.student_email}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-bold text-brand bg-[#F3EBFF] dark:bg-brand/15 px-2.5 py-1 rounded-full capitalize">
                      {t.category}
                    </span>
                    <span className="text-[12px] text-gray-400">{fmtDate(t.created_at)}</span>
                  </div>
                </div>
                {t.summary && <p className="text-[13px] font-semibold text-body-strong mt-2">{t.summary}</p>}
                <p className="text-[13px] text-body mt-1 whitespace-pre-wrap break-words">“{t.body}”</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Link
                    to="/dashboard/community"
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Reply in {t.channel_name || 'community'}
                  </Link>
                  {t.status === 'open' ? (
                    <button
                      type="button"
                      disabled={ticketBusy === t.id}
                      onClick={() => setTicketStatus(t, 'resolved')}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-green hover:underline disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark resolved
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={ticketBusy === t.id}
                      onClick={() => setTicketStatus(t, 'open')}
                      className="text-[12.5px] font-bold text-body hover:underline disabled:opacity-60"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${cardClass} space-y-3`}>
        <label htmlFor="bot-instructions" className="block font-bold text-ink">
          Extra guidance <span className="font-normal text-body">(optional)</span>
        </label>
        <p className="text-[13px] text-body">
          Anything you'd like it to keep in mind — for example “end welcomes by inviting them to share what they're building.”
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
        <p className="text-[13px] text-body">See what it would do with a sample message. Nothing is posted and no ticket is created.</p>
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
          onClick={runPreview}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold border border-brand text-brand hover:bg-[#F3EBFF] dark:hover:bg-brand/15 disabled:opacity-60"
        >
          {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {previewing ? 'Working…' : 'Preview'}
        </button>
        {preview && (
          <div className="space-y-2 text-[13.5px]">
            <div className="rounded-xl bg-[#FAF8FF] dark:bg-white/5 border border-border-soft px-4 py-3 text-body-strong">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">If it's their first message and not a help request</span>
              <span className="font-bold text-ink">Social Dev Assistant: </span>{preview.text}
            </div>
            <div className="rounded-xl bg-[#FAF8FF] dark:bg-white/5 border border-border-soft px-4 py-3 text-body-strong">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Support check</span>
              {!preview.support ? (
                'Gemini was unavailable — a real message like this would be logged as a ticket for you to review, with no reply posted.'
              ) : preview.support.is_support ? (
                <>
                  Ticket ({preview.support.category}): {preview.support.summary}
                  <br />
                  <span className="font-bold text-ink">Social Dev Assistant: </span>{preview.support.reply}
                </>
              ) : (
                'Not a help request — no ticket, and it would be welcomed (if first message and welcome is on).'
              )}
            </div>
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
