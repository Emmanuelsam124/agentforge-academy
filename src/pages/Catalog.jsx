import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { agents } from '../data/agents';
import { isVisibleToPublic } from '../data/departments';
import { useFilter } from '../hooks/useFilter';
import DepartmentFilter from '../components/DepartmentFilter';
import DifficultyFilter from '../components/DifficultyFilter';
import SearchBar from '../components/SearchBar';
import AgentCard from '../components/AgentCard';
import { usePro } from '../hooks/usePro';
import { usePageSeo } from '../hooks/usePageSeo';

export default function Catalog({ progress, onSelectAgent }) {
  const { hasBuilder1, hasBuilder2, isAdmin } = usePro();

  // Canonical always points at the bare URL regardless of active filters —
  // ?q=/?department=/?difficulty= are the same underlying content filtered,
  // not distinct pages, so they shouldn't compete with each other for
  // ranking.
  usePageSeo({
    title: 'Agent Catalog — Every AI Agent You Can Build | Social Dev Technologies',
    description: 'Browse every AI agent taught across Builder 1 and Builder 2 — filter by department, difficulty, or search by name.',
    canonicalPath: '/catalog',
  });
  const [searchParams] = useSearchParams();

  // Advanced/World Class are admin-only now — hidden entirely from the
  // catalog for everyone else, not just locked.
  const visibleAgents = useMemo(
    () => (isAdmin ? agents : agents.filter((a) => isVisibleToPublic(a.difficulty))),
    [isAdmin]
  );

  const {
    department, setDepartment,
    difficulty, setDifficulty,
    search, setSearch,
    sort, setSort,
    filtered, sortOptions,
  } = useFilter(visibleAgents);

  useEffect(() => {
    const q = searchParams.get('q');
    const dept = searchParams.get('department');
    const diff = searchParams.get('difficulty');
    if (q !== null) setSearch(q);
    if (dept) setDepartment(dept);
    if (diff) setDifficulty(diff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink flex items-center gap-3">
          <LayoutGrid className="w-7 h-7 text-link" />
          Agent Catalog
        </h1>
        <p className="text-body mt-2">
          <span>{filtered.length}</span> of <span>{visibleAgents.length}</span> agents — filter by department, difficulty, or search.
        </p>
      </div>

      <div className="md:hidden">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <DepartmentFilter value={department} onChange={setDepartment} />
      <DifficultyFilter
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        sort={sort}
        onSortChange={setSort}
        sortOptions={sortOptions}
        isAdmin={isAdmin}
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <p className="text-ink font-bold text-[17px]">No agents match your filters.</p>
          <p className="text-sm text-body mt-2 mb-4">Try adjusting your search, department, or difficulty.</p>
          <button
            onClick={() => { setSearch(''); setDepartment('all'); setDifficulty('All'); }}
            className="bg-brand text-white font-bold px-5 py-2.5 rounded-xl"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              completed={progress.isCompleted(agent.id)}
              onClick={() => onSelectAgent(agent)}
              hasBuilder1={hasBuilder1}
              hasBuilder2={hasBuilder2}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
