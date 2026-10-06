import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getStoredReferralCode } from '../lib/referral';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // loading already initialized to false in this case — nothing to sync.
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Real signup + confirmation-email flow, restored now that Auth's SMTP is
  // confirmed working (verified domain on Resend, tested via the emailed
  // login-code path). This briefly went through a create-account Edge
  // Function that bypassed email confirmation entirely while SMTP was
  // broken — reverted deliberately, since that bypass let anyone sign up
  // with an email they don't own.
  const signUp = useCallback(async (email, password, displayName) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    // referral_code rides along in metadata purely for handle_new_user()
    // (referrals-setup.sql) to read at insert time — it's never written to
    // profiles directly, and a missing/invalid/expired code here just means
    // no referral gets attributed, never a failed signup.
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
          referral_code: getStoredReferralCode() || undefined,
        },
      },
    });
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  // Sends a 6-digit login code to an existing account's email — an
  // alternative to typing a password. shouldCreateUser is false so this
  // never silently creates a new account; sign-up stays its own explicit step.
  const sendLoginCode = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  }, []);

  const verifyLoginCode = useCallback(async (email, token) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.verifyOtp({ email, token, type: 'email' });
  }, []);

  // Sends a password-reset link to an existing account's email. Supabase
  // redirects the click to redirectTo with a recovery session already
  // attached (its client-side detectSessionInUrl handles that automatically)
  // — ResetPassword.jsx picks that session up and lets them set a new one.
  const resetPassword = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  }, []);

  // Only valid within an active recovery session (i.e. right after landing
  // on /reset-password from the emailed link) — updateUser reuses whatever
  // session is currently active, there's no separate "recovery token" param.
  const updatePassword = useCallback(async (newPassword) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.updateUser({ password: newPassword });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        // Always show Google's account chooser rather than silently
        // completing with whichever Google account is already active in
        // the browser — gives the user a visible, deliberate step.
        queryParams: { prompt: 'select_account' },
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: null };
    return supabase.auth.signOut();
  }, []);

  // For the checkout modal only (usePaystackCheckout.js / CheckoutAuthModal.jsx)
  // — unlike sendLoginCode, shouldCreateUser is true here on purpose: the
  // whole point of that flow is one email+code step that works whether
  // someone's new or returning, since a buyer mid-checkout doesn't want to
  // stop and decide "am I signing up or logging in?". /welcome's own
  // signup (password) and log-in-with-code (existing accounts only) stay
  // exactly as they are — this is an additional path, not a replacement.
  // A typed-back code is the same proof of inbox ownership as the
  // confirmation-link flow signUp() uses, so this doesn't reopen the
  // "signed up with an email they don't own" issue that flow was
  // restored to prevent.
  const sendCheckoutCode = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          display_name: email.split('@')[0],
          referral_code: getStoredReferralCode() || undefined,
        },
      },
    });
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    sendLoginCode,
    sendCheckoutCode,
    verifyLoginCode,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
