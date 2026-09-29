import { useState } from 'react';
import { Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Shown once, right after a pay-first BYU student's first login (they paid
// before having an account, so they never chose a password). Setting it also
// clears user_metadata.needs_password (AuthContext.setInitialPassword), which
// unmounts this via the dashboard's own check — no extra state to sync.
export default function SetPasswordModal({ open, email, onLater }) {
  const { setInitialPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await setInitialPassword(password);
      if (err) throw err;
    } catch (err) {
      setError(err.message || 'Could not save your password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-password-title"
        className="w-full max-w-sm bg-white dark:bg-[#181818] rounded-[22px] p-6 sm:p-7 shadow-[0_30px_70px_-20px_rgba(20,10,50,.5)]"
      >
        <div className="w-11 h-11 rounded-xl bg-[#F3EBFF] dark:bg-brand/15 flex items-center justify-center mb-3">
          <KeyRound className="w-5 h-5 text-brand" />
        </div>
        <h2 id="set-password-title" className="font-display font-extrabold text-xl text-ink mb-1.5">Create your password</h2>
        <p className="text-[13.5px] text-body mb-1">Your login email:</p>
        <p className="text-[14px] font-bold text-ink mb-4 break-all">{email}</p>

        {error && (
          <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 mb-4 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            required
            autoFocus
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (8+ characters)"
            className="w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            className="w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3 rounded-xl transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Saving…' : 'Save password'}
          </button>
          <button type="button" onClick={onLater} className="w-full text-xs font-semibold text-gray-500 hover:text-ink text-center pt-1">
            Maybe later — I'll log in with an emailed code
          </button>
        </form>
      </div>
    </div>
  );
}
