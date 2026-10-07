import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { CheckCircle2, AlertCircle, Infinity as InfinityIcon, Loader2, Zap, Info, Sparkles, Bot } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { usePro } from '../hooks/usePro';
import { usePaystackCheckout } from '../hooks/usePaystackCheckout';
import { useUpgradeOffer } from '../hooks/useUpgradeOffer';
import CheckoutAuthModal from '../components/CheckoutAuthModal';
import { agents } from '../data/agents';
import { BUILDER1_PRICE, BUILDER2_PRICE, PRO_PRICE, VIBECODING_PRICE, AI_AGENT_MASTERY_PRICE } from '../data/pricing';
import { usePageSeo } from '../hooks/usePageSeo';

const builder1Count = agents.filter((a) => a.difficulty === 'Builder 1').length;
const builder2Count = agents.filter((a) => a.difficulty === 'Builder 2').length;

const BUILDER1_FEATURES = [
  `${builder1Count} Builder 1 agent guides`,
  'Copy-paste prompts for every build',
  'XP tracking & progress',
  'Portfolio write-up prompts',
  'Permanent access — yours to keep',
];

const BUILDER2_FEATURES = [
  `${builder2Count} Builder 2 agent guides`,
  'Multi-step, API-integrated agent builds',
  'XP tracking & progress',
  'Portfolio write-up prompts',
  'Permanent access — yours to keep',
];

const PRO_FEATURES = [
  `All ${builder1Count + builder2Count} guides — Builder 1 + Builder 2`,
  'No prerequisite — both tracks unlock immediately',
  'XP tracking & progress across both tracks',
  'Portfolio write-up prompts for every agent',
  'Permanent access — yours to keep',
];

// Vibe Coding and AI Agent Mastery are both live cohorts with their own
// full marketing pages (VibeCoding.jsx / AIAgentMastery.jsx) — including
// their own checkout, curriculum detail, and FAQ. This page shows just
// enough to compare all three programs at a glance and send someone to
// the right page, rather than duplicating a second checkout flow for each.
// AI Agent Mastery listed first — it's the priority/flagship program
// (founder-confirmed 2026-09-23), not a reflection of price or launch order.
const LIVE_COHORTS = [
  {
    to: '/ai-agent-mastery',
    icon: Bot,
    name: 'AI Agent Mastery',
    text: 'Live cohort. Build one integrated personal-assistant agent — inbox, calendar, research, and messaging, handled for you.',
    bullets: ['Live instructor-led classes', 'One assistant, built end to end', 'Certificate of completion'],
    price: AI_AGENT_MASTERY_PRICE,
    hasKey: 'hasAiMastery',
    coursePath: '/ai-agent-mastery/course',
  },
  {
    to: '/vibe-coding',
    icon: Sparkles,
    name: 'Vibe Coding Bootcamp',
    text: '4 weeks, 8 live classes. Go from an idea to a deployed website, web app, and AI-powered product — no coding experience required.',
    bullets: ['Live instructor-led classes', 'Portfolio site, to-do app, Supabase CRUD app + more', 'Certificate of completion'],
    price: VIBECODING_PRICE,
    hasKey: 'hasVibeCoding',
    coursePath: '/vibe-coding/course',
  },
];

// Shown instead of a full-price button when the visitor owns exactly one guide
// tier: the upgrade-by-difference price (see useUpgradeOffer). `target` is the
// tier/bundle this card sells, so the offer only replaces the button on the
// cards it actually applies to.
function UpgradeButton({ offer, loading, onClick, target }) {
  const label = target === 'pro' ? 'Upgrade to Pro' : `Unlock ${offer.missingLabel}`;
  return (
    <div>
      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Starting checkout…' : `${label} — pay ₦${offer.price.toLocaleString()}`}
      </button>
      <p className="text-center text-[12.5px] text-body mt-2">
        You own {offer.ownedLabel}, so you only pay the difference to Pro — not ₦{offer.listPrice.toLocaleString()}.
      </p>
    </div>
  );
}

export default function Pricing() {
  const { theme } = useTheme();
  const { hasBuilder1, hasBuilder2, isPro, hasVibeCoding, hasAiMastery } = usePro();
  const { offer: upgradeOffer } = useUpgradeOffer();
  const cohortAccess = { hasVibeCoding, hasAiMastery };

  usePageSeo({
    title: 'Pricing — AI Agent Guides, Vibe Coding & AI Agent Mastery | Social Dev Technologies',
    description: 'Every program and price in one place — permanent AI Agent Guides from ₦5,000, or a live cohort with Vibe Coding and AI Agent Mastery.',
    canonicalPath: '/pricing',
  });

  const {
    checkout: handleCheckout, loadingKey: checkoutLoading, error: checkoutError,
    authModalOpen, closeAuthModal, handleAuthenticated,
  } = usePaystackCheckout();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">

      {/* Header */}
      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link">
          Simple, one-time pricing
        </span>
        <h1 className="font-display font-extrabold text-[32px] sm:text-[42px] leading-[1.1] text-ink tracking-[-1px] mt-4 mb-2.5">
          Every program, every price.
        </h1>
        <p className="text-body text-base max-w-xl mx-auto">
          Pick the path that fits — self-paced AI Agent Guides you keep forever, or a live cohort with real classes.
        </p>
      </m.div>

      {/* AI Agent Guides */}
      <div className="text-left mb-6">
        <h2 className="font-display font-extrabold text-2xl text-ink mb-1">AI Agent Guides</h2>
        <p className="text-body text-[14.5px]">Self-paced. Builder 1, Builder 2, or both as Pro.</p>
      </div>

      <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-link bg-[#E8EDF3] dark:bg-brand/15 rounded-full px-4 py-2 mb-6">
        <Info className="w-4 h-4 flex-shrink-0" />
        All you need is a free Gemini API key from Google AI Studio — no paid AI subscription required.
      </div>

      {checkoutError && (
        <div className="max-w-md mx-auto mb-6 flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 text-left">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {checkoutError}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">

        {/* Builder 1 */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[22px] border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-7.5 flex flex-col"
        >
          <div className="font-extrabold text-ink text-lg">🌱 Builder 1</div>
          <div className="flex items-baseline gap-2.5 mt-2.5 mb-0.5">
            <span className="font-display font-extrabold text-[34px] text-ink">₦<span>{BUILDER1_PRICE.toLocaleString()}</span></span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            <span className="inline-flex items-center gap-1 bg-[#EAFAF1] dark:bg-green/10 text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
              <InfinityIcon className="w-3 h-3" /> Yours forever — no expiry
            </span>
          </div>
          <p className="text-[13.5px] text-body mb-4.5">One-time payment, permanent access. Start here — the foundation track.</p>
          <ul className="flex flex-col gap-2.5 mb-5.5 flex-1">
            {BUILDER1_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {hasBuilder1 ? (
            <div className="rounded-xl bg-[#EAFAF1] dark:bg-green/10 border border-green/30 px-4 py-3 text-center text-sm font-bold text-green">
              You already have Builder 1
            </div>
          ) : upgradeOffer?.missingLabel === 'Builder 1' ? (
            <UpgradeButton offer={upgradeOffer} target="builder1" loading={checkoutLoading === 'proupgrade'} onClick={() => handleCheckout('proupgrade')} />
          ) : (
            <button
              onClick={() => handleCheckout('builder1')}
              disabled={checkoutLoading === 'builder1'}
              className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
            >
              {checkoutLoading === 'builder1' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {checkoutLoading === 'builder1' ? 'Starting checkout…' : `Pay ₦${BUILDER1_PRICE.toLocaleString()} with Paystack`}
            </button>
          )}
        </m.div>

        {/* Builder 2 */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[22px] border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-7.5 flex flex-col"
        >
          <div className="font-extrabold text-ink text-lg">⚡ Builder 2</div>
          <div className="flex items-baseline gap-2.5 mt-2.5 mb-0.5">
            <span className="font-display font-extrabold text-[34px] text-ink">₦<span>{BUILDER2_PRICE.toLocaleString()}</span></span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            <span className="inline-flex items-center gap-1 bg-[#EAFAF1] dark:bg-green/10 text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
              <InfinityIcon className="w-3 h-3" /> Yours forever — no expiry
            </span>
          </div>
          <p className="text-[13.5px] text-body mb-4.5">One-time payment, permanent access. Best after finishing Builder 1 — but nothing stops you from jumping in early.</p>
          <ul className="flex flex-col gap-2.5 mb-5.5 flex-1">
            {BUILDER2_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {hasBuilder2 ? (
            <div className="rounded-xl bg-[#EAFAF1] dark:bg-green/10 border border-green/30 px-4 py-3 text-center text-sm font-bold text-green">
              You already have Builder 2
            </div>
          ) : upgradeOffer?.missingLabel === 'Builder 2' ? (
            <UpgradeButton offer={upgradeOffer} target="builder2" loading={checkoutLoading === 'proupgrade'} onClick={() => handleCheckout('proupgrade')} />
          ) : (
            <button
              onClick={() => handleCheckout('builder2')}
              disabled={checkoutLoading === 'builder2'}
              className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
            >
              {checkoutLoading === 'builder2' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {checkoutLoading === 'builder2' ? 'Starting checkout…' : `Pay ₦${BUILDER2_PRICE.toLocaleString()} with Paystack`}
            </button>
          )}
        </m.div>

        {/* Pro (bundle) */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[22px] border-[2.5px] border-brand p-7.5 flex flex-col relative"
          style={{ background: theme === 'dark' ? '#131E2F' : '#FFFFFF' }}
        >
          <span className="absolute -top-3.5 right-6 bg-brand text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-full">
            BEST VALUE
          </span>
          <div className="font-extrabold text-ink text-lg flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-link" /> Pro
          </div>
          <div className="font-display font-extrabold text-[38px] text-ink mt-2.5 mb-0.5">
            ₦<span>{PRO_PRICE.toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            <span className="inline-flex items-center gap-1 bg-[#EAFAF1] dark:bg-green/10 text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
              <InfinityIcon className="w-3 h-3" /> Yours forever — no expiry
            </span>
          </div>
          <p className="text-[13.5px] text-body mb-4.5">
            One-time payment for Builder 1 + Builder 2 together — no prerequisite, both unlock immediately.
          </p>
          <ul className="flex flex-col gap-2.5 mb-5.5 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <div className="rounded-xl bg-[#EAFAF1] dark:bg-green/10 border border-green/30 px-4 py-3 text-center text-sm font-bold text-green">
              You're on Pro — enjoy full access!
            </div>
          ) : upgradeOffer ? (
            <UpgradeButton offer={upgradeOffer} target="pro" loading={checkoutLoading === 'proupgrade'} onClick={() => handleCheckout('proupgrade')} />
          ) : (
            <button
              onClick={() => handleCheckout('pro')}
              disabled={checkoutLoading === 'pro'}
              className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
            >
              {checkoutLoading === 'pro' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {checkoutLoading === 'pro' ? 'Starting checkout…' : `Pay ₦${PRO_PRICE.toLocaleString()} with Paystack`}
            </button>
          )}
        </m.div>
      </div>

      {/* Live cohorts — Vibe Coding & AI Agent Mastery, each with their own
          full page (marketing detail + checkout). Summarized here just
          enough to compare against the guides above and send people to
          the right page. */}
      <div className="text-left mt-14 mb-6">
        <h2 className="font-display font-extrabold text-2xl text-ink mb-1">Live Cohorts</h2>
        <p className="text-body text-[14.5px]">Instructor-led, real classes, a fixed cohort of students.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
        {LIVE_COHORTS.map((program, i) => {
          const enrolled = cohortAccess[program.hasKey];
          return (
            <m.div
              key={program.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="rounded-[22px] border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-7.5 flex flex-col"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#E8EDF3] dark:bg-brand/15 text-link flex items-center justify-center mb-4">
                <program.icon className="w-5 h-5" />
              </div>
              <div className="font-extrabold text-ink text-lg mb-1">{program.name}</div>
              <p className="text-[13.5px] text-body mb-4.5">{program.text}</p>
              <ul className="flex flex-col gap-2.5 mb-5.5 flex-1">
                {program.bullets.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                    <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="font-display font-extrabold text-[26px] text-ink mb-4">
                ₦{program.price.toLocaleString()} <span className="text-sm font-bold text-body">one-time</span>
              </div>
              <Link
                to={enrolled ? program.coursePath : program.to}
                className={`flex items-center justify-center gap-2 w-full font-extrabold px-6 py-3.5 rounded-xl transition-colors ${
                  enrolled
                    ? 'bg-[#EAFAF1] dark:bg-green/10 text-green border border-green/30'
                    : 'bg-brand hover:bg-brand-deep text-white shadow-[0_10px_22px_rgba(15,26,42,.35)]'
                }`}
              >
                {enrolled ? "You're enrolled — go to your classes →" : `Explore ${program.name} →`}
              </Link>
            </m.div>
          );
        })}
      </div>

      {/* Payment methods */}
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-14 text-center">
        <p className="text-[13.5px] text-gray-400 mb-3">
          Payments processed securely by Paystack — cards accepted worldwide
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {['Bank Transfer', 'USSD', 'Mobile Money', 'Visa / Mastercard'].map((m) => (
            <span key={m} className="text-xs font-semibold text-body border border-border-soft rounded-full px-3.5 py-1.5">
              {m}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Every plan is a one-time payment — no subscription, no auto-renewal. For billing questions email support@socialdevtechnologies.com
        </p>
      </m.div>

      <CheckoutAuthModal open={authModalOpen} onClose={closeAuthModal} onAuthenticated={handleAuthenticated} />
    </div>
  );
}
