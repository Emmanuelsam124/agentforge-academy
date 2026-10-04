import { escapeHtml } from '../src/lib/guideBlocks.js';
import { sectionOgImage, applyOgImage } from '../src/lib/ogCards.js';
import { jsonLdBody } from '../src/lib/jsonLd.js';

// Server-renders the /guides listing — same pattern and reasoning as
// api/news-index.js. Guides are admin-editable at any time, so a committed
// static snapshot would go stale the moment one is published or reordered.
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const siteUrl = 'https://socialdevtechnologies.com';
  const canonicalUrl = `${siteUrl}/guides`;

  const [shellRes, guidesRes] = await Promise.all([
    fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/index.html`),
    fetch(
      // Newest first, matching src/pages/guides/GuidesIndex.jsx — a crawler
      // and a browser must see the same order on the same URL.
      `${SUPABASE_URL}/rest/v1/guides?status=eq.published&select=slug,title,dek,category,emoji,reading_time&order=published_at.desc.nullslast`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    ),
  ]);

  let html = await shellRes.text();
  const guides = guidesRes.ok ? await guidesRes.json() : [];

  const pageTitle = 'AI Agent Guides — Social Dev Technologies';
  const description =
    'Plain-language guides to the AI agents businesses actually use — what each one does, where it helps, and how to run one well.';

  html = html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1website$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`);
  html = applyOgImage(html, sectionOgImage('guides'), 'AI build guides from Social Dev Technologies');

  const jsonLd = jsonLdBody({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: guides.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${siteUrl}/guides/${g.slug}`,
        name: g.title,
      })),
    },
  });

  html = html.replace('</head>', `
    <link rel="canonical" href="${canonicalUrl}" />
    <script type="application/ld+json">${jsonLd}</script>
  </head>`);

  const items = guides
    .map(
      (g) => `
      <li>
        <a href="${siteUrl}/guides/${escapeHtml(g.slug)}">${escapeHtml(g.title)}</a>
        <p>${escapeHtml(g.dek)}</p>
      </li>`,
    )
    .join('');

  const bodyHtml = `
    <main>
      <h1>${escapeHtml(pageTitle)}</h1>
      <p>${escapeHtml(description)}</p>
      ${guides.length ? `<ul>${items}</ul>` : '<p>No guides yet — check back soon.</p>'}
    </main>`;

  html = html.replace(/<div id="root">[\s\S]*<\/div>/, `<div id="root" data-ssr-stub="1">${bodyHtml}</div>`);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.end(html);
}
