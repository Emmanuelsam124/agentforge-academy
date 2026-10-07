import { useEffect, useState } from 'react';
import { Gift, Loader2, Link2, Check, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { SITE_URL } from '../../lib/ogCards';
import { copyShareLink } from '../../components/shareTargets';
import { REFERRAL_COMMISSION_PERCENT } from '../../data/pricing';

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

// Gated on the RPC's own answer, not a client-side entitlement check.
// get_or_create_my_referral_code() allows anyone who has ever bought any
// product — current or expired — so re-deriving that same
// "ever purchased" rule here from usePro() (which only tracks *currently
// active* access) would drift from the database's actual rule the moment
// someone's access lapses. Letting the RPC's error decide keeps there being
// exactly one source of truth for who's eligible.
export default function Refer() {
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(true);
  const [code, setCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: codeData, error: codeErr } = await supabase.rpc('get_or_create_my_referral_code');
      if (cancelled) return;

      if (codeErr) {
        setEligible(false);
        setLoading(false);
        return;
      }
      setCode(codeData || '');

      const { data: referralsData, error: referralsErr } = await supabase.rpc('get_my_referrals');
      if (cancelled) return;
      if (referralsErr) {
        setError('Could not load your referrals — try refreshing.');
      } else {
        setReferrals(referralsData || []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const link = code ? `${SITE_URL}/?ref=${code}` : '';
  const totalPaid = referrals.reduce((sum, r) => sum + Number(r.earned_paid || 0), 0);
  const totalPending = referrals.reduce((sum, r) => sum + Number(r.earned_pending || 0), 0);

  const copyLink = async () => {
    if (await copyShareLink(link)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-link mx-auto" />
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="bg-white dark:bg-[#131E2F] border border-border-soft rounded-2xl p-6 sm:p-8 text-center">
        <Gift className="w-8 h-8 text-link mx-auto mb-3" />
        <h1 className="font-display text-xl font-extrabold text-ink mb-1.5">Refer & Earn</h1>
        <p className="text-body max-w-sm mx-auto">
          Enroll in any of our courses to get your referral link — you'll earn {REFERRAL_COMMISSION_PERCENT}% of
          {' '}the amount every student you send our way pays for a course you're enrolled in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink flex items-center gap-2.5">
          <Gift className="w-6 h-6 text-link" /> Refer & Earn
        </h1>
        <p className="text-body mt-1.5">
          Share your link. When someone signs up through it and pays for any course you're enrolled in, you earn {REFERRAL_COMMISSION_PERCENT}% of what they pay.
        </p>
      </div>

      <div className="bg-white dark:bg-[#131E2F] border border-border-soft rounded-2xl p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Your referral link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 min-w-0 truncate px-3 py-2.5 rounded-lg bg-[#F6F8FB] dark:bg-white/5 text-[13px] text-body-strong">
            {link}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-lg bg-brand hover:bg-brand-deep text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#131E2F] border border-border-soft rounded-2xl p-4 text-center">
          <p className="text-2xl font-display font-extrabold text-ink">{referrals.length}</p>
          <p className="text-[11px] font-semibold text-body mt-0.5">Signed up</p>
        </div>
        <div className="bg-white dark:bg-[#131E2F] border border-border-soft rounded-2xl p-4 text-center">
          <p className="text-2xl font-display font-extrabold text-ink">{naira(totalPaid)}</p>
          <p className="text-[11px] font-semibold text-body mt-0.5">Paid out</p>
        </div>
        <div className="bg-white dark:bg-[#131E2F] border border-border-soft rounded-2xl p-4 text-center">
          <p className="text-2xl font-display font-extrabold text-ink">{naira(totalPending)}</p>
          <p className="text-[11px] font-semibold text-body mt-0.5">Pending</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#131E2F] border border-border-soft rounded-2xl p-5">
        <h2 className="font-display font-bold text-ink flex items-center gap-2 mb-4">
          <Users className="w-[18px] h-[18px] text-link" /> People you've referred
        </h2>

        {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

        {referrals.length === 0 ? (
          <p className="text-sm text-body py-6 text-center">
            Nobody yet — share your link above to start earning.
          </p>
        ) : (
          <div className="divide-y divide-border-soft">
            {referrals.map((r, i) => {
              const pending = Number(r.earned_pending || 0);
              const paid = Number(r.earned_paid || 0);
              return (
                <div key={i} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink text-sm truncate">{r.referred_display_name || 'A student'}</p>
                    <p className="text-[12px] text-gray-400">
                      Signed up {new Date(r.signed_up_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    {paid === 0 && pending === 0 && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400">
                        No qualifying purchase yet
                      </span>
                    )}
                    {paid > 0 && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EAFBF1] text-green dark:bg-green/15">
                        {naira(paid)} paid
                      </span>
                    )}
                    {pending > 0 && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        {naira(pending)} pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
