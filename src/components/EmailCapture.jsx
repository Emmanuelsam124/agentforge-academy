import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { callEmailLeads } from '../lib/emailLeads';

// Email capture for the free AI agent starter series (see
// supabase/functions/email-leads). Double opt-in: submitting only sends a
// confirmation email; nothing else is sent until its link is used.
//
// Not shown to signed-in people — they already have an account with us and get
// the product emails that apply to them; asking again would just be noise.
// `source` is stored with the sign-up so we can tell which page converts.
export default function EmailCapture({ source = 'site', className = '' }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  // Honeypot: real visitors never see or fill this; bots that do are ignored
  // server-side.
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');

  if (user) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('sending');
    const result = await callEmailLeads({ action: 'subscribe', email, source, website });
    if (!result.ok) {
      setError(result.message);
      setStatus('idle');
      return;
    }
    setStatus('sent');
  };

  return (
    <aside
      className={`rounded-2xl border-[1.5px] border-brand/25 bg-[#F7F9FC] dark:bg-brand/10 p-5 sm:p-6 ${className}`}
      aria-label="Free AI agent starter series"
    >
      {status === 'sent' ? (
        <div className="flex items-start gap-3">
          <MailCheck className="w-6 h-6 text-link flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-extrabold text-ink text-[16px] mb-1">Check your inbox</p>
            <p className="text-[14px] text-body leading-relaxed">
              We sent a confirmation link to <strong className="text-ink">{email.trim()}</strong>. Press it and your first
              email arrives straight away. Nothing there? Look in Spam or Promotions.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-link" />
            <p className="font-display font-extrabold text-ink text-[16px]">Build your first AI agent — free</p>
          </div>
          <p className="text-[14px] text-body leading-relaxed mb-4">
            A free step-by-step walkthrough and a short 3-email starter series, straight to your inbox. No paid AI
            subscription needed.
          </p>
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2.5" noValidate>
            <label className="sr-only" htmlFor={`capture-email-${source}`}>Email address</label>
            <input
              id={`capture-email-${source}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 min-w-0 rounded-xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] text-ink px-4 py-3 text-[15px] focus:outline-none focus:border-brand"
            />
            {/* Honeypot — hidden from people and from assistive tech. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-6 py-3 rounded-xl transition-colors flex-shrink-0"
            >
              {status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'sending' ? 'Sending…' : 'Send it to me'}
            </button>
          </form>
          {error && (
            <div className="mt-3 flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
          <p className="text-[12px] text-body mt-3">
            We'll email you a link to confirm. Unsubscribe any time with one click. See our{' '}
            <Link to="/legal/privacy" className="underline hover:text-link">privacy policy</Link>.
          </p>
        </>
      )}
    </aside>
  );
}
