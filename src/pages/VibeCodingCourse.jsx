import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Lock, Loader2, CheckCircle2, Circle, Video, PlayCircle, ExternalLink,
  Copy, Check, Calendar, BookOpen, ListChecks,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';
import { useLiveSessions } from '../hooks/useLiveSessions';
import { usePageSeo } from '../hooks/usePageSeo';

// Fixed at 2 classes/week (4 weeks, 8 classes total — see the bootcamp
// curriculum). live_sessions has no explicit week column, so this groups
// chronologically rather than adding a vibecoding-specific column to a
// table shared with builder1/builder2.
const CLASSES_PER_WEEK = 2;

function groupIntoWeeks(sessions) {
  const weeks = [];
  for (let i = 0; i < sessions.length; i += CLASSES_PER_WEEK) {
    weeks.push({ week: weeks.length + 1, sessions: sessions.slice(i, i + CLASSES_PER_WEEK) });
  }
  return weeks;
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
      className="flex items-center gap-1.5 text-xs font-semibold text-body-strong bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/15 px-3 py-2 rounded-lg transition-colors"
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
        isSelected ? 'bg-[#E8EDF3] dark:bg-brand/15' : 'hover:bg-[#F6F8FB] dark:hover:bg-white/5'
      }`}
    >
      {hasReplay ? (
        <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
      ) : isPast ? (
        <Circle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
      ) : (
        <Calendar className="w-4 h-4 text-link mt-0.5 flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className={`text-[13px] font-semibold leading-snug ${isSelected ? 'text-link' : 'text-ink'}`}>
          Class {index + 1}: {session.title}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {formatDate(session.session_date)} · {hasReplay ? 'Replay available' : isPast ? 'Recording coming soon' : 'Upcoming'}
        </p>
      </div>
    </button>
  );
}

// Zoom's own recording page renders inside this iframe — its download
// button (if shown at all) is governed by Zoom's own recording-sharing
// settings, not by anything here. Turn off "allow viewers to download" on
// the Zoom side (account-wide or per share link) if that matters — no
// amount of iframe/JS on our end can remove a button Zoom's own page
// renders inside its own document.
function EmbedArea({ session }) {
  const isPast = new Date(session.session_date) < new Date();
  const hasReplay = Boolean(session.recording_url);

  return (
    <div>
      <div className="rounded-2xl overflow-hidden bg-[#0C1420] aspect-video flex items-center justify-center relative">
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
            <Calendar className="w-9 h-9 text-link mx-auto mb-2" />
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-body-strong bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/15 px-3 py-2 rounded-lg transition-colors"
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
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-link mb-2">
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
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-link mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Resources
          </p>
          <div className="flex flex-col gap-2">
            {session.resources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between text-sm text-body-strong hover:text-ink bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/10 border border-border-soft rounded-lg px-3.5 py-2.5 transition-colors"
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

// Standalone page — same pattern as Builder 1/2's own course pages
// (BuilderSession.jsx): normal site Navbar/Footer, own route, not nested
// inside StudentDashboard's grid (which otherwise reserves space for the
// "Jump back in" widget on every /dashboard/* page regardless of content).
export default function VibeCodingCourse() {
  const { user } = useAuth();
  const { hasVibeCoding, isAdmin, proLoading } = usePro();
  const liveSessions = useLiveSessions(user);
  const [selectedId, setSelectedId] = useState(null);

  usePageSeo({
    title: 'Your Classes — Vibe Coding Bootcamp | Social Dev Technologies',
    description: 'Your Vibe Coding Bootcamp classes, replays, and resources.',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loading = proLoading || liveSessions.loading;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-6 flex items-center gap-3">
        <Sparkles className="w-7 h-7 text-link" /> Vibe Coding Bootcamp
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-link" />
        </div>
      ) : !hasVibeCoding && !isAdmin ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
          <Lock className="w-8 h-8 text-link mx-auto mb-3" />
          <p className="text-ink font-bold">This is Vibe Coding Bootcamp content</p>
          <p className="text-sm text-body mt-1 mb-4">Join the launch cohort to unlock your classes.</p>
          <Link to="/vibe-coding#pricing" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
            See the offer
          </Link>
        </div>
      ) : (
        <VibeCodingCourseBody liveSessions={liveSessions} selectedId={selectedId} setSelectedId={setSelectedId} />
      )}
    </div>
  );
}

function VibeCodingCourseBody({ liveSessions, selectedId, setSelectedId }) {
  const sessions = liveSessions.sessions
    .filter((s) => s.tier === 'vibecoding')
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

  const weeks = groupIntoWeeks(sessions);
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

      <div className="order-2 lg:order-1 lg:col-start-1 rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] overflow-hidden lg:sticky lg:top-24">
        {weeks.map((w) => (
          <div key={w.week} className="border-b border-border-soft last:border-b-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 px-3.5 pt-3.5 pb-1.5">Week {w.week}</p>
            <div className="px-1.5 pb-1.5 flex flex-col gap-0.5">
              {w.sessions.map((s) => {
                const index = sessions.indexOf(s);
                return (
                  <OutlineItem
                    key={s.id}
                    session={s}
                    index={index}
                    isSelected={s.id === selected.id}
                    onSelect={() => setSelectedId(s.id)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
