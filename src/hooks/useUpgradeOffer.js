import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  BUILDER1_PRICE, BUILDER2_PRICE, PRO_UPGRADE_FROM_BUILDER1, PRO_UPGRADE_FROM_BUILDER2,
} from '../data/pricing';

// The Pro upgrade-by-difference offer: someone who owns exactly one permanent
// guide tier (a guide_purchases row — the same rows usePro.js reads, and the
// same rule create-paystack-checkout enforces) can unlock the other for the
// difference to Pro. Returns `offer: null` for everyone else — owns neither,
// owns both, signed out, or still loading.
//
// Grandfathered subscribers (an unexpired entitlements.builder*_expires_at but
// no guide_purchases row) are deliberately NOT offered this: the server would
// refuse the checkout, and their access isn't permanent anyway.
export function useUpgradeOffer() {
  const { user } = useAuth();
  // The loaded tiers are stored with the user they belong to, so a stale result
  // from a previous account is simply ignored — no resetting state in the effect.
  const [loaded, setLoaded] = useState({ userId: null, tiers: null });

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return undefined;
    let cancelled = false;
    supabase
      .from('guide_purchases')
      .select('tier')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setLoaded({ userId: user.id, tiers: new Set((data || []).map((r) => r.tier)) });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || loaded.userId !== user.id || !loaded.tiers) return { offer: null };
  const has1 = loaded.tiers.has('builder1');
  const has2 = loaded.tiers.has('builder2');
  if (has1 === has2) return { offer: null };

  return {
    offer: has1
      ? { ownedLabel: 'Builder 1', missingLabel: 'Builder 2', price: PRO_UPGRADE_FROM_BUILDER1, listPrice: BUILDER2_PRICE }
      : { ownedLabel: 'Builder 2', missingLabel: 'Builder 1', price: PRO_UPGRADE_FROM_BUILDER2, listPrice: BUILDER1_PRICE },
  };
}
