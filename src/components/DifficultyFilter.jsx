import { ChevronDown } from 'lucide-react';
import { difficultyLevels, publicDifficultyLevels } from '../data/departments';

export default function DifficultyFilter({ difficulty, onDifficultyChange, sort, onSortChange, sortOptions, isAdmin = false }) {
  const levels = isAdmin ? difficultyLevels : publicDifficultyLevels;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onDifficultyChange('All')}
          className={`font-bold text-[13px] px-3.5 py-2 rounded-full border-[1.5px] transition-colors ${
            difficulty === 'All' ? 'bg-brand border-brand text-white' : 'bg-[#F6F8FB] dark:bg-[#131E2F] border-border text-body-strong hover:border-brand/50'
          }`}
        >
          All Levels
        </button>
        {levels.map((level) => {
          const active = difficulty === level.id;
          return (
            <button
              key={level.id}
              onClick={() => onDifficultyChange(level.id)}
              className={`flex items-center gap-1.5 font-bold text-[13px] px-3.5 py-2 rounded-full border-[1.5px] transition-colors ${
                active ? 'text-white' : 'bg-[#F6F8FB] dark:bg-[#131E2F] border-border text-body-strong hover:border-brand/50'
              }`}
              style={active ? { background: level.color, borderColor: level.color } : undefined}
            >
              <span>{level.icon}</span>
              {level.label}
              {level.adminOnly && <span className="text-[10px] opacity-70">(Admin)</span>}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="appearance-none pl-3.5 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#131E2F] border border-border text-sm font-semibold text-body-strong focus:outline-none focus:ring-2 focus:ring-brand/40 cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body pointer-events-none" />
      </div>
    </div>
  );
}
