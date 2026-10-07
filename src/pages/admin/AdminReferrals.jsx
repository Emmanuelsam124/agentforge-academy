import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Gift, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'all', label: 'All' },
];

export default function AdminReferrals() {
  const { showToast } = useOutletContext();
  const [status, setStatus] = useState('pending');
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  const fetchEarnings = useCallback(async (p_status) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('admin_list_referral_earnings', { p_status });
      if (err) throw err;
      setEarnings(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load referral earnings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings(status);
  }, [status, fetchEarnings]);

  // This never sends money anywhere — it only flips the ledger row to
  // 'paid' after the admin has actually sent the ₦5,000 by bank transfer
  // outside the platform. There is no automated payout path in this app.
  const markPaid = async (id) => {
    if (!window.confirm('Mark this as paid? Only do this after you’ve actually sent the ₦5,000.')) return;
    setActionLoading(id);
    try {
      const { error: err } = await supabase.rpc('admin_mark_referral_earning_paid', { p_id: id });
      if (err) throw err;
      if (status === 'all') {
        setEarnings((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'paid', paid_at: new Date().toISOString() } : e)));
      } else {
        setEarnings((prev) => prev.filter((e) => e.id !== id));
      }
      showToast('Marked as paid.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
          <Gift className="w-7 h-7 text-link" />
          Referral Payouts
        </h1>
        {earnings.length > 0 && status === 'pending' && (
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
            {earnings.length} pending
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatus(t.id)}
            className={`text-[13px] font-semibold px-4 py-2 rounded-full border transition-colors ${
              status === t.id
                ? 'bg-brand text-white border-brand'
                : 'bg-white dark:bg-[#131E2F] text-body-strong border-border hover:border-brand/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#131E2F]">
        {loading ? (
          <div className="px-5 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-link mx-auto" />
          </div>
        ) : earnings.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">
            {status === 'pending' ? 'Nothing owed right now.' : 'No referral earnings here.'}
          </div>
        ) : (
          earnings.map((e) => (
            <div key={e.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-border-soft last:border-b-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-semibold text-ink text-sm">{e.referrer_display_name}</span>
                  <span className="text-[11px] font-semibold text-gray-400">{e.referrer_email}</span>
                  <span className="text-[11px] font-bold text-link bg-[#E8EDF3] dark:bg-brand/15 px-2 py-0.5 rounded-full">
                    {e.code}
                  </span>
                </div>
                <p className="text-[12.5px] text-body">
                  Commission on a {e.plan} purchase on{' '}
                  {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {e.paid_at && (
                    <>
                      {' '}· paid {new Date(e.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-display font-extrabold text-ink">₦{Number(e.amount).toLocaleString()}</span>
                {e.status === 'pending' ? (
                  <button
                    onClick={() => markPaid(e.id)}
                    disabled={actionLoading === e.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-40 text-white transition-colors"
                  >
                    {actionLoading === e.id && <Loader2 className="w-3 h-3 animate-spin" />}
                    Mark paid
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-green bg-[#EAFAF1] dark:bg-green/10 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Paid
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
