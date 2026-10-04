import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { usePageSeo } from '../../hooks/usePageSeo';
import GuideBody from '../../components/guides/GuideBody';
import ShareRow from '../../components/ShareRow';
import EmailCapture from '../../components/EmailCapture';
import ShareRail from '../../components/ShareRail';
import NotFound from '../NotFound';

const CATEGORY_LABEL = {
  'agent-guide': 'Agent guide',
  'how-to': 'How-to',
};

// One data-driven page for every guide, replacing the five hand-written
// components this section started as. Content, FAQs and the related-agent
// link all come from the `guides` table, so an admin can add or edit a guide
// in /admin/guides without a deploy.
export default function GuidePage() {
  const { slug } = useParams();
  const [guide, setGuide] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('guides')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setGuide(data || null);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  // Cross-links, fetched separately so a failure here can't blank the guide
  // itself. Ordering matches the index; the current guide is filtered out.
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('guides')
      .select('slug, title, emoji, reading_time')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        if (!cancelled) setRelated((data || []).filter((g) => g.slug !== slug));
      });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  usePageSeo({
    title: guide ? `${guide.title} | Social Dev Technologies` : undefined,
    description: guide?.dek,
    canonicalPath: guide ? `/guides/${guide.slug}` : undefined,
    // Article carries the byline/dates search engines use for the result
    // itself; BreadcrumbList mirrors the "All guides" link above into the
    // trail Google renders under the URL; FAQPage is what turns the
    // Q&A section below into an expandable rich result — only added when
    // there's actually an FAQ section, since an empty FAQPage is invalid.
    jsonLd: guide
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: guide.title,
            description: guide.dek,
            image: guide.image_url ? [guide.image_url] : undefined,
            datePublished: guide.published_at,
            dateModified: guide.updated_at,
            author: { '@type': 'Organization', name: 'Social Dev Technologies' },
            publisher: {
              '@type': 'Organization',
              name: 'Social Dev Technologies',
              logo: { '@type': 'ImageObject', url: 'https://socialdevtechnologies.com/logo-icon.webp' },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://socialdevtechnologies.com/guides/${guide.slug}`,
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://socialdevtechnologies.com/' },
              { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://socialdevtechnologies.com/guides' },
              { '@type': 'ListItem', position: 3, name: guide.title, item: `https://socialdevtechnologies.com/guides/${guide.slug}` },
            ],
          },
          ...(guide.faqs?.length
            ? [{
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: guide.faqs.map((f) => ({
                  '@type': 'Question',
                  name: f.q,
                  acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
              }]
            : []),
        ]
      : undefined,
  });

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
      </div>
    );
  }

  if (!guide) return <NotFound />;

  const faqs = guide.faqs || [];

  // Below lg there's no real gutter for ShareRail's collapsed toggle to sit
  // in without it, so it just overlays the top-left corner of the text —
  // `fixed`, out of flow, doesn't push the column over. Normal symmetric
  // padding here, same as every other content page.
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ShareRail section="guides" slug={guide.slug} title={guide.title} />

      <Link
        to="/guides"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-brand transition-colors mb-7"
      >
        <ArrowLeft className="w-4 h-4" /> All guides
      </Link>

      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand bg-[#F3EBFF] dark:bg-brand/15 rounded-full px-3 py-1">
          <span>{guide.emoji}</span> {CATEGORY_LABEL[guide.category] || 'Guide'}
        </span>
        {guide.reading_time && (
          <span className="text-[12.5px] text-gray-400 font-semibold">{guide.reading_time}</span>
        )}
      </div>

      <h1 className="font-display font-extrabold text-[34px] sm:text-[42px] leading-[1.08] text-ink tracking-[-0.8px]">
        {guide.title}
      </h1>

      {guide.image_url && (
        <img
          src={guide.image_url}
          alt=""
          className="w-full aspect-[16/9] object-cover rounded-2xl mt-6"
        />
      )}

      <GuideBody blocks={guide.body_blocks} />

      {faqs.length > 0 && (
        <div className="pt-9 mt-1 border-t border-border-soft">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">Common questions</div>
          <h2 className="font-display text-2xl sm:text-[28px] font-extrabold text-ink mb-2">
            Frequently asked questions
          </h2>
          <div className="mt-2">
            {faqs.map((f) => (
              <div key={f.q} className="py-4 border-b border-border-soft last:border-none">
                <h3 className="font-display font-bold text-[15.5px] text-ink mb-1.5">{f.q}</h3>
                <p className="text-[14.5px] text-body leading-relaxed m-0">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Placed after the FAQs but before "Keep reading": the moment the
          reader has finished the guide is when they'd share it, and putting
          it after the related-links grid buries it under a second call to
          action. */}
      <ShareRow section="guides" slug={guide.slug} title={guide.title} />

      <EmailCapture source="guide-page" className="mt-8" />

      {related.length > 0 && (
        <div className="mt-10 pt-8 border-t border-border-soft">
          <h2 className="font-display font-extrabold text-lg text-ink mb-4">Keep reading</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {related.map((g) => (
              <Link
                key={g.slug}
                to={`/guides/${g.slug}`}
                className="flex items-start gap-3 rounded-xl border border-border-soft bg-white dark:bg-[#181818] p-4 hover:border-brand/40 transition-colors"
              >
                <span className="text-xl flex-shrink-0">{g.emoji || <BookOpen className="w-5 h-5 text-brand" />}</span>
                <span className="min-w-0">
                  <span className="block font-display font-bold text-[14px] text-ink leading-snug mb-0.5">{g.title}</span>
                  {g.reading_time && <span className="block text-[12.5px] text-body leading-relaxed">{g.reading_time}</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
