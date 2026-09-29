import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, MailCheck } from 'lucide-react';
import { supabase, setRememberMe } from '../lib/supabaseClient';

// Landing page for the "Confirm my email" link in Supabase's Confirm signup
// email. The link points HERE (with token_hash + type) instead of straight at
// Supabase's /auth/v1/verify: mail scanners such as Microsoft Safe Links
// auto-open every link in a message, and opening /verify consumes the
// one-time token — which is the same token as the 6-digit code in that email,
// so the code died before the student ever saw it. A scanner only GETs this
// page; the token is consumed only when a person presses the button.
export default function ConfirmEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tokenHash = params.get('token_hash');
  const type = params.get('type') || 'signup';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setError('');
    setLoading(true);
    try {
      setRememberMe(true);
      const { error: err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (err) throw err;
      navigate('/dashboard', { replace: true });
    } catch {
      setError('This link has already been used or has expired. Go back to the page you were on and request a new code.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center bg-white dark:bg-[#181818] rounded-[22px] p-7 shadow-[0_30px_70px_-20px_rgba(20,10,50,.25)]">
        <MailCheck className="w-10 h-10 text-brand mx-auto mb-3" />
        <h1 className="font-display font-extrabold text-xl text-ink mb-1.5">Confirm your email</h1>
        {tokenHash ? (
          <>
            <p className="text-[13.5px] text-body mb-5">Press the button to finish confirming your account.</p>
            {error && (
              <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 mb-4 text-left">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}
            <button
              onClick={confirm}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3 rounded-xl transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Confirming…' : 'Confirm my email'}
            </button>
          </>
        ) : (
          <p className="text-[13.5px] text-body">This confirmation link is incomplete. Open it again from your email.</p>
        )}
      </div>
    </div>
  );
}
