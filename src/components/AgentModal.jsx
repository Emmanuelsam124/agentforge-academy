import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, Circle, BookOpen, Wrench, ListChecks,
  ArrowRight, ExternalLink, Clock, Sparkles, Lock, Loader2, PlayCircle, FileText,
} from 'lucide-react';
import { getDifficulty } from '../data/departments';
import { getTechColor } from '../data/techStack';
import { getNextRecommended, getBuilderPagePath } from '../data/agents';
import { useCourseContent } from '../hooks/useCourseContent';
import XPBadge from './XPBadge';
import SessionGuide from './SessionGuide';
import YouTubeFacade from './YouTubeFacade';

import EmojiIcon from './EmojiIcon';
export default function AgentModal({ agent, completed, onToggleComplete, onClose, onSelectAgent }) {
  const [showXpPop, setShowXpPop] = useState(false);
  const [activeTab, setActiveTab] = useState('guide');
  const { content, loading, locked } = useCourseContent(agent?.id);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!agent) return null;

  const difficulty = getDifficulty(agent.difficulty);
  const next = getNextRecommended(agent);

  const handleComplete = () => {
    if (!completed) {
      setShowXpPop(true);
      setTimeout(() => setShowXpPop(false), 1400);
    }
    onToggleComplete(agent);
  };

  return (
    <AnimatePresence>
      <m.div
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#0F1A2A]/55 backdrop-blur-sm p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <m.div
          className="relative w-full sm:max-w-4xl h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden bg-white dark:bg-[#131E2F] border border-border-soft flex flex-col"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="relative px-6 sm:px-8 pt-8 pb-6 border-b border-border-soft"
            style={{ background: `${difficulty.color}14` }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-[#0C1420] hover:bg-[#E8EDF3] dark:hover:bg-brand/15 text-link transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <EmojiIcon emoji={agent.emoji} className="w-12 h-12 sm:w-14 sm:h-14 text-link" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md"
                    style={{ backgroundColor: difficulty.tint, color: difficulty.color }}
                  >
                    <EmojiIcon emoji={difficulty.icon} className="inline-block w-3.5 h-3.5 align-[-2px]" /> {difficulty.label}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-body">
                    <Clock className="w-3.5 h-3.5" /> {agent.buildTime}
                  </span>
                  <XPBadge xp={agent.xp} size="sm" />
                </div>
                <h2 className="font-display text-xl sm:text-3xl font-extrabold text-ink leading-tight">{agent.title}</h2>
                <p className="text-body text-sm mt-2 max-w-2xl">{agent.description}</p>
              </div>
            </div>
          </div>

          {/* Tab bar — only shown when a video exists */}
          {agent.videoId && (
            <div className="flex border-b border-border-soft px-6 sm:px-8 bg-[#F6F8FB] dark:bg-white/5">
              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'guide'
                    ? 'border-brand text-ink'
                    : 'border-transparent text-gray-400 hover:text-ink'
                }`}
              >
                <FileText className="w-4 h-4" />
                Session Guide
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'video'
                    ? 'border-brand text-ink'
                    : 'border-transparent text-gray-400 hover:text-ink'
                }`}
              >
                <PlayCircle className="w-4 h-4" />
                Watch the Build
              </button>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 sm:px-8 py-6 space-y-8">

            {/* Video tab */}
            {agent.videoId && activeTab === 'video' && (
              <div className="space-y-4">
                <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                  <YouTubeFacade
                    className="absolute inset-0 w-full h-full"
                    videoId={agent.videoId}
                    title={`How to build: ${agent.title}`}
                  />
                </div>
                <p className="text-sm text-body text-center">
                  Watch the full build, then follow the Session Guide tab to build it yourself.
                </p>
              </div>
            )}

            {/* Guide tab (or default when no video) — gated content, fetched server-side */}
            {(!agent.videoId || activeTab === 'guide') && (
              <>
                {loading && (
                  <div className="flex items-center justify-center py-16 text-body gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading session guide…
                  </div>
                )}

                {!loading && locked && (
                  <div className="flex flex-col items-center text-center gap-3 py-16 border-2 border-dashed border-border rounded-2xl">
                    <Lock className="w-8 h-8 text-link" />
                    <p className="font-bold text-ink">This session's guide is Pro content</p>
                    <p className="text-sm text-body max-w-sm">
                      Upgrade to Pro or Live Class to unlock the full step-by-step build, prompts, and resources.
                    </p>
                    <a
                      href="/pricing"
                      className="mt-2 inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                    >
                      See plans
                    </a>
                  </div>
                )}

                {!loading && !locked && content?.session && (
                  <SessionGuide session={content.session} troubleshooting={content.troubleshooting} />
                )}

                {!loading && !locked && !content?.session && content?.whatYouBuild && (
                  <section>
                    <SectionTitle icon={FileText} title="What You'll Build" />
                    <p className="text-body text-sm leading-relaxed">{content.whatYouBuild}</p>
                  </section>
                )}
              </>
            )}

            {/* Tech stack + prerequisites — public metadata, always shown */}
            <section className="grid sm:grid-cols-2 gap-6">
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
            {!loading && !locked && content?.resources?.length > 0 && (
              <section>
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

            {/* Next recommended */}
            {next && (
              <section>
                <SectionTitle icon={ArrowRight} title="Next Recommended Agent" />
                {getBuilderPagePath(next) ? (
                  <Link
                    to={getBuilderPagePath(next)}
                    className="w-full flex items-center gap-4 text-left bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/10 border border-border-soft rounded-xl p-4 transition-colors"
                  >
                    <EmojiIcon emoji={next.emoji} className="w-8 h-8 text-link flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink">{next.title}</p>
                      <p className="text-xs text-body line-clamp-1">{next.description}</p>
                    </div>
                    <XPBadge xp={next.xp} size="sm" />
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </Link>
                ) : (
                  <button
                    onClick={() => onSelectAgent(next)}
                    className="w-full flex items-center gap-4 text-left bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/10 border border-border-soft rounded-xl p-4 transition-colors"
                  >
                    <EmojiIcon emoji={next.emoji} className="w-8 h-8 text-link flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink">{next.title}</p>
                      <p className="text-xs text-body line-clamp-1">{next.description}</p>
                    </div>
                    <XPBadge xp={next.xp} size="sm" />
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                )}
              </section>
            )}
          </div>

          {/* Footer / mark complete */}
          <div className="relative border-t border-border-soft px-6 sm:px-8 py-4 bg-[#F6F8FB] dark:bg-white/5 flex items-center justify-between gap-4">
            <AnimatePresence>
              {showXpPop && (
                <m.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -40, scale: 1.1 }}
                  exit={{ opacity: 0, y: -60 }}
                  transition={{ duration: 1.2 }}
                  className="absolute left-6 sm:left-8 -top-2 text-amber-600 font-extrabold text-lg pointer-events-none flex items-center gap-1"
                >
                  <Sparkles className="w-5 h-5" /> +{agent.xp} XP!
                </m.div>
              )}
            </AnimatePresence>

            <p className="text-sm text-body hidden sm:block">
              {completed ? 'Marked as completed — great work!' : 'Mark this agent complete to earn XP.'}
            </p>
            <button
              onClick={handleComplete}
              className={`flex items-center gap-2 font-bold rounded-lg px-5 py-3 transition-all w-full sm:w-auto justify-center ${
                completed
                  ? 'bg-[#EAFAF1] dark:bg-green/10 text-green border border-green/30 hover:bg-green/10'
                  : 'bg-green text-white hover:brightness-95 shadow-lg shadow-green/20'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {completed ? 'Completed' : 'Mark Complete'}
            </button>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
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
