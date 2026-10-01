import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { invokeWithRetry } from '../lib/invokeFunction';
import { STUDENT_EMAIL_DOMAIN, AI_AGENT_MASTERY_STUDENT_PRICE, isStudentEmail } from '../data/pricing';

// BYU-Pathway "pay first" checkout: no sign-in, no code up front. Whoever
// pays gets nothing they can use directly — the account is created after
// payment and its login goes to this BYU mailbox only (see
// supabase/functions/create-student-checkout). The retype field is there
// because a typo here means the login goes to the wrong inbox.
export default function StudentCheckoutModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleClose = () => {
    setError('');
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const clean = email.trim().toLowerCase();
    if (!isStudentEmail(clean)) {
      setError(`Enter your full ${STUDENT_EMAIL_DOMAIN} email address.`);
      return;
    }
    if (clean !== confirm.trim().toLowerCase()) {
      setError("The two email addresses don't match.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: fnError } = await invokeWithRetry('create-student-checkout', {
        body: { email: clean, redirectOrigin: window.location.origin },
      });
      if (fnError) throw fnError;
      if (!data?.authorization_url) throw new Error(data?.error || 'Could not start checkout.');
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.message || 'Something went wrong starting checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="relative w-full max-w-sm bg-white dark:bg-[#181818] rounded-[22px] p-6 sm:p-7 shadow-[0_30px_70px_-20px_rgba(20,10,50,.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-ink transition-colors" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-display font-extrabold text-xl text-ink mb-1.5 pr-6">BYU-Pathway student price</h2>
        <p className="text-[13.5px] text-body mb-5">
          Pay ₦{AI_AGENT_MASTERY_STUDENT_PRICE.toLocaleString()} now — no sign-up step. After payment we email your login to this address, so
          use the {STUDENT_EMAIL_DOMAIN} inbox you can open.
        </p>

        {error && (
          <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 mb-4 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`you${STUDENT_EMAIL_DOMAIN}`}
            className="w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <input
            type="email"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again to confirm"
            className="w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3 rounded-xl transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Starting checkout…' : `Pay ₦${AI_AGENT_MASTERY_STUDENT_PRICE.toLocaleString()} →`}
          </button>
        </form>
      </div>
    </div>
  );
}
