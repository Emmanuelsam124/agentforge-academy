import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { setRememberMe } from '../lib/supabaseClient';

// Purpose-built for the checkout flow (usePaystackCheckout.js) — pops up
// in place instead of navigating to /welcome, so paying is: click pay ->
// email -> code -> Paystack, no page change in between. One unified email
// + code step regardless of whether the person is new or returning (see
// sendCheckoutCode's comment in AuthContext.jsx for why that's safe).
// /welcome's own signup/login forms are untouched — this is an additional,
// faster path for checkout specifically, not a replacement.
// requiredEmailDomain (e.g. '@byupathway.edu') is set for the student-price
// flow: it only gates which address we'll send a code to, for a clear early
// error. The real check is server-side in create-paystack-checkout.
export default function CheckoutAuthModal({ open, onClose, onAuthenticated, requiredEmailDomain }) {
  const { sendCheckoutCode, verifyLoginCode } = useAuth();
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSendCode = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    if (requiredEmailDomain && !email.trim().toLowerCase().endsWith(requiredEmailDomain)) {
      setError(`The student price needs an email ending in ${requiredEmailDomain}.`);
      return;
    }
    setLoading(true);
    try {
      // No "remember me" checkbox in this flow — default to remembered,
      // same reasoning Welcome.jsx's Google sign-in uses: without this,
      // the session can silently land in sessionStorage-only and vanish.
      setRememberMe(true);
      const { error: err } = await sendCheckoutCode(email.trim());
      if (err) throw err;
      setStep('code');
    } catch (err) {
      setError(err.message || 'Could not send a code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Enter the code we emailed you.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await verifyLoginCode(email.trim(), code.trim());
      if (err) throw err;
      reset();
      onAuthenticated();
    } catch (err) {
      setError(err.message || "That code didn't work. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-[#181818] rounded-[22px] p-6 sm:p-7 shadow-[0_30px_70px_-20px_rgba(20,10,50,.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-ink transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {error && (
          <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 mb-4 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        {step === 'email' ? (
          <>
            <h2 className="font-display font-extrabold text-xl text-ink mb-1.5 pr-6">Almost there</h2>
            <p className="text-[13.5px] text-body mb-5">
              {requiredEmailDomain
                ? `Enter your ${requiredEmailDomain} email — we'll send a 6-digit code to confirm it's yours, then take you to payment at the student price.`
                : "Enter your email — we'll send a 6-digit code to confirm it's you, then take you straight to payment."}
            </p>
            <form onSubmit={handleSendCode} className="space-y-3">
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={requiredEmailDomain ? `you${requiredEmailDomain}` : 'you@example.com'}
                className="w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3 rounded-xl transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Sending code…' : 'Send me a code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="font-display font-extrabold text-xl text-ink mb-1.5 pr-6">Check your email</h2>
            <p className="text-[13.5px] text-body mb-5">
              Sent a 6-digit code to <strong className="text-ink">{email}</strong>. Enter it below to continue.
            </p>
            <form onSubmit={handleVerify} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent tracking-[0.4em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3 rounded-xl transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Verifying…' : 'Verify & continue to payment'}
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="text-xs font-semibold text-brand hover:underline w-full text-center"
              >
                Resend code
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
