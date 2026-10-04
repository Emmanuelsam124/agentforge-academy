import { Link } from 'react-router-dom';
import { Flame, Trophy, Sparkles, ArrowRight, FolderGit2 } from 'lucide-react';
import { agents, getNextRecommended, getBuilderPagePath } from '../data/agents';
import { difficultyLevels, publicDifficultyLevels, getDifficulty, getLevel, levels, isVisibleToPublic } from '../data/departments';
import ProgressBar from './ProgressBar';
import XPBadge from './XPBadge';
import AgentCard from './AgentCard';
import { usePro } from '../hooks/usePro';
import { useUpgradeOffer } from '../hooks/useUpgradeOffer';
import UpgradeOfferCard from './UpgradeOfferCard';

export default function Dashboard({ progress, onSelectAgent }) {
  const { hasBuilder1, hasBuilder2, isAdmin, isPro } = usePro();
  const { offer: upgradeOffer } = useUpgradeOffer();
  const { completed, xp, streak, history, isCompleted } = progress;

  // Advanced/World Class are admin-only — hide them from the catalog counts
  // and per-difficulty breakdown for everyone else.
  const visibleAgents = isAdmin ? agents : agents.filter((a) => isVisibleToPublic(a.difficulty));
  const visibleDifficulties = isAdmin ? difficultyLevels : publicDifficultyLevels;

  const level = getLevel(xp);
  const levelIdx = levels.findIndex((l) => l.name === level.name);
  const nextLevel = levels[levelIdx + 1];
  const levelProgress = nextLevel ? xp - level.min : level.max - level.min;
  const levelTarget = nextLevel ? nextLevel.min - level.min : 1;

  const completedAgents = agents.filter((a) => completed.includes(a.id));

  const recommendations = [];
  for (const agent of completedAgents) {
    const next = getNextRecommended(agent);
    if (next && isVisibleToPublic(next.difficulty) && !completed.includes(next.id) && !recommendations.find((r) => r.id === next.id)) {
      recommendations.push(next);
    }
    if (recommendations.length >= 3) break;
  }
  if (recommendations.length === 0) {
    for (const agent of visibleAgents) {
      if (!completed.includes(agent.id)) {
        recommendations.push(agent);
        if (recommendations.length >= 3) break;
      }
    }
  }

  return (
    <div className="space-y-10">
      {/* Top stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#F3EBFF] dark:bg-[#181818] p-5">
          <div className="flex items-center gap-2 text-brand mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">Total XP</span>
          </div>
          <p className="font-display text-3xl font-extrabold text-ink">{xp.toLocaleString()}</p>
          <p className="text-sm text-body mt-1">
            {level.icon} {level.name}
            {nextLevel && ` — ${(levelTarget - levelProgress).toLocaleString()} XP to ${nextLevel.name}`}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FEF9E7] dark:bg-[#181818] p-5">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">Day Streak</span>
          </div>
          <p className="font-display text-3xl font-extrabold text-ink">{streak}</p>
          <p className="text-sm text-body mt-1">Keep building daily to grow your streak</p>
        </div>

        <div className="rounded-2xl bg-[#EAFAF1] dark:bg-[#181818] p-5">
          <div className="flex items-center gap-2 text-green mb-2">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">Agents Built</span>
          </div>
          <p className="font-display text-3xl font-extrabold text-ink">
            {completed.length} <span className="text-lg text-gray-400">/ {visibleAgents.length}</span>
          </p>
          <p className="text-sm text-body mt-1">
            {Math.round((completed.length / visibleAgents.length) * 100)}% of the catalog complete
          </p>
        </div>
      </section>

      {/* Level progress */}
      {nextLevel && (
        <section className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] p-5">
          <ProgressBar
            value={levelProgress}
            max={levelTarget}
            color="#7C3AED"
            label={`${level.icon} ${level.name} → ${nextLevel.icon} ${nextLevel.name}`}
          />
        </section>
      )}

      {/* One-tier owners get the upgrade-by-difference offer; everyone else
          locked out of a tier gets the generic plans banner. */}
      {!isPro && upgradeOffer && <UpgradeOfferCard offer={upgradeOffer} />}

      {/* Upsell for locked tiers */}
      {!isPro && !upgradeOffer && (
        <section
          className="rounded-2xl px-6 sm:px-7 py-6 flex items-center justify-between flex-wrap gap-4"
          style={{ background: 'linear-gradient(120deg, #7C3AED, #9D5CFF)' }}
        >
          <div>
            <div className="font-display font-extrabold text-lg text-white">
              {hasBuilder1 || hasBuilder2 ? 'Unlock the rest of the catalog' : 'Unlock the full catalog'}
            </div>
            <div className="text-[13.5px] text-[#EDE4FF]">
              {hasBuilder1
                ? 'Get Builder 2 or upgrade to Pro to unlock every session.'
                : hasBuilder2
                ? 'Get Builder 1 or upgrade to Pro to unlock every session.'
                : 'Get Builder 1, Builder 2, or both bundled as Pro.'}
            </div>
          </div>
          <Link to="/pricing" className="bg-yellow text-ink font-extrabold px-5 py-2.5 rounded-xl flex-shrink-0">
            See plans →
          </Link>
        </section>
      )}

      {/* Progress by difficulty */}
      <section>
        <h2 className="font-display text-lg font-bold text-ink mb-4">Progress by Difficulty</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleDifficulties.map((level) => {
            const tierAgents = agents.filter((a) => a.difficulty === level.id);
            const tierCompleted = tierAgents.filter((a) => completed.includes(a.id));
            return (
              <div key={level.id} className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] p-4">
                <ProgressBar
                  value={tierCompleted.length}
                  max={tierAgents.length}
                  color={level.color}
                  label={`${level.icon} ${level.label}`}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Completed agents grid / portfolio */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand" />
            My Portfolio
          </h2>
          <span className="text-sm text-body">{completedAgents.length} completed</span>
        </div>

        {completedAgents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
            <p className="text-ink font-bold">You haven't completed any agents yet.</p>
            <p className="text-sm text-body mt-1">Browse the catalog and mark your first build complete to start earning XP.</p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 mt-4 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              Browse Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {completedAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                completed={isCompleted(agent.id)}
                onClick={() => onSelectAgent(agent)}
                hasBuilder1={hasBuilder1}
                hasBuilder2={hasBuilder2}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-4">Recommended Next</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((agent) => {
              const difficulty = getDifficulty(agent.difficulty);
              const className = "flex items-center gap-3 text-left bg-white dark:bg-[#181818] hover:bg-[#FAF8FF] dark:hover:bg-white/5 border-[1.5px] border-border-soft rounded-xl p-4 transition-colors";
              const inner = (
                <>
                  <div className="text-3xl">{agent.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-1"
                      style={{ backgroundColor: difficulty.tint, color: difficulty.color }}
                    >
                      {difficulty.icon} {difficulty.label}
                    </span>
                    <p className="font-bold text-ink text-sm leading-snug truncate">{agent.title}</p>
                  </div>
                  <XPBadge xp={agent.xp} size="sm" />
                </>
              );
              // Builder 1/2 recommendations link straight to the dedicated
              // session page — everything else still opens in the modal.
              const builderPagePath = getBuilderPagePath(agent);
              if (builderPagePath) {
                return (
                  <Link key={agent.id} to={builderPagePath} className={className}>
                    {inner}
                  </Link>
                );
              }
              return (
                <button key={agent.id} onClick={() => onSelectAgent(agent)} className={className}>
                  {inner}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent activity */}
      {history.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-4">Recent Activity</h2>
          <div className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] divide-y divide-border-soft">
            {history.slice(0, 8).map((h) => (
              <div key={`${h.id}-${h.date}`} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{h.title}</p>
                  <p className="text-xs text-gray-400">{new Date(h.date).toLocaleString()}</p>
                </div>
                <XPBadge xp={h.xp} size="sm" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
