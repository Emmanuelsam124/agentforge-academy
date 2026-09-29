// Block vocabulary for /guides content, and the plain-string HTML renderer
// used server-side (api/guide-article.js) where there's no React runtime.
//
// Same split as src/lib/newsBlocks.js — a string renderer here for crawlers,
// a JSX renderer in components/guides/GuideBody.jsx for the browser. Keep the
// two block-type switches in sync by eye; they're deliberately small.
//
// Block types:
//   intro       { text }                         — lede under the h1
//   section     { eyebrow, title }               — starts a section (h2)
//   subheading  { text }                         — bold lead-in inside a section
//   paragraph   { text }                         — supports **bold** inline
//   checklist   { items[] }                      — green-tick list
//   list        { items[] }                      — plain bullets
//   quote       { text }
//   callout     { variant, title, text, linkTo?, linkLabel? }
//   practice    { n, title, text }               — numbered best-practice item
//   widget      { name }                         — an interactive React island
//   cta         { to, label, tier?, eyebrow?, text }
//   table       { caption?, header[], rows[][] }  — comparison table, **bold** per cell
//   image       { src, alt, caption? }            — inline diagram/illustration, own card

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// **bold** -> <strong>. Runs AFTER escaping, so the input is already safe and
// the only tags that can appear are the ones added here.
export function renderInline(text) {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

// Strips the ** markers without emitting tags — for React, which escapes text
// on its own and needs the segments rather than an HTML string.
export function splitBold(text) {
  return String(text ?? '')
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**')
        ? { bold: true, text: part.slice(2, -2) }
        : { bold: false, text: part },
    );
}

export function renderGuideBlocksToHtml(blocks) {
  return (blocks || [])
    .map((block) => {
      switch (block.type) {
        case 'intro':
          return `<p>${renderInline(block.text)}</p>`;
        case 'section':
          return `${block.eyebrow ? `<p>${escapeHtml(block.eyebrow)}</p>` : ''}<h2>${escapeHtml(block.title)}</h2>`;
        case 'subheading':
          return `<h3>${escapeHtml(block.text)}</h3>`;
        case 'checklist':
        case 'list':
          return `<ul>${(block.items || []).map((i) => `<li>${renderInline(i)}</li>`).join('')}</ul>`;
        case 'quote':
          return `<blockquote>${renderInline(block.text)}</blockquote>`;
        case 'callout':
          return `<p>${block.title ? `<strong>${escapeHtml(block.title)}</strong> ` : ''}${renderInline(block.text)}${
            block.linkTo ? ` <a href="${escapeHtml(block.linkTo)}">${escapeHtml(block.linkLabel || 'Read more')}</a>` : ''
          }</p>`;
        case 'practice':
          return `<h3>${escapeHtml(block.title)}</h3><p>${renderInline(block.text)}</p>`;
        case 'table':
          return `${block.caption ? `<p><strong>${escapeHtml(block.caption)}</strong></p>` : ''}<table><thead><tr>${
            (block.header || []).map((h) => `<th>${renderInline(h)}</th>`).join('')
          }</tr></thead><tbody>${
            (block.rows || []).map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`).join('')
          }</tbody></table>`;
        case 'cta':
          return `<p><a href="${escapeHtml(block.to)}">${escapeHtml(block.label)}</a> — ${renderInline(block.text)}</p>`;
        case 'image':
          return `<figure><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || '')}" loading="lazy" />${
            block.caption ? `<figcaption>${renderInline(block.caption)}</figcaption>` : ''
          }</figure>`;
        // Interactive islands have no meaningful server-rendered form; the
        // surrounding prose already explains what they do, so emitting
        // nothing is better than emitting an empty shell for a crawler.
        case 'widget':
          return '';
        case 'paragraph':
        default:
          return `<p>${renderInline(block.text)}</p>`;
      }
    })
    .filter(Boolean)
    .join('\n');
}

export function renderFaqsToHtml(faqs) {
  if (!faqs || faqs.length === 0) return '';
  return `<h2>Frequently asked questions</h2>${faqs
    .map((f) => `<h3>${escapeHtml(f.q)}</h3><p>${renderInline(f.a)}</p>`)
    .join('')}`;
}
