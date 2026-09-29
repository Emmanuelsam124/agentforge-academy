import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BookOpen, Loader2, AlertCircle, Pencil, Trash2, Plus, X, Save, Eye, EyeOff, ExternalLink, Share2,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import SharePanel from '../../components/admin/SharePanel';
import ImageUploadField from '../../components/admin/ImageUploadField';

// Admins write guides in a plain-text block syntax rather than a raw JSON
// editor — same idea as AdminNews.jsx's blocksToText/textToBlocks, extended
// with the richer block types guides use (sections, callouts, numbered
// practices, widgets).
//
// Syntax, blocks separated by a blank line:
//   # Eyebrow | Section title     -> section
//   ## Subheading                 -> subheading
//   ### 3. Practice title         -> numbered practice (text on next lines)
//   > Quote
//   !tip Title | text             -> callout (also !warn)
//   [widget:prompt-generator]     -> embeds an interactive widget
//   [cta:/path|Label|Builder 1]   -> call-to-action (tier optional)
//   [image:/path.svg|Alt text|Caption]  -> inline diagram/illustration (caption optional)
//   - item                        -> checklist (all lines must start "- ")
//   table: Caption (optional)     -> comparison table — a caption line (optional)
//   | Col A | Col B |                followed by a header row, a required
//   | --- | --- |                    "|---|---|" separator row, then data rows
//   | cell | cell |                  (all pipe-delimited, **bold** supported per cell)
//   anything else                 -> paragraph (**bold** supported)
// Exported for round-trip verification — a lossy text<->blocks conversion
// would silently corrupt a guide the first time an admin saves it.
export function blocksToText(blocks) {
  return (blocks || [])
    .map((b) => {
      switch (b.type) {
        case 'intro': return `intro: ${b.text}`;
        case 'section': return `# ${b.eyebrow || ''} | ${b.title}`;
        case 'subheading': return `## ${b.text}`;
        case 'practice': return `### ${b.n}. ${b.title}\n${b.text}`;
        case 'quote': return `> ${b.text}`;
        case 'callout': {
          const head = `!${b.variant === 'warning' ? 'warn' : 'tip'} ${b.title || ''} | ${b.text}`;
          return b.linkTo ? `${head}\nlink: ${b.linkTo} | ${b.linkLabel || ''}` : head;
        }
        case 'widget': return `[widget:${b.name}]`;
        // tier and eyebrow are both optional; empty slots are kept so the
        // positions stay stable (…|tier|eyebrow]).
        case 'cta': return `[cta:${b.to}|${b.label}|${b.tier || ''}|${b.eyebrow || ''}]\n${b.text}`;
        case 'image': return `[image:${b.src}|${b.alt || ''}|${b.caption || ''}]`;
        case 'checklist':
        case 'list': return (b.items || []).map((i) => `- ${i}`).join('\n');
        case 'table': {
          const capLine = b.caption ? `table: ${b.caption}\n` : '';
          const sep = `| ${(b.header || []).map(() => '---').join(' | ')} |`;
          const rows = [
            `| ${(b.header || []).join(' | ')} |`,
            sep,
            ...(b.rows || []).map((r) => `| ${r.join(' | ')} |`),
          ];
          return `${capLine}${rows.join('\n')}`;
        }
        default: return b.text;
      }
    })
    .join('\n\n');
}

export function textToBlocks(text) {
  return text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split('\n');
      const first = lines[0].trim();
      const rest = lines.slice(1).join(' ').trim();

      if (first.toLowerCase().startsWith('intro:')) {
        return { type: 'intro', text: first.slice(6).trim() };
      }
      if (first.startsWith('### ')) {
        const m = first.slice(4).match(/^(\d+)\.\s*(.*)$/);
        return { type: 'practice', n: m ? Number(m[1]) : 1, title: m ? m[2] : first.slice(4), text: rest };
      }
      if (first.startsWith('## ')) return { type: 'subheading', text: first.slice(3).trim() };
      if (first.startsWith('# ')) {
        const [eyebrow, ...titleParts] = first.slice(2).split('|');
        const title = titleParts.join('|').trim();
        return { type: 'section', eyebrow: title ? eyebrow.trim() : '', title: title || eyebrow.trim() };
      }
      if (first.startsWith('> ')) return { type: 'quote', text: chunk.slice(2).trim() };
      if (/^!(tip|warn)\s/i.test(first)) {
        const variant = /^!warn/i.test(first) ? 'warning' : 'tip';
        const body = first.replace(/^!(tip|warn)\s*/i, '');
        const [title, ...textParts] = body.split('|');
        const calloutText = textParts.join('|').trim();
        const block = {
          type: 'callout',
          variant,
          title: calloutText ? title.trim() : '',
          text: calloutText || title.trim(),
        };
        // Optional "link: /path | Label" on a following line.
        const linkLine = lines.slice(1).map((l) => l.trim()).find((l) => /^link:/i.test(l));
        if (linkLine) {
          const [to, ...labelParts] = linkLine.replace(/^link:\s*/i, '').split('|');
          block.linkTo = to.trim();
          block.linkLabel = labelParts.join('|').trim() || 'Read more';
        }
        return block;
      }
      const widgetMatch = first.match(/^\[widget:([a-z-]+)\]$/i);
      if (widgetMatch) return { type: 'widget', name: widgetMatch[1] };

      const imageMatch = first.match(/^\[image:([^|\]]+)\|([^|\]]*)(?:\|([^\]]*))?\]$/);
      if (imageMatch) {
        const block = { type: 'image', src: imageMatch[1].trim(), alt: imageMatch[2]?.trim() || '' };
        if (imageMatch[3]?.trim()) block.caption = imageMatch[3].trim();
        return block;
      }

      const ctaMatch = first.match(/^\[cta:([^|\]]+)\|([^|\]]*)(?:\|([^|\]]*))?(?:\|([^\]]*))?\]$/);
      if (ctaMatch) {
        const block = {
          type: 'cta',
          to: ctaMatch[1].trim(),
          label: ctaMatch[2].trim(),
          text: rest,
        };
        if (ctaMatch[3]?.trim()) block.tier = ctaMatch[3].trim();
        if (ctaMatch[4]?.trim()) block.eyebrow = ctaMatch[4].trim();
        return block;
      }

      const tableCaptionMatch = first.match(/^table:\s*(.*)$/i);
      const tableLines = tableCaptionMatch ? lines.slice(1) : lines;
      const parseRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const isSeparatorRow = (l) => {
        const cells = parseRow(l);
        return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
      };
      if (tableLines[0]?.trim().startsWith('|') && tableLines[1] && isSeparatorRow(tableLines[1])) {
        const block = {
          type: 'table',
          header: parseRow(tableLines[0]),
          rows: tableLines.slice(2).filter((l) => l.trim()).map(parseRow),
        };
        if (tableCaptionMatch?.[1]?.trim()) block.caption = tableCaptionMatch[1].trim();
        return block;
      }

      const allLines = lines.map((l) => l.trim()).filter(Boolean);
      if (allLines.length > 0 && allLines.every((l) => l.startsWith('- '))) {
        return { type: 'checklist', items: allLines.map((l) => l.slice(2).trim()) };
      }
      return { type: 'paragraph', text: chunk.replace(/\n/g, ' ') };
    });
}

export function faqsToText(faqs) {
  return (faqs || []).map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
}

export function textToFaqs(text) {
  return text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const qMatch = chunk.match(/^Q:\s*(.*)$/m);
      const aMatch = chunk.match(/^A:\s*([\s\S]*)$/m);
      if (!qMatch || !aMatch) return null;
      return { q: qMatch[1].trim(), a: aMatch[1].replace(/\n/g, ' ').trim() };
    })
    .filter(Boolean);
}

const emptyForm = {
  id: null, slug: '', title: '', dek: '', category: 'agent-guide', emoji: '📘',
  reading_time: '', image_url: '', related_agent_slug: '', related_agent_tier: 'builder1',
  is_hub: false, sort_order: 0, bodyText: '', faqText: '',
};

export default function AdminGuides() {
  const { showToast } = useOutletContext();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  // Which guide's share panel is open. Held here rather than per row because
  // the rows are mapped inline with no component to own the state -- and one
  // panel open at a time is the behaviour we want anyway.
  const [shareId, setShareId] = useState(null);

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('admin_list_guides');
      if (err) throw err;
      setGuides(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load guides.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGuides(); }, [fetchGuides]);

  const startNew = () => {
    setForm({ ...emptyForm, sort_order: guides.length });
    setEditorOpen(true);
    setError('');
  };

  const startEdit = (g) => {
    setForm({
      id: g.id,
      slug: g.slug,
      title: g.title,
      dek: g.dek,
      category: g.category,
      emoji: g.emoji || '📘',
      reading_time: g.reading_time || '',
      image_url: g.image_url || '',
      related_agent_slug: g.related_agent_slug || '',
      related_agent_tier: g.related_agent_tier || 'builder1',
      is_hub: g.is_hub,
      sort_order: g.sort_order,
      bodyText: blocksToText(g.body_blocks),
      faqText: faqsToText(g.faqs),
    });
    setEditorOpen(true);
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.slug.trim() || !form.title.trim() || !form.dek.trim()) {
      setError('Slug, title and dek are required.');
      return;
    }
    setSaving(true);
    try {
      const { error: err } = await supabase.rpc('admin_upsert_guide', {
        p_id: form.id,
        p_slug: form.slug.trim(),
        p_title: form.title.trim(),
        p_dek: form.dek.trim(),
        p_category: form.category,
        p_body_blocks: textToBlocks(form.bodyText),
        p_faqs: textToFaqs(form.faqText),
        p_emoji: form.emoji.trim() || '📘',
        p_reading_time: form.reading_time.trim() || null,
        p_image_url: form.image_url.trim() || null,
        p_related_agent_slug: form.related_agent_slug.trim() || null,
        p_related_agent_tier: form.related_agent_slug.trim() ? form.related_agent_tier : null,
        p_is_hub: form.is_hub,
        p_sort_order: Number(form.sort_order) || 0,
      });
      if (err) throw err;
      showToast(form.id ? 'Guide saved.' : 'Guide created as a draft.');
      setEditorOpen(false);
      setForm(emptyForm);
      fetchGuides();
    } catch (err) {
      setError(err.message || 'Could not save this guide.');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id, status) => {
    setActionLoading(id + status);
    try {
      const { error: err } = await supabase.rpc('admin_set_guide_status', { p_id: id, p_status: status });
      if (err) throw err;
      setGuides((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
      showToast(status === 'published' ? 'Guide published.' : 'Guide unpublished.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this guide permanently?')) return;
    setActionLoading(id + 'delete');
    try {
      const { error: err } = await supabase.rpc('admin_delete_guide', { p_id: id });
      if (err) throw err;
      setGuides((prev) => prev.filter((g) => g.id !== id));
      showToast('Guide deleted.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40';

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-brand" /> Guides
        </h1>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-brand hover:bg-brand-deep text-white transition-colors"
        >
          <Plus className="w-4 h-4" /> New guide
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {editorOpen && (
        <form onSubmit={save} className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] p-5 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink text-sm">{form.id ? 'Edit guide' : 'New guide'}</h3>
            <button
              type="button"
              onClick={() => { setEditorOpen(false); setForm(emptyForm); }}
              className="text-xs font-semibold text-body hover:text-ink flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" />
            <input className={inputCls} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="URL slug (e.g. ai-meeting-notes)" />
          </div>

          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={form.dek}
            onChange={(e) => setForm((f) => ({ ...f, dek: e.target.value }))}
            placeholder="Dek — one or two sentences. Doubles as the meta description and the card blurb."
          />

          <div className="grid sm:grid-cols-4 gap-3">
            <select className={inputCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="agent-guide">Agent guide</option>
              <option value="how-to">How-to</option>
            </select>
            <input className={inputCls} value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="Emoji" />
            <input className={inputCls} value={form.reading_time} onChange={(e) => setForm((f) => ({ ...f, reading_time: e.target.value }))} placeholder="8 min read" />
            <input className={inputCls} type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} placeholder="Sort order" />
          </div>

          <ImageUploadField
            value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
            slug={form.slug}
            placeholder="Header image (optional) — shown on the card and at the top of the guide"
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <input className={inputCls} value={form.related_agent_slug} onChange={(e) => setForm((f) => ({ ...f, related_agent_slug: e.target.value }))} placeholder="Related agent slug (optional)" />
            <select className={inputCls} value={form.related_agent_tier} disabled={!form.related_agent_slug} onChange={(e) => setForm((f) => ({ ...f, related_agent_tier: e.target.value }))}>
              <option value="builder1">Builder 1</option>
              <option value="builder2">Builder 2</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-body-strong">
            <input type="checkbox" checked={form.is_hub} onChange={(e) => setForm((f) => ({ ...f, is_hub: e.target.checked }))} className="w-4 h-4 accent-[#7C3AED]" />
            Make this the hub guide (the broad "start here" one — only one at a time)
          </label>

          <div>
            <label className="block text-xs font-bold text-body-strong mb-1.5">Body</label>
            <textarea
              className={`${inputCls} font-mono resize-y`}
              rows={16}
              value={form.bodyText}
              onChange={(e) => setForm((f) => ({ ...f, bodyText: e.target.value }))}
              placeholder={'Blank line between blocks.\n\nintro: Opening line under the title\n# Eyebrow | Section heading\n## Bold subheading\n### 1. A numbered best practice\nIts explanation on the next line.\n- checklist item\n> a quote\n!tip Title | callout text\n!warn Title | warning callout\nlink: /some-page | Link text   (optional line under a callout)\n[widget:prompt-generator]\n[cta:/catalog|Button label|Builder 1|Eyebrow]\nCTA description on the next line.\n[image:/guides/diagrams/example.svg|Alt text|Optional caption]\ntable: Optional caption\n| | Column A | Column B |\n| --- | --- | --- |\n| **Row label** | cell | cell |\n\nAnything else is a paragraph. Use **bold** for emphasis.'}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-body-strong mb-1.5">FAQs</label>
            <textarea
              className={`${inputCls} font-mono resize-y`}
              rows={6}
              value={form.faqText}
              onChange={(e) => setForm((f) => ({ ...f, faqText: e.target.value }))}
              placeholder={'Q: A question people actually search\nA: The answer.\n\nQ: Another question\nA: Another answer.'}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-40 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {form.id ? 'Save changes' : 'Create guide'}
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
        {loading ? (
          <div className="px-5 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" /></div>
        ) : guides.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">No guides yet.</div>
        ) : (
          guides.map((g) => (
            <div key={g.id} className="border-b border-border-soft last:border-b-0">
              <div className="flex items-start justify-between gap-3 px-5 py-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-lg">{g.emoji}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${g.status === 'published' ? 'text-green bg-[#EAFAF1] dark:bg-green/10' : 'text-gray-500 bg-gray-100 dark:bg-white/5'}`}>
                      {g.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-[11px] font-bold text-brand bg-[#F3EBFF] dark:bg-brand/15 px-2 py-0.5 rounded-full">
                      {g.category === 'how-to' ? 'How-to' : 'Agent guide'}
                    </span>
                    {g.is_hub && <span className="text-[11px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 rounded-full">Hub</span>}
                  </div>
                  <p className="font-semibold text-ink text-sm">{g.title}</p>
                  <p className="text-xs text-body mt-0.5 line-clamp-2">{g.dek}</p>
                  <a href={`/guides/${g.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-brand mt-1.5">
                    <ExternalLink className="w-3 h-3" /> /guides/{g.slug}
                  </a>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <button onClick={() => startEdit(g)} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand transition-colors">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  {g.status === 'published' && (
                    <button
                      onClick={() => setShareId((cur) => (cur === g.id ? null : g.id))}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${shareId === g.id ? 'bg-brand text-white' : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand'}`}
                    >
                      <Share2 className="w-3 h-3" /> Post
                    </button>
                  )}
                  <button
                    onClick={() => setStatus(g.id, g.status === 'published' ? 'draft' : 'published')}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand transition-colors disabled:opacity-40"
                  >
                    {g.status === 'published' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {g.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => remove(g.id)}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  </div>
              </div>
              {shareId === g.id && <SharePanel section="guides" record={g} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
