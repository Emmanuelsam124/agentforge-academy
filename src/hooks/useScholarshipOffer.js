import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { isScholarshipOfferLive } from '../data/scholarship';

// True when the signed-in, email-confirmed user has an approved, unredeemed
// scholarship application and the offer hasn't lapsed. DISPLAY ONLY — it decides
// whether the price card shows the scholarship price; the amount actually
// charged is decided by create-paystack-checkout from the same rows, so a wrong
// answer here can mislead the card but never the charge.
export function useScholarshipOffer() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const eligible = isSupabaseConfigured && !!userId && !!user?.email_confirmed_at;
  // Remember which user the answer belongs to so a sign-out/sign-in as someone
  // else can't show the previous person's result for a render.
  const [answer, setAnswer] = useState({ userId: null, offer: false });

  useEffect(() => {
    if (!eligible) return undefined;
    let cancelled = false;
    supabase.rpc('has_scholarship_offer').then(({ data, error }) => {
      if (cancelled) return;
      setAnswer({ userId, offer: !error && data === true });
    });
    return () => {
      cancelled = true;
    };
  }, [eligible, userId]);

  return eligible && answer.userId === userId && answer.offer && isScholarshipOfferLive();
}
