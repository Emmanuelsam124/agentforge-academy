import { escapeHtml, renderGuideBlocksToHtml, renderFaqsToHtml } from '../src/lib/guideBlocks.js';
import { sectionOgImage, applyOgImage } from '../src/lib/ogCards.js';
import { jsonLdBody } from '../src/lib/jsonLd.js';

// Server-renders /guides/:slug (routed here via the vercel.json rewrite,
// which passes the slug as ?slug=). Same reasoning and shape as
// api/news-article.js — flat file taking a query param, deliberately NOT the
// nested api/guides/[slug].js form, which silently failed to route in
// production and served the SPA shell to every crawler.
export default async function handler(req, res) {
  const slug = req.query.slug;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const siteUrl = 'https://socialdevtechnologies.com';

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;

  const [shellRes, guideRes] = await Promise.all([
    fetch(`${proto}://${host}/index.html`),
    fetch(
      `${SUPABASE_URL}/rest/v1/guides?slug=eq.${encodeURIComponent(slug || '')}&status=eq.published&select=*`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    ),
  ]);

  let html = await shellRes.text();
  const rows = guideRes.ok ? await guideRes.json() : [];
  const guide = rows[0];

  if (!guide) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html); // real 404 status; the SPA renders its own NotFound client-side
    return;
  }

  const pageTitle = `${guide.title} | Social Dev Technologies`;
  const description = guide.dek;
  const canonicalUrl = `${siteUrl}/guides/${encodeURIComponent(guide.slug)}`;
  // Same rule as api/news-article.js: never fall back to the 192x192 logo,
  // which is under LinkedIn's large-card threshold and Facebook's floor.
  const ogImage = guide.image_url
    ? { url: guide.image_url, isCard: false }
    : sectionOgImage('guides');

  html = html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1article$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(guide.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeHtml(guide.title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`);
  html = applyOgImage(html, ogImage, escapeHtml(guide.title));

  // Mirrors the three blocks src/pages/guides/GuidePage.jsx sends via
  // usePageSeo — but THIS is the copy that actually reaches most crawlers.
  // The React version only exists once client JS has run and replaced this
  // server-rendered stub (see the data-ssr-stub note below), so a crawler
  // that doesn't execute JS — GPTBot, ClaudeBot, PerplexityBot, Bing's
  // first pass — sees only what's built here. Keep these two in sync by eye.
  const articleJsonLd = jsonLdBody({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description,
    image: guide.image_url ? [guide.image_url] : undefined,
    datePublished: guide.published_at,
    dateModified: guide.updated_at,
    author: { '@type': 'Organization', name: 'Social Dev Technologies' },
    publisher: {
      '@type': 'Organization',
      name: 'Social Dev Technologies',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo-icon.webp` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  });

  const breadcrumbJsonLd = jsonLdBody({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${siteUrl}/guides` },
      { '@type': 'ListItem', position: 3, name: guide.title, item: canonicalUrl },
    ],
  });

  const faqJsonLd = guide.faqs?.length
    ? jsonLdBody({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: guide.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      })
    : null;

  // data-page-seo="jsonld" matches the marker src/hooks/usePageSeo.js puts on
  // every script IT injects, and sweeps before injecting a fresh set. This
  // route's #root carries data-ssr-stub (see below), so the client does a
  // clean createRoot().render() rather than hydrating — that only replaces
  // #root's contents, never touches <head>, so without this shared marker
  // usePageSeo's sweep can't see (and can't remove) these server-rendered
  // scripts. Once GuidePage mounts, its own Article/Breadcrumb/FAQPage blocks
  // would then stack on top of these instead of replacing them — two
  // Article blocks, both correct in isolation, is exactly that bug.
  html = html.replace('</head>', `
    <link rel="canonical" href="${canonicalUrl}" />
    <script type="application/ld+json" data-page-seo="jsonld">${articleJsonLd}</script>
    <script type="application/ld+json" data-page-seo="jsonld">${breadcrumbJsonLd}</script>
    ${faqJsonLd ? `<script type="application/ld+json" data-page-seo="jsonld">${faqJsonLd}</script>` : ''}
  </head>`);

  const imageBlock = guide.image_url
    ? `<img src="${escapeHtml(guide.image_url)}" alt="" style="width:100%;max-width:720px;" />`
    : '';
  const articleHtml = `
    <article>
      <h1>${escapeHtml(guide.title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${imageBlock}
      ${renderGuideBlocksToHtml(guide.body_blocks)}
      ${renderFaqsToHtml(guide.faqs)}
    </article>`;

  // data-ssr-stub tells src/main.jsx to skip hydration and do a clean
  // createRoot render — this is hand-written crawler markup, not real React
  // output. Greedy match to the last </div> because scripts/inject-home.mjs
  // pre-fills #root with the prerendered homepage; see api/news-article.js
  // for the full explanation of that bug.
  html = html.replace(/<div id="root">[\s\S]*<\/div>/, `<div id="root" data-ssr-stub="1">${articleHtml}</div>`);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.end(html);
}
