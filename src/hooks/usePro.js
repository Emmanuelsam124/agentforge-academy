import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

function isActive(expiresAt) {
  return Boolean(expiresAt) && new Date(expiresAt) > new Date();
}

export function usePro() {
  const { user } = useAuth();
  const [hasBuilder1, setHasBuilder1] = useState(false);
  const [hasBuilder2, setHasBuilder2] = useState(false);
  const [hasVibeCoding, setHasVibeCoding] = useState(false);
  const [hasAiMastery, setHasAiMastery] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [proLoading, setProLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setHasBuilder1(false);
      setHasBuilder2(false);
      setHasVibeCoding(false);
      setHasAiMastery(false);
      setIsAdmin(false);
      setProLoading(false);
      return;
    }

    let cancelled = false;
    setProLoading(true);
    // Two independent access paths for Builder 1/2, checked in parallel:
    // an active (grandfathered, pre-2026-09-22) entitlements-table
    // subscription, OR a permanent guide_purchases row for that tier
    // (every purchase since 2026-09-22 — see guide-purchases-setup.sql).
    // A bundle purchase always grants every course_id in a tier
    // atomically in one webhook transaction, so "owns at least one guide
    // in tier X" is equivalent to "owns the whole tier X bundle."
    Promise.all([
      supabase
        .from('entitlements')
        .select('builder1_expires_at, builder2_expires_at, vibecoding_expires_at, aimastery_expires_at, is_admin')
        .eq('user_id', user.id)
        .single(),
      supabase.from('guide_purchases').select('tier').eq('user_id', user.id),
    ]).then(([{ data, error }, { data: guideRows }]) => {
      if (cancelled) return;
      if (error || !data) {
        setHasBuilder1(false);
        setHasBuilder2(false);
        setHasVibeCoding(false);
        setHasAiMastery(false);
          setIsAdmin(false);
        setProLoading(false);
        return;
      }
      const admin = Boolean(data.is_admin);
      const ownedTiers = new Set((guideRows || []).map((r) => r.tier));
      setIsAdmin(admin);
      setHasBuilder1(admin || isActive(data.builder1_expires_at) || ownedTiers.has('builder1'));
      setHasBuilder2(admin || isActive(data.builder2_expires_at) || ownedTiers.has('builder2'));
      setHasVibeCoding(admin || isActive(data.vibecoding_expires_at));
      setHasAiMastery(admin || isActive(data.aimastery_expires_at));
      setProLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // isPro is a convenience alias meaning "has full access" (both tiers, or
  // admin) — kept for the handful of places that just need a yes/no badge
  // rather than per-tier detail. Deliberately excludes vibecoding/aimastery:
  // both are separate products, not part of the builder1/builder2 "Pro" bundle.
  const isPro = isAdmin || (hasBuilder1 && hasBuilder2);

  return { hasBuilder1, hasBuilder2, hasVibeCoding, hasAiMastery, isPro, isAdmin, proLoading };
}
