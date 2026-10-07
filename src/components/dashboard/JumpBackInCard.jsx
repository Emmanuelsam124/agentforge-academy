import { Link } from 'react-router-dom';
import { Video, Users, FolderGit2, ArrowRight } from 'lucide-react';

function formatSessionTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

// Persistent across every /dashboard/* page (rendered once by
// StudentDashboard's layout, not per-page) — quick links to the things a
// returning student most often wants without hunting through the sidebar.
export default function JumpBackInCard({ nextSession }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-5">
      <h3 className="font-display font-bold text-sm text-ink mb-3.5">Jump back in</h3>
      <div className="flex flex-col gap-2.5">
        {nextSession ? (
          <a
            href={nextSession.join_link || undefined}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors ${
              nextSession.join_link
                ? 'bg-[#E8EDF3] dark:bg-brand/15 hover:bg-[#E5ECF5] dark:hover:bg-brand/25'
                : 'bg-[#F6F8FB] dark:bg-white/5 pointer-events-none opacity-70'
            }`}
          >
            <Video className="w-4 h-4 text-link flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink truncate">Join live room</p>
              <p className="text-xs text-body truncate">{formatSessionTime(nextSession.session_date)}</p>
            </div>
          </a>
        ) : (
          <Link
            to="/dashboard/live-sessions"
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/15 transition-colors"
          >
            <Video className="w-4 h-4 text-link flex-shrink-0" />
            <p className="text-sm font-bold text-ink">No sessions scheduled yet</p>
          </Link>
        )}

        <Link
          to="/dashboard/live-sessions"
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/15 transition-colors"
        >
          <Users className="w-4 h-4 text-link flex-shrink-0" />
          <p className="text-sm font-bold text-ink">See all live sessions</p>
        </Link>

        <Link
          to="/catalog"
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/15 transition-colors"
        >
          <FolderGit2 className="w-4 h-4 text-link flex-shrink-0" />
          <p className="text-sm font-bold text-ink flex-1">Browse resources</p>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}
