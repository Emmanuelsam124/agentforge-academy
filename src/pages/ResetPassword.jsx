import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { setRememberMe } from '../lib/supabaseClient';

export default function ResetPassword() {
  const { user, updatePassword } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Clicking the emailed reset link lands here with a recovery session that
  // AuthContext picks up asynchronously (via its own onAuthStateChange
  // listener) — `user` goes from null to populated once that resolves, which
  // can take a moment longer than the page's first render. Give it a few
  // seconds before concluding the link is invalid/expired rather than
  // failing immediately on the first (still-null) render.
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setChecking(false);
      return;
    }
    const timeout = setTimeout(() => setChecking(false), 4000);
    return () => clearTimeout(timeout);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      // Same reasoning as the Google sign-in path in Welcome.jsx — without
      // this, the new session lands in sessionStorage only and can vanish
      // before the user gets to /dashboard.
      setRememberMe(true);
      const { error: err } = await updatePassword(password);
      if (err) throw err;
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message || 'Could not update your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center justify-center px-4"
      style={{
        background: theme === 'dark'
          ? '#0C1420'
          : '#F6F8FB',
      }}
    >
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[22px] border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] shadow-[0_20px_44px_-16px_rgba(15,26,42,.18)] p-6 sm:p-8"
      >
        {checking ? (
          <div className="flex flex-col items-center text-center py-8 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-link" />
            <p className="text-sm text-body">Checking your reset link…</p>
          </div>
        ) : success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-[#EAFAF1] dark:bg-green/10 border border-green/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-green" />
            </div>
            <h1 className="font-display text-xl font-bold text-ink mb-2">Password updated</h1>
            <p className="text-sm text-body">Taking you to your dashboard…</p>
          </div>
        ) : !user ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-[#FBEAE9] dark:bg-rose/10 border border-rose/30 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-rose" />
            </div>
            <h1 className="font-display text-xl font-bold text-ink mb-2">This link has expired</h1>
            <p className="text-sm text-body mb-5">
              Password reset links only work once and expire quickly. Request a new one to continue.
            </p>
            <Link
              to="/welcome"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-extrabold text-ink mb-1.5">Set a new password</h1>
            <p className="text-sm text-body mb-6">Choose a new password for your account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-body-strong mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#0C1420] border border-border dark:border-[#26364B] text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-body-strong mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#0C1420] border border-border dark:border-[#26364B] text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-50 text-white font-bold rounded-lg px-5 py-3 shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update password
              </button>
            </form>
          </>
        )}
      </m.div>
    </div>
  );
}
