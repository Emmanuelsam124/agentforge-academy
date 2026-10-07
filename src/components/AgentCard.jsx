import { CheckCircle2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDifficulty, hasAccessToDifficulty } from '../data/departments';
import { getTechColor } from '../data/techStack';
import { getBuilderPagePath } from '../data/agents';

import EmojiIcon from './EmojiIcon';
export default function AgentCard({ agent, completed, onClick, hasBuilder1 = false, hasBuilder2 = false, isAdmin = false }) {
  const difficulty = getDifficulty(agent.difficulty);
  const unlocked = hasAccessToDifficulty(agent.difficulty, { hasBuilder1, hasBuilder2, isAdmin });
  const locked = !unlocked;

  const card = (
    <div className="relative flex flex-col gap-2 text-left bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-[18px] p-4.5 h-full transition-all hover:border-brand/40 hover:shadow-[0_10px_28px_-8px_rgba(15,26,42,.18)]">
      {completed && (
        <div className="absolute top-3 right-3 z-10 bg-green rounded-full p-1 shadow">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}
      {locked && !completed && (
        <div className="absolute top-3 right-3 z-10 bg-white dark:bg-[#131E2F] border border-border rounded-full p-1.5 shadow">
          <Lock className="w-3.5 h-3.5 text-link" />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full"
          style={{ background: difficulty.tint, color: difficulty.color }}
        >
          <EmojiIcon emoji={difficulty.icon} className="w-3.5 h-3.5" /> <span>{difficulty.label}</span>
        </span>
        <EmojiIcon emoji={agent.emoji} className="w-[18px] h-[18px] text-link" />
      </div>

      <h3 className="font-display font-bold text-base text-ink leading-snug mt-0.5">{agent.title}</h3>
      <p className="text-[13px] text-body leading-relaxed line-clamp-2 flex-1">{agent.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {agent.techStack.slice(0, 3).map((tech) => (
          <span
            key={tech}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border text-body-strong"
            style={{ borderColor: `${getTechColor(tech)}55` }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getTechColor(tech) }} />
            {tech}
          </span>
        ))}
      </div>

      <div className="flex justify-between text-[12.5px] text-[#6A7582] dark:text-[#99A4B2] font-semibold pt-2 border-t border-border-soft">
        <span>{agent.buildTime}</span>
        <span className="inline-flex items-center gap-1"><EmojiIcon emoji="⚡" className="w-3.5 h-3.5" /> <span>{agent.xp}</span> XP</span>
      </div>

      {locked && (
        <div className="mt-1 text-center text-[12.5px] font-bold text-link bg-[#E8EDF3] dark:bg-brand/15 rounded-lg py-2">
          Upgrade to unlock
        </div>
      )}
    </div>
  );

  // Builder 1/2 agents have their own dedicated page (better for SEO) —
  // always link there, locked or not, since the page itself renders the
  // paywall state instead of bouncing straight to /pricing with no agent context.
  const builderPagePath = getBuilderPagePath(agent);
  if (builderPagePath) {
    return (
      <Link to={builderPagePath} className="block h-full">
        {card}
      </Link>
    );
  }

  if (locked) {
    return (
      <Link to="/pricing" className="block h-full">
        {card}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="text-left w-full h-full">
      {card}
    </button>
  );
}
