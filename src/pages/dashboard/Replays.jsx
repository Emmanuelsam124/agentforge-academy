import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PlayCircle, Lock, Loader2, Copy, Check } from 'lucide-react';

const TIER_LABELS = { builder1: 'Builder 1', builder2: 'Builder 2', vibecoding: 'Vibe Coding' };

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
      className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-body-strong bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/15 px-3 py-2.5 rounded-xl transition-colors"
      title="Copy Zoom passcode"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green" /> : <Copy className="w-3.5 h-3.5" />}
      Passcode: <span className="font-mono">{passcode}</span>
    </button>
  );
}

function ReplayCard({ session }) {
  const available = Boolean(session.recording_url);
  return (
    <div
      className={`rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 ${
        available
          ? 'border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F]'
          : 'border-2 border-dashed border-border'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${available ? 'bg-[#E8EDF3] dark:bg-brand/15' : 'bg-[#F6F8FB] dark:bg-white/5'}`}>
          {available ? <PlayCircle className="w-5 h-5 text-link" /> : <Lock className="w-5 h-5 text-gray-400" />}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-ink truncate">{session.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(session.session_date)} · {TIER_LABELS[session.tier] || session.tier}</p>
        </div>
      </div>
      {available ? (
        <div className="flex items-center gap-2 flex-shrink-0">
          {session.recording_passcode && <PasscodeChip passcode={session.recording_passcode} />}
          <a
            href={session.recording_url}
            target="_blank"
            rel="noreferrer"
            className="flex-shrink-0 bg-brand hover:bg-brand-deep text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            Watch replay
          </a>
        </div>
      ) : (
        <span className="flex-shrink-0 text-xs font-semibold text-gray-400 bg-[#F6F8FB] dark:bg-white/5 px-3 py-2 rounded-lg">
          Recording coming soon
        </span>
      )}
    </div>
  );
}

export default function Replays() {
  const { liveSessions } = useOutletContext();
  const { past, loading } = liveSessions;

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-6 flex items-center gap-3">
        <PlayCircle className="w-7 h-7 text-link" /> Replays
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-link" />
        </div>
      ) : past.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
          <PlayCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-ink font-bold">No past sessions yet</p>
          <p className="text-sm text-body mt-1">Replays show up here once a live session has happened.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {past.map((s) => <ReplayCard key={s.id} session={s} />)}
        </div>
      )}
    </div>
  );
}
