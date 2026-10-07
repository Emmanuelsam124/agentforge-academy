import { useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { generateArticleShareText, generateGuideShareText } from '../../utils/shareText';
import { getAgentBySlug } from '../../data/agents';

// Ready-to-paste social copy for a published article or guide, so posting
// is a copy/paste rather than a writing job every time. Same
// template-not-LLM approach as src/utils/generateShareText.js — see that
// file's note.
//
// Takes the raw row and picks the generator itself, so each admin screen
// mounts it with one line and neither has to know which template applies.

function CopyBlock({ label, text, hint }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this:', text);
    }
  };
  return (
    <div className="rounded-xl border border-border-soft bg-bg p-3.5">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-body">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs font-semibold text-link hover:underline flex-shrink-0">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {hint && <p className="text-[11px] text-body mb-2 leading-relaxed">{hint}</p>}
      <p className="text-[13px] text-ink whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

export default function SharePanel({ section, record }) {
  const relatedAgent = record.related_agent_slug ? getAgentBySlug(record.related_agent_slug) : null;
  const share = section === 'guides'
    ? generateGuideShareText({ guide: record, relatedAgent })
    : generateArticleShareText({ article: record, relatedAgent });

  return (
    <div className="px-5 py-4 bg-[#F6F8FB] dark:bg-white/5 space-y-3">
      {/* Not a hard block: the drafting prompt deliberately tells the bot to
          leave this null more often than not, because a forced link is worse
          than none. But an article with no build to point at converts
          nothing, so it's worth seeing before posting. */}
      {!relatedAgent && (
        <div className="flex items-start gap-2 text-[12px] text-amber bg-amber/10 border border-amber/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            No related session linked. Posts that end with something to build convert; posts that only inform don&apos;t.
            Add one via Edit if any session genuinely fits.
          </span>
        </div>
      )}

      <CopyBlock
        label="LinkedIn — post"
        hint="Post this on its own. Do NOT paste the link into the post body — LinkedIn suppresses reach on posts with outbound links."
        text={share.linkedin}
      />
      <CopyBlock
        label="LinkedIn — first comment"
        hint="Add this as the first comment immediately after posting."
        text={share.linkedinComment}
      />
      <div className="grid sm:grid-cols-3 gap-3">
        <CopyBlock label="WhatsApp" text={share.whatsapp} />
        <CopyBlock label="X" text={share.x} />
        <CopyBlock label="Facebook" text={share.facebook} />
      </div>
    </div>
  );
}
