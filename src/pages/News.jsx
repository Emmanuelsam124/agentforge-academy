import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { departments } from '../data/departments';
import EmailCapture from '../components/EmailCapture';

const PAGE_SIZE = 12;

function departmentBadges(ids) {
  return (ids || [])
    .map((id) => departments.find((d) => d.id === id))
    .filter(Boolean);
}

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // No react-helmet in this repo — same hand-rolled title/meta pattern used
  // elsewhere (see BuilderSession.jsx), save/restore on unmount so client
  // nav doesn't leak this page's tags onto the next one.
  useEffect(() => {
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    document.title = 'AI News — Social Dev Technologies';
    if (metaDesc) metaDesc.setAttribute('content', 'The AI news that actually matters for people building real agents — picked daily, explained plainly, no hype.');

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, []);

  const fetchPage = useCallback(async (offset) => {
    const { data, error } = await supabase
      .from('news_articles')
      .select('slug, title, dek, image_url, department_ids, published_at')
      .eq('is_full_article', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) return { rows: [], error };
    return { rows: data || [], error: null };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { rows } = await fetchPage(0);
      setArticles(rows);
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
    })();
  }, [fetchPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    const { rows } = await fetchPage(articles.length);
    setArticles((prev) => [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink flex items-center gap-3">
          <Newspaper className="w-7 h-7 text-brand" />
          AI News
        </h1>
        <p className="text-body mt-2">The AI news that actually matters for people building real agents — picked daily, explained plainly.</p>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
        </div>
      ) : articles.length === 0 ? (
        <div className="py-16 text-center text-body">No articles yet — check back soon.</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((a) => (
              <Link
                key={a.slug}
                to={`/news/${a.slug}`}
                className="flex flex-col bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-[18px] overflow-hidden transition-all hover:border-brand/40 hover:shadow-[0_10px_28px_-8px_rgba(124,58,237,.18)]"
              >
                {a.image_url ? (
                  <img src={a.image_url} alt="" className="w-full aspect-[16/9] object-cover" loading="lazy" />
                ) : (
                  <div className="w-full aspect-[16/9] bg-[#F3EBFF] dark:bg-white/5 flex items-center justify-center">
                    <Newspaper className="w-8 h-8 text-brand/40" />
                  </div>
                )}
                <div className="p-4.5 flex flex-col gap-2 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {departmentBadges(a.department_ids).map((d) => (
                      <span
                        key={d.id}
                        className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full"
                        style={{ background: `${d.color}1A`, color: d.color }}
                      >
                        {d.icon} {d.name}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-display font-bold text-base text-ink leading-snug">{a.title}</h3>
                  <p className="text-[13px] text-body leading-relaxed line-clamp-2 flex-1">{a.dek}</p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full border border-border-soft text-body-strong hover:border-brand/40 hover:text-brand transition-colors disabled:opacity-40"
              >
                {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Load more
              </button>
            </div>
          )}
        </>
      )}

      <EmailCapture source="news-index" className="max-w-2xl mx-auto" />
    </div>
  );
}
