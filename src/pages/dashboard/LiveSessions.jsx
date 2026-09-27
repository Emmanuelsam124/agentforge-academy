import { useOutletContext } from 'react-router-dom';
import { Video, Calendar, Loader2 } from 'lucide-react';

const TIER_LABELS = { builder1: 'Builder 1', builder2: 'Builder 2', vibecoding: 'Vibe Coding', aimastery: 'AI Agent Mastery', agentslive: 'AI Agents Live' };

function formatDay(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
}

function SessionCard({ session }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] p-5 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-[#F3EBFF] dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
          <Video className="w-5 h-5 text-brand" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-ink truncate">{session.title}</p>
          {session.description && <p className="text-sm text-body truncate">{session.description}</p>}
          <p className="text-xs text-gray-400 mt-0.5">{formatTime(session.session_date)} · {TIER_LABELS[session.tier] || session.tier}</p>
        </div>
      </div>
      {session.join_link ? (
        <a
          href={session.join_link}
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 bg-brand hover:bg-brand-deep text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          Join session
        </a>
      ) : (
        <span className="flex-shrink-0 text-xs font-semibold text-gray-400 bg-[#FAF8FF] dark:bg-white/5 px-3 py-2 rounded-lg">
          Link coming soon
        </span>
      )}
    </div>
  );
}

export default function LiveSessions() {
  const { liveSessions } = useOutletContext();
  const { upcoming, loading } = liveSessions;

  // Group by calendar day, preserving chronological order.
  const groups = [];
  for (const s of upcoming) {
    const day = formatDay(s.session_date);
    let group = groups.find((g) => g.day === day);
    if (!group) {
      group = { day, sessions: [] };
      groups.push(group);
    }
    group.sessions.push(s);
  }

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-6 flex items-center gap-3">
        <Video className="w-7 h-7 text-brand" /> Live Sessions
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-ink font-bold">No sessions scheduled yet</p>
          <p className="text-sm text-body mt-1">Check back soon — new sessions show up here as they're scheduled.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <div key={g.day}>
              <p className="text-xs font-bold uppercase tracking-wide text-body mb-3">{g.day}</p>
              <div className="flex flex-col gap-3">
                {g.sessions.map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
