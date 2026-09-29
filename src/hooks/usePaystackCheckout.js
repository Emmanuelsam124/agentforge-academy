import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { isStudentEmail, STUDENT_EMAIL_DOMAIN } from '../data/pricing';

/**
 * Starts a Paystack checkout via create-paystack-checkout and redirects to
 * the returned authorization_url. Shared by every purchase surface (guide
 * tiers on Pricing.jsx, Vibe Coding, AI Agent Mastery) so this logic — and
 * the auth-modal flow below — only lives in one place.
 *
 * Unauthenticated clicks no longer navigate to /welcome (founder-confirmed
 * 2026-09-23: paying should never leave the page). Instead this opens
 * CheckoutAuthModal in place, remembers which plan was requested, and
 * resumes the actual checkout automatically once the modal reports success
 * — the caller just needs to render `<CheckoutAuthModal open={authModalOpen}
 * onClose={closeAuthModal} onAuthenticated={handleAuthenticated} />`
 * alongside its checkout button(s).
 */
export function usePaystackCheckout() {
  const { user, signOut } = useAuth();
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  // Passed to CheckoutAuthModal while a student-discount checkout waits on
  // sign-in; undefined for normal checkouts.
  const [requiredEmailDomain, setRequiredEmailDomain] = useState(undefined);
  // The plan/extra a checkout() call was made with, replayed once the auth
  // modal reports success — a ref rather than state since it's write-then-
  // read-once, never rendered.
  const pendingRef = useRef(null);

  const runCheckout = async (plan, extra) => {
    setError('');
    setLoadingKey(plan);
    try {
      // A cached-but-expired session (e.g. it lived in sessionStorage only
      // and the tab was closed/reopened) can look authenticated from React
      // state alone — confirm a real session exists right before spending a
      // network round-trip on it. If it's actually gone, resolve it through
      // the same modal rather than a dead end.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        pendingRef.current = { plan, extra };
        setLoadingKey(null);
        setRequiredEmailDomain(extra?.studentDiscount ? STUDENT_EMAIL_DOMAIN : undefined);
        setAuthModalOpen(true);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-paystack-checkout', {
        body: { plan, redirectOrigin: window.location.origin, ...extra },
      });
      if (fnError) {
        // supabase-js's error.message is a generic "non-2xx status" string —
        // the real reason is in the response body on error.context.
        if (fnError.context) {
          try {
            const body = await fnError.context.clone().json();
            console.error('create-paystack-checkout error response:', fnError.context.status, body);
          } catch {
            const text = await fnError.context.clone().text();
            console.error('create-paystack-checkout error response (non-JSON):', fnError.context.status, text);
          }
        }
        throw fnError;
      }
      if (!data?.authorization_url) throw new Error(data?.error || 'Could not start checkout.');
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.message || 'Something went wrong starting checkout. Please try again.');
      setLoadingKey(null);
    }
  };

  const checkout = async (plan, extra = {}) => {
    // Student-discount checkout: a signed-in account without a BYU-Pathway
    // address can't get the price (the server would refuse it), so swap to
    // the verify-your-student-email flow instead of a dead-end error. The
    // server still makes the real eligibility call either way.
    if (extra.studentDiscount && user && !isStudentEmail(user.email)) {
      await signOut();
      pendingRef.current = { plan, extra };
      setRequiredEmailDomain(extra?.studentDiscount ? STUDENT_EMAIL_DOMAIN : undefined);
      setAuthModalOpen(true);
      return;
    }
    if (!user) {
      pendingRef.current = { plan, extra };
      setRequiredEmailDomain(extra?.studentDiscount ? STUDENT_EMAIL_DOMAIN : undefined);
      setAuthModalOpen(true);
      return;
    }
    await runCheckout(plan, extra);
  };

  // Passed to CheckoutAuthModal as onAuthenticated. supabase.auth.getSession()
  // inside runCheckout reads the client's live session directly, so this is
  // safe to call immediately after verifyOtp() resolves even though the
  // AuthContext `user` value (driven by the onAuthStateChange listener) may
  // not have re-rendered yet.
  const handleAuthenticated = async () => {
    setAuthModalOpen(false);
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) await runCheckout(pending.plan, pending.extra);
  };

  const closeAuthModal = () => {
    pendingRef.current = null;
    setAuthModalOpen(false);
  };

  return { checkout, loadingKey, error, setError, authModalOpen, requiredEmailDomain, closeAuthModal, handleAuthenticated };
}
