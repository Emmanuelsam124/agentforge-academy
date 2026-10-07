import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, AlertTriangle, Check } from 'lucide-react';
import { splitBold } from '../../lib/guideBlocks';
import PromptGenerator from './PromptGenerator';

// React counterpart to renderGuideBlocksToHtml in src/lib/guideBlocks.js —
// same block-type switch, kept small so the two stay easy to keep in sync.
// React escapes text content on its own, so only the **bold** segmentation
// needs handling here (no manual escaping, unlike the string renderer).

// Interactive islands a guide can embed by name. Adding a new one means
// adding it here — an admin can turn an existing widget on or off from the
// editor, but can't invent a new interactive component without a developer.
const WIDGETS = {
  'prompt-generator': PromptGenerator,
};

function Rich({ text }) {
  return splitBold(text).map((part, i) =>
    part.bold ? <strong key={i} className="text-ink">{part.text}</strong> : <span key={i}>{part.text}</span>,
  );
}

// react-router's <Link to> only understands in-app routes — handing it an
// absolute URL produces a relative navigation to a path that doesn't exist.
// Guides cite outside sources, so route on the destination instead. The
// string renderer in lib/guideBlocks.js emits plain <a href> and already
// handles both cases.
function GuideLink({ to, className, children }) {
  if (/^(https?:)?\/\//i.test(to) || to.startsWith('mailto:')) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return <Link to={to} className={className}>{children}</Link>;
}

function Callout({ block }) {
  const isWarning = block.variant === 'warning';
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3.5 my-5 ${
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

function Cta({ block }) {
  return (
    <div className="mt-8 rounded-2xl border-[1.5px] border-brand/30 bg-[#F8FAFD] dark:bg-brand/10 p-6">
      <div className="text-[10px] font-bold uppercase tracking-widest text-link mb-2">
        {block.eyebrow || 'Build this one'}
      </div>
      <p className="text-[15px] text-body leading-relaxed mb-5"><Rich text={block.text} /></p>
      <GuideLink
        to={block.to}
        className="inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-[0_6px_16px_rgba(15,26,42,.3)]"
      >
        <span>{block.tier ? `${block.label} — ${block.tier} session` : block.label}</span>
        <ArrowRight className="w-4 h-4 flex-shrink-0" />
      </GuideLink>
    </div>
  );
}

export default function GuideBody({ blocks }) {
  return (
    <>
      {(blocks || []).map((block, i) => {
        switch (block.type) {
          case 'intro':
            return (
              <p key={i} className="text-[17px] text-body leading-relaxed mt-4 mb-2">
                <Rich text={block.text} />
              </p>
            );

          case 'section':
            return (
              <div key={i} className="pt-9 mt-1 border-t border-border-soft first:border-none first:pt-2">
                {block.eyebrow && (
                  <div className="text-[10px] font-bold uppercase tracking-widest text-link mb-2">{block.eyebrow}</div>
                )}
                <h2 className="font-display text-2xl sm:text-[28px] font-extrabold text-ink mb-4" style={{ textWrap: 'balance' }}>
                  {block.title}
                </h2>
              </div>
            );

          case 'subheading':
            return <p key={i} className="text-[15px] font-bold text-ink mt-6 mb-1">{block.text}</p>;

          case 'checklist':
            return (
              <ul key={i} className="flex flex-col gap-2.5 my-4">
                {(block.items || []).map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-[15px] text-body-strong leading-relaxed">
                    <Check className="w-4 h-4 text-green mt-1 flex-shrink-0" />
                    <span><Rich text={item} /></span>
                  </li>
                ))}
              </ul>
            );

          case 'list':
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5 my-4 text-[15.5px] text-body leading-relaxed">
                {(block.items || []).map((item, j) => <li key={j}><Rich text={item} /></li>)}
              </ul>
            );

          case 'table':
            return (
              <div key={i} className="my-5">
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

          case 'quote':
            return (
              <blockquote key={i} className="border-l-[3px] border-brand pl-4 italic text-body-strong my-4">
                <Rich text={block.text} />
              </blockquote>
            );

          case 'callout':
            return <Callout key={i} block={block} />;

          case 'practice':
            return (
              <div key={i} className="flex gap-3.5 py-4 border-b border-border-soft last:border-none">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link flex items-center justify-center font-display font-extrabold text-[13px] mt-0.5">
                  {block.n}
                </div>
                <div>
                  <h3 className="font-display font-bold text-[15.5px] text-ink mb-1">{block.title}</h3>
                  <p className="text-[14.5px] text-body leading-relaxed m-0"><Rich text={block.text} /></p>
                </div>
              </div>
            );

          case 'widget': {
            const Widget = WIDGETS[block.name];
            return Widget ? <Widget key={i} /> : null;
          }

          case 'cta':
            return <Cta key={i} block={block} />;

          case 'image':
            return (
              <figure key={i} className="my-6">
                <img
                  src={block.src}
                  alt={block.alt || ''}
                  loading="lazy"
                  className="w-full rounded-2xl border border-border bg-white"
                />
                {block.caption && (
                  <figcaption className="text-[13px] text-body text-center mt-2.5">
                    <Rich text={block.caption} />
                  </figcaption>
                )}
              </figure>
            );

          case 'paragraph':
          default:
            return (
              <p key={i} className="text-[15.5px] leading-relaxed text-body my-4">
                <Rich text={block.text} />
              </p>
            );
        }
      })}
    </>
  );
}
