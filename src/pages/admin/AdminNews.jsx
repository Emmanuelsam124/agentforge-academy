import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Newspaper, CheckCircle2, XCircle, Trash2, Loader2, AlertCircle, Send, Pencil, ExternalLink, Share2,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { departments } from '../../data/departments';
import SharePanel from '../../components/admin/SharePanel';
import ImageUploadField from '../../components/admin/ImageUploadField';

import EmojiIcon from '../../components/EmojiIcon';
// body_blocks <-> plain text, same spirit as AdminEmails.jsx's
// plainTextToHtml — admins edit plain text, not a raw block-JSON editor.
// "## " starts a heading, "> " a quote, a run of "- " lines a list,
// anything else a paragraph; blocks are separated by a blank line.
function blocksToText(blocks) {
  return (blocks || [])
    .map((b) => {
      if (b.type === 'heading') return `## ${b.text}`;
      if (b.type === 'quote') return `> ${b.text}`;
      if (b.type === 'list') return (b.items || []).map((i) => `- ${i}`).join('\n');
      return b.text;
    })
    .join('\n\n');
}

function textToBlocks(text) {
  return text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith('## ')) return { type: 'heading', text: chunk.slice(3).trim() };
      if (chunk.startsWith('> ')) return { type: 'quote', text: chunk.slice(2).trim() };
      const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0 && lines.every((l) => l.startsWith('- '))) {
        return { type: 'list', items: lines.map((l) => l.slice(2).trim()) };
      }
      return { type: 'paragraph', text: chunk.replace(/\n/g, ' ') };
    });
}

function EditForm({ draft, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(draft.title);
  const [dek, setDek] = useState(draft.dek);
  const [bodyText, setBodyText] = useState(blocksToText(draft.body_blocks));
  const [departmentIds, setDepartmentIds] = useState(draft.department_ids || []);
  const [relatedAgentSlug, setRelatedAgentSlug] = useState(draft.related_agent_slug || '');
  const [relatedAgentTier, setRelatedAgentTier] = useState(draft.related_agent_tier || 'builder1');
  const [imageUrl, setImageUrl] = useState(draft.image_url || '');

  const toggleDept = (id) => {
    setDepartmentIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  return (
    <div className="px-5 py-4 bg-[#F6F8FB] dark:bg-white/5 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
      />
      <input
        type="text"
        value={dek}
        onChange={(e) => setDek(e.target.value)}
        placeholder="One-sentence dek (meta description + digest blurb)"
        className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
      />
      {draft.is_full_article && (
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={8}
          placeholder="Body — blank line between blocks. '## ' for a heading, '> ' for a quote, lines starting '- ' for a list, anything else is a paragraph."
          className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40 font-mono resize-y"
        />
      )}
      <div className="flex flex-wrap gap-1.5">
        {departments.filter((d) => d.id !== 'all').map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => toggleDept(d.id)}
            className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
              departmentIds.includes(d.id) ? 'border-transparent' : 'border-border-soft text-gray-400 opacity-50'
            }`}
            style={departmentIds.includes(d.id) ? { background: `${d.color}1A`, color: d.color } : {}}
          >
            <EmojiIcon emoji={d.icon} className="inline-block w-3.5 h-3.5 align-[-2px]" /> {d.name}
          </button>
        ))}
      </div>
      <ImageUploadField
        value={imageUrl}
        onChange={setImageUrl}
        slug={draft.slug}
        placeholder="Image URL — upload one, paste a link, or leave blank for no image"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={relatedAgentSlug}
          onChange={(e) => setRelatedAgentSlug(e.target.value)}
          placeholder="Related agent slug (optional — leave blank for none)"
          className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <select
          value={relatedAgentTier}
          onChange={(e) => setRelatedAgentTier(e.target.value)}
          disabled={!relatedAgentSlug}
          className="px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-40"
        >
          <option value="builder1">Builder 1</option>
          <option value="builder2">Builder 2</option>
        </select>
      </div>
      <div className="flex items-center gap-2 justify-end pt-1">
        <button onClick={onCancel} className="text-xs font-semibold px-3 py-2 rounded-lg text-body-strong hover:bg-white dark:hover:bg-white/5 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onSave({
            title,
            dek,
            body_blocks: draft.is_full_article ? textToBlocks(bodyText) : [],
            department_ids: departmentIds,
            related_agent_slug: relatedAgentSlug.trim() || null,
            related_agent_tier: relatedAgentSlug.trim() ? relatedAgentTier : null,
            image_url: imageUrl.trim() || null,
          })}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-40 text-white transition-colors"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );
}

function DraftRow({ draft, actionLoading, editingId, onEdit, onCancelEdit, onSave, onApprove, onReject, onDelete }) {
  const isEditing = editingId === draft.id;
  const [showShare, setShowShare] = useState(false);
  const depts = (draft.department_ids || []).map((id) => departments.find((d) => d.id === id)).filter(Boolean);

  return (
    <div className="border-b border-border-soft last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 px-5 py-4">
        {draft.image_url && (
          <img src={draft.image_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {draft.is_full_article ? (
              <span className="text-[11px] font-bold text-link bg-[#E8EDF3] dark:bg-brand/15 px-2 py-0.5 rounded-full">Full article</span>
            ) : (
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">Digest blurb</span>
            )}
            {draft.status !== 'pending_review' && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${draft.status === 'approved' ? 'text-green bg-[#EAFAF1] dark:bg-green/10' : 'text-rose bg-[#FBEAE9] dark:bg-rose/10'}`}>
                {draft.status === 'approved' ? 'Approved' : 'Rejected'}
              </span>
            )}
            {depts.map((d) => (
              <span key={d.id} className="inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${d.color}1A`, color: d.color }}>
                <EmojiIcon emoji={d.icon} className="inline-block w-3.5 h-3.5 align-[-2px]" /> {d.name}
              </span>
            ))}
          </div>
          <p className="font-semibold text-ink text-sm">{draft.title}</p>
          <p className="text-sm text-body leading-relaxed mt-0.5">{draft.dek}</p>
          <a href={draft.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-link mt-1.5">
            <ExternalLink className="w-3 h-3" /> {draft.source_name}
          </a>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button
            onClick={() => onEdit(draft.id)}
            disabled={!!actionLoading}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#F6F8FB] dark:bg-white/5 text-body-strong hover:bg-[#E8EDF3] dark:hover:bg-brand/15 hover:text-link transition-colors disabled:opacity-40"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
          {draft.status === 'approved' && draft.is_full_article && (
            <button
              onClick={() => setShowShare((v) => !v)}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${showShare ? 'bg-brand text-white' : 'bg-[#F6F8FB] dark:bg-white/5 text-body-strong hover:bg-[#E8EDF3] dark:hover:bg-brand/15 hover:text-link'}`}
            >
              <Share2 className="w-3 h-3" /> Post
            </button>
          )}
          {draft.status !== 'approved' && (
            <button
              onClick={() => onApprove(draft.id)}
              disabled={!!actionLoading}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green text-white hover:brightness-95 transition-colors disabled:opacity-40"
            >
              {actionLoading === draft.id + '_approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve
            </button>
          )}
          {draft.status !== 'rejected' && (
            <button
              onClick={() => onReject(draft.id)}
              disabled={!!actionLoading}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FBEAE9] dark:bg-rose/10 text-rose hover:bg-rose/10 transition-colors disabled:opacity-40"
            >
              {actionLoading === draft.id + '_reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
            </button>
          )}
          <button
            onClick={() => onDelete(draft.id)}
            disabled={!!actionLoading}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#F6F8FB] dark:bg-white/5 text-body-strong hover:bg-[#FBEAE9] dark:hover:bg-rose/10 hover:text-rose transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {isEditing && (
        <EditForm draft={draft} onCancel={onCancelEdit} onSave={(fields) => onSave(draft.id, fields)} saving={actionLoading === draft.id + '_save'} />
      )}
      {showShare && !isEditing && <SharePanel section="news" record={draft} />}
    </div>
  );
}

export default function AdminNews() {
  const { showToast } = useOutletContext();
  const [status, setStatus] = useState('pending_review');
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [digestDate, setDigestDate] = useState(new Date().toISOString().slice(0, 10));
  const [sendingDigest, setSendingDigest] = useState(false);
  const [error, setError] = useState('');

  const fetchDrafts = useCallback(async () => {
    setDraftsLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('admin_list_news_drafts', { p_status: status });
      if (err) throw err;
      setDrafts(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load articles.');
    } finally {
      setDraftsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const setArticleStatus = async (id, newStatus) => {
    const key = newStatus === 'approved' ? '_approve' : '_reject';
    setActionLoading(id + key);
    try {
      const { error: err } = await supabase.rpc('admin_set_news_article_status', { p_id: id, p_status: newStatus });
      if (err) throw err;
      setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));
      showToast(newStatus === 'approved' ? 'Article approved and published.' : 'Article rejected.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const saveEdits = async (id, fields) => {
    setActionLoading(id + '_save');
    try {
      const { error: err } = await supabase.rpc('admin_update_news_article', {
        p_id: id,
        p_title: fields.title,
        p_dek: fields.dek,
        p_body_blocks: fields.body_blocks,
        p_department_ids: fields.department_ids,
        p_related_agent_slug: fields.related_agent_slug,
        p_related_agent_tier: fields.related_agent_tier,
        p_image_url: fields.image_url,
      });
      if (err) throw err;
      setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...fields } : d)));
      setEditingId(null);
      showToast('Changes saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteDraft = async (id) => {
    if (!window.confirm('Delete this article permanently?')) return;
    setActionLoading(id + '_delete');
    try {
      const { error: err } = await supabase.rpc('admin_delete_news_article', { p_id: id });
      if (err) throw err;
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      showToast('Article deleted.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const sendDigest = async () => {
    if (!window.confirm(`Send today's digest to every student? This emails and notifies everyone with an account — approved articles from ${digestDate} that haven't been sent yet.`)) return;
    setSendingDigest(true);
    setError('');
    try {
      const { data, error: err } = await supabase.functions.invoke('send-news-digest', { body: { date: digestDate } });
      if (err) throw err;
      if (data?.sent === 0 && data?.reason) {
        showToast(data.reason);
      } else {
        showToast(`Digest sent to ${data?.sent ?? 0} of ${data?.matched ?? 0} students (${data?.articleCount ?? 0} articles).`);
      }
    } catch (err) {
      setError(err.message || 'Failed to send digest.');
    } finally {
      setSendingDigest(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
          <Newspaper className="w-7 h-7 text-link" />
          News Review
        </h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={digestDate}
            onChange={(e) => setDigestDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button
            onClick={sendDigest}
            disabled={sendingDigest}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-40 text-white transition-colors"
          >
            {sendingDigest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send today's digest
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        {['pending_review', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              status === s ? 'bg-brand text-white' : 'bg-[#F6F8FB] dark:bg-white/5 text-body-strong hover:bg-[#E8EDF3] dark:hover:bg-brand/15'
            }`}
          >
            {s === 'pending_review' ? 'Pending' : s === 'approved' ? 'Approved' : 'Rejected'}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#131E2F]">
        {draftsLoading ? (
          <div className="px-5 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-link mx-auto" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">Nothing here.</div>
        ) : (
          drafts.map((d) => (
            <DraftRow
              key={d.id}
              draft={d}
              actionLoading={actionLoading}
              editingId={editingId}
              onEdit={setEditingId}
              onCancelEdit={() => setEditingId(null)}
              onSave={saveEdits}
              onApprove={(id) => setArticleStatus(id, 'approved')}
              onReject={(id) => setArticleStatus(id, 'rejected')}
              onDelete={deleteDraft}
            />
          ))
        )}
      </div>
    </div>
  );
}
