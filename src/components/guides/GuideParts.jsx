import { Link } from 'react-router-dom';
import { Lightbulb, AlertTriangle } from 'lucide-react';
import { splitBold } from '../../lib/guideBlocks';

// Small pieces shared by the /guides renderer (GuideBody) and the session
// guide renderer (SessionGuide), so a callout or table looks the same in both.
// React escapes text content on its own, so only **bold** needs segmenting.

export function Rich({ text }) {
  return splitBold(text).map((part, i) =>
    part.bold ? <strong key={i} className="text-ink">{part.text}</strong> : <span key={i}>{part.text}</span>,
  );
}

// react-router's <Link to> only understands in-app routes — handing it an
// absolute URL produces a relative navigation to a path that doesn't exist.
// Guides cite outside sources, so route on the destination instead. The
// string renderer in lib/guideBlocks.js emits plain <a href> and already
// handles both cases.
export function GuideLink({ to, className, children }) {
  if (/^(https?:)?\/\//i.test(to) || to.startsWith('mailto:')) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return <Link to={to} className={className}>{children}</Link>;
}

// variant: 'warning' (amber) or anything else (blue tip). className sets the
// outer spacing; session steps pass '' because the step list spaces itself.
export function Callout({ block, className = 'my-5' }) {
  const isWarning = block.variant === 'warning';
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3.5 ${className} ${
        isWarning
          ? 'bg-[#FEF9E7] dark:bg-amber-500/10 border border-amber/30'
          : 'bg-[#E8EDF3] dark:bg-brand/10 border border-brand/20'
      }`}
    >
      {isWarning ? (
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
      ) : (
        <Lightbulb className="w-4 h-4 text-link mt-0.5 flex-shrink-0" />
      )}
      <p className="text-[14px] text-body-strong leading-relaxed m-0">
        {block.title && <strong className="text-ink">{block.title} </strong>}
        <Rich text={block.text} />
        {block.linkTo && (
          <>
            {' '}
            <GuideLink to={block.linkTo} className="text-link font-bold hover:underline">
              {block.linkLabel || 'Read more'}
            </GuideLink>
          </>
        )}
      </p>
    </div>
  );
}

// block: { caption?, header[], rows[][] } — **bold** works inside any cell.
export function GuideTable({ block, className = 'my-5' }) {
  return (
    <div className={className}>
      {block.caption && (
        <p className="text-[13px] font-bold text-ink mb-2"><Rich text={block.caption} /></p>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-[14px] border-collapse">
          <thead>
            <tr className="bg-border-soft">
              {(block.header || []).map((h, ci) => (
                <th key={ci} scope="col" className="text-left font-bold text-ink px-4 py-2.5 border-b border-border whitespace-nowrap">
                  <Rich text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(block.rows || []).map((row, ri) => (
              <tr key={ri} className="border-t border-border">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-body-strong align-top">
                    <Rich text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
