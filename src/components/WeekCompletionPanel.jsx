import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, ExternalLink, Video, FileText, Loader2, Copy, Check, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCertificates } from '../hooks/useCertificates';
import { useProjectSubmission } from '../hooks/useProjectSubmission';
import { generateShareText } from '../utils/generateShareText';

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="rounded-xl border border-border-soft bg-bg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-body">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs font-semibold text-link hover:underline"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

function SubmissionForm({ onSubmit, submitting, error }) {
  const [mode, setMode] = useState('video'); // 'video' | 'text'
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'video') onSubmit({ videoUrl });
    else onSubmit({ description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('video')}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
            mode === 'video' ? 'bg-brand text-white' : 'bg-bg text-body border border-border-soft'
          }`}
        >
          <Video className="w-3.5 h-3.5" /> I made a video
        </button>
        <button
          type="button"
          onClick={() => setMode('text')}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
            mode === 'text' ? 'bg-brand text-white' : 'bg-bg text-body border border-border-soft'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> I'll write a description
        </button>
      </div>

      {mode === 'video' ? (
        <div>
          <label className="block text-xs font-medium text-body-strong mb-1.5">
            Link to your video (YouTube, Loom, Drive — anywhere it's viewable)
          </label>
          <input
            type="url"
            required
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-body-strong mb-1.5">
            What did you build, and what's a real-world use for it?
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="I built..."
            className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
          />
        </div>
      )}

      {error && <p className="text-sm text-rose">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
        Submit
      </button>
    </form>
  );
}

// Shown on a main-project session page once it's marked complete. The
// certificate itself is claimed automatically by useCertificateClaims
// (mounted globally in App.jsx) the moment `completed` includes this
// agent's id — this panel just reflects that state and layers the
// submission + share-text steps on top, per the explicit ordering: build
// complete -> certificate, then submit a video/description, then (only
// after that) optional share text.
export default function WeekCompletionPanel({ agent, week }) {
  const { user } = useAuth();
  const { certificates, loading: certLoading } = useCertificates(user?.id);
  const { submission, loading: subLoading, submit } = useProjectSubmission(user?.id, agent.id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cert = certificates.find((c) => c.tier === `week${week}`);

  const handleSubmit = async ({ videoUrl, description }) => {
    setError('');
    setSubmitting(true);
    const { error: err } = await submit({ videoUrl, description });
    if (err) setError(err.message || 'Could not save your submission.');
    setSubmitting(false);
  };

  if (certLoading || subLoading) return null;

  const shareText = submission ? generateShareText({ agent, submission }) : null;

  return (
    <div className="rounded-2xl border-[1.5px] border-brand/25 bg-[#E8EDF3] dark:bg-brand/10 p-5 sm:p-6 mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Award className="w-5 h-5 text-link" />
        <h3 className="font-display font-bold text-lg text-ink">Week <span>{week}</span> complete 🎉</h3>
      </div>
      <p className="text-sm text-body mb-4">
        This was Week <span>{week}</span>'s main project — you're good to go for the week.
      </p>

      {cert ? (
        <Link
          to={`/certificate/${cert.id}`}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors mb-5"
        >
          View your Week <span>{week}</span> certificate <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <p className="text-xs text-body mb-5">Your certificate is being issued — refresh in a moment if it doesn't appear.</p>
      )}

      <div className="border-t border-brand/20 pt-5">
        {!submission ? (
          <>
            <p className="text-sm font-bold text-ink mb-3">
              Tell us about what you built
            </p>
            <SubmissionForm onSubmit={handleSubmit} submitting={submitting} error={error} />
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-ink mb-3 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-link" /> Share what you built (optional)
            </p>
            <p className="text-xs text-body mb-4">
              Copy-paste ready for LinkedIn, Instagram, or Facebook — edit however you like before posting.
            </p>
            <div className="grid sm:grid-cols-1 gap-3">
              <CopyBlock label="LinkedIn" text={shareText.linkedin} />
              <CopyBlock label="Instagram" text={shareText.instagram} />
              <CopyBlock label="Facebook" text={shareText.facebook} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
