import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, Flag } from 'lucide-react';
import { getBuilderPagePath, groupAgentsByWeek } from '../data/agents';
import ProgressBar from './ProgressBar';

// Tiers with a dedicated pre-course guide — rendered as item 0 in the same
// list as the real sessions (not a separate button above it) so the whole
// course reads as one sequence with one Previous/Next, not two systems
// glued together.
const GUIDE_PATH = {
  'Builder 1': '/builder-1-guide',
};

function LessonRow({ agent, i, currentSlug, progress, onNavigate }) {
  const isCurrent = agent.slug === currentSlug;
  const isDone = progress.isCompleted(agent.id);
  return (
    <li>
      <Link
        to={getBuilderPagePath(agent)}
        onClick={onNavigate}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
          isCurrent
            ? 'bg-[#E8EDF3] dark:bg-brand/15 text-link font-bold'
            : 'text-body hover:bg-[#F6F8FB] dark:hover:bg-white/5 hover:text-ink'
        }`}
      >
        {isDone ? (
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green" />
        ) : (
          <Circle className="w-4 h-4 flex-shrink-0 text-gray-300 dark:text-gray-600" />
        )}
        <span className="text-[11px] font-mono text-gray-400 flex-shrink-0 w-4 text-right">{i + 1}</span>
        <span className="truncate flex-1 min-w-0">{agent.title}</span>
        {agent.isMainProject && (
          <span className="text-[9px] font-bold uppercase tracking-wide text-link bg-brand/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
            Main
          </span>
        )}
      </Link>
    </li>
  );
}

function LessonList({ tier, tierAgents, currentSlug, progress, onNavigate }) {
  const location = useLocation();
  const guidePath = GUIDE_PATH[tier];
  const weeks = groupAgentsByWeek(tierAgents);

  const guideItem = guidePath && (
    <li>
      <Link
        to={guidePath}
        onClick={onNavigate}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
          location.pathname === guidePath
            ? 'bg-[#E8EDF3] dark:bg-brand/15 text-link font-bold'
            : 'text-body hover:bg-[#F6F8FB] dark:hover:bg-white/5 hover:text-ink'
        }`}
      >
        <Flag className="w-4 h-4 flex-shrink-0" />
        <span className="text-[11px] font-mono text-gray-400 flex-shrink-0 w-4 text-right">·</span>
        <span className="truncate">Getting Started</span>
      </Link>
    </li>
  );

  // Weeks 1-4, one section each with its own header — falls back to a flat
  // list for tiers without week data (Builder 2 doesn't have it yet).
  // Start indices are computed up front (not mutated during the render map)
  // so numbering stays 1, 2, 3... continuously across week boundaries.
  if (weeks.length > 0) {
    const weeksWithStart = weeks.reduce((acc, w) => {
      const prev = acc[acc.length - 1];
      const startIndex = prev ? prev.startIndex + prev.agents.length : 0;
      return [...acc, { ...w, startIndex }];
    }, []);

    return (
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col gap-0.5">{guideItem}</ul>
        {weeksWithStart.map(({ week, agents: weekAgents, startIndex }) => {
          return (
            <div key={week}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1">Week <span>{week}</span></p>
              <ul className="flex flex-col gap-0.5">
                {weekAgents.map((agent, i) => (
                  <LessonRow
                    key={agent.id}
                    agent={agent}
                    i={startIndex + i}
                    currentSlug={currentSlug}
                    progress={progress}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {guideItem}
      {tierAgents.map((agent, i) => (
        <LessonRow
          key={agent.id}
          agent={agent}
          i={i}
          currentSlug={currentSlug}
          progress={progress}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  );
}

export default function CourseSidebar({ tier, tierAgents, currentSlug, progress }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const completedCount = tierAgents.filter((a) => progress.isCompleted(a.id)).length;

  return (
    <>
      {/* Desktop — persistent sticky sidebar */}
      <aside className="hidden lg:block sticky top-24 self-start w-full rounded-xl border border-border-soft bg-[#F6F8FB] dark:bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-body mb-2"><span>{tier}</span> Sessions</p>
        <div className="mb-4">
          <ProgressBar value={completedCount} max={tierAgents.length} showLabel={false} height="h-1.5" />
          <p className="text-xs text-body mt-1.5"><span>{completedCount}</span> / <span>{tierAgents.length}</span> complete</p>
        </div>
        <LessonList tier={tier} tierAgents={tierAgents} currentSlug={currentSlug} progress={progress} />
      </aside>

      {/* Mobile — collapsible toggle above the content */}
      <div className="lg:hidden rounded-xl border border-border-soft bg-[#F6F8FB] dark:bg-white/5 overflow-hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-ink">
            <span>{tier}</span> Course Menu
            <span className="text-xs font-medium text-body">(<span>{completedCount}</span>/<span>{tierAgents.length}</span>)</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {mobileOpen && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3">
                <LessonList
                  tier={tier}
                  tierAgents={tierAgents}
                  currentSlug={currentSlug}
                  progress={progress}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
