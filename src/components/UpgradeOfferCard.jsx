import { AlertCircle, Loader2, Zap } from 'lucide-react';
import { usePaystackCheckout } from '../hooks/usePaystackCheckout';
import CheckoutAuthModal from './CheckoutAuthModal';

// "You own one track — finish the set for the difference." Shown on the
// dashboard to people useUpgradeOffer() says are eligible. The price is only
// display: create-paystack-checkout recomputes it from their purchases.
export default function UpgradeOfferCard({ offer }) {
  const {
    checkout, loadingKey, error, authModalOpen, closeAuthModal, handleAuthenticated,
  } = usePaystackCheckout();
  const loading = loadingKey === 'proupgrade';

  return (
    <section
      className="rounded-2xl px-6 sm:px-7 py-6 flex items-center justify-between flex-wrap gap-4"
      style={{ background: '#264D73' }}
    >
      <div className="min-w-0">
        <div className="font-display font-extrabold text-lg text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow" /> Upgrade to Pro for ₦{offer.price.toLocaleString()}
        </div>
        <div className="text-[13.5px] text-[#D5DEE9] max-w-xl">
          You already own {offer.ownedLabel}. Unlock {offer.missingLabel} for just the difference to Pro —
          ₦{offer.price.toLocaleString()} instead of ₦{offer.listPrice.toLocaleString()}. One payment, yours permanently.
        </div>
        {error && (
          <div className="mt-3 flex items-start gap-2 text-sm text-white bg-white/15 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
      <button
        onClick={() => checkout('proupgrade')}
        disabled={loading}
        className="flex items-center gap-2 bg-yellow text-ink font-extrabold px-5 py-2.5 rounded-xl flex-shrink-0 disabled:opacity-60"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Starting checkout…' : `Upgrade for ₦${offer.price.toLocaleString()} →`}
      </button>
      <CheckoutAuthModal open={authModalOpen} onClose={closeAuthModal} onAuthenticated={handleAuthenticated} />
    </section>
  );
}
