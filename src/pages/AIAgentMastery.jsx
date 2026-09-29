import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  CheckCircle2, ArrowRight, CalendarDays, Info, CircleHelp, Loader2, AlertCircle,
  Bot, Mail, Calendar, Search, MessageSquare, ShieldCheck, X, Zap,
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
import { useAuth } from '../context/AuthContext';
import {
  AI_AGENT_MASTERY_PRICE, AI_AGENT_MASTERY_STUDENT_PRICE, STUDENT_EMAIL_DOMAIN, isStudentEmail,
} from '../data/pricing';

// This page sells ONE product: AI Agent Mastery. Same pattern as
// VibeCoding.jsx — checkout is hardcoded to plan: 'aimastery', this page
// never offers the guides ladder or Vibe Coding.
//
// Deliberately does not name the underlying agent framework the curriculum
// is built on anywhere on this page (founder-confirmed, 2026-09-22) —
// every section describes the outcome (a working personal-assistant agent)
// rather than the tooling used to get there.

// 3 live days, confirmed by the founder 2026-09-27 — day 3 is dedicated to
// monetizing the skill, not more assistant-building. Day 1/2 copy draws
// only on the OUTCOMES already listed below (architecture/memory/inbox/
// calendar on day 1, multi-step tasks/messaging/guardrails on day 2).
const CURRICULUM_DAYS = [
  {
    day: 'Day 1',
    title: 'Agent Architecture & Your First Connections',
    text: 'Design an agent that holds context across tasks, then wire it into your real inbox and calendar so it starts triaging and scheduling for you.',
    tags: ['AGENT ARCHITECTURE', 'INBOX', 'CALENDAR'],
  },
  {
    day: 'Day 2',
    title: 'Memory, Multi-Step Tasks & Guardrails',
    text: "Give your agent memory so it improves with use, teach it to handle research and messaging tasks it can't finish in one shot, and add the guardrails that keep it asking before it acts.",
    tags: ['MEMORY', 'RESEARCH & MESSAGING', 'GUARDRAILS'],
  },
  {
    day: 'Day 3',
    title: 'Monetizing Your New Skill',
    text: 'Turn what you just built into an income stream — how to package and offer this same kind of build as a paid service to other businesses.',
    tags: ['MONETIZATION', 'OFFERING IT AS A SERVICE'],
  },
];

const FORMAT = [
  '3 live days — hands-on, building alongside the instructor, not watching a lecture',
  '6 months of access to classes, recordings, and resources after the live days end',
];

const CAPABILITIES = [
  { icon: Mail, name: 'Inbox', text: 'Reads, triages, and drafts replies to your email before you even open it.' },
  { icon: Calendar, name: 'Calendar', text: 'Finds time, schedules meetings, and untangles conflicts on your behalf.' },
  { icon: Search, name: 'Research', text: 'Pulls together answers, summaries, and briefings from across the web.' },
  { icon: MessageSquare, name: 'Messaging', text: 'Drafts and sends messages in your voice, on the channels you already use.' },
];

const WHO_FOR = [
  { title: 'Founders & operators', text: 'You want an assistant handling the busywork that eats your week, not another app to babysit.' },
  { title: 'Builder 1 / Builder 2 graduates', text: "You've shipped individual agents — now build the one that ties everything together." },
  { title: 'Consultants & freelancers', text: 'You want to reclaim the hours lost to admin, so you can bill for the work that actually matters.' },
  { title: 'Anyone tired of context-switching', text: 'You want one assistant that remembers context across your inbox, calendar, and tasks — not five disconnected tools.' },
  { title: 'Anyone who wants a new income stream', text: "Once you can build one for yourself, you can build one for someone else's business too — a skill most people in your market can't deliver yet." },
];

// Self-assessment, same pattern AIBuilder.jsx uses ("A quick gut check")
// for the automation-guides program — written fresh here for
// personal-assistant-specific pain points (inbox/calendar/follow-up),
// not copy-pasted from that page.
const HONEST_CHECK = [
  { title: 'Your inbox runs your day', items: ['You lose the first hour of your day just triaging what came in overnight', 'The same few questions come in on repeat, and you type the same answer every time'] },
  { title: 'Your calendar is a second job', items: ['Finding a slot that works for everyone takes five messages back and forth', 'Something slips through because nothing is actually tracking it for you'] },
  { title: "You're the one who has to remember", items: ["Follow-ups slip because nobody's chasing them but you", 'Research and prep for a call falls on you the night before, every time'] },
];

// Same "using it vs. owning it" framing as AIBuilder.jsx's "Using AI vs.
// Building with AI" — adapted for a personal assistant specifically
// rather than agent-building in general.
const USING_TOOLS = [
  'Opens a chat tool when they remember to, for one question at a time',
  're-explains the same context every single session',
  'Still does the triaging, scheduling, and follow-up by hand',
];
const OWNING_ASSISTANT = [
  'Runs continuously, not just when you remember to open it',
  'Remembers context across your inbox, calendar, and tasks',
  'Handles the triage, the scheduling, and the follow-up — and checks with you before anything risky',
];

const FOR_YOU = [
  'You want an assistant handling real busywork, not another app to babysit',
  'You can commit to showing up live and building alongside the cohort',
  'You want a skill you could also offer to other businesses',
];
const NOT_FOR_YOU = [
  "You're looking for a fully autonomous system with zero oversight from day one",
  'You want to skip straight to results without building the guardrails first',
  "You can't commit to the live sessions",
];

const OUTCOMES = [
  'Design an agent architecture that can hold context across tasks',
  'Wire an agent into real inbox, calendar, and messaging tools',
  'Give an agent memory so it improves the more you use it',
  'Handle multi-step tasks an agent can\'t finish in one shot',
  'Add guardrails so an agent asks before it acts on anything risky',
  'Debug an agent when it gets something wrong',
  'Deploy your assistant somewhere you can actually keep using it',
];

const FAQS = [
  { q: 'Is this the same as Builder 1 / Builder 2?', a: "No — those are self-paced, permanent-access guides for individual agent builds. AI Agent Mastery is live/cohort-taught, and the goal is one integrated personal-assistant agent, not a portfolio of separate builds." },
  { q: 'Do I need to have done Builder 1 / Builder 2 first?', a: "It helps, but it isn't required — the cohort starts from the fundamentals of agent architecture before building up to the full assistant." },
  { q: 'What will my assistant actually be able to do?', a: 'By the end, an agent that can triage your inbox, manage your calendar, do research on request, and draft messages in your voice — with guardrails so it checks with you before anything risky.' },
  { q: 'Do I need to pay for any tools?', a: "The cohort is built around free-tier tools wherever possible — anything with an unavoidable cost is called out before you need it." },
  { q: 'What if I miss a live class?', a: 'Class recordings are available so you can catch up, though attending live is strongly recommended.' },
  { q: 'How long will I have access?', a: "The cohort runs over 3 live days — the third dedicated to monetizing your new skill — and you'll have access for 6 months to the classes, recordings, resources, and your project." },
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

export default function AIAgentMastery() {
  const { hasAiMastery } = usePro();
  const { aimastery: cohortDateRaw } = useCohortSchedule();
  const cohortDate = formatCohortDate(cohortDateRaw);
  const {
    checkout, loadingKey: checkoutLoading, error: checkoutError,
    authModalOpen, requiredEmailDomain, closeAuthModal, handleAuthenticated,
  } = usePaystackCheckout();
  const { user } = useAuth();
  // Mirrors the server rule (create-paystack-checkout): the signed-in
  // account must have a confirmed BYU-Pathway address. Display only.
  const isStudent = !!user?.email_confirmed_at && isStudentEmail(user.email);
  const price = isStudent ? AI_AGENT_MASTERY_STUDENT_PRICE : AI_AGENT_MASTERY_PRICE;

  usePageSeo({
    title: 'AI Agent Mastery | Social Dev Technologies',
    description: `Build your own AI personal assistant — inbox, calendar, research, and messaging, handled for you. Live cohort, ₦${AI_AGENT_MASTERY_PRICE.toLocaleString()} one-time.`,
    canonicalPath: '/ai-agent-mastery',
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
            🤖 Live cohort — enrollment open
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
            {' '}<span className="text-brand">— Live, in 3 Days.</span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[17px] leading-relaxed text-body mt-5 max-w-lg mx-auto"
          >
            Stop copying tutorials that break. {cohortDate ? `Join us on ${cohortDate}` : 'Join the live cohort'} to
            connect your own AI agents to Telegram and WhatsApp, build a multi-agent dashboard, and cut repetitive
            manual work for good — even if you've never coded before.
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
              Join — ₦{AI_AGENT_MASTERY_PRICE.toLocaleString()} →
            </a>
            <a href="#demo" className="text-body-strong font-bold text-[14.5px] hover:text-brand transition-colors">
              Watch it in action ↓
            </a>
          </m.div>
        </div>
      </div>

      {/* System showcase — same diagram used on the AI Agents Live page,
          since both pages describe an agent connected to real tools plus
          a multi-agent dashboard. */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-4 pb-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="Under the hood">One agent, a whole team behind it</SectionHeading>
        <p className="text-center text-body max-w-xl mx-auto -mt-5 mb-8 text-[14px] leading-relaxed">
          A message or task comes in, your agent picks it up, and a team of agents on one shared dashboard splits the
          work — this is the system you'll build.
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
      <InstructorSection closingLine="AI Agent Mastery is that exact system, taught live, over the course of the cohort." />

      {/* Curriculum */}
      <div className="bg-[#FBFAFF] dark:bg-[#141416] border-y border-border-soft px-4 sm:px-6 lg:px-[5vw] py-16">
        <div className="max-w-3xl mx-auto">
          <SectionHeading eyebrow="The curriculum">Three days, one working assistant</SectionHeading>
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

      {/* Honest check */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="A quick gut check">How many of these sound like you?</SectionHeading>
        <div className="grid sm:grid-cols-3 gap-3.5 max-w-4xl mx-auto mb-6">
          {HONEST_CHECK.map((group) => (
            <div key={group.title} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-4.5">
              <span className="font-display font-bold text-[14px] text-ink block mb-2.5">{group.title}</span>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <li key={item} className="text-[12.5px] text-body leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center font-display font-bold text-[15px] sm:text-lg text-ink max-w-xl mx-auto">
          If two or more sound like your week, you don't need another app. <span className="text-brand">You need an assistant that just handles it.</span>
        </p>
      </div>

      {/* Capabilities */}
      <div id="capabilities" className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto scroll-mt-20">
        <SectionHeading eyebrow="One assistant, four jobs">What your agent will handle</SectionHeading>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-4xl mx-auto">
          {CAPABILITIES.map((c) => (
            <div key={c.name} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-5 text-center">
              <div className="w-11 h-11 mx-auto rounded-full bg-[#F3EBFF] dark:bg-brand/15 text-brand flex items-center justify-center mb-3">
                <c.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-[14.5px] text-ink mb-1.5">{c.name}</h3>
              <p className="text-[12.5px] text-body leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Using tools vs. owning an assistant */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading>Using AI tools vs. owning an assistant</SectionHeading>
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
              <h3 className="font-display font-bold text-[15px] text-ink">Owning an assistant</h3>
            </div>
            <ul className="space-y-2">
              {OWNING_ASSISTANT.map((t) => (
                <li key={t} className="flex items-start gap-2 text-[12.5px] text-body-strong font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-green mt-0.5 flex-shrink-0" /> <span>{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* What you'll learn */}
      <div className="bg-[#FBFAFF] dark:bg-[#141416] border-y border-border-soft px-4 sm:px-6 lg:px-[5vw] py-16">
        <div className="max-w-3xl mx-auto">
          <SectionHeading eyebrow="By the end of the cohort">What you'll walk away knowing</SectionHeading>
          <div className="grid sm:grid-cols-2 gap-2.5 text-left">
            {OUTCOMES.map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-[13px] font-semibold text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Who is this for */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="Who is this for">Built for people who want their time back</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
          {WHO_FOR.map((w) => (
            <div key={w.title} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-4.5">
              <h3 className="font-display font-bold text-[13.5px] text-ink mb-1.5">{w.title}</h3>
              <p className="text-[12px] text-body leading-relaxed">{w.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Guardrails note — sets expectations about an assistant that acts on your behalf */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pb-16 max-w-3xl mx-auto">
        <div className="flex items-start gap-3 bg-[#F3EBFF] dark:bg-brand/10 rounded-2xl p-5">
          <ShieldCheck className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
          <p className="text-[13.5px] text-body-strong leading-relaxed">
            An assistant that can send emails and manage your calendar needs real guardrails, not blind trust — a core
            part of the cohort is building in the checks that keep your agent asking before it acts on anything risky.
          </p>
        </div>
      </div>

      {/* Qualifier */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pb-16 max-w-5xl mx-auto">
        <SectionHeading>Is AI Agent Mastery for you?</SectionHeading>
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

      {/* Testimonials — real screenshots (on file), see
          AgentBuildTestimonials.jsx for the data. */}
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
        <SectionHeading eyebrow="Your investment">Join the cohort</SectionHeading>

        {checkoutError && (
          <div className="max-w-md mx-auto mb-6 flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {checkoutError}
          </div>
        )}

        <div className="rounded-[24px] border-[2.5px] border-brand bg-[#FAF7FF] dark:bg-[#181022] p-7 sm:p-8 relative">
          <span className="absolute -top-3.5 left-7 bg-brand text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-full">
            LIVE COHORT
          </span>
          <div className="font-display font-extrabold text-[36px] text-ink mt-2 mb-1">
            {isStudent && (
              <span className="text-lg font-bold text-body line-through mr-2">₦{AI_AGENT_MASTERY_PRICE.toLocaleString()}</span>
            )}
            ₦{price.toLocaleString()} <span className="text-base font-bold text-body">one-time</span>
          </div>
          {isStudent && (
            <p className="text-[12.5px] font-bold text-green mb-3">BYU-Pathway student price applied</p>
          )}
          {cohortDate && (
            <span className="inline-flex items-center gap-1 bg-white dark:bg-[#141319] text-brand font-bold text-[12px] px-2.5 py-1 rounded-full w-fit mb-4">
              <CalendarDays className="w-3.5 h-3.5" /> Cohort starts {cohortDate}
            </span>
          )}
          <ul className="flex flex-col gap-2.5 mb-6">
            {[
              '3 live instructor-led days — day 3 on monetizing your new skill',
              '6 months access to classes, replays, and resources',
              'One integrated personal-assistant agent, built end to end',
              'Guardrails and safety checks built in from the start',
              'Community/support',
              'Certificate of completion',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong"><CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{f}</span></li>
            ))}
          </ul>

          {hasAiMastery ? (
            <Link
              to="/ai-agent-mastery/course"
              className="flex items-center justify-center gap-2 w-full bg-green text-white font-extrabold px-5 py-3.5 rounded-xl transition-colors"
            >
              You're enrolled — go to your classes →
            </Link>
          ) : (
            <button
              onClick={() => checkout('aimastery')}
              disabled={checkoutLoading === 'aimastery'}
              className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(124,58,237,.35)] transition-colors"
            >
              {checkoutLoading === 'aimastery' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {checkoutLoading === 'aimastery' ? 'Starting checkout…' : `Join the cohort — ₦${price.toLocaleString()} →`}
            </button>
          )}

          {!hasAiMastery && !isStudent && (
            <div className="mt-4 rounded-xl border border-brand/25 bg-white dark:bg-[#141319] px-4 py-3 text-[13px] text-body-strong">
              <strong className="text-ink">BYU-Pathway student?</strong> Pay ₦{AI_AGENT_MASTERY_STUDENT_PRICE.toLocaleString()} instead.
              Verify your {STUDENT_EMAIL_DOMAIN} email and the student price is applied.{' '}
              <button
                type="button"
                onClick={() => checkout('aimastery', { studentDiscount: true })}
                disabled={checkoutLoading === 'aimastery'}
                className="font-bold text-brand hover:underline disabled:opacity-60"
              >
                Verify my student email →
              </button>
            </div>
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
              <Bot className="w-6 h-6" /> Ready to build your assistant?
            </h2>
            <p className="text-[#EDE4FF] mt-2 mb-0 text-[15px]">Live cohort. One agent that actually runs your busywork.</p>
          </div>
          <a
            href="#pricing"
            className="bg-yellow text-ink font-extrabold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,.18)] hover:brightness-95 transition-all flex-shrink-0 flex items-center gap-2"
          >
            Join the cohort <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <CheckoutAuthModal open={authModalOpen} onClose={closeAuthModal} onAuthenticated={handleAuthenticated} requiredEmailDomain={requiredEmailDomain} />
    </div>
  );
}
