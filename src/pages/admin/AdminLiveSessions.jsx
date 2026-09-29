import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Video, Save, Trash2, Loader2, AlertCircle, Pencil, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const emptyForm = { id: null, tier: 'builder1', title: '', description: '', session_date: '', join_link: '', recording_url: '', recording_passcode: '', resourcesText: '', topicsText: '' };

// Resources are edited as plain text, one per line ("Title | https://url"),
// and parsed to/from the jsonb array `live_sessions.resources` stores —
// same lightweight text<->structured-data convention AdminGuides.jsx uses
// for its body_blocks, rather than a dynamic add/remove-row form.
function resourcesToText(resources) {
  if (!Array.isArray(resources)) return '';
  return resources.map((r) => `${r.title} | ${r.url}`).join('\n');
}

function textToResources(text) {
  const rows = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, url] = line.split('|').map((s) => s.trim());
      return title && url ? { title, url } : null;
    })
    .filter(Boolean);
  return rows.length > 0 ? rows : null;
}

// Topics — one per line, no structure needed beyond that.
function topicsToText(topics) {
  return Array.isArray(topics) ? topics.join('\n') : '';
}

function textToTopics(text) {
  const rows = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return rows.length > 0 ? rows : null;
}

// Converts a Postgres timestamptz into the value <input type="datetime-local">
// expects (local time, no timezone/seconds) and back.
function toLocalInputValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSessionDate(isoString) {
  return new Date(isoString).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

const TIER_LABELS = { builder1: 'Builder 1', builder2: 'Builder 2', vibecoding: 'Vibe Coding', aimastery: 'AI Agent Mastery' };

export default function AdminLiveSessions() {
  const { showToast } = useOutletContext();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('admin_list_live_sessions');
      if (err) throw err;
      setSessions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleEdit = (session) => {
    setForm({
      id: session.id,
      tier: session.tier,
      title: session.title,
      description: session.description || '',
      session_date: toLocalInputValue(session.session_date),
      join_link: session.join_link || '',
      recording_url: session.recording_url || '',
      recording_passcode: session.recording_passcode || '',
      resourcesText: resourcesToText(session.resources),
      topicsText: topicsToText(session.topics),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.session_date) {
      setError('Title and date/time are required.');
      return;
    }
    setSaving(true);
    try {
      const { error: err } = await supabase.rpc('admin_upsert_live_session', {
        p_id: form.id,
        p_tier: form.tier,
        p_title: form.title.trim(),
        p_description: form.description.trim() || null,
        p_session_date: new Date(form.session_date).toISOString(),
        p_join_link: form.join_link.trim() || null,
        p_recording_url: form.recording_url.trim() || null,
        p_recording_passcode: form.recording_passcode.trim() || null,
        p_resources: textToResources(form.resourcesText),
        p_topics: textToTopics(form.topicsText),
      });
      if (err) throw err;
      showToast(form.id ? 'Session updated.' : 'Session created.');
      setForm(emptyForm);
      fetchSessions();
    } catch (err) {
      setError(err.message || 'Could not save this session.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session permanently?')) return;
    setDeletingId(id);
    try {
      const { error: err } = await supabase.rpc('admin_delete_live_session', { p_id: id });
      if (err) throw err;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast('Session deleted.');
      if (form.id === id) setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3 mb-5">
        <Video className="w-7 h-7 text-brand" /> Live Sessions
      </h1>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] p-5 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink text-sm">{form.id ? 'Edit session' : 'Add a session'}</h3>
          {form.id && (
            <button type="button" onClick={() => setForm(emptyForm)} className="text-xs font-semibold text-body hover:text-ink flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancel edit
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <select
            value={form.tier}
            onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="builder1">Builder 1</option>
            <option value="builder2">Builder 2</option>
            <option value="vibecoding">Vibe Coding</option>
            <option value="aimastery">AI Agent Mastery</option>
          </select>
          <input
            type="datetime-local"
            value={form.session_date}
            onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Session title"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
        />
        <input
          type="url"
          value={form.join_link}
          onChange={(e) => setForm((f) => ({ ...f, join_link: e.target.value }))}
          placeholder="Join link (Zoom/Meet URL)"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <input
          type="url"
          value={form.recording_url}
          onChange={(e) => setForm((f) => ({ ...f, recording_url: e.target.value }))}
          placeholder="Recording URL — paste in once the session has happened, to publish it as a replay"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <input
          type="text"
          value={form.recording_passcode}
          onChange={(e) => setForm((f) => ({ ...f, recording_passcode: e.target.value }))}
          placeholder="Recording passcode (optional) — from Zoom's Share dialog, not the sharing-info text block"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <textarea
          value={form.topicsText}
          onChange={(e) => setForm((f) => ({ ...f, topicsText: e.target.value }))}
          placeholder={'Topics (optional) — one per line'}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
        />
        <textarea
          value={form.resourcesText}
          onChange={(e) => setForm((f) => ({ ...f, resourcesText: e.target.value }))}
          placeholder={'Resources (optional) — one per line, "Title | https://url"\ne.g. Slide deck | https://docs.google.com/...'}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none font-mono"
        />

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-40 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {form.id ? 'Save changes' : 'Add session'}
        </button>
      </form>

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
        {loading ? (
          <div className="px-5 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">No sessions yet.</div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-soft last:border-b-0 flex-wrap">
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">
                  {s.title} <span className="text-xs font-normal text-gray-400">· {TIER_LABELS[s.tier] || s.tier}</span>
                </p>
                <p className="text-xs text-body">
                  {formatSessionDate(s.session_date)}
                  {s.join_link && ' · has join link'}
                  {s.recording_url && ' · has replay'}
                  {s.recording_passcode && ' · has passcode'}
                  {s.resources?.length > 0 && ` · ${s.resources.length} resource${s.resources.length === 1 ? '' : 's'}`}
                  {s.topics?.length > 0 && ` · ${s.topics.length} topic${s.topics.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(s)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose transition-colors disabled:opacity-40"
                >
                  {deletingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
