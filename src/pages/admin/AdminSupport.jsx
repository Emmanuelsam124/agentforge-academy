import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  LifeBuoy, CheckCircle2, Loader2, AlertCircle, Send, ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function formatWhen(iso) {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

const WINDOW_MS = 24 * 60 * 60 * 1000;

// WhatsApp only accepts a free-form reply within 24h of the customer's last
// message. Work it out here so the composer can say so up front rather than
// letting the send fail against Meta.
function replyWindow(messages) {
  const lastInbound = [...messages].reverse().find((m) => m.direction === 'inbound');
  if (!lastInbound) return { open: false, hoursLeft: 0 };
  const msLeft = WINDOW_MS - (Date.now() - new Date(lastInbound.created_at).getTime());
  return { open: msLeft > 0, hoursLeft: Math.max(0, Math.floor(msLeft / 3600_000)) };
}

function Thread({ phone, onSent }) {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('admin_get_whatsapp_thread', { phone }).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message);
      else setMessages(data || []);
    });
    return () => { cancelled = true; };
  }, [phone]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError('');
    try {
      const { data, error: err } = await supabase.functions.invoke('whatsapp-send-reply', {
        body: { phone, body },
      });
      if (err) throw err;
      if (data?.error) throw new Error(data.error);

      setMessages((prev) => [
        ...(prev || []),
        { direction: 'outbound', body, created_at: new Date().toISOString() },
      ]);
      setDraft('');
      onSent?.();
    } catch (err) {
      setError(err.message || 'Could not send that.');
    } finally {
      setSending(false);
    }
  };

  if (error && !messages) return <p className="text-xs text-rose px-1 py-2">{error}</p>;
  if (!messages) return <Loader2 className="w-4 h-4 animate-spin text-link my-3" />;

  const { open, hoursLeft } = replyWindow(messages);

  return (
    <div className="mt-3">
      {messages.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">No messages logged.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                m.direction === 'inbound'
                  ? 'self-start bg-[#F6F8FB] dark:bg-white/5 text-ink'
                  : 'self-end bg-[#EAFAF1] dark:bg-green/10 text-ink'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
              <span className="block text-[10px] text-gray-400 mt-1">{formatWhen(m.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
            }}
            rows={3}
            placeholder="Reply as Social Dev Technologies…"
            disabled={sending}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#131E2F] focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none disabled:opacity-50"
          />
          <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
            <span className="text-[11px] text-gray-400">
              Sends from your business number · {hoursLeft}h left in WhatsApp&apos;s reply window
            </span>
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#25D366] text-white hover:brightness-95 transition-colors disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Send
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10 rounded-lg px-3 py-2">
          WhatsApp&apos;s 24-hour reply window has closed for this contact. You can email them, or
          wait for them to message again.
        </p>
      )}

      {error && <p className="text-xs text-rose mt-2">{error}</p>}
    </div>
  );
}

function EscalationRow({ e, actionLoading, expanded, onToggle, onResolve }) {
  return (
    <div className="px-5 py-4 border-b border-border-soft last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-ink text-sm">{e.contact_name || 'Unknown'}</span>
            <span className="text-[11px] text-gray-500">+{e.wa_phone}</span>
            {e.status === 'open' ? (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                Needs reply
              </span>
            ) : (
              <span className="text-[11px] font-bold text-green bg-[#EAFAF1] dark:bg-green/10 px-2 py-0.5 rounded-full">
                Resolved
              </span>
            )}
            <span className="text-[11px] text-gray-400">{formatWhen(e.created_at)}</span>
          </div>

          <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">{e.question}</p>
          {e.reason && (
            <p className="text-xs text-gray-500 mt-1.5 italic">Handed off because: {e.reason}</p>
          )}

          <button
            onClick={() => onToggle(e.id)}
            className="flex items-center gap-1 text-xs font-semibold text-link mt-2 hover:underline"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Hide conversation' : 'Open conversation & reply'}
          </button>
          {expanded && <Thread phone={e.wa_phone} />}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {e.status === 'open' && (
            <button
              onClick={() => onResolve(e.id)}
              disabled={!!actionLoading}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#F6F8FB] dark:bg-white/5 text-body-strong hover:bg-[#E8EDF3] dark:hover:bg-brand/15 hover:text-link transition-colors disabled:opacity-40"
            >
              {actionLoading === e.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <><CheckCircle2 className="w-3 h-3" /> Done</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSupport() {
  const { showToast } = useOutletContext();
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('open');
  const [error, setError] = useState('');

  const fetchEscalations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('admin_list_whatsapp_escalations', {
        status_filter: filter,
      });
      if (err) throw err;
      setEscalations(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load support queue.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEscalations();
  }, [fetchEscalations]);

  const resolve = async (id) => {
    setActionLoading(id);
    try {
      const { error: err } = await supabase.rpc('admin_resolve_whatsapp_escalation', {
        escalation_id: id,
      });
      if (err) throw err;
      setEscalations((prev) =>
        filter === 'open' ? prev.filter((e) => e.id !== id)
          : prev.map((e) => (e.id === id ? { ...e, status: 'resolved' } : e))
      );
      showToast('Marked as handled.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
          <LifeBuoy className="w-7 h-7 text-link" />
          WhatsApp Support
        </h1>
        <div className="flex items-center gap-1 rounded-lg bg-[#F6F8FB] dark:bg-white/5 p-1">
          {['open', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md capitalize transition-colors ${
                filter === f ? 'bg-white dark:bg-white/10 text-link shadow-sm' : 'text-body hover:text-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#131E2F]">
        {loading ? (
          <div className="px-5 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-link mx-auto" />
          </div>
        ) : escalations.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">
            {filter === 'open' ? 'Nothing waiting on you — the agent is handling everything.' : 'No resolved items yet.'}
          </div>
        ) : (
          escalations.map((e) => (
            <EscalationRow
              key={e.id}
              e={e}
              actionLoading={actionLoading}
              expanded={expandedId === e.id}
              onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
              onResolve={resolve}
            />
          ))
        )}
      </div>
    </div>
  );
}
