import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  CheckCircle2, ArrowRight, CalendarDays, Info, CircleHelp, Loader2, AlertCircle,
  Bot, Send, LayoutGrid, ShieldCheck, X, Clock,
} from 'lucide-react';
import { usePro } from '../hooks/usePro';
import { useCohortSchedule } from '../hooks/useCohortSchedule';
import { usePaystackCheckout } from '../hooks/usePaystackCheckout';
import CheckoutAuthModal from '../components/CheckoutAuthModal';
import { usePageSeo } from '../hooks/usePageSeo';
import { AGENTS_LIVE_PRICE, AGENTS_LIVE_ACCESS_DAYS } from '../data/pricing';

// AI Agents Live — a separate, short-format live workshop, NOT the same
// product as AI Agent Mastery (that's a ₦19,999, 6-month cohort). This
// page sells ONE product: checkout is hardcoded to plan: 'agentslive'.
//
// Founder direction (2026-09-27): describe only what students build, never
// the underlying tools/frameworks — same "outcome, not tooling" rule
// AIAgentMastery.jsx follows. The two demo videos below are meant to carry
// that weight instead of naming anything.

const DEMOS = [
  {
    title: 'Your agent, live on Telegram',
    text: 'Message it like you would a person — it reads, decides, and replies, connected to the tools you gave it.',
    icon: Send,
    src: '/videos/agents-live-telegram-demo.mp4',
  },
  {
    title: 'The multi-agent dashboard',
    text: 'Several agents on one board, each with its own job, working a shared task list the way a small team would.',
    icon: LayoutGrid,
    src: '/videos/agents-live-dashboard-demo.mp4',
  },
];

const BUILDS = [
  { icon: Send, name: 'Your own agent', text: 'Connected to Telegram, WhatsApp, and other tools you already use — it can read, reply, and act on your behalf.' },
  { icon: LayoutGrid, name: 'A multi-agent dashboard', text: 'Several agents working together on one board, each assigned its own part of the job, like a small team.' },
];

const WHO_FOR = [
  { title: "You came to the webinar but didn't join the cohort", text: "This is the fast, low-cost way to actually build something — in two days, not a 6-month commitment." },
  { title: 'Founders & operators', text: 'You want a working agent and a working dashboard, not a slide deck about AI.' },
  { title: 'Builder 1 / Builder 2 graduates', text: "You've built single-purpose agents — this is where you connect one to real messaging channels and put several to work together." },
  { title: 'Anyone curious but budget-conscious', text: 'One weekend, one low price, two real things to show for it at the end.' },
];

const FORMAT = [
  '2 live days — hands-on, building alongside the instructor, not watching a lecture',
  'Day 1: your own agent, wired into Telegram, WhatsApp, and other tools',
  'Day 2: the multi-agent dashboard — several agents working a shared task list',
  `7 days of access to replays and resources after the live days end`,
];

const FOR_YOU = [
  'You want a working agent and dashboard by the end of the weekend',
  'You can show up live for both days (or catch the replay within the week)',
  "You're fine starting from the fundamentals — no prior build required",
];
const NOT_FOR_YOU = [
  'You want 6 months of ongoing access and support — that\'s AI Agent Mastery, not this',
  "You can't make either day, live or replay, within the access window",
  'You want a fully autonomous system with zero setup on your part',
];

const FAQS = [
  { q: 'Is this the same as AI Agent Mastery?', a: 'No — AI Agent Mastery is a ₦19,999, 6-month live cohort building one personal-assistant agent. AI Agents Live is a ₦10,000, 2-day workshop: your own connected agent, plus a multi-agent dashboard.' },
  { q: 'Do I need coding experience?', a: "No. It's built to be followed step by step, whether or not you've built an agent before." },
  { q: "What do I actually walk away with?", a: 'Your own agent connected to Telegram, WhatsApp, and other tools, plus a working dashboard where multiple agents share a task list — both built by your own hands during the workshop.' },
  { q: 'What if I miss a live day?', a: `Replays are available for ${AGENTS_LIVE_ACCESS_DAYS} days after the workshop — plenty to catch up, though live is where you get help in real time.` },
  { q: 'How long do I keep access?', a: `${AGENTS_LIVE_ACCESS_DAYS} days from when the workshop starts — long enough to rewatch and finish your build, not an ongoing subscription.` },
  { q: 'Do I need to pay for any tools?', a: "The workshop is built around free-tier tools wherever possible — anything with an unavoidable cost is called out before you need it." },
];

function formatCohortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (date < new Date(new Date().toDateString())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function SectionHeading({ eyebrow, children }) {
  return (
    <div className="text-center mb-9">
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#F3EBFF] dark:bg-brand/15 text-brand mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px] max-w-2xl mx-auto">{children}</h2>
    </div>
  );
}

// controlsList="nodownload" hides the download button from Chrome/Edge's
// native controls, and blocking the context menu removes the obvious
// "Save video as…" path. This is a casual-user deterrent, not real
// protection — the browser still fetches the actual file to play it, so
// anyone using devtools/network-tab can still save it. True prevention
// would need a streaming/DRM host, which two marketing clips don't warrant.
function DemoVideo({ demo }) {
  return (
    <div className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl overflow-hidden">
      <div className="aspect-video bg-[#0A090F] flex items-center justify-center relative">
        <video
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full"
          preload="none"
        >
          <source src={demo.src} type="video/mp4" />
        </video>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-1.5">
          <demo.icon className="w-4 h-4 text-brand flex-shrink-0" />
          <h3 className="font-display font-bold text-[14.5px] text-ink">{demo.title}</h3>
        </div>
        <p className="text-[12.5px] text-body leading-relaxed">{demo.text}</p>
      </div>
    </div>
  );
}

export default function AgentsLive() {
  const { hasAgentsLive } = usePro();
  const { agentslive: cohortDateRaw } = useCohortSchedule();
  const cohortDate = formatCohortDate(cohortDateRaw);
  const {
    checkout, loadingKey: checkoutLoading, error: checkoutError,
    authModalOpen, closeAuthModal, handleAuthenticated,
  } = usePaystackCheckout();

  usePageSeo({
    title: 'AI Agents Live | Social Dev Technologies',
    description: `A 2-day live workshop: build your own AI agent connected to Telegram, WhatsApp, and other tools, plus a dashboard where multiple agents work together. ₦${AGENTS_LIVE_PRICE.toLocaleString()} one-time.`,
    canonicalPath: '/ai-agents-live',
  });

  return (
    <div>
      {/* Hero */}
      <div
        className="relative overflow-hidden pt-16 pb-14 px-4 sm:px-6 lg:px-[5vw] text-center"
        style={{ background: 'radial-gradient(120% 100% at 50% 0%, #F3EBFF 0%, #FBFAFF 55%)' }}
      >
        <div className="relative max-w-3xl mx-auto">
          <m.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white dark:bg-[#181818] border-[1.5px] border-border text-brand font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(124,58,237,.1)]"
          >
            <Clock className="w-3.5 h-3.5" /> 2-day live workshop — seats limited
          </m.span>

          <m.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-extrabold text-[36px] sm:text-[54px] leading-[1.05] text-ink tracking-[-1.5px] mt-5"
          >
            Build your own AI agent <span className="text-brand">— live, in 2 days.</span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[17px] leading-relaxed text-body mt-5 max-w-lg mx-auto"
          >
            Connect your own agent to Telegram, WhatsApp, and other tools you already use — then build a dashboard
            where several agents work together on shared tasks. Two live days, hands-on, small group.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3.5 items-center justify-center mt-8"
          >
            <a
              href="#pricing"
              className="bg-brand text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-[0_10px_22px_rgba(124,58,237,.4)] hover:bg-brand-deep transition-colors"
            >
              Join — ₦{AGENTS_LIVE_PRICE.toLocaleString()} →
            </a>
            <a href="#demo" className="text-body-strong font-bold text-[14.5px] hover:text-brand transition-colors">
              Watch it in action ↓
            </a>
          </m.div>
        </div>
      </div>

      {/* Demo videos */}
      <div id="demo" className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto scroll-mt-20">
        <SectionHeading eyebrow="See it working">This is what you'll build</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {DEMOS.map((demo) => (
            <DemoVideo key={demo.title} demo={demo} />
          ))}
        </div>
      </div>

      {/* What you'll build */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="Two builds, one weekend">What you'll walk away with</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {BUILDS.map((b) => (
            <div key={b.name} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-6 text-center">
              <div className="w-11 h-11 mx-auto rounded-full bg-[#F3EBFF] dark:bg-brand/15 text-brand flex items-center justify-center mb-3">
                <b.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-[15px] text-ink mb-1.5">{b.name}</h3>
              <p className="text-[13px] text-body leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Format */}
      <div className="bg-[#FBFAFF] dark:bg-[#141416] border-y border-border-soft px-4 sm:px-6 lg:px-[5vw] py-16">
        <div className="max-w-3xl mx-auto">
          <SectionHeading eyebrow="How it runs">Two days, live, hands-on</SectionHeading>
          <div className="flex flex-col gap-2.5 text-left">
            {FORMAT.map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-[13.5px] font-semibold text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Who is this for */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="Who is this for">Built for the weekend build, not the long haul</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
          {WHO_FOR.map((w) => (
            <div key={w.title} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-4.5">
              <h3 className="font-display font-bold text-[13.5px] text-ink mb-1.5">{w.title}</h3>
              <p className="text-[12px] text-body leading-relaxed">{w.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Guardrails note */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pb-16 max-w-3xl mx-auto">
        <div className="flex items-start gap-3 bg-[#F3EBFF] dark:bg-brand/10 rounded-2xl p-5">
          <ShieldCheck className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
          <p className="text-[13.5px] text-body-strong leading-relaxed">
            An agent that can message people and act on tasks needs real guardrails, not blind trust — you'll build in
            checks so nothing sends or acts without you knowing.
          </p>
        </div>
      </div>

      {/* Qualifier */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pb-16 max-w-5xl mx-auto">
        <SectionHeading>Is AI Agents Live for you?</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-[#181818] border-[2px] border-green rounded-2xl p-6">
            <h3 className="font-display font-bold text-base text-ink mb-4">This is for you if…</h3>
            <ul className="flex flex-col gap-2.5">
              {FOR_YOU.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-body-strong font-medium"><CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-6">
            <h3 className="font-display font-bold text-base text-ink mb-4">This might not be for you if…</h3>
            <ul className="flex flex-col gap-2.5">
              {NOT_FOR_YOU.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-body"><X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" /> <span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading>Your questions, answered</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto">
          {FAQS.map((item) => (
            <div key={item.q} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-4.5">
              <div className="flex items-start gap-2.5 mb-1.5">
                <CircleHelp className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                <span className="font-display font-bold text-[14px] text-ink">{item.q}</span>
              </div>
              <p className="text-[13px] text-body leading-relaxed m-0 pl-6.5">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing / offer — the ONLY plan sold on this page */}
      <div id="pricing" className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-3xl mx-auto scroll-mt-20">
        <SectionHeading eyebrow="Your investment">Join the workshop</SectionHeading>

        {checkoutError && (
          <div className="max-w-md mx-auto mb-6 flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {checkoutError}
          </div>
        )}

        <div className="rounded-[24px] border-[2.5px] border-brand bg-[#FAF7FF] dark:bg-[#181022] p-7 sm:p-8 relative">
          <span className="absolute -top-3.5 left-7 bg-brand text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-full">
            2-DAY WORKSHOP
          </span>
          <div className="font-display font-extrabold text-[36px] text-ink mt-2 mb-1">
            ₦{AGENTS_LIVE_PRICE.toLocaleString()} <span className="text-base font-bold text-body">one-time</span>
          </div>
          {cohortDate && (
            <span className="inline-flex items-center gap-1 bg-white dark:bg-[#141319] text-brand font-bold text-[12px] px-2.5 py-1 rounded-full w-fit mb-4">
              <CalendarDays className="w-3.5 h-3.5" /> Workshop starts {cohortDate}
            </span>
          )}
          <ul className="flex flex-col gap-2.5 mb-6">
            {[
              '2 live instructor-led days',
              `${AGENTS_LIVE_ACCESS_DAYS} days access to replays and resources after`,
              'Your own agent, connected to Telegram, WhatsApp, and other tools',
              'A multi-agent dashboard, built from scratch',
              'Guardrails so nothing acts without you knowing',
              'Community/support during the access window',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong"><CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{f}</span></li>
            ))}
          </ul>

          {hasAgentsLive ? (
            <Link
              to="/dashboard/live-sessions"
              className="flex items-center justify-center gap-2 w-full bg-green text-white font-extrabold px-5 py-3.5 rounded-xl transition-colors"
            >
              You're enrolled — go to your classes →
            </Link>
          ) : (
            <button
              onClick={() => checkout('agentslive')}
              disabled={checkoutLoading === 'agentslive'}
              className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(124,58,237,.35)] transition-colors"
            >
              {checkoutLoading === 'agentslive' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {checkoutLoading === 'agentslive' ? 'Starting checkout…' : `Join — ₦${AGENTS_LIVE_PRICE.toLocaleString()} →`}
            </button>
          )}

          <p className="flex items-start gap-1.5 text-[12px] text-body mt-4">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            One-time payment, not a subscription. Access starts the moment you pay.
          </p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pb-16 max-w-6xl mx-auto">
        <div
          className="rounded-[24px] px-8 sm:px-10 py-9 flex items-center justify-between flex-wrap gap-5 shadow-[0_20px_44px_-16px_rgba(124,58,237,.6)]"
          style={{ background: 'linear-gradient(120deg, #7C3AED, #9D5CFF)' }}
        >
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-[26px] text-white m-0 flex items-center gap-2.5">
              <Bot className="w-6 h-6" /> Ready to build this weekend?
            </h2>
            <p className="text-[#EDE4FF] mt-2 mb-0 text-[15px]">2 live days. Your own agent, plus a dashboard where several work together.</p>
          </div>
          <a
            href="#pricing"
            className="bg-yellow text-ink font-extrabold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,.18)] hover:brightness-95 transition-all flex-shrink-0 flex items-center gap-2"
          >
            Join the workshop <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <CheckoutAuthModal open={authModalOpen} onClose={closeAuthModal} onAuthenticated={handleAuthenticated} />
    </div>
  );
}
