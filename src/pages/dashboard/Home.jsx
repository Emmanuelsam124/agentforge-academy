import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CalendarPlus, Video, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import Dashboard from '../../components/Dashboard';
import ProgressBar from '../../components/ProgressBar';
import TestimonialPrompt from '../../components/TestimonialPrompt';

function formatSessionTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
  });
}

// Plain Google Calendar "template" link — no API/backend needed, just a URL
// with the right query params. Times must be UTC in Ymd\THis\Z format.
function googleCalendarLink(session) {
  const start = new Date(session.session_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // assume 1hr if no explicit end
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: session.description || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function OnboardingChecklist({ hasIndustry, hasCompletedBuild }) {
  const items = [
    { done: hasIndustry, label: 'Tell us your industry', to: '/dashboard/account' },
    { done: hasCompletedBuild, label: 'Complete your first build', to: '/catalog' },
  ];
  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return null;

  return (
    <div className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm text-ink">Get set up</h3>
        <span className="text-xs text-body font-semibold">{doneCount} / {items.length}</span>
      </div>
      <ProgressBar value={doneCount} max={items.length} showLabel={false} height="h-1.5" />
      <div className="flex flex-col gap-1 mt-3.5">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-2.5 py-1.5 text-sm text-body-strong hover:text-ink transition-colors"
          >
            {item.done ? (
              <CheckCircle2 className="w-4 h-4 text-green flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            )}
            <span className={item.done ? 'line-through text-gray-400' : ''}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { progress, onSelectAgent, liveSessions } = useOutletContext();
  const { user } = useAuth();
  const [industry, setIndustry] = useState(undefined); // undefined = loading

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setIndustry(null);
      return;
    }
    let cancelled = false;
    supabase.from('profiles').select('industry').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (!cancelled) setIndustry(data?.industry || null);
    });
    return () => { cancelled = true; };
  }, [user]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const { nextSession, upcoming } = liveSessions;

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-6">
        Hey {displayName}
      </h1>

      {nextSession && (
        <div
          className="rounded-2xl px-6 py-5 mb-6 flex items-center justify-between flex-wrap gap-4"
          style={{ background: '#264D73' }}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#D5DEE9] mb-1">Next live session</p>
            <p className="font-display font-extrabold text-lg text-white">{nextSession.title}</p>
            <p className="text-sm text-[#D5DEE9] mt-0.5">{formatSessionTime(nextSession.session_date)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={googleCalendarLink(nextSession)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <CalendarPlus className="w-4 h-4" /> Add to calendar
            </a>
            {nextSession.join_link && (
              <a
                href={nextSession.join_link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-yellow text-ink font-bold text-sm px-4 py-2.5 rounded-xl hover:brightness-95 transition-all"
              >
                <Video className="w-4 h-4" /> Join room
              </a>
            )}
          </div>
        </div>
      )}

      {industry !== undefined && (
        <OnboardingChecklist hasIndustry={Boolean(industry)} hasCompletedBuild={progress.completed.length > 0} />
      )}

      {upcoming.length > 1 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-ink">Upcoming sessions</h2>
            <Link to="/dashboard/live-sessions" className="text-sm font-semibold text-link hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcoming.slice(0, 2).map((s) => (
              <div key={s.id} className="rounded-xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-4">
                <p className="font-bold text-ink text-sm truncate">{s.title}</p>
                <p className="text-xs text-body mt-1">{formatSessionTime(s.session_date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <TestimonialPrompt completedCount={progress.completed.length} />

      <Dashboard progress={progress} onSelectAgent={onSelectAgent} />
    </div>
  );
}
