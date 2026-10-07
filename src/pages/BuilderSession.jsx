import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Lock, Clock, CheckCircle2, Sparkles,
  ListChecks, BookOpen, ExternalLink, Loader2, ArrowLeft, Circle, Wrench, Info,
} from 'lucide-react';
import { getAgentsByDifficulty, getBuilderPagePath } from '../data/agents';
import { getDifficulty } from '../data/departments';
import { getTechColor } from '../data/techStack';
import { useCourseContent } from '../hooks/useCourseContent';
import { useTheme } from '../context/ThemeContext';
import XPBadge from '../components/XPBadge';
import SessionGuide from '../components/SessionGuide';
import CourseSidebar from '../components/CourseSidebar';
import WeekCompletionPanel from '../components/WeekCompletionPanel';
import NotFound from './NotFound';

import EmojiIcon from '../components/EmojiIcon';
export default function BuilderSession({ progress, tier }) {
  const { slug } = useParams();
  const { theme } = useTheme();
  const [showXpPop, setShowXpPop] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const endRef = useRef(null);

  // Reset the scroll gate when switching sessions. Done during render rather
  // than inside the observer effect below, so changing session doesn't render
  // once with the previous session's reachedEnd before clearing it.
  const [observedSlug, setObservedSlug] = useState(slug);
  if (observedSlug !== slug) {
    setObservedSlug(slug);
    setReachedEnd(false);
  }

  const tierAgents = getAgentsByDifficulty(tier);
  const index = tierAgents.findIndex((a) => a.slug === slug);
  const agent = index !== -1 ? tierAgents[index] : null;
  const prevAgent = index > 0 ? tierAgents[index - 1] : null;
  const nextAgent = index !== -1 && index < tierAgents.length - 1 ? tierAgents[index + 1] : null;
  // Builder 1's first session links back to the getting-started guide
  // (itself item 0 in CourseSidebar's list) rather than having no
  // Previous at all — only Builder 1 has a guide, so this is scoped to
  // that tier's first session specifically.
  const showGuideBack = tier === 'Builder 1' && index === 0;
  const difficulty = getDifficulty(tier);

  const { content, loading, locked } = useCourseContent(agent?.id);

  // SEO — each session gets its own title + description, restored on unmount
  // so navigating away doesn't leave stale tags on the next page.
  useEffect(() => {
    if (!agent) return;
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    document.title = `${agent.title} — ${tier} Session Guide | Social Dev Technologies`;
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        `${agent.description} Step-by-step ${tier} session guide — ${agent.buildTime}, ${agent.xp} XP.`
      );
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, [agent, tier]);

  // Canonical — kept as its own effect (not folded into the title/description
  // one above) since combining them tripped the react-compiler eslint plugin's
  // immutability check on this particular component; isolated like this it's
  // clean, same net behavior.
  useEffect(() => {
    if (!agent) return;
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    const hadCanonical = Boolean(canonicalEl);
    const prevCanonical = canonicalEl?.getAttribute('href');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', `https://socialdevtechnologies.com${getBuilderPagePath(agent)}`);

    return () => {
      if (hadCanonical && prevCanonical) canonicalEl.setAttribute('href', prevCanonical);
      else canonicalEl.remove();
    };
  }, [agent]);

  // Structured data — Course rich results in Google Search. Injected per
  // session (not baked into index.html) since name/description/URL differ
  // per agent; removed on unmount so it doesn't leak onto the next page.
  useEffect(() => {
    if (!agent) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: agent.title,
      description: agent.description,
      url: `https://socialdevtechnologies.com${getBuilderPagePath(agent)}`,
      provider: {
        '@type': 'Organization',
        name: 'Social Dev Technologies',
        sameAs: 'https://socialdevtechnologies.com',
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: agent.buildTime,
      },
      // Tells crawlers the step-by-step guide is behind a legitimate paywall
      // rather than thin/low-quality content — see Google's paywalled-content
      // structured data guidance. The public teaser (title, description, tech
      // stack, prerequisites) stays outside this, so it's still what search
      // snippets draw from.
      isAccessibleForFree: false,
      hasPart: {
        '@type': 'WebPageElement',
        isAccessibleForFree: false,
        cssSelector: '#session-guide, #resources',
      },
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [agent]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Gate "Mark Complete" behind having actually scrolled through the
  // session — re-observes the sentinel at the bottom of the page content
  // whenever the session changes.
  useEffect(() => {
    const node = endRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setReachedEnd(true);
      },
      { threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [slug]);

  if (!agent) return <NotFound />;

  const completed = progress.isCompleted(agent.id);

  const handleComplete = () => {
    if (!completed) {
      setShowXpPop(true);
      setTimeout(() => setShowXpPop(false), 1400);
    }
    progress.toggleComplete(agent);
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
          <CourseSidebar tier={tier} tierAgents={tierAgents} currentSlug={slug} progress={progress} />
          <div className="min-w-0">
        <Link
          to={`/catalog?difficulty=${encodeURIComponent(tier)}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-link transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to <span>{tier}</span> catalog
        </Link>

        {/* Hero */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-[1.5px] border-border-soft p-6 sm:p-8 mb-8"
          style={{
            background: theme === 'dark'
              ? '#131E2F'
              : '#EEF2F7',
          }}
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-link bg-white dark:bg-[#131E2F] border border-brand/25 rounded-full px-3 py-1.5 mb-4">
            <EmojiIcon emoji={difficulty.icon} className="inline-block w-4 h-4 align-[-3px]" /> <span>{tier}</span> · Session <span>{index + 1}</span> of <span>{tierAgents.length}</span>
          </span>
          <div className="flex items-start gap-4">
            <EmojiIcon emoji={agent.emoji} className="w-14 h-14 sm:w-16 sm:h-16 text-link" />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-tight">{agent.title}</h1>
              <p className="text-body text-sm sm:text-base mt-2 max-w-2xl">{agent.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="flex items-center gap-1 text-xs font-semibold text-body">
                  <Clock className="w-3.5 h-3.5" /> <span>{agent.buildTime}</span>
                </span>
                <XPBadge xp={agent.xp} size="sm" />
              </div>
            </div>
          </div>
        </m.div>

        <div className="flex items-start gap-2 text-[13px] text-link bg-[#E8EDF3] dark:bg-brand/15 rounded-lg px-3.5 py-2.5 mb-8">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          All you need is a free Gemini API key from Google AI Studio — no paid AI subscription required to follow along with this build.
        </div>

        {/* Mark complete */}
        <div className="relative flex items-center justify-between gap-4 rounded-xl border border-border-soft bg-[#F6F8FB] dark:bg-white/5 px-5 py-4 mb-8">
          <AnimatePresence>
            {showXpPop && (
              <m.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -36, scale: 1.1 }}
                exit={{ opacity: 0, y: -56 }}
                transition={{ duration: 1.2 }}
                className="absolute left-5 -top-2 text-amber-600 font-extrabold text-lg pointer-events-none flex items-center gap-1"
              >
                <Sparkles className="w-5 h-5" /> +<span>{agent.xp}</span> XP!
              </m.div>
            )}
          </AnimatePresence>
          <p className="text-sm text-body">
            {locked
              ? 'Unlock this session to mark it complete and earn XP.'
              : completed
              ? 'Marked as completed — great work!'
              : reachedEnd
              ? 'Mark this session complete to earn XP.'
              : 'Scroll to the end of the session to mark it complete.'}
          </p>
          {locked ? (
            <Link
              to="/pricing"
              className="flex items-center gap-2 font-bold rounded-lg px-5 py-2.5 flex-shrink-0 bg-white dark:bg-[#131E2F] border border-border-soft text-body-strong hover:border-brand/40 transition-colors"
            >
              <Lock className="w-4 h-4" /> See plans
            </Link>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading || (!completed && !reachedEnd)}
              className={`flex items-center gap-2 font-bold rounded-lg px-5 py-2.5 transition-all flex-shrink-0 ${
                completed
                  ? 'bg-[#EAFAF1] dark:bg-green/10 text-green border border-green/30 hover:bg-green/10'
                  : 'bg-green text-white hover:brightness-95 shadow-lg shadow-green/20'
              } ${loading || (!completed && !reachedEnd) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {completed ? 'Completed' : 'Mark Complete'}
            </button>
          )}
        </div>

        {agent.isMainProject && completed && (
          <WeekCompletionPanel agent={agent} week={agent.week} />
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-body gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading session guide…
          </div>
        )}

        {!loading && locked && (
          <div className="flex flex-col items-center text-center gap-3 py-16 border-2 border-dashed border-border rounded-2xl mb-8">
            <Lock className="w-8 h-8 text-link" />
            <p className="font-bold text-ink">This session's guide is <span>{tier}</span> content</p>
            <p className="text-sm text-body max-w-sm">
              Get <span>{tier}</span> (or the Pro bundle) to unlock the full step-by-step build, prompts, and resources — permanent access, yours to keep.
            </p>
            <Link
              to="/pricing"
              className="mt-2 inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              See plans
            </Link>
          </div>
        )}

        {!loading && (!locked) && content?.session && (
          <div id="session-guide" className="mb-8">
            <SessionGuide session={content.session} troubleshooting={content.troubleshooting} />
          </div>
        )}

        {/* Tech stack + prerequisites — public metadata, always shown */}
        <section className="grid sm:grid-cols-2 gap-6 mb-8">
          <div>
            <SectionTitle icon={Wrench} title="Tech Stack" />
            <div className="flex flex-wrap gap-2">
              {agent.techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border text-body-strong"
                  style={{ borderColor: `${getTechColor(tech)}55` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getTechColor(tech) }} />
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle icon={ListChecks} title="Prerequisites" />
            <ul className="space-y-1.5">
              {agent.prerequisites.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-body">
                  <Circle className="w-2 h-2 mt-1.5 fill-gray-400 text-gray-400 flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Resources — gated, from fetched content */}
        {!loading && (!locked) && content?.resources?.length > 0 && (
          <section id="resources" className="mb-8">
            <SectionTitle icon={BookOpen} title="Resources" />
            <div className="flex flex-col gap-2">
              {content.resources.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm text-body-strong hover:text-ink bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/10 border border-border-soft rounded-lg px-3.5 py-2.5 transition-colors"
                >
                  {r.title}
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Previous / Next — cycle through this tier's sequence */}
        {(prevAgent || nextAgent || showGuideBack) && (
          <div className="flex items-stretch justify-between gap-3 pt-6 border-t border-border-soft">
            {prevAgent ? (
              <Link
                to={getBuilderPagePath(prevAgent)}
                className="flex items-center gap-2 bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft hover:border-brand/40 rounded-xl pl-2.5 pr-4 py-2.5 transition-colors min-w-0"
              >
                <ChevronLeft className="w-4 h-4 text-link flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-400">Previous</span>
                  <span className="block text-xs sm:text-sm font-bold text-ink truncate">{prevAgent.title}</span>
                </span>
              </Link>
            ) : showGuideBack ? (
              <Link
                to="/builder-1-guide"
                className="flex items-center gap-2 bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft hover:border-brand/40 rounded-xl pl-2.5 pr-4 py-2.5 transition-colors min-w-0"
              >
                <ChevronLeft className="w-4 h-4 text-link flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-400">Previous</span>
                  <span className="block text-xs sm:text-sm font-bold text-ink truncate">Getting Started Guide</span>
                </span>
              </Link>
            ) : <span />}
            {nextAgent && (
              <Link
                to={getBuilderPagePath(nextAgent)}
                className="flex items-center gap-2 bg-brand hover:bg-brand-deep text-white rounded-xl pl-4 pr-2.5 py-2.5 transition-colors min-w-0"
              >
                <span className="min-w-0 text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-white/70">Next</span>
                  <span className="block text-xs sm:text-sm font-bold truncate">{nextAgent.title}</span>
                </span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </Link>
            )}
          </div>
        )}
        <div ref={endRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-link" />
      <h3 className="font-bold text-ink text-sm uppercase tracking-wide">{title}</h3>
    </div>
  );
}
