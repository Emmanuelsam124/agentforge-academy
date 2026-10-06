import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Lock, Loader2, CheckCircle2, Circle, Video, PlayCircle, ExternalLink,
  Copy, Check, Calendar, BookOpen, ListChecks,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { dashboardCohortStart, aiMasteryCohortDays, formatClassDay } from '../data/aiMasteryCohort';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';
import { useLiveSessions } from '../hooks/useLiveSessions';
import { usePageSeo } from '../hooks/usePageSeo';

// The three class evenings of the current/next weekly cohort, each with a
// "Join class" button. The room URL lives in public.aimastery_room (RLS: only
// enrolled students/admins can read it) and the buttons stay disabled until
// its join_enabled flag is switched on — see supabase/aimastery-room.sql.
const CLASS_DAYS = [
  { day: 'Day 1', title: 'Agent Architecture & Your First Connections' },
  { day: 'Day 2', title: 'Memory, Multi-Step Tasks & Guardrails' },
  { day: 'Day 3', title: 'Monetizing Your New Skill' },
];

function JoinRoomCards() {
  const [room, setRoom] = useState(null);
  const [start] = useState(() => dashboardCohortStart());
  const days = aiMasteryCohortDays(start);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('aimastery_room')
      .select('join_link, join_enabled')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setRoom(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canJoin = Boolean(room?.join_enabled && room?.join_link);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Video className="w-4 h-4 text-brand" />
        <h2 className="font-display font-bold text-lg text-ink">Join room</h2>
        <span className="text-xs text-body">Fri, Sat &amp; Mon · 7:00 PM WAT</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {CLASS_DAYS.map((c, i) => (
          <div key={c.day} className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] p-5 flex flex-col">
            <span className="inline-flex w-fit text-[11px] font-extrabold text-brand bg-[#F3EBFF] dark:bg-brand/15 px-2.5 py-1 rounded-full mb-2.5">{c.day}</span>
            <p className="font-display font-bold text-[15px] text-ink leading-snug">{c.title}</p>
            <p className="text-[13px] text-body mt-1.5 mb-4">{formatClassDay(days[i])} · 7:00 PM WAT</p>
            {canJoin ? (
              <a
                href={room.join_link}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-brand hover:bg-brand-deep px-4 py-2.5 rounded-xl transition-colors"
              >
                <Video className="w-4 h-4" /> Join class
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="mt-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-gray-400 bg-[#F3F1F8] dark:bg-white/5 px-4 py-2.5 rounded-xl cursor-not-allowed"
              >
                <Lock className="w-4 h-4" /> Join class
              </button>
            )}
          </div>
        ))}
      </div>
      {!canJoin && <p className="text-xs text-body mt-2.5">The join button opens when class is about to start.</p>}
    </div>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function PasscodeChip({ passcode }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(passcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs font-semibold text-body-strong bg-[#FAF8FF] dark:bg-white/5 hover:bg-[#F3EBFF] dark:hover:bg-brand/15 px-3 py-2 rounded-lg transition-colors"
      title="Copy Zoom passcode"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green" /> : <Copy className="w-3.5 h-3.5" />}
      Passcode: <span className="font-mono">{passcode}</span>
    </button>
  );
}

function OutlineItem({ session, index, isSelected, onSelect }) {
  const isPast = new Date(session.session_date) < new Date();
  const hasReplay = Boolean(session.recording_url);
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-start gap-3 text-left px-3.5 py-3 rounded-xl transition-colors ${
        isSelected ? 'bg-[#F3EBFF] dark:bg-brand/15' : 'hover:bg-[#FAF8FF] dark:hover:bg-white/5'
      }`}
    >
      {hasReplay ? (
        <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
      ) : isPast ? (
        <Circle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
      ) : (
        <Calendar className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className={`text-[13px] font-semibold leading-snug ${isSelected ? 'text-brand' : 'text-ink'}`}>
          Class {index + 1}: {session.title}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {formatDate(session.session_date)} · {hasReplay ? 'Replay available' : isPast ? 'Recording coming soon' : 'Upcoming'}
        </p>
      </div>
    </button>
  );
}

// Zoom's own recording page renders inside this iframe — see
// VibeCodingCourse.jsx's identical EmbedArea for why nothing here controls
// Zoom's own download button.
function EmbedArea({ session }) {
  const isPast = new Date(session.session_date) < new Date();
  const hasReplay = Boolean(session.recording_url);

  return (
    <div>
      <div className="rounded-2xl overflow-hidden bg-[#0A090F] aspect-video flex items-center justify-center relative">
        {hasReplay ? (
          <iframe
            key={session.id}
            src={session.recording_url}
            title={session.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : isPast ? (
          <div className="text-center px-6">
            <PlayCircle className="w-9 h-9 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm font-semibold">Recording coming soon</p>
          </div>
        ) : (
          <div className="text-center px-6">
            <Calendar className="w-9 h-9 text-brand mx-auto mb-2" />
            <p className="text-white text-sm font-semibold">This class hasn't happened yet</p>
            <p className="text-gray-400 text-xs mt-1">{formatDate(session.session_date)}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
        {hasReplay && (
          <a
            href={session.recording_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-body-strong bg-[#FAF8FF] dark:bg-white/5 hover:bg-[#F3EBFF] dark:hover:bg-brand/15 px-3 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open on Zoom
          </a>
        )}
        {session.recording_passcode && <PasscodeChip passcode={session.recording_passcode} />}
        {!isPast && session.join_link && (
          <a
            href={session.join_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand hover:bg-brand-deep px-3.5 py-2 rounded-lg transition-colors"
          >
            <Video className="w-3.5 h-3.5" /> Join live
          </a>
        )}
      </div>

      <h2 className="font-display font-bold text-lg text-ink mt-5">{session.title}</h2>
      {session.description && <p className="text-sm text-body leading-relaxed mt-1.5">{session.description}</p>}

      {session.topics?.length > 0 && (
        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand mb-2">
            <ListChecks className="w-3.5 h-3.5" /> Topics
          </p>
          <ul className="flex flex-col gap-1.5">
            {session.topics.map((t) => (
              <li key={t} className="flex items-start gap-2 text-[13px] text-body-strong">
                <Circle className="w-1.5 h-1.5 mt-1.5 fill-gray-400 text-gray-400 flex-shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {session.resources?.length > 0 && (
        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Resources
          </p>
          <div className="flex flex-col gap-2">
            {session.resources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between text-sm text-body-strong hover:text-ink bg-[#FAF8FF] dark:bg-white/5 hover:bg-[#F3EBFF] dark:hover:bg-brand/10 border border-border-soft rounded-lg px-3.5 py-2.5 transition-colors"
              >
                {r.title}
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Standalone page — same pattern as VibeCodingCourse.jsx: normal site
// Navbar/Footer, own route, not nested inside StudentDashboard's grid.
// Unlike Vibe Coding (fixed 4 weeks / 2 classes-per-week), this program's
// cadence isn't fixed yet, so classes list chronologically with no
// week-grouping — add grouping back if/when a fixed cadence is set.
export default function AIAgentMasteryCourse() {
  const { user } = useAuth();
  const { hasAiMastery, isAdmin, proLoading } = usePro();
  const liveSessions = useLiveSessions(user);
  const [selectedId, setSelectedId] = useState(null);

  usePageSeo({
    title: 'Your Classes — AI Agent Mastery | Social Dev Technologies',
    description: 'Your AI Agent Mastery classes, replays, and resources.',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loading = proLoading || liveSessions.loading;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-6 flex items-center gap-3">
        <Bot className="w-7 h-7 text-brand" /> AI Agent Mastery
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : !hasAiMastery && !isAdmin ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
          <Lock className="w-8 h-8 text-brand mx-auto mb-3" />
          <p className="text-ink font-bold">This is AI Agent Mastery content</p>
          <p className="text-sm text-body mt-1 mb-4">Join the cohort to unlock your classes.</p>
          <Link to="/ai-agent-mastery#pricing" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
            See the offer
          </Link>
        </div>
      ) : (
        <>
          <JoinRoomCards />
          <AIAgentMasteryCourseBody liveSessions={liveSessions} selectedId={selectedId} setSelectedId={setSelectedId} />
        </>
      )}
    </div>
  );
}

function AIAgentMasteryCourseBody({ liveSessions, selectedId, setSelectedId }) {
  const sessions = liveSessions.sessions
    .filter((s) => s.tier === 'aimastery')
    .slice()
    .sort((a, b) => new Date(a.session_date) - new Date(b.session_date));

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-ink font-bold">No classes scheduled yet</p>
        <p className="text-sm text-body mt-1">Your classes will show up here as they're scheduled.</p>
      </div>
    );
  }

  const now = new Date();
  // Default to the most recent class with a replay, else the next upcoming
  // one, else just the last scheduled class — always land somewhere useful.
  const defaultSession =
    [...sessions].reverse().find((s) => s.recording_url) ||
    sessions.find((s) => new Date(s.session_date) >= now) ||
    sessions[sessions.length - 1];
  const selected = sessions.find((s) => s.id === selectedId) || defaultSession;

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
      {/* Right on desktop, but comes first in DOM so mobile shows video before outline */}
      <div className="order-1 lg:order-2 lg:col-start-2">
        <EmbedArea session={selected} />
      </div>

      <div className="order-2 lg:order-1 lg:col-start-1 rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] overflow-hidden lg:sticky lg:top-24 px-1.5 py-1.5 flex flex-col gap-0.5">
        {sessions.map((s, index) => (
          <OutlineItem
            key={s.id}
            session={s}
            index={index}
            isSelected={s.id === selected.id}
            onSelect={() => setSelectedId(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
