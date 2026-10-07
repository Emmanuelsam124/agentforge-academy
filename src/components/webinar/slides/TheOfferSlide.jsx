import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Tag, CalendarDays, Info, UserPlus, CreditCard, Unlock } from 'lucide-react';
import SlideShell from '../SlideShell';
import { useCohortSchedule } from '../../../hooks/useCohortSchedule';
import { agents } from '../../../data/agents';

const builder1Count = agents.filter((a) => a.difficulty === 'Builder 1').length;
// Duplicated from src/data/pricing.js rather than imported (pre-existing,
// not introduced here) — keep in sync by hand until this is fixed to import.
const ANCHOR_PRICE = 100000;
const BUILDER_PRICE = 25000;
const BUILDER_SAVINGS = ANCHOR_PRICE - BUILDER_PRICE;
// Computed, not hardcoded — this used to be a literal "50% off" next to it,
// correct when BUILDER_PRICE was N50,000 but silently wrong the moment the
// price cut made the real number 75%. Shipped live once already; see
// pricing.js for the same fix on the main site.
const BUILDER_SAVINGS_PERCENT = Math.round((BUILDER_SAVINGS / ANCHOR_PRICE) * 100);

const FEATURES = [
  `${builder1Count} Builder 1 agent sessions`,
  'Copy-paste prompts for every build',
  'XP tracking & progress',
  'Portfolio write-up prompts',
  '6 months of access',
];

const AFTER_PAYMENT = [
  { icon: UserPlus, text: 'Sign up' },
  { icon: CreditCard, text: 'Pay once' },
  { icon: Unlock, text: 'Session 1 unlocks immediately — no waiting for a cohort' },
];

// Same "unset or past" rule as Pricing.jsx — a stale cohort date an admin
// forgot to clear shouldn't linger on the webinar CTA either.
function formatCohortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (date < new Date(new Date().toDateString())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function TheOfferSlide() {
  const { builder1: builder1CohortDate } = useCohortSchedule();
  const builder1Cohort = formatCohortDate(builder1CohortDate);

  return (
    <SlideShell decorations>
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link mb-3">
          The offer
        </span>
        <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px]">Start Builder 1 today.</h2>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6 max-w-4xl mx-auto items-start">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[22px] border-[2.5px] border-brand bg-white dark:bg-[#131E2F] p-7.5"
        >
          <div className="font-extrabold text-ink text-lg">🌱 Builder 1</div>
          <div className="flex items-baseline gap-2.5 mt-2.5 mb-0.5">
            <span className="text-base text-gray-400 line-through">₦{ANCHOR_PRICE.toLocaleString()}</span>
            <span className="font-display font-extrabold text-[34px] text-ink">₦{BUILDER_PRICE.toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="inline-flex items-center gap-1 bg-[#EAFAF1] dark:bg-green/10 text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full">
              <Tag className="w-3 h-3" /> Save ₦{BUILDER_SAVINGS.toLocaleString()} · {BUILDER_SAVINGS_PERCENT}% off
            </span>
            {builder1Cohort && (
              <span className="inline-flex items-center gap-1 bg-[#E8EDF3] dark:bg-brand/15 text-link font-bold text-[11.5px] px-2.5 py-1 rounded-full">
                <CalendarDays className="w-3 h-3" /> Cohort starts {builder1Cohort}
              </span>
            )}
          </div>
          <ul className="flex flex-col gap-2.5 mb-6">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Link
            to="/pricing"
            className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep text-white font-extrabold px-6 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
          >
            Claim Builder 1 →
          </Link>
          <p className="flex items-start gap-1.5 text-[12px] text-body mt-3">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> One-time payment. You'll need your own paid Claude account to complete the builds.
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col gap-4"
        >
          <div className="bg-[#F6F8FB] dark:bg-white/5 border border-border-soft rounded-2xl p-5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-body mb-3">What happens after you pay</div>
            <ul className="flex flex-col gap-2.5">
              {AFTER_PAYMENT.map((step) => (
                <li key={step.text} className="flex items-center gap-2.5 text-[13px] text-body-strong">
                  <step.icon className="w-4 h-4 text-link flex-shrink-0" /> {step.text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[12.5px] text-body leading-relaxed px-1">
            Builder 2 — the next-level, multi-step builds — is waiting for you when you're ready. No rush, no expiry on that decision.
          </p>
        </m.div>
      </div>
    </SlideShell>
  );
}
