import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  Mail, Lock, User, Loader2, CheckCircle2,
  Trophy, Flame, Rocket, AlertCircle, KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { setRememberMe } from '../lib/supabaseClient';
import { agents } from '../data/agents';
import { isVisibleToPublic } from '../data/departments';
import { usePageSeo } from '../hooks/usePageSeo';

const publicAgentCount = agents.filter((a) => isVisibleToPublic(a.difficulty)).length;

const highlights = [
  { icon: Rocket, title: `${publicAgentCount} Hands-On AI Agent Sessions`, text: 'Real, runnable projects across every department — no placeholder tutorials.' },
  { icon: Trophy, title: 'XP, Levels & Streaks', text: 'Earn XP for every build, level up from Apprentice to Master, and track your daily streak.' },
  { icon: CheckCircle2, title: 'Progress Saved to Your Account', text: 'Sign up and your completed builds, XP, and history sync to the cloud — pick up on any device.' },
];

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function Welcome() {
  const { signUp, signIn, sendLoginCode, verifyLoginCode, resetPassword, signInWithGoogle, isConfigured, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirected-here visitors (StudentDashboard's auth guard, on landing on
  // /dashboard signed out — the common case now that the installed PWA's
  // start_url opens straight into it) are almost always existing students,
  // not new signups, so land them on "Log In" instead of the default.
  const [mode, setMode] = useState(() => (searchParams.get('mode') === 'login' ? 'login' : 'signup'));
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'code' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  usePageSeo({
    title: 'Log In or Sign Up | Social Dev Technologies',
    description: 'Create a free account or log in to Social Dev Technologies to start building real AI agents.',
    canonicalPath: '/welcome',
  });

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const resetAuxState = () => {
    setError('');
    setConfirmSent(false);
    setLoginMethod('password');
    setCode('');
    setCodeSent(false);
    setResetSent(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      // Google sign-in has no "remember me" checkbox of its own — default it
      // to remembered (localStorage), same as the other methods' default.
      // Without this, REMEMBER_KEY is never set for Google-only users, so
      // their session silently lands in sessionStorage only, which can
      // vanish (tab closed, some mobile browsers) while the UI still thinks
      // they're logged in — leading to authenticated-looking API calls that
      // fail with no auth header attached.
      setRememberMe(true);
      const { error: err } = await signInWithGoogle();
      if (err) throw err;
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError('');
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await sendLoginCode(email);
      // otp_disabled ("Signups not allowed for otp") is Supabase's answer for
      // an email with no account. Showing it would let anyone check whether
      // an address is registered, so that case moves on to the code step
      // exactly like a real send — the copy there doesn't promise a code.
      if (err && err.code !== 'otp_disabled') throw err;
      setCodeSent(true);
    } catch (err) {
      setError(err.message || 'Could not send a login code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await resetPassword(email);
      if (err) throw err;
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Could not send a reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!code) {
      setError('Enter the code we emailed you.');
      return;
    }
    setLoading(true);
    try {
      setRememberMe(remember);
      const { error: err } = await verifyLoginCode(email, code);
      if (err) throw err;
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'That code didn\'t work. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await signUp(email, password, name);
        if (err) throw err;
        if (data?.session) {
          navigate('/dashboard');
        } else {
          setConfirmSent(true);
        }
      } else {
        setRememberMe(remember);
        const { error: err } = await signIn(email, password);
        if (err) throw err;
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden min-h-[calc(100vh-4rem)]"
      style={{
        background: theme === 'dark'
          ? '#0C1420'
          : '#F6F8FB',
      }}
    >
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: pitch */}
        <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.jpeg" alt="Social Dev Technologies" className="w-12 h-12 object-contain rounded-lg" />
            <div>
              <p className="font-display font-extrabold text-ink text-lg leading-tight">Social Dev</p>
              <p className="text-[10px] font-semibold text-link uppercase tracking-widest">Technologies</p>
            </div>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-ink leading-tight tracking-[-1px] mb-4">
            Create your account.<span> </span>
            <span className="inline-block bg-yellow px-2.5 rounded-lg -rotate-[1.5deg]">Never lose your progress.</span>
          </h1>
          <p className="text-body text-lg mb-10 max-w-xl">
            Sign up to save your XP, completed builds, and streaks to your account — synced
            across every device.
          </p>

          <div className="space-y-6">
            {highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#131E2F] border border-border-soft flex items-center justify-center flex-shrink-0">
                  <h.icon className="w-5 h-5 text-link" />
                </div>
                <div>
                  <p className="font-bold text-ink">{h.title}</p>
                  <p className="text-sm text-body">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </m.div>

        {/* Right: auth form */}
        <m.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[22px] border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] shadow-[0_20px_44px_-16px_rgba(15,26,42,.18)] p-6 sm:p-8"
        >
          {!isConfigured && (
            <div className="mb-6 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10 border border-amber/30 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Accounts aren't configured yet. Add <code className="font-mono">VITE_SUPABASE_URL</code> and<span> </span>
                <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to your <code className="font-mono">.env</code> file.
              </span>
            </div>
          )}

          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-lg bg-[#F6F8FB] dark:bg-[#0C1420] border border-border-soft">
            <button
              onClick={() => { setMode('signup'); resetAuxState(); }}
              className={`py-2.5 rounded-md text-sm font-bold transition-colors ${mode === 'signup' ? 'bg-brand text-white' : 'text-body-strong hover:text-ink'}`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setMode('login'); resetAuxState(); }}
              className={`py-2.5 rounded-md text-sm font-bold transition-colors ${mode === 'login' ? 'bg-brand text-white' : 'text-body-strong hover:text-ink'}`}
            >
              Log In
            </button>
          </div>

          {confirmSent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[#EAFAF1] dark:bg-green/10 border border-green/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-green" />
              </div>
              <h3 className="font-display text-xl font-bold text-ink mb-2">Check your inbox</h3>
              <p className="text-sm text-body max-w-sm mx-auto">
                We sent a confirmation link to <span className="text-ink font-medium">{email}</span>.
                Click it to verify your account, then come back and log in.
              </p>
            </div>
          ) : (
            <>
              {/* Google sign-in */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || !isConfigured}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#131E2F] hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-body-strong border-[1.5px] border-border font-bold rounded-lg px-5 py-3 transition-colors mb-5"
              >
                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : <GoogleIcon />}
                {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-border-soft" />
                <span className="text-xs text-gray-400">or continue with email</span>
                <div className="flex-1 h-px bg-border-soft" />
              </div>

              {/* Forgot password */}
              {mode === 'login' && loginMethod === 'forgot' ? (
                resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-[#EAFAF1] dark:bg-green/10 border border-green/30 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-green" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-ink mb-2">Check your inbox</h3>
                    <p className="text-sm text-body max-w-sm mx-auto mb-4">
                      We sent a password reset link to <span className="text-ink font-medium">{email}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('password'); setResetSent(false); setError(''); }}
                      className="text-link font-bold text-sm hover:underline"
                    >
                      Back to log in
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-body-strong mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          autoFocus
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
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
                      disabled={loading || !isConfigured}
                      className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-50 text-white font-bold rounded-lg px-5 py-3 shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Send reset link
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      <button type="button" onClick={() => { setLoginMethod('password'); setError(''); }} className="text-link font-bold hover:underline">
                        Back to log in
                      </button>
                    </p>
                  </form>
                )
              ) : mode === 'login' && loginMethod === 'code' ? (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-body-strong mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        disabled={codeSent}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#0C1420] border border-border dark:border-[#26364B] text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:bg-[#F6F8FB] dark:disabled:bg-white/5 disabled:text-body"
                      />
                    </div>
                  </div>

                  {!codeSent ? (
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={loading || !isConfigured}
                      className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-50 text-white font-bold rounded-lg px-5 py-3 shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Send me a login code
                    </button>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-body-strong mb-1.5">Code from your email</label>
                        <div className="relative">
                          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            inputMode="numeric"
                            autoFocus
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter your code"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#0C1420] border border-border dark:border-[#26364B] text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand tracking-widest"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          If <span>{email}</span> has an account, a code is on its way. No email after a few minutes? Check the address, or <button type="button" onClick={handleSendCode} className="text-link font-semibold hover:underline">resend the code</button>.
                        </p>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-body-strong cursor-pointer">
                        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-brand w-4 h-4" />
                        Remember me on this device
                      </label>

                      <button
                        type="submit"
                        disabled={loading || !isConfigured}
                        className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-50 text-white font-bold rounded-lg px-5 py-3 shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        Verify & Log In
                      </button>
                    </>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 text-center">
                    <button type="button" onClick={() => { setLoginMethod('password'); setCode(''); setCodeSent(false); setError(''); }} className="text-link font-bold hover:underline">
                      Use my password instead
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-body-strong mb-1.5">Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#0C1420] border border-border dark:border-[#26364B] text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-body-strong mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#0C1420] border border-border dark:border-[#26364B] text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-body-strong mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      {/* minLength is signup-only on purpose: accounts created
                          before the password rules were tightened still have
                          shorter passwords, and constraining this shared field
                          would stop those users typing their real one to log in. */}
                      <input
                        type="password"
                        required
                        minLength={mode === 'signup' ? 12 : undefined}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'At least 12 characters' : 'Your password'}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-[#0C1420] border border-border dark:border-[#26364B] text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                      />
                    </div>
                    {/* Supabase Auth rejects weak passwords server-side (12 chars,
                        all four character classes — confirmed against the live
                        endpoint). Stating the rules up front beats letting someone
                        fill the form and get a 422 back with no explanation. */}
                    {mode === 'signup' && (
                      <p className="text-[11.5px] text-body leading-relaxed mt-1.5">
                        Use at least 12 characters, including an uppercase letter, a lowercase letter, a number, and a symbol.
                      </p>
                    )}
                  </div>

                  {mode === 'login' && (
                    <p className="text-right -mt-2">
                      <button
                        type="button"
                        onClick={() => { setLoginMethod('forgot'); setError(''); }}
                        className="text-xs text-link font-semibold hover:underline"
                      >
                        Forgot password?
                      </button>
                    </p>
                  )}

                  {mode === 'login' && (
                    <label className="flex items-center gap-2 text-sm text-body-strong cursor-pointer">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-brand w-4 h-4" />
                      Remember me on this device
                    </label>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !isConfigured}
                    className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg px-5 py-3 shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'signup' ? <Flame className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                    {mode === 'signup' ? 'Create Account' : 'Log In'}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    {mode === 'signup' ? (
                      <>Already have an account?<span> </span>
                        <button type="button" onClick={() => { setMode('login'); resetAuxState(); }} className="text-link font-bold hover:underline">Log in</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setLoginMethod('code')} className="text-link font-bold hover:underline">
                          Log in with an emailed code instead
                        </button>
                        <br className="sm:hidden" />
                        <span> </span>·<span> </span>
                        Don't have an account?<span> </span>
                        <button type="button" onClick={() => { setMode('signup'); resetAuxState(); }} className="text-link font-bold hover:underline">Sign up</button>
                      </>
                    )}
                  </p>
                </form>
              )}
            </>
          )}
        </m.div>
      </div>

      <div className="relative text-center pb-12 text-sm text-body">
        <Link to="/" className="hover:text-link transition-colors">← Back to home</Link>
      </div>
    </div>
  );
}
