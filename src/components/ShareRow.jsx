import { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { shareUrl } from '../utils/shareText';
import { TARGETS, copyShareLink } from './shareTargets';

// Inline share row at the end of the content, shared by /news/:slug and
// /guides/:slug.
//
// Shown BELOW lg only. Below lg, ShareRail is a collapsed 32px toggle that
// needs a tap to reveal its icons at all — this labelled row is what most
// mobile readers actually use to share, reached by scrolling rather than
// discovering the toggle. From lg up the rail is the always-open labelled-
// enough version on its own and this stays hidden.
//
// Every destination gets its own utm_source, and each section its own
// utm_campaign (see shareUrl), so GA4 can tell which platform AND which
// kind of content actually drives catalog and pricing visits, instead of
// filing all of it under "direct".
export default function ShareRow({ section, slug, title }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (await copyShareLink(shareUrl(section, slug, 'copy'))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="lg:hidden flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-border-soft">
      <span className="text-[11px] font-bold uppercase tracking-widest text-body mr-1">Share</span>

      {TARGETS.map(({ id, label, Icon, href }) => (
        <a
          key={id}
          href={href(shareUrl(section, slug, id), title)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Share on ${label}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[13px] font-semibold text-body-strong hover:border-brand hover:text-link transition-colors"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </a>
      ))}

      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[13px] font-semibold text-body-strong hover:border-brand hover:text-link transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
