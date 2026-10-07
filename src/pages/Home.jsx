import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  Code2, Bot, KeyRound, MessageCircle, Video, CalendarDays, PlayCircle, Send, CheckCheck, Sparkles, ArrowRight,
  Users, Award, TrendingUp, Wallet, Zap, Workflow,
} from 'lucide-react';
import AgentCard from '../components/AgentCard';
import AutomationFlowDiagram from '../components/AutomationFlowDiagram';
import YouTubeFacade from '../components/YouTubeFacade';
import TestimonialsSection from '../components/TestimonialsSection';
import { agents, getBuilder1Agents, groupAgentsByWeek, getAgentBySlug, getBuilderPagePath } from '../data/agents';
import { departments, isVisibleToPublic } from '../data/departments';
import { usePro } from '../hooks/usePro';
import { useTheme } from '../context/ThemeContext';
import { useCohortSchedule } from '../hooks/useCohortSchedule';
import { BUILDER1_PRICE, VIBECODING_PRICE, AI_AGENT_MASTERY_PRICE } from '../data/pricing';

// Returns a display string for a cohort start date, or null if it's unset or
// already in the past — same rule Pricing.jsx uses, duplicated rather than
// shared since the two pages' surrounding date logic differs slightly.
function formatCohortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (date < new Date(new Date().toDateString())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

// Stylized recreation of the real live-session card (see
// src/pages/dashboard/LiveSessions.jsx), not a screenshot — avoids both the
// consent issue of a real Zoom capture and the staleness of a screenshot
// going out of date the next time that page's design changes.
function LiveClassMockup() {
  return (
    <div className="relative bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-[22px] p-5 shadow-[0_20px_44px_-24px_rgba(15,26,42,.5)]">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose bg-[#FBEAE9] dark:bg-rose/10 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-rose animate-pulse" /> LIVE THIS WEEK
        </span>
        <CalendarDays className="w-4 h-4 text-gray-300" />
      </div>
      {[
        { title: 'Vibe Coding — Week 1 walkthrough', tier: 'Vibe Coding Bootcamp' },
        { title: 'AI Agent Mastery — Office hours', tier: 'AI Agent Mastery' },
      ].map((s) => (
        <div key={s.title} className="flex items-center gap-3 rounded-xl border border-border-soft px-3.5 py-3 mb-2.5 last:mb-0">
          <div className="w-9 h-9 rounded-lg bg-[#E8EDF3] dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
            <Video className="w-4 h-4 text-link" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-ink truncate">{s.title}</p>
            <p className="text-[11px] text-gray-500">{s.tier}</p>
          </div>
          <span className="flex-shrink-0 bg-brand text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">Join</span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-border-soft text-xs text-body">
        <PlayCircle className="w-3.5 h-3.5 text-gray-400" /> Can't make it live? Every session is recorded.
      </div>
    </div>
  );
}

// Stylized WhatsApp-style chat mockup — generic initials in place of avatars
// and made-up (but realistic) support exchange, not real members' names,
// photos, or messages.
const CHAT_MESSAGES = [
  { who: 'A', color: '#264D73', text: 'Anyone else stuck on the Gmail agent OAuth step? 😩', mine: false },
  { who: 'D', color: '#16A34A', text: 'yep — check the scope you granted, easy to miss one', mine: false },
  { who: 'Me', color: '#F2A93B', text: 'that was it, thank you!! 🙏', mine: true },
];

function CommunityMockup() {
  return (
    <div className="relative bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-[22px] overflow-hidden shadow-[0_20px_44px_-24px_rgba(22,163,74,.35)]">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#075E54]">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white">
          <MessageCircle className="w-4 h-4" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Social Dev Builders</p>
          <p className="text-white/80 text-[11px] leading-tight">128 members</p>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2.5" style={{ background: '#E5DDD5' }}>
        {CHAT_MESSAGES.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.mine ? 'flex-row-reverse' : ''}`}>
            {!m.mine && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ background: m.color }}
              >
                {m.who}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-xl px-3 py-2 text-[12.5px] leading-snug text-[#1F1F1F] ${
                m.mine ? 'bg-[#DCF8C6] rounded-br-sm' : 'bg-white rounded-bl-sm'
              }`}
            >
              {m.text}
              {m.mine && (
                <span className="inline-flex items-center gap-0.5 float-right mt-0.5 ml-1.5">
                  <CheckCheck className="w-3 h-3 text-[#4FC3F7]" />
                </span>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2 mt-1">
          <span className="text-[12px] text-gray-500 flex-1">Message</span>
          <Send className="w-3.5 h-3.5 text-[#075E54]" />
        </div>
      </div>
    </div>
  );
}

const TECH_MARQUEE = ['PYTHON', 'CLAUDE API', 'GMAIL API', 'SLACK', 'SUPABASE', 'NOTION'];
const YOUTUBE_VIDEO_ID = 'MYcREKgdAV4';

// Advanced/World Class are admin-only — every public-facing count and grid
// on this marketing page is based on the public catalog only.
const publicAgents = agents.filter((a) => isVisibleToPublic(a.difficulty));

// Two distinct product lines — not tiers of one ladder, see business-model.md.
// Equal visual weight (same card treatment, same border thickness) so
// neither reads as the "real" product with the other bolted on.
// AI Agent Mastery listed first — it's the priority/flagship program
// (founder-confirmed 2026-09-23), not a reflection of price or launch order.
const PROGRAMS = [
  {
    to: '/ai-agent-mastery',
    icon: MessageCircle,
    accent: 'brand',
    tag: 'AI Agent Mastery',
    title: 'Build your own AI personal assistant',
    text: 'Live cohort. Build one integrated assistant that triages your inbox, runs your calendar, does research, and drafts messages — with guardrails built in.',
    bullets: ['Live instructor-led classes', 'One assistant, built end to end', 'Certificate of completion'],
    price: `₦${AI_AGENT_MASTERY_PRICE.toLocaleString()} one-time`,
  },
  {
    to: '/ai-builder',
    icon: Bot,
    accent: 'green',
    tag: 'AI Agent Guides',
    title: 'Build AI agents for real work',
    text: `${publicAgents.length} guided, self-paced builds — Gmail triage, WhatsApp bots, invoice processing, and more. Ship a portfolio of working agents.`,
    bullets: ['Self-paced, permanent access', 'Runs on your own free Gemini key', 'Portfolio write-up every session'],
    price: `From ₦${BUILDER1_PRICE.toLocaleString()}`,
  },
  {
    to: '/vibe-coding',
    icon: Sparkles,
    accent: 'brand',
    tag: 'Vibe Coding Bootcamp',
    title: 'Build your own web app with AI',
    text: '4 weeks, 8 live classes. Go from an idea to a deployed website, web app, and AI-powered product — no coding experience required.',
    bullets: ['Live instructor-led classes', 'Portfolio site, to-do app, Supabase CRUD app + more', 'Certificate of completion'],
    price: `₦${VIBECODING_PRICE.toLocaleString()} one-time`,
  },
];

// General, company-wide track record — deliberately placed with the "Three
// programs" section near the top of the page, not folded into the
// AI-Agent-Guides-only stats further down (AI Agents / Departments / XP /
// Hours), since these numbers and outcomes span all three programs.
const TRACK_RECORD_STATS = [
  { icon: Users, value: '500+', label: 'Students taught' },
  { icon: Award, value: 'Certificates', label: 'Awarded on completion' },
  { icon: Sparkles, value: '3', label: 'Programs to choose from' },
];

const OUTCOMES = [
  { icon: TrendingUp, title: 'Stay ahead of the curve', text: 'Students walk into work already using AI skills their teams and managers are only just starting to ask for.' },
  { icon: Wallet, title: 'Real salary increases', text: 'Bringing new, in-demand skills to the table shows up in more than just a portfolio — many students see it reflected in their pay.' },
  { icon: Zap, title: 'More efficient at work', text: 'Tasks that used to take hours get automated away — students get noticeably more done in the same workday.' },
];

const HOW_IT_WORKS = [
  { num: 1, bg: '#264D73', fg: '#fff', title: 'Pick a session', text: `${publicAgents.length} guided builds across Builder 1 and Builder 2. Each has a time estimate and clear outcomes.` },
  { num: 2, bg: '#F2A93B', fg: '#0F1A2A', title: 'Follow the guide', text: 'Every build ships a clear, step-by-step guide with ready-to-use prompts — no blank page, just follow along and build.' },
  { num: 3, bg: '#16A34A', fg: '#fff', title: 'Ship to portfolio', text: 'Each session ends with a write-up prompt: LinkedIn post, resume bullets, project blurb.' },
];

// Set expectations before checkout, not after — these are the things
// students actually get surprised by, put somewhere a visitor deciding
// whether to buy will actually see it.
const BEFORE_YOU_START = [
  {
    icon: Code2,
    title: 'No prior coding experience required',
    text: 'Every build ships copy-paste-ready prompts — you\'re directing the AI, not writing code from scratch. Basic comfort with a browser and copy-paste is all you need to start.',
  },
  {
    icon: Bot,
    title: 'No paid AI subscription needed',
    text: 'All you need is a free Gemini API key from Google AI Studio — the free tier is enough to complete every build. Nothing extra to pay for beyond your one-time course payment.',
  },
  {
    icon: KeyRound,
    title: 'A few Builder 2 sessions need their own API key',
    text: 'A handful of advanced builds connect to a third-party service — Pinecone, HubSpot, DataForSEO — to do their job. Most have a free tier that\'s enough to complete the session; each build tells you exactly what it needs before you start.',
  },
];

// Short theme labels for each Builder 1 week — the underlying data
// (src/data/agentsBeginner.js) only stores week number + isMainProject, not
// a display label, so the label lives here alongside the one place it's
// rendered.
const WEEK_THEMES = {
  1: 'Info & briefing agents',
  2: 'Document processing',
  3: 'Inbound triage & lead handling',
  4: 'Customer-facing messaging',
};
const builder1Weeks = groupAgentsByWeek(getBuilder1Agents());

// Outcome-framed showcase: "what you'll actually walk away having built"
// rather than a topic list — each entry names one or two real catalog
// agents (by slug, so titles/emoji always stay in sync with the data) under
// a punchier umbrella. Spans both tracks, unlike the week-by-week preview
// above which is Builder 1 only.
const FLAGSHIP_BUILDS = [
  {
    label: 'A personal inbox agent',
    text: 'Triages your inbox and drafts replies before you even open it — start the day at zero, not 200 unread.',
    slugs: ['gmail-ai-triage-agent'],
  },
  {
    label: 'A daily briefing agent',
    text: 'Turns raw meeting notes and industry noise into a clean summary waiting for you every morning.',
    slugs: ['daily-news-industry-summary-agent', 'meeting-notes-formatter-agent'],
  },
  {
    label: 'A customer-facing bot',
    text: "A real bot your customers message directly on WhatsApp — live and answering, not a demo.",
    slugs: ['whatsapp-auto-reply-bot'],
  },
  {
    label: 'A RAG-powered support agent',
    text: 'Feed it your own docs and past tickets — it answers customer questions accurately, not generically.',
    slugs: ['customer-support-rag-bot'],
  },
  {
    label: 'Business automation agents',
    text: 'Agents that chase stale deals and write personalized outreach, so nothing falls through the cracks.',
    slugs: ['crm-lead-follow-up-agent', 'sales-email-personalization-agent'],
  },
];

const totalXP = publicAgents.reduce((sum, a) => sum + a.xp, 0);
const totalHours = Math.round(publicAgents.reduce((sum, a) => sum + parseFloat(a.buildTime), 0));
const realDepartments = departments.filter((d) => d.id !== 'all');

export default function Home({ progress, onSelectAgent }) {
  const { hasBuilder1, hasBuilder2, isAdmin } = usePro();
  const { theme } = useTheme();
  const navigate = useNavigate();
  // Builder 1/2 have no live cohort anymore (permanent, guides-only access) —
  // the only programs with a "next cohort starts" date are the two live ones.
  const { vibecoding: vibecodingCohortDate, aimastery: aimasteryCohortDate } = useCohortSchedule();

  const popularAgents = [...publicAgents].sort((a, b) => b.xp - a.xp).slice(0, 4);
  const nextCohort = formatCohortDate(vibecodingCohortDate) || formatCohortDate(aimasteryCohortDate);

  return (
    <div>
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden pt-14 pb-14 px-4 sm:px-6 lg:px-[5vw]"
        style={{
          background: theme === 'dark'
            ? '#0C1420'
            : '#F6F8FB',
        }}
      >
        <div
          className="absolute top-10 right-[15%] w-[150px] h-[150px] bg-yellow opacity-50 animate-floaty pointer-events-none hidden sm:block"
          style={{ borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' }}
        />
        <div
          className="absolute bottom-5 left-[20%] w-[90px] h-[90px] bg-emerald-400 opacity-35 animate-floaty pointer-events-none hidden sm:block"
          style={{ borderRadius: '50%', animationDelay: '.5s' }}
        />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_.95fr] gap-11 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-white dark:bg-[#131E2F] border-[1.5px] border-border text-link font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(15,26,42,.1)]">
              🚀 Learn by building real agents
            </span>
            <h1 className="font-display font-extrabold text-[40px] sm:text-[54px] leading-[1.04] text-ink tracking-[-1px] sm:tracking-[-1.5px] mt-5">
              Build real AI agents.<br />
              <span className="text-link">Earn XP.</span>{' '}
              <span className="inline-block bg-yellow px-2.5 rounded-lg -rotate-[1.5deg]">Level up.</span>
            </h1>
            <p className="text-[17px] leading-relaxed text-body mt-5 mb-5 max-w-[480px]">
              Learn AI by building it. Ship real AI agents, launch your own AI-powered web app, or build a personal
              assistant that works for you — hands-on, project-based programs with a real outcome at the end of
              every one, not video lectures.
            </p>
            <div className="flex gap-3.5 items-center flex-wrap mt-2">
              <Link
                to="/pricing"
                className="bg-brand text-white font-bold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_22px_rgba(15,26,42,.4)] hover:bg-brand-deep transition-colors"
              >
                Get started →
              </Link>
              <Link
                to="/catalog"
                className="bg-white dark:bg-[#131E2F] border-[1.5px] border-[#DDE3EA] dark:border-[#26364B] text-body-strong font-bold text-base px-6.5 py-[15px] rounded-2xl hover:bg-[#F6F8FB] dark:hover:bg-white/5 transition-colors"
              >
                Browse catalog
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative h-[220px] sm:h-[280px] lg:h-[320px] rounded-[22px] overflow-hidden shadow-[0_24px_50px_-18px_rgba(15,26,42,.4)] bg-[#0F1A2A]">
              <YouTubeFacade
                className="w-full h-full"
                videoId={YOUTUBE_VIDEO_ID}
                title="Don't Get Left Behind: Learn AI Automation with Claude"
                thumbnailSrc="/video-thumbnail.jpg"
                priority
              />
            </div>
            <m.div
              className="absolute -top-4.5 -left-6"
              initial={{ opacity: 0, x: -50, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: 'easeOut' }}
            >
              <div className="bg-white rounded-2xl px-4 py-3 shadow-[0_12px_26px_rgba(15,26,42,.22)] animate-floaty2 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[#ECFDF5] flex items-center justify-center text-lg">✅</div>
                <div>
                  <div className="font-display font-extrabold text-sm text-ink">Agent shipped!</div>
                  <div className="text-[11.5px] text-green font-bold">+300 XP earned</div>
                </div>
              </div>
            </m.div>
            <m.div
              className="absolute -bottom-4 -right-4.5"
              initial={{ opacity: 0, x: 50, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.7, delay: 1.3, ease: 'easeOut' }}
            >
              <div className="bg-brand text-white rounded-2xl px-4 py-3 shadow-[0_12px_26px_rgba(15,26,42,.4)] animate-floaty" style={{ animationDelay: '.8s' }}>
                <div className="text-[11px] opacity-85 font-semibold">Your level</div>
                <div className="font-display font-extrabold text-base">🔨 Builder</div>
              </div>
            </m.div>
          </div>
        </div>
      </div>

      {/* ── Tech marquee ── */}
      <div className="bg-[#0F1A2A] py-4 overflow-hidden whitespace-nowrap">
        <div className="inline-flex gap-[52px] animate-marquee font-bold text-sm text-white/55">
          {[...TECH_MARQUEE, ...TECH_MARQUEE].map((t, i) => (
            <span key={i} className="flex gap-[52px]">
              {t}{i < TECH_MARQUEE.length * 2 - 1 && <span>·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Automation flow showcase ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-14 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link mb-3">
            <Workflow className="w-3.5 h-3.5" /> See an agent at work
          </span>
          <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] m-0">From trigger to done — automatically</h2>
          <p className="text-center text-body mt-2 max-w-xl mx-auto">
            An email lands, your AI agent reads it, decides what matters, and acts — replying on Slack and logging it
            in Notion. This is the kind of automation you'll build yourself.
          </p>
        </div>
        <AutomationFlowDiagram />
      </div>

      {/* ── Three programs ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-14 pb-14 max-w-6xl mx-auto">
        <div className="text-center mb-7">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link mb-3">
            What we offer
          </span>
          <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] m-0">Three ways to build with AI</h2>
          <p className="text-center text-body mt-2">Pick the path that fits — automate real work, ship your own web app, or build a personal assistant</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROGRAMS.map((program) => (
            <Link
              key={program.to}
              to={program.to}
              className={`bg-white dark:bg-[#131E2F] rounded-[20px] p-6.5 transition-colors ${
                program.accent === 'green'
                  ? 'border-[2px] border-green hover:border-green'
                  : 'border-[2px] border-brand hover:border-brand'
              }`}
            >
              <span
                className={`inline-flex items-center gap-1.5 font-bold text-[11px] px-2.5 py-1 rounded-full mb-4 ${
                  program.accent === 'green'
                    ? 'bg-[#EAFAF1] dark:bg-green/10 text-green'
                    : 'bg-[#E8EDF3] dark:bg-brand/15 text-link'
                }`}
              >
                {program.tag}
              </span>
              <div
                className={`w-12 h-12 rounded-[14px] flex items-center justify-center mb-4 ${
                  program.accent === 'green' ? 'bg-[#EAFAF1] dark:bg-green/10 text-green' : 'bg-[#E8EDF3] dark:bg-brand/15 text-link'
                }`}
              >
                <program.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink mb-2">{program.title}</h3>
              <p className="text-sm leading-relaxed text-body mb-4">{program.text}</p>
              <ul className="flex flex-col gap-1.5 mb-5">
                {program.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[12.5px] text-body-strong">
                    <CheckCheck className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${program.accent === 'green' ? 'text-green' : 'text-link'}`} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-4 border-t border-border-soft">
                <span className="font-display font-extrabold text-ink">{program.price}</span>
                <span className={`inline-flex items-center gap-1.5 font-bold text-sm ${program.accent === 'green' ? 'text-green' : 'text-link'}`}>
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Track record ── */}
      <div className="bg-[#0F1A2A] px-4 sm:px-6 lg:px-[5vw] py-14">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-9">
            <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-white/10 text-yellow mb-3">
              Proven track record
            </span>
            <h2 className="font-display font-extrabold text-[30px] text-white tracking-[-.8px] m-0">Real outcomes, not just sessions</h2>
            <p className="text-[#D5DEE9] mt-2 max-w-xl mx-auto">
              500+ students taught across three programs — with outcomes that show up at work, not just a certificate.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-9">
            {TRACK_RECORD_STATS.map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-[18px] px-5 py-6 text-center">
                <stat.icon className="w-5 h-5 text-yellow mx-auto mb-2" />
                <div className="font-display font-extrabold text-2xl text-white">{stat.value}</div>
                <div className="text-[13px] text-[#D5DEE9] font-semibold mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {OUTCOMES.map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-[20px] p-6">
                <div className="w-11 h-11 rounded-xl bg-white/10 text-yellow flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[#D5DEE9] m-0">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Agent Guides deep dive — everything from here through "Most
          popular sessions" is specifically about the self-paced guides
          track, not Vibe Coding or AI Agent Mastery. This divider makes
          that scope explicit now that it no longer sits right under the
          hero. ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-4 text-center max-w-6xl mx-auto">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#EAFAF1] dark:bg-green/10 text-green">
          🌱 A closer look: AI Agent Guides
        </span>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 sm:px-6 lg:px-[5vw] py-10 max-w-6xl mx-auto">
        <div className="bg-[#E8EDF3] dark:bg-[#131E2F] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-link">{publicAgents.length}</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">AI Agents</div>
        </div>
        <div className="bg-[#FEF9E7] dark:bg-[#131E2F] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-[#B45309]">{realDepartments.length}</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">Departments</div>
        </div>
        <div className="bg-[#EAFAF1] dark:bg-[#131E2F] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-green"><span>{Math.round(totalXP / 1000)}</span>k+</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">XP Available</div>
        </div>
        <div className="bg-[#FBEAE9] dark:bg-[#131E2F] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-rose"><span>{totalHours}</span>+</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">Hours of content</div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-5 pb-11 max-w-6xl mx-auto">
        <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] text-center m-0">How it works</h2>
        <p className="text-center text-body mt-2 mb-7 max-w-2xl mx-auto">
          {/* Dynamic count kept in its own element rather than a bare text
              sibling: two adjacent JSX text children serialize as one merged
              text node in prerendered static HTML, which then mismatches
              React's two-node hydration expectation (React #418) on every
              visit. */}
          <span>{publicAgents.length}</span> guided AI agent build sessions across every department — copy-paste
          prompts, step-by-step builds, and a portfolio write-up every session. Three steps from zero to
          portfolio-ready agent:
        </p>
        <div className="grid sm:grid-cols-3 gap-5">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.num} className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-[20px] p-6.5">
              <div
                className="w-12 h-12 rounded-[14px] font-display font-extrabold text-xl flex items-center justify-center shadow-[0_8px_18px_rgba(15,26,42,.35)]"
                style={{ background: step.bg, color: step.fg }}
              >
                {step.num}
              </div>
              <h3 className="font-display font-bold text-lg text-ink mt-4 mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed text-body m-0">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Before you start ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] text-center m-0">Before you start</h2>
        <p className="text-center text-body mt-2 mb-7">What you actually need — no surprises after checkout</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {BEFORE_YOU_START.map((item) => (
            <div key={item.title} className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-[20px] p-6.5">
              <div className="w-11 h-11 rounded-xl bg-[#E8EDF3] dark:bg-brand/15 text-link flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-ink mb-2">{item.title}</h3>
              <p className="text-sm leading-relaxed text-body m-0">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Flagship builds ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] text-center m-0">What you'll actually walk away having built</h2>
        <p className="text-center text-body mt-2 mb-7">Real agents from the catalog — not a topic list, a portfolio</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FLAGSHIP_BUILDS.map((item) => {
            const buildAgents = item.slugs.map(getAgentBySlug).filter(Boolean);
            const primary = buildAgents[0];
            return (
              <Link
                key={item.label}
                to={primary ? getBuilderPagePath(primary) : '/catalog'}
                className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-[20px] p-6 hover:border-brand/40 transition-colors"
              >
                <div className="flex gap-1.5 mb-4">
                  {buildAgents.map((a) => (
                    <span key={a.id} className="w-11 h-11 rounded-xl bg-[#E8EDF3] dark:bg-brand/15 flex items-center justify-center text-xl flex-shrink-0">
                      {a.emoji}
                    </span>
                  ))}
                </div>
                <h3 className="font-display font-bold text-lg text-ink mb-2">{item.label}</h3>
                <p className="text-sm leading-relaxed text-body m-0">{item.text}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Curriculum preview ── */}
      {builder1Weeks.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
          <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] text-center m-0">What you'll build, week by week</h2>
          <p className="text-center text-body mt-2 mb-7">Builder 1's first month, mapped out — each week has one main project and two optional ones</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {builder1Weeks.map(({ week, agents: weekAgents, mainAgent }) => (
              <div key={week} className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-[20px] p-6">
                <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-link bg-[#E8EDF3] dark:bg-brand/15 px-2.5 py-1 rounded-full mb-3">
                  Week <span>{week}</span>
                </span>
                <h3 className="font-display font-bold text-lg text-ink mb-1">{WEEK_THEMES[week] || `Week ${week}`}</h3>
                {mainAgent && (
                  <p className="text-sm text-body leading-relaxed mb-3">
                    <span className="font-semibold text-ink">Main build:</span> <span>{mainAgent.title}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500"><span>{weekAgents.length}</span> sessions this week</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Browse by department ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4.5">
          <h2 className="font-display font-extrabold text-2xl text-ink m-0">Browse by department</h2>
          <Link to="/catalog" className="font-bold text-sm text-link">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {realDepartments.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/catalog?department=${d.id}`)}
              className="rounded-2xl p-4.5 text-center hover:opacity-90 transition-opacity"
              style={{ background: `${d.color}14` }}
            >
              <div className="text-[26px]">{d.icon}</div>
              <div className="font-bold text-[13.5px] text-ink mt-1.5">{d.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Most popular sessions ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <h2 className="font-display font-extrabold text-2xl text-ink mb-4.5">Most popular sessions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {popularAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              completed={progress.isCompleted(agent.id)}
              onClick={() => onSelectAgent(agent)}
              hasBuilder1={hasBuilder1}
              hasBuilder2={hasBuilder2}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>

      {/* ── Live classes ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 bg-[#FBEAE9] dark:bg-rose/10 text-rose font-bold text-[12.5px] px-4 py-2 rounded-full">
              <Video className="w-3.5 h-3.5" /> Live classes
            </span>
            <h2 className="font-display font-extrabold text-[28px] sm:text-[32px] text-ink tracking-[-.7px] mt-4 mb-3">
              Prefer real classes over a self-paced library?
            </h2>
            <p className="text-body leading-relaxed mb-5 max-w-[440px]">
              AI Agent Mastery and Vibe Coding Bootcamp are both live, instructor-led cohorts — walkthroughs, office
              hours, and Q&A on Zoom, not just guides to read on your own. Can't make it live? Every session is
              recorded and added to your replays.
            </p>
            {nextCohort && (
              <p className="inline-flex items-center gap-2 text-sm font-bold text-ink bg-[#E8EDF3] dark:bg-brand/15 px-4 py-2 rounded-full mb-5">
                <CalendarDays className="w-4 h-4 text-link" /> Next cohort starts <span>{nextCohort}</span>
              </p>
            )}
            <div>
              <Link
                to="/pricing"
                className="inline-flex bg-brand text-white font-bold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_22px_rgba(15,26,42,.4)] hover:bg-brand-deep transition-colors"
              >
                See the live cohorts →
              </Link>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <LiveClassMockup />
          </div>
        </div>
      </div>

      {/* ── Community support ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <CommunityMockup />
          </div>
          <div>
            <span className="inline-flex items-center gap-2 bg-[#EAFAF1] dark:bg-green/10 text-green font-bold text-[12.5px] px-4 py-2 rounded-full">
              <MessageCircle className="w-3.5 h-3.5" /> Community support
            </span>
            <h2 className="font-display font-extrabold text-[28px] sm:text-[32px] text-ink tracking-[-.7px] mt-4 mb-3">
              Stuck on a build? You're not on your own
            </h2>
            <p className="text-body leading-relaxed mb-5 max-w-[440px]">
              Every student gets added to our WhatsApp community — ask questions, share what you've shipped, and get
              unstuck from other builders (and us) the same day, not a forum post that sits unanswered for a week.
            </p>
            <Link
              to="/pricing"
              className="inline-flex bg-brand text-white font-bold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_22px_rgba(15,26,42,.4)] hover:bg-brand-deep transition-colors"
            >
              Get started →
            </Link>
          </div>
        </div>
      </div>

      <TestimonialsSection />

      {/* ── Pricing CTA band ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pb-14 max-w-6xl mx-auto">
        <div
          className="rounded-[24px] px-8 sm:px-10 py-9 flex items-center justify-between flex-wrap gap-5 shadow-[0_20px_44px_-16px_rgba(15,26,42,.6)]"
          style={{ background: '#264D73' }}
        >
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-[26px] text-white m-0">Ready to start building?</h2>
            <p className="text-[#D5DEE9] mt-2 mb-0 text-[15px]">AI Agent Mastery, AI Agent Guides, or Vibe Coding — every program and price in one place.</p>
          </div>
          <Link
            to="/pricing"
            className="bg-yellow text-ink font-extrabold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,.18)] hover:brightness-95 transition-all flex-shrink-0"
          >
            See pricing →
          </Link>
        </div>
      </div>
    </div>
  );
}
