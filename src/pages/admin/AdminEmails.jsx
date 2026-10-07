import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Mail, Send, UserX, ShoppingCart, CalendarDays, History, Save, Loader2, AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Broadcast composer takes plain text — turn it into minimal safe HTML
// (paragraph breaks, plus one special case) rather than asking admins to
// hand-write HTML. A paragraph containing only `[Button label](https://url)`
// renders as the same purple CTA button style used elsewhere in the app's
// transactional emails, instead of becoming a plain paragraph with a link.
const BUTTON_LINE_RE = /^\[(.+?)\]\((https?:\/\/[^\s)]+)\)$/;

function plainTextToHtml(text) {
  return text
    .split(/\n{2,}/)
    .map((para) => {
      const match = para.trim().match(BUTTON_LINE_RE);
      if (match) {
        const [, label, url] = match;
        return `<div style="text-align:center;margin:24px 0;"><a href="${url}" style="display:inline-block;background:#264D73;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">${label}</a></div>`;
      }
      return `<p style="font-size:15px;color:#1F2C3D;line-height:1.6;margin:0 0 16px;">${para.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}

function AutomationToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 py-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-brand w-4 h-4 mt-0.5 flex-shrink-0"
      />
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-body">{description}</span>
      </span>
    </label>
  );
}

export default function AdminEmails() {
  const { showToast } = useOutletContext();

  const [emailSettings, setEmailSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [inactiveLoading, setInactiveLoading] = useState(true);
  const [emailLog, setEmailLog] = useState([]);
  const [emailLogLoading, setEmailLogLoading] = useState(true);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSegment, setBroadcastSegment] = useState('all');
  const [broadcastUseCustomRecipients, setBroadcastUseCustomRecipients] = useState(false);
  const [broadcastRecipientsInput, setBroadcastRecipientsInput] = useState('');
  const [sendingType, setSendingType] = useState(null); // 'broadcast' | 'winback' | 'abandoned_checkout' | 'cohort_reminder' | null
  const [error, setError] = useState('');

  const fetchEmailSettings = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.rpc('admin_get_email_settings');
      if (err) throw err;
      const row = data?.[0];
      if (row) setEmailSettings(row);
    } catch (err) {
      setError(err.message || 'Failed to load email settings.');
    }
  }, []);

  const fetchInactiveUsers = useCallback(async (days) => {
    setInactiveLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('admin_get_inactive_users', { p_days: days });
      if (err) throw err;
      setInactiveUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load inactive users.');
    } finally {
      setInactiveLoading(false);
    }
  }, []);

  const fetchEmailLog = useCallback(async () => {
    setEmailLogLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('admin_get_email_log', { p_limit: 20 });
      if (err) throw err;
      setEmailLog(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load email log.');
    } finally {
      setEmailLogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmailSettings();
    fetchEmailLog();
  }, [fetchEmailSettings, fetchEmailLog]);

  // Re-run the inactive-users lookup whenever the configured threshold
  // changes (loaded from settings, or edited by the admin).
  useEffect(() => {
    if (emailSettings?.winback_inactive_days) {
      fetchInactiveUsers(emailSettings.winback_inactive_days);
    }
  }, [emailSettings?.winback_inactive_days, fetchInactiveUsers]);

  const saveEmailSettings = async () => {
    if (!emailSettings) return;
    setSettingsSaving(true);
    try {
      const { error: err } = await supabase.rpc('admin_update_email_settings', {
        p_winback_inactive_days: emailSettings.winback_inactive_days,
        p_winback_automation_enabled: emailSettings.winback_automation_enabled,
        p_abandoned_checkout_automation_enabled: emailSettings.abandoned_checkout_automation_enabled,
        p_cohort_reminder_automation_enabled: emailSettings.cohort_reminder_automation_enabled,
      });
      if (err) throw err;
      showToast('Email settings saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  // All four of these hit a real send endpoint that emails actual students —
  // confirm before firing, same as the destructive testimonial-delete action.
  const invokeEmailFunction = async (fnName, body, confirmMessage, type) => {
    if (!window.confirm(confirmMessage)) return false;
    setSendingType(type);
    setError('');
    try {
      const { data, error: err } = await supabase.functions.invoke(fnName, { body: body || {} });
      if (err) throw err;
      showToast(`Sent to ${data?.sent ?? 0} of ${data?.matched ?? 0} matched recipients.`);
      fetchEmailLog();
      if (type === 'winback' && emailSettings) fetchInactiveUsers(emailSettings.winback_inactive_days);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to send.');
      return false;
    } finally {
      setSendingType(null);
    }
  };

  const sendBroadcastNow = async () => {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      setError('Subject and message are required for a broadcast.');
      return;
    }

    let body;
    let confirmMessage;
    if (broadcastUseCustomRecipients) {
      const recipients = [...new Set(
        broadcastRecipientsInput.split(/[,\n]/).map((e) => e.trim()).filter(Boolean),
      )];
      if (recipients.length === 0) {
        setError('Enter at least one email address.');
        return;
      }
      body = { subject: broadcastSubject, html: plainTextToHtml(broadcastBody), recipients };
      confirmMessage = `Send this to ${recipients.length} specific address${recipients.length === 1 ? '' : 'es'} right now? This cannot be undone.`;
    } else {
      const segmentLabel = { all: 'everyone', builder1: 'Builder 1 students', builder2: 'Builder 2 students', pro: 'Pro students' }[broadcastSegment];
      body = { subject: broadcastSubject, html: plainTextToHtml(broadcastBody), segment: broadcastSegment };
      confirmMessage = `Send this broadcast to ${segmentLabel} right now? This cannot be undone.`;
    }

    const ok = await invokeEmailFunction('send-broadcast-email', body, confirmMessage, 'broadcast');
    if (ok) {
      setBroadcastSubject('');
      setBroadcastBody('');
      setBroadcastRecipientsInput('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
          <Mail className="w-7 h-7 text-link" />
          Email Communications
        </h1>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Broadcast composer */}
        <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#131E2F] p-5">
          <h3 className="font-bold text-ink text-sm mb-3 flex items-center gap-1.5">
            <Send className="w-4 h-4 text-link" /> Send a broadcast
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <textarea
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder="Message body (plain text — blank lines start a new paragraph)"
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
            />
            <p className="text-xs text-gray-400 -mt-1.5">
              Tip: put <code className="font-mono">[Button label](https://url)</code> on its own line to render a purple CTA button there.
            </p>
            <label className="flex items-center gap-2 text-xs font-semibold text-body-strong cursor-pointer">
              <input
                type="checkbox"
                checked={broadcastUseCustomRecipients}
                onChange={(e) => setBroadcastUseCustomRecipients(e.target.checked)}
                className="accent-brand w-3.5 h-3.5"
              />
              Send to specific addresses instead of a segment
            </label>

            {broadcastUseCustomRecipients ? (
              <textarea
                value={broadcastRecipientsInput}
                onChange={(e) => setBroadcastRecipientsInput(e.target.value)}
                placeholder="Emails separated by commas or new lines — e.g. a test batch before a full segment send"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
              />
            ) : null}

            <div className="flex items-center gap-2 flex-wrap">
              {!broadcastUseCustomRecipients && (
                <select
                  value={broadcastSegment}
                  onChange={(e) => setBroadcastSegment(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  <option value="all">Everyone</option>
                  <option value="builder1">Builder 1 students</option>
                  <option value="builder2">Builder 2 students</option>
                  <option value="pro">Pro students</option>
                </select>
              )}
              <button
                onClick={sendBroadcastNow}
                disabled={sendingType === 'broadcast'}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-40 text-white transition-colors ml-auto"
              >
                {sendingType === 'broadcast' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send now
              </button>
            </div>
          </div>
        </div>

        {/* Automation settings */}
        <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#131E2F] p-5">
          <h3 className="font-bold text-ink text-sm mb-1 flex items-center gap-1.5">
            <UserX className="w-4 h-4 text-link" /> Win-back &amp; automation
          </h3>
          <p className="text-xs text-body mb-3">
            {inactiveLoading ? 'Checking…' : `${inactiveUsers.length} student${inactiveUsers.length === 1 ? '' : 's'} currently inactive`}
            {emailSettings ? ` (${emailSettings.winback_inactive_days}+ days since last login)` : ''}
          </p>
          {emailSettings && (
            <>
              <label className="block text-xs font-semibold text-body-strong mb-1.5">Inactive threshold (days)</label>
              <input
                type="number"
                min={1}
                value={emailSettings.winback_inactive_days}
                onChange={(e) => setEmailSettings((s) => ({ ...s, winback_inactive_days: Number(e.target.value) || 1 }))}
                className="w-24 px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40 mb-2"
              />
              <div className="divide-y divide-border-soft border-t border-border-soft mt-1">
                <AutomationToggle
                  label="Automatic win-back emails"
                  description="Runs weekly (Mondays) for students inactive past the threshold above."
                  checked={emailSettings.winback_automation_enabled}
                  onChange={(v) => setEmailSettings((s) => ({ ...s, winback_automation_enabled: v }))}
                />
                <AutomationToggle
                  label="Automatic abandoned-checkout emails"
                  description="Runs daily for anyone who started checkout 2+ hours ago and never completed it."
                  checked={emailSettings.abandoned_checkout_automation_enabled}
                  onChange={(v) => setEmailSettings((s) => ({ ...s, abandoned_checkout_automation_enabled: v }))}
                />
                <AutomationToggle
                  label="Automatic cohort-start reminders"
                  description="Runs daily for students whose paid cohort starts within 3 days."
                  checked={emailSettings.cohort_reminder_automation_enabled}
                  onChange={(v) => setEmailSettings((s) => ({ ...s, cohort_reminder_automation_enabled: v }))}
                />
              </div>
              <button
                onClick={saveEmailSettings}
                disabled={settingsSaving}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-40 text-white transition-colors mt-3"
              >
                {settingsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save settings
              </button>
            </>
          )}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-soft">
            <button
              onClick={() => invokeEmailFunction('send-winback-emails', {}, `Send a win-back email to ${inactiveUsers.length} inactive student${inactiveUsers.length === 1 ? '' : 's'} right now?`, 'winback')}
              disabled={!!sendingType || inactiveUsers.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#F6F8FB] dark:bg-white/5 text-body-strong hover:bg-[#E8EDF3] dark:hover:bg-brand/15 hover:text-link transition-colors disabled:opacity-40"
            >
              {sendingType === 'winback' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
              Send win-back now
            </button>
            <button
              onClick={() => invokeEmailFunction('send-abandoned-checkout-emails', {}, 'Send abandoned-checkout reminders to everyone currently eligible?', 'abandoned_checkout')}
              disabled={!!sendingType}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#F6F8FB] dark:bg-white/5 text-body-strong hover:bg-[#E8EDF3] dark:hover:bg-brand/15 hover:text-link transition-colors disabled:opacity-40"
            >
              {sendingType === 'abandoned_checkout' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
              Send abandoned-checkout now
            </button>
            <button
              onClick={() => invokeEmailFunction('send-cohort-reminder-emails', {}, 'Send cohort-start reminders to everyone currently eligible?', 'cohort_reminder')}
              disabled={!!sendingType}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#F6F8FB] dark:bg-white/5 text-body-strong hover:bg-[#E8EDF3] dark:hover:bg-brand/15 hover:text-link transition-colors disabled:opacity-40"
            >
              {sendingType === 'cohort_reminder' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-3.5 h-3.5" />}
              Send cohort reminder now
            </button>
          </div>
        </div>
      </div>

      {/* Email log */}
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-link" />
        <h3 className="font-bold text-ink text-sm">Recent sends</h3>
      </div>
      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#131E2F]">
        {emailLogLoading ? (
          <div className="px-5 py-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-link mx-auto" />
          </div>
        ) : emailLog.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No emails sent yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F6F8FB] dark:bg-white/5 border-b border-border-soft">
                  <th className="text-left px-5 py-2.5 text-xs font-bold text-body uppercase tracking-wider">Recipient</th>
                  <th className="text-left px-5 py-2.5 text-xs font-bold text-body uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-2.5 text-xs font-bold text-body uppercase tracking-wider">Subject</th>
                  <th className="text-left px-5 py-2.5 text-xs font-bold text-body uppercase tracking-wider">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {emailLog.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-2.5 text-body-strong">{e.email}</td>
                    <td className="px-5 py-2.5 text-body capitalize">{e.email_type.replace('_', ' ')}</td>
                    <td className="px-5 py-2.5 text-body truncate max-w-[240px]">{e.subject}</td>
                    <td className="px-5 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(e.sent_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
