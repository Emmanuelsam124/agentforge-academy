import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ExternalLink, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { departments } from '../data/departments';
import { getAgentBySlug, getBuilderPagePath } from '../data/agents';
import ArticleBody from '../components/news/ArticleBody';
import ShareRow from '../components/ShareRow';
import ShareRail from '../components/ShareRail';
import NotFound from './NotFound';

const TIER_LABEL = { builder1: 'Builder 1', builder2: 'Builder 2' };

export default function NewsArticle() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('news_articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_full_article', true)
      .maybeSingle()
      .then(({ data }) => {
        setArticle(data || null);
        setLoading(false);
      });
  }, [slug]);

  // Same hand-rolled title/meta pattern as BuilderSession.jsx — save/restore
  // on unmount so client-side nav doesn't leak this article's tags onto the
  // next page.
  useEffect(() => {
    if (!article) return;
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    document.title = `${article.title} | Social Dev Technologies News`;
    if (metaDesc) metaDesc.setAttribute('content', article.dek);

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, [article]);

  // Structured data — NewsArticle rich results, same inject/remove-on-unmount
  // technique as the Course schema in BuilderSession.jsx.
  useEffect(() => {
    if (!article) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.dek,
      image: article.image_url ? [article.image_url] : undefined,
      datePublished: article.published_at,
      author: { '@type': 'Organization', name: article.author },
      publisher: {
        '@type': 'Organization',
        name: 'Social Dev Technologies',
        logo: { '@type': 'ImageObject', url: 'https://socialdevtechnologies.com/logo-icon.webp' },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://socialdevtechnologies.com/news/${article.slug}` },
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [article]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
      </div>
    );
  }

  if (!article) return <NotFound />;

  const departmentBadges = (article.department_ids || [])
    .map((id) => departments.find((d) => d.id === id))
    .filter(Boolean);

  // Silently drops the link if the agent was renamed/removed from the
  // catalog since this article was drafted, rather than breaking the page.
  const relatedAgent = article.related_agent_slug ? getAgentBySlug(article.related_agent_slug) : null;
  const relatedAgentPath = relatedAgent ? getBuilderPagePath(relatedAgent) : null;

  // pl-12 below lg reserves just enough room for ShareRail's collapsed
  // 32px toggle — see the matching note in GuidePage.jsx and the sizes in
  // ShareRail.jsx.
  return (
    <article className="max-w-3xl mx-auto pl-12 pr-4 sm:pl-14 sm:pr-6 lg:px-8 py-10">
      <ShareRail section="news" slug={article.slug} title={article.title} />

      <div className="flex flex-wrap gap-1.5 mb-4">
        {departmentBadges.map((d) => (
          <span
            key={d.id}
            className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full"
            style={{ background: `${d.color}1A`, color: d.color }}
          >
            {d.icon} {d.name}
          </span>
        ))}
      </div>

      <h1 className="font-display font-extrabold text-[32px] sm:text-[40px] leading-[1.08] text-ink tracking-[-0.5px]">
        {article.title}
      </h1>
      <p className="text-[17px] text-body leading-relaxed mt-4">{article.dek}</p>

      <div className="flex items-center gap-2 text-[13px] text-gray-400 mt-5 pb-5 border-b border-border-soft">
        <span className="font-semibold text-body-strong">{article.author}</span>
        <span>·</span>
        <span>{new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>

      {article.image_url && (
        <img src={article.image_url} alt={article.title} className="w-full aspect-[16/9] object-cover rounded-2xl mt-6" />
      )}

      <div className="mt-8">
        <ArticleBody blocks={article.body_blocks} />
      </div>

      {relatedAgentPath && (
        <Link
          to={relatedAgentPath}
          className="flex items-center justify-between gap-3 mt-8 p-4 rounded-2xl border-[1.5px] border-brand/30 bg-[#F7F4FF] dark:bg-brand/10 hover:border-brand/60 transition-colors"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand mb-0.5">Build it yourself</p>
            <p className="font-display font-bold text-ink">{relatedAgent.title}</p>
            <p className="text-[13px] text-body">{TIER_LABEL[article.related_agent_tier]} session</p>
          </div>
          <ArrowRight className="w-5 h-5 text-brand flex-shrink-0" />
        </Link>
      )}

      <ShareRow section="news" slug={article.slug} title={article.title} />

      <a
        href={article.source_url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 text-sm font-semibold text-body-strong hover:text-brand transition-colors mt-6"
      >
        <ExternalLink className="w-4 h-4" />
        Original source: {article.source_name}
      </a>

      <Link to="/news" className="inline-block text-sm font-semibold text-brand hover:text-brand-deep transition-colors mt-6">
        ← Back to all news
      </Link>
    </article>
  );
}
