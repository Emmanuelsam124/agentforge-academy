import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  CheckCircle2, ArrowRight, CalendarDays, Info, CircleHelp, Loader2, AlertCircle,
  Bot, Send, LayoutGrid, ShieldCheck, X, Clock, MessageSquare, Zap, Flame,
} from 'lucide-react';
import { usePro } from '../hooks/usePro';
import { useCohortSchedule } from '../hooks/useCohortSchedule';
import { usePaystackCheckout } from '../hooks/usePaystackCheckout';
import CheckoutAuthModal from '../components/CheckoutAuthModal';
import AgentsLiveFlowDiagram from '../components/AgentsLiveFlowDiagram';
import { DemoVideo, DemoLoop } from '../components/DemoMedia';
import { DEMO_VIDEO, DEMO_LOOP } from '../data/demoMedia';
import InstructorSection from '../components/InstructorSection';
import AgentBuildTestimonials from '../components/AgentBuildTestimonials';
import { usePageSeo } from '../hooks/usePageSeo';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  AGENTS_LIVE_PRICE_EARLY, AGENTS_LIVE_PRICE_LATE, AGENTS_LIVE_SEAT_THRESHOLD,
  AGENTS_LIVE_ACCESS_DAYS, AGENTS_LIVE_START_HOUR_WAT,
} from '../data/pricing';

// AI Agents Live — a separate, short-format live workshop, NOT the same
// product as AI Agent Mastery (that's a ₦19,999, 6-month cohort). This
// page sells ONE product: checkout is hardcoded to plan: 'agentslive'.
//
// Founder direction (2026-09-27): describe only what students build, never
// the underlying tools/frameworks — same "outcome, not tooling" rule
// AIAgentMastery.jsx follows. The two demo videos below are meant to carry
// that weight instead of naming anything.
//
// Seat-based pricing (founder-confirmed 2026-09-27) is REAL, not decorative:
// the price shown and charged is whatever create-paystack-checkout actually
// computes server-side from a live count of granted 'agentslive' payments
// (same threshold/prices as PRICING here) — this page reads that same count
// via the public agentslive_seats_taken() RPC so the displayed price never
// drifts from what checkout charges.

const CURRICULUM_DAYS = [
  {
    day: 'Day 1',
    title: 'Your Own Agent — Built and Talking',
    text: "Build your agent from the ground up and connect it to Telegram, WhatsApp, and other tools you already use, so it's reading and replying for real by the end of the day.",
    tags: ['AGENT SETUP', 'MESSAGING CHANNELS', 'FIRST REPLY'],
  },
  {
    day: 'Day 2',
    title: 'The Multi-Agent Dashboard — Agents Working Together',
    text: 'Build a dashboard where several agents share a task list and work together like a small team, with the guardrails that keep everything supervised.',
    tags: ['MULTI-AGENT BOARD', 'TASK HANDOFF', 'GUARDRAILS'],
  },
];

const USING_TOOLS = [
  'Copying prompts from tutorials and hoping they still work',
  'Using ChatGPT like a search engine, one question at a time',
  'Getting generic output that still needs heavy editing',
  'Closing the laptop with nothing actually running',
];
const OWNING_BUILD = [
  'An agent connected to real channels, replying without you at the keyboard',
  'A dashboard where several agents share the workload, not just one chat window',
  'Output tailored to your own business, not a generic template',
  'Something that keeps running after the two days end',
];

const DELIVERABLES = [
  { icon: Send, text: 'A working agent, connected to Telegram, WhatsApp, and other tools' },
  { icon: LayoutGrid, text: 'A live multi-agent dashboard — not a diagram of one, an actual one' },
  { icon: Zap, text: 'A path to offering this as a paid service to other businesses' },
  { icon: ShieldCheck, text: "Guardrails built in, so nothing acts without your sign-off" },
];

const WHO_FOR = [
  { title: "You came to the webinar but didn't join the cohort", text: "This is the fast, low-cost way to actually build something — in two days, not a 6-month commitment." },
  { title: 'Founders & operators', text: 'You want a working agent and a working dashboard, not a slide deck about AI.' },
  { title: 'Builder 1 / Builder 2 graduates', text: "You've built single-purpose agents — this is where you connect one to real messaging channels and put several to work together." },
  { title: 'Anyone who wants a new income stream', text: 'Once you can build this for yourself, the workshop also covers offering it to other businesses as a paid service.' },
  { title: 'Anyone curious but budget-conscious', text: 'One weekend, one low price, two real things to show for it at the end.' },
];

const FORMAT = [
  '2 live days — hands-on, building alongside the instructor, not watching a lecture',
  `${AGENTS_LIVE_ACCESS_DAYS} days of access to replays and resources after the live days end`,
];

const FOR_YOU = [
  'You want a working agent and dashboard by the end of the weekend',
  'You can show up live for both days (or catch the replay within the week)',
  "You're fine starting from the fundamentals — no prior build required",
];
const NOT_FOR_YOU = [
  'You want ongoing access and support well past the workshop itself',
  "You can't make either day, live or replay, within the access window",
  'You want a fully autonomous system with zero setup on your part',
];

const FAQS = [
  { q: 'Do I need coding experience?', a: "No. It's built to be followed step by step, whether or not you've built an agent before." },
  { q: "What do I actually walk away with?", a: 'Your own agent connected to Telegram, WhatsApp, and other tools, plus a working dashboard where multiple agents share a task list — both built by your own hands during the workshop.' },
  { q: 'What if I miss a live day?', a: `Replays are available for ${AGENTS_LIVE_ACCESS_DAYS} days after the workshop — plenty to catch up, though live is where you get help in real time.` },
  { q: 'How long do I keep access?', a: `${AGENTS_LIVE_ACCESS_DAYS} days from when the workshop starts — long enough to rewatch and finish your build, not an ongoing subscription.` },
  { q: 'Do I need to pay for any tools?', a: "The workshop is built around free-tier tools wherever possible — anything with an unavoidable cost is called out before you need it." },
  { q: 'Can I use this to make money, not just for myself?', a: "Yes — alongside the build itself, the workshop covers how to offer this to other businesses as a freelancer or agency, not just how to use it for your own." },
  { q: 'Why does the price go up — is that real?', a: `Yes. The first ${AGENTS_LIVE_SEAT_THRESHOLD} people who pay lock in ₦${AGENTS_LIVE_PRICE_EARLY.toLocaleString()}; every seat after that is ₦${AGENTS_LIVE_PRICE_LATE.toLocaleString()}. The price on this page is live — it updates the moment the ${AGENTS_LIVE_SEAT_THRESHOLD}th seat is taken, and that's exactly what you're charged at checkout.` },
];

function formatCohortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (date < new Date(new Date().toDateString())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Fetches the live seat count once on mount — no polling, since a stale-by-
// a-few-minutes count on a marketing page is fine, and the real price is
// re-verified server-side at checkout regardless of what this shows.
function useAgentsLiveSeats() {
  const [seatsTaken, setSeatsTaken] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let cancelled = false;
    supabase.rpc('agentslive_seats_taken').then(({ data, error }) => {
      if (!cancelled && !error && typeof data === 'number') setSeatsTaken(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const seatsLeft = seatsTaken === null ? null : Math.max(0, AGENTS_LIVE_SEAT_THRESHOLD - seatsTaken);
  const currentPrice = seatsLeft === 0 ? AGENTS_LIVE_PRICE_LATE : AGENTS_LIVE_PRICE_EARLY;
  return { seatsTaken, seatsLeft, currentPrice };
}

// Ticks once a second toward `target` (a Date or null) and returns null once
// it's passed or was never set — the caller just hides the timer then.
function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function CountdownTimer({ time }) {
  const units = [
    ['Days', time.days],
    ['Hours', time.hours],
    ['Min', time.minutes],
    ['Sec', time.seconds],
  ];
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {units.map(([label, value]) => (
        <div key={label} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-xl px-3 py-2 min-w-[58px] text-center">
          <div className="font-display font-extrabold text-[20px] sm:text-[24px] text-ink tabular-nums">{String(value).padStart(2, '0')}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
        </div>
      ))}
    </div>
  );
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

export default function AgentsLive() {
  const { hasAgentsLive } = usePro();
  const { agentslive: cohortDateRaw } = useCohortSchedule();
  const cohortDate = formatCohortDate(cohortDateRaw);
  const { seatsLeft, currentPrice } = useAgentsLiveSeats();
  const countdownTarget = useMemo(
    () => (cohortDateRaw ? new Date(`${cohortDateRaw}T${AGENTS_LIVE_START_HOUR_WAT}`) : null),
    [cohortDateRaw],
  );
  const countdown = useCountdown(countdownTarget);
  const {
    checkout, loadingKey: checkoutLoading, error: checkoutError,
    authModalOpen, closeAuthModal, handleAuthenticated,
  } = usePaystackCheckout();

  usePageSeo({
    title: 'AI Agents Live | Social Dev Technologies',
    description: `A 2-day live workshop: build your own AI agent connected to Telegram, WhatsApp, and other tools, plus a dashboard where multiple agents work together. ₦${AGENTS_LIVE_PRICE_EARLY.toLocaleString()} one-time.`,
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
            {seatsLeft === null ? (
              <><Clock className="w-3.5 h-3.5" /> 2-day live workshop — seats limited</>
            ) : seatsLeft > 0 ? (
              <><Flame className="w-3.5 h-3.5" /> Only {seatsLeft} seats left at ₦{AGENTS_LIVE_PRICE_EARLY.toLocaleString()}</>
            ) : (
              <><Flame className="w-3.5 h-3.5" /> Early-bird seats are gone — now ₦{AGENTS_LIVE_PRICE_LATE.toLocaleString()}</>
            )}
          </m.span>

          <m.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="italic text-[14px] sm:text-[15px] text-body-strong max-w-lg mx-auto mt-5 leading-relaxed"
          >
            "In January of this year, I built my first AI agent to handle customer messages. Since then, it's done
            the work of a 3-person team and I haven't paid a single staff salary for those roles."
          </m.p>

          <m.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-extrabold text-[32px] sm:text-[50px] leading-[1.08] text-ink tracking-[-1.5px] mt-5"
          >
            Build the Exact Multi-Agent System That Replaced My Business Overhead
            {' '}<span className="text-brand">— Live, in 2 Days.</span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[17px] leading-relaxed text-body mt-5 max-w-lg mx-auto"
          >
            Stop copying tutorials that break. Join us on October 9th to connect your own AI agents to Telegram and
            WhatsApp, build a multi-agent dashboard, and cut repetitive manual work for good — even if you've never
            coded before.
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
              Join — ₦{currentPrice.toLocaleString()} →
            </a>
            <a href="#demo" className="text-body-strong font-bold text-[14.5px] hover:text-brand transition-colors">
              Watch it in action ↓
            </a>
          </m.div>

          {countdown && (
            <div className="mt-8">
              <p className="text-[12px] font-bold uppercase tracking-wide text-body mb-2.5">
                Registration closes when the workshop starts
              </p>
              <CountdownTimer time={countdown} />
            </div>
          )}
        </div>
      </div>

      {/* System showcase — same engineering pattern as the homepage's
          AutomationFlowDiagram (loops forever from a fully-visible first
          frame, prerender-safe), reworked to show this page's own story:
          Telegram/WhatsApp in, a shared multi-agent dashboard out. */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-4 pb-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="Under the hood">One agent, a whole team behind it</SectionHeading>
        <p className="text-center text-body max-w-xl mx-auto -mt-5 mb-8 text-[14px] leading-relaxed">
          A message comes in on Telegram or WhatsApp, your agent picks it up, and a team of agents on one shared
          dashboard splits the work — this is the system you'll build.
        </p>
        <AgentsLiveFlowDiagram />
      </div>

      {/* Demo videos */}
      <div id="demo" className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-4xl mx-auto scroll-mt-20">
        <SectionHeading eyebrow="See it working">This is what you'll build</SectionHeading>
        <div className="flex flex-col gap-6">
          <DemoVideo demo={DEMO_VIDEO} />
          <DemoLoop demo={DEMO_LOOP} />
        </div>
      </div>


      {/* About the instructor */}
      <InstructorSection closingLine="AI Agents Live is that exact system, taught live, over two days." />

      {/* Curriculum */}
      <div className="bg-[#FBFAFF] dark:bg-[#141416] border-y border-border-soft px-4 sm:px-6 lg:px-[5vw] py-16">
        <div className="max-w-3xl mx-auto">
          <SectionHeading eyebrow="The curriculum">Two days, one transformation</SectionHeading>
          <div className="flex flex-col gap-4 mb-8">
            {CURRICULUM_DAYS.map((d) => (
              <div key={d.day} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-5 sm:p-6 text-left">
                <span className="inline-flex items-center text-[11px] font-extrabold text-brand bg-[#F3EBFF] dark:bg-brand/15 px-2.5 py-1 rounded-full mb-2.5">{d.day}</span>
                <h3 className="font-display font-bold text-[16px] sm:text-[18px] text-ink mb-1.5">{d.title}</h3>
                <p className="text-[13px] text-body leading-relaxed mb-3">{d.text}</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.tags.map((tag) => (
                    <span key={tag} className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400 bg-[#FAF8FF] dark:bg-white/5 px-2 py-1 rounded-md">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 text-left">
            {FORMAT.map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-[13.5px] font-semibold text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Using AI tools vs. owning what you built */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading>Using AI tools vs. owning what you built</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-400 flex items-center justify-center"><MessageSquare className="w-4.5 h-4.5" /></div>
              <h3 className="font-display font-bold text-[15px] text-ink">Using AI tools</h3>
            </div>
            <ul className="space-y-2">
              {USING_TOOLS.map((t) => (
                <li key={t} className="flex items-start gap-2 text-[12.5px] text-body"><X className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /> <span>{t}</span></li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-[#181818] border-[2px] border-brand rounded-2xl p-5 shadow-[0_16px_36px_-18px_rgba(124,58,237,.4)]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#F3EBFF] dark:bg-brand/15 text-brand flex items-center justify-center"><Zap className="w-4.5 h-4.5" /></div>
              <h3 className="font-display font-bold text-[15px] text-ink">Owning what you built</h3>
            </div>
            <ul className="space-y-2">
              {OWNING_BUILD.map((t) => (
                <li key={t} className="flex items-start gap-2 text-[12.5px] text-body-strong font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-green mt-0.5 flex-shrink-0" /> <span>{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Deliverables */}
      <div className="bg-[#FBFAFF] dark:bg-[#141416] border-y border-border-soft px-4 sm:px-6 lg:px-[5vw] py-16">
        <div className="max-w-3xl mx-auto">
          <SectionHeading eyebrow="By the end of day 2">After 2 days, you will have…</SectionHeading>
          <div className="grid sm:grid-cols-2 gap-3">
            {DELIVERABLES.map((item) => (
              <div key={item.text} className="flex items-start gap-2.5 text-left bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-xl p-4">
                <item.icon className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-[13px] font-semibold text-body-strong">{item.text}</span>
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

      {/* Testimonials — real screenshots (on file), captioned "an earlier
          class" rather than implying AI Agents Live itself already has
          graduates. See AgentBuildTestimonials.jsx for the data. */}
      <AgentBuildTestimonials />

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
            ₦{currentPrice.toLocaleString()} <span className="text-base font-bold text-body">one-time</span>
          </div>
          <p className="text-[12.5px] text-body font-medium mb-3">
            {seatsLeft === null
              ? `Rises to ₦${AGENTS_LIVE_PRICE_LATE.toLocaleString()} after the first ${AGENTS_LIVE_SEAT_THRESHOLD} seats.`
              : seatsLeft > 0
                ? `Rises to ₦${AGENTS_LIVE_PRICE_LATE.toLocaleString()} after the first ${AGENTS_LIVE_SEAT_THRESHOLD} seats — ${seatsLeft} left at this price.`
                : `Early-bird pricing has ended — ₦${AGENTS_LIVE_PRICE_LATE.toLocaleString()} is now the price for everyone.`}
          </p>
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
              {checkoutLoading === 'agentslive' ? 'Starting checkout…' : `Join — ₦${currentPrice.toLocaleString()} →`}
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
