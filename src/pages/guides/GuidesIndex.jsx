import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { usePageSeo } from '../../hooks/usePageSeo';
import EmailCapture from '../../components/EmailCapture';

const CANONICAL_PATH = '/guides';
const DESCRIPTION =
  'Plain-language guides to the AI agents businesses actually use — what each one does, where it helps, and how to run one well.';

// Client-side filter only — every guide is present in the markup regardless
// of the active pill, so a crawler sees the full list on one URL rather than
// content hidden behind a tab it can't click.
const FILTERS = [
  { id: 'all', label: 'All guides' },
  { id: 'agent-guide', label: 'Agent guides' },
  { id: 'how-to', label: 'How-tos' },
];

export default function GuidesIndex() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('guides')
      .select('slug, title, dek, category, emoji, reading_time, image_url')
      .eq('status', 'published')
      // Newest guide first. published_at is stamped once, on the first
      // draft -> published transition (admin_set_guide_status only writes it
      // `when published_at is null`), so re-publishing an edited guide can't
      // bounce it back to the top the way a `now()`-on-every-approve column
      // would. nullsFirst:false keeps an unstamped row at the bottom rather
      // than letting it head the list.
      .order('published_at', { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        if (cancelled) return;
        setGuides(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  usePageSeo({
    title: 'AI Agent Guides — Social Dev Technologies',
    description: DESCRIPTION,
    canonicalPath: CANONICAL_PATH,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'AI Agent Guides',
      description: DESCRIPTION,
      url: `https://socialdevtechnologies.com${CANONICAL_PATH}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: guides.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `https://socialdevtechnologies.com/guides/${g.slug}`,
          name: g.title,
        })),
      },
    },
  });

  const visible = filter === 'all' ? guides : guides.filter((g) => g.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink flex items-center gap-3">
        <BookOpen className="w-7 h-7 text-brand" />
        AI Agent Guides
      </h1>
      <p className="text-body mt-2.5 max-w-2xl leading-relaxed">{DESCRIPTION}</p>

      {guides.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {FILTERS.map((f) => {
            const count = f.id === 'all' ? guides.length : guides.filter((g) => g.category === f.id).length;
            if (count === 0) return null;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-[13px] font-semibold px-4 py-2 rounded-full border transition-colors ${
                  filter === f.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-[#181818] text-body-strong border-border hover:border-brand/40'
                }`}
              >
                {f.label} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-body">No guides yet — check back soon.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {visible.map((g) => (
            <Link
              key={g.slug}
              to={`/guides/${g.slug}`}
              className="group flex flex-col bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl overflow-hidden transition-all hover:border-brand/40 hover:shadow-[0_10px_28px_-8px_rgba(124,58,237,.18)]"
            >
              {g.image_url ? (
                <img src={g.image_url} alt="" className="w-full aspect-[16/9] object-cover" loading="lazy" />
              ) : (
                <div className="w-full aspect-[16/9] bg-[#F3EBFF] dark:bg-white/5 flex items-center justify-center text-4xl">
                  {g.emoji}
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h2 className="font-display font-bold text-[17px] text-ink leading-snug mb-2">{g.title}</h2>
                <p className="text-[13.5px] text-body leading-relaxed flex-1">{g.dek}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11.5px] text-gray-400 font-semibold">{g.reading_time}</span>
                  <ArrowRight className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <EmailCapture source="guides-index" className="max-w-2xl mx-auto mt-12" />
    </div>
  );
}
