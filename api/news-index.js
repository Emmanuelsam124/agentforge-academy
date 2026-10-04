import { escapeHtml } from '../src/lib/newsBlocks.js';
import { sectionOgImage, applyOgImage } from '../src/lib/ogCards.js';
import { jsonLdBody } from '../src/lib/jsonLd.js';

// Server-renders /news (routed here via the vercel.json rewrite) — same
// reasoning as api/news-article.js: this app is otherwise a client-rendered
// SPA with no SSR, invisible to crawlers that don't execute JS. Unlike the
// fixed marketing/session routes (scripts/prerender.mjs), this page's
// content changes throughout the day as admins approve new articles, so a
// committed static snapshot would go stale within hours — this fetches the
// live approved list on every request instead, same pattern already used by
// api/news-sitemap.xml.js.
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const siteUrl = 'https://socialdevtechnologies.com';
  const canonicalUrl = `${siteUrl}/news`;

  const [shellRes, articlesRes] = await Promise.all([
    fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/index.html`),
    fetch(
      `${SUPABASE_URL}/rest/v1/news_articles?is_full_article=eq.true&select=slug,title,dek,image_url,published_at&order=published_at.desc&limit=60`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    ),
  ]);

  let html = await shellRes.text();
  const articles = articlesRes.ok ? await articlesRes.json() : [];

  const pageTitle = 'AI News — Social Dev Technologies';
  const description = 'The AI news that actually matters for people building real agents — picked daily, explained plainly, no hype.';

  html = html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1website$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`);
  html = applyOgImage(html, sectionOgImage('news'), 'AI News from Social Dev Technologies');

  const jsonLd = jsonLdBody({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${siteUrl}/news/${a.slug}`,
      })),
    },
  });

  const headExtra = `
    <link rel="canonical" href="${canonicalUrl}" />
    <script type="application/ld+json">${jsonLd}</script>
  </head>`;
  html = html.replace('</head>', headExtra);

  const articleItems = articles
    .map(
      (a) => `
      <li>
        <a href="${siteUrl}/news/${escapeHtml(a.slug)}">${escapeHtml(a.title)}</a>
        <p>${escapeHtml(a.dek)}</p>
      </li>`,
    )
    .join('');

  const bodyHtml = `
    <main>
      <h1>${escapeHtml(pageTitle)}</h1>
      <p>${escapeHtml(description)}</p>
      ${articles.length ? `<ul>${articleItems}</ul>` : '<p>No articles yet — check back soon.</p>'}
    </main>`;
  // data-ssr-stub tells src/main.jsx to skip hydration and do a clean
  // createRoot render instead — see main.jsx and api/news-article.js's own
  // comments for why: this is hand-written HTML for crawlers, not real
  // React output, so hydrating against it throws a React #418 mismatch and
  // forces a disruptive teardown/rebuild.
  //
  // Not a literal '<div id="root"></div>' match — see the matching comment
  // in api/news-article.js for why: scripts/inject-home.mjs splices the
  // prerendered homepage into dist/index.html's #root, so the shell
  // fetched above is never actually empty in production.
  html = html.replace(/<div id="root">[\s\S]*<\/div>/, `<div id="root" data-ssr-stub="1">${bodyHtml}</div>`);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.end(html);
}
