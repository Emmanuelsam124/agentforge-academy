import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  CheckCircle2, X, Briefcase, Repeat, Building2, ChevronRight, Info,
  MessageCircle, Hammer, CircleHelp, ArrowRight, Zap, Infinity as InfinityIcon,
} from 'lucide-react';
import TestimonialCard from '../components/TestimonialCard';
import YouTubeFacade from '../components/YouTubeFacade';
import { agents, getBuilder1Agents, groupAgentsByWeek } from '../data/agents';
import { agentsBeginner } from '../data/agentsBeginner';
import { levels } from '../data/departments';
import { BUILDER1_PRICE, BUILDER2_PRICE, PRO_PRICE } from '../data/pricing';
import { usePageSeo } from '../hooks/usePageSeo';

// Content below is adapted from the /webinar deck's narrative (same offer,
// same honest framing, same real proof points) rebuilt as a scrollable
// sales landing page for cold ad traffic rather than a live presentation —
// no live-demo section (nothing to demo without a presenter), replaced
// with a CTA to the free, self-serve WhatsApp bot guide instead.

// Same video as the homepage hero. Swap this for a purpose-shot agent demo
// (the WhatsApp bot or the inbox-triage build actually running) when one
// exists — a demo of the product beats a talking-head intro on a cold ad
// landing page, but a real generic video beats a placeholder for a fake one.
const DEMO_VIDEO_ID = 'MYcREKgdAV4';

const WANTS = ['More money', 'More time', 'A better job', 'A growing business', 'To stay ahead'];
const SCENES = [
  { icon: '🎓', text: "Everyone in her class has the same degree. She has three AI agents she actually built — that's the interview conversation starter." },
  { icon: '🏪', text: 'He used to close his shop to answer messages. Now a bot replies while he sleeps, and sales never stop for the night.' },
  { icon: '👩‍🏫', text: 'She used to spend Sunday nights grading. Now she walks into Monday already prepared — and already ahead.' },
];

const HONEST_CHECK = [
  { title: 'Your time is draining', items: ['You spend evenings finishing the paperwork part of something you already did', 'You answer the same question over and over, one person at a time'] },
  { title: "You're stuck doing repeatable work", items: ['You do the same multi-step check by hand, every single day', 'Work a computer could do while you sleep is costing you hours'] },
  { title: "You're leaving things on the table", items: ['People message you and move on while they wait for your reply', 'You keep saying "I\'ll get to that" about the thing you never automate'] },
  { title: 'You are the bottleneck', items: ['Nothing moves — at work, in class, in your business — until you personally touch it'] },
];

const USING = ['Opens ChatGPT when they remember to', 'Asks the same question every time', "Nothing happens unless they're there, typing"];
const BUILDING = ['Builds a system that runs the task automatically', 'Solves a problem once — permanently', "Keeps working even when they're not there"];

const WALL_ORDER = [
  'gmail-ai-triage-agent', 'whatsapp-auto-reply-bot', 'slack-morning-briefing-bot', 'daily-news-industry-summary-agent',
  'meeting-notes-formatter-agent', 'simple-faq-chatbot', 'social-media-post-generator', 'document-summarizer-agent',
  'lead-capture-qualifier-bot', 'price-competitor-monitor-agent', 'calendar-task-prioritizer-agent', 'basic-data-extractor-agent',
];
const wall = WALL_ORDER.map((slug) => agentsBeginner.find((a) => a.slug === slug)).filter(Boolean);

const builder1Count = agents.filter((a) => a.difficulty === 'Builder 1').length;
const builder2Count = agents.filter((a) => a.difficulty === 'Builder 2').length;

const TRACKS = [
  { tag: '🌱 Builder 1 · Start here', tagClass: 'bg-[#EAFAF1] dark:bg-green/10 text-green', border: 'border-green border-[2.5px]', title: 'The foundation', text: `${builder1Count} single-tool builds designed for zero-to-one confidence. No prerequisite except curiosity.` },
  { tag: "⚡ Builder 2 · What's next", tagClass: 'bg-[#F3EBFF] dark:bg-brand/15 text-brand', border: 'border-border-soft border-[1.5px]', title: 'The next level', text: `${builder2Count} multi-step, API-integrated builds — waiting once you've shipped your first few agents.` },
  { tag: '⚡🌱 Pro · Both, no wait', tagClass: 'bg-[#FEF9E7] dark:bg-amber-500/15 text-amber-700 dark:text-amber-400', border: 'border-border-soft border-[1.5px]', title: 'Everything, now', text: 'One payment, no prerequisite — both tracks unlock immediately if you already know you want it all.' },
];

const CAPABILITIES = ['Spot work worth automating', 'Design an AI solution', 'Build agents with Claude', 'Connect AI to real tools', 'Build a real portfolio', 'Move on to Builder 2'];

const MONEY_PATHS = [
  { icon: Briefcase, label: 'Freelance builds', text: 'One-off automations for local businesses who need exactly one problem solved' },
  { icon: Repeat, label: 'Ongoing retainers', text: 'Maintain and improve agents for clients over time, not just a one-time project' },
  { icon: Building2, label: 'Become the "AI person"', text: 'The one who makes your own workplace faster — without a title change' },
];

// Two real, on-topic reviews pinned here rather than the full live
// testimonials grid — both are about learning to build, which matches this
// page's offer directly; the other approved rows are about unrelated
// web-dev/SEO client work. Copied verbatim from the `testimonials` table
// (approved = true), never paraphrased or written for the page — this sits
// above a payment CTA, so invented quotes would be fabricated reviews.
// John Amadi leads: his is the only review specifically about the AI course.
const FEATURED_TESTIMONIALS = [
  {
    id: '29d84036-0970-4ae7-9ec6-95b0514ef3b4',
    display_name: 'John Amadi',
    body: 'This was the best AI course I have seen. The instructor was super helpful too.',
    rating: 5,
    source: 'student',
  },
  {
    id: 'chiamaka-review',
    display_name: 'Chiamaka M.',
    body: 'When I enrolled in Social Dev Technologies, I had no clue what programming was all about, but now, I can code and my learning experience has been so wonderful... Social Dev Technologies has created a career path for me that will change my life forever.',
    rating: 5,
    source: 'google_business',
  },
];

const FAQS = [
  { q: 'Do I need coding experience?', a: 'No. Every session starts with copy-paste prompts.' },
  { q: "What if I've never programmed at all?", a: "That's exactly who AI Agent Guides is for — start with Builder 1, follow steps, copy-paste, done." },
  { q: "What if I don't know what to build?", a: "Every session is project-based. You're never starting blank." },
  { q: "What if I'm busy?", a: 'Self-paced. 1.5–3 hrs per session. Permanent access, no deadline.' },
  { q: 'Do I need to pay for AI tools?', a: 'No — a free Gemini API key from Google AI Studio is all you need.' },
  { q: 'What support do I get?', a: 'Direct support. Reach out, get an answer. Never alone.' },
  { q: 'What if I get stuck?', a: "Reach out anytime — we'll help you move forward." },
  { q: 'What if AI changes?', a: "You learn principles, not tools. That doesn't expire." },
];

const FOR_YOU = ['You want to build something, not just watch a video', "You've tried AI tools and felt like you weren't getting real results", 'You can commit an hour or two per session, at your own pace', 'You want a skill you can point to, not just a certificate'];
const NOT_FOR_YOU = ["You're looking for a magic button that needs zero effort from you", 'You want theory with no hands-on building', "You're not willing to actually open Claude and follow along"];

// Prices come from src/data/pricing.js — this page used to redeclare them
// locally, which is exactly the drift that file exists to prevent. Builder 1
// and Builder 2 no longer share one price (BUILDER1_PRICE/BUILDER2_PRICE),
// since they're now permanent, guides-only purchases (2026-09-22) rather
// than a 6-month subscription — no anchor/savings framing at this price
// point, see data/pricing.js's own comment for why.
const BUILDER1_FEATURES = [`${builder1Count} Builder 1 agent sessions`, 'Copy-paste prompts for every build', 'XP tracking & progress', 'Portfolio write-up prompts', 'Permanent access — yours to keep'];
const BUILDER2_FEATURES = [`${builder2Count} Builder 2 agent sessions`, 'Multi-step, API-integrated agent builds', 'XP tracking & progress', 'Portfolio write-up prompts', 'Permanent access — yours to keep'];
const PRO_FEATURES = [`All ${builder1Count + builder2Count} sessions — Builder 1 + Builder 2`, 'No prerequisite — both tracks unlock immediately', 'XP tracking & progress across both tracks', 'Portfolio write-up prompts for every agent', 'Permanent access — yours to keep'];

// Short theme labels per Builder 1 week. The data (src/data/agentsBeginner.js)
// stores only week number + isMainProject, not a display label — same split
// as Home.jsx's WEEK_THEMES, kept here alongside the one place it renders.
const WEEK_THEMES = {
  1: 'Info & briefing agents',
  2: 'Document processing',
  3: 'Inbound triage & lead handling',
  4: 'Customer-facing messaging',
};
const builder1Weeks = groupAgentsByWeek(getBuilder1Agents());

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

export default function AIBuilder() {
  const remaining = agentsBeginner.length - wall.length;

  usePageSeo({
    title: 'Become an AI Agent Builder | Social Dev Technologies',
    description: `Stop using AI. Start building with it. ${builder1Count + builder2Count} real AI agent sessions across AI Agent Guides, one-time payment, permanent access. Get AI Agent Guides today.`,
    canonicalPath: '/ai-builder',
  });

  return (
    <div>
      {/* Hero */}
      <div
        className="relative overflow-hidden pt-16 pb-14 px-4 sm:px-6 lg:px-[5vw] text-center"
        style={{ background: 'radial-gradient(120% 100% at 50% 0%, #F3EBFF 0%, #FBFAFF 55%)' }}
      >
        <div
          className="absolute top-10 right-[12%] w-[130px] h-[130px] bg-yellow opacity-40 animate-floaty pointer-events-none hidden sm:block"
          style={{ borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' }}
        />
        <div
          className="absolute bottom-8 left-[10%] w-[80px] h-[80px] bg-emerald-400 opacity-30 animate-floaty pointer-events-none hidden sm:block"
          style={{ borderRadius: '50%', animationDelay: '.5s' }}
        />
        <div className="relative max-w-3xl mx-auto">
          <m.span
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white dark:bg-[#181818] border-[1.5px] border-border text-brand font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(124,58,237,.1)]"
          >
            🚀 Enrollment open now
          </m.span>

          <m.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-extrabold text-[36px] sm:text-[54px] leading-[1.05] text-ink tracking-[-1.5px] mt-5"
          >
            Become an <span className="text-brand">AI Builder.</span>
          </m.h1>

          <m.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[17px] leading-relaxed text-body mt-5 max-w-lg mx-auto"
          >
            AI Agent Guides — <span>{builder1Count + builder2Count}</span> real AI agent sessions, permanent access.
            Everything you need to stop using AI and start building with it — no coding experience required.
          </m.p>

          <m.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3.5 items-center justify-center mt-8"
          >
            <Link
              to="/pricing"
              className="bg-brand text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-[0_10px_22px_rgba(124,58,237,.4)] hover:bg-brand-deep transition-colors"
            >
              Get AI Agent Guides — from ₦<span>{BUILDER1_PRICE.toLocaleString()}</span> →
            </Link>
            <a href="#what-you-build" className="text-body-strong font-bold text-[14.5px] hover:text-brand transition-colors">
              See what you'll build ↓
            </a>
          </m.div>

          <m.div initial={false} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-6 text-[13px] text-body font-semibold">
            <span><span>{builder1Count + builder2Count}</span> sessions</span>
            <span>·</span>
            <span>Permanent access</span>
            <span>·</span>
            <span>One-time payment, no subscription</span>
          </m.div>

          {/* Demo video. YouTubeFacade, not a raw iframe — the embed pulls
              ~1.5MB of third-party JS on sight, and this page is an ad
              landing page where load time is the conversion. */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-9 max-w-2xl mx-auto"
          >
            <div className="relative h-[200px] sm:h-[280px] lg:h-[340px] rounded-[22px] overflow-hidden shadow-[0_24px_50px_-18px_rgba(80,40,160,.4)] bg-[#1A1333]">
              <YouTubeFacade
                className="w-full h-full"
                videoId={DEMO_VIDEO_ID}
                title="Learn to build real AI agents with Claude"
                thumbnailSrc="/video-thumbnail.jpg"
                priority
              />
            </div>
            <p className="text-[12.5px] text-body mt-3">Watch what you'll actually be building — 2 minutes.</p>
          </m.div>
        </div>
      </div>

      {/* The opportunity */}
      <div className="bg-[#1A1333] py-16 px-4 sm:px-6 lg:px-[5vw]">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[13px] font-bold uppercase tracking-[3px] mb-5 inline-block" style={{ color: '#B39DFF' }}>
            Why this matters now
          </span>
          <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] leading-[1.15] tracking-[-1px] text-white">
            The opportunity has changed.
          </h2>
          <p className="text-[#E5DEF7] text-[15px] leading-relaxed mt-3 max-w-lg mx-auto">
            The people getting ahead aren't necessarily the smartest. They're the ones learning how to work
            differently.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6 mb-8">
            {WANTS.map((w) => (
              <span key={w} className="text-[12px] font-bold text-[#E5DEF7] bg-white/[0.08] border border-white/10 rounded-full px-3 py-1.5">{w}</span>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 text-left">
            {SCENES.map((scene) => (
              <div key={scene.text} className="flex items-center gap-3.5 bg-white/[0.06] border border-white/10 rounded-2xl px-5 py-4">
                <span className="text-xl flex-shrink-0">{scene.icon}</span>
                <span className="text-[#E5DEF7] text-[13.5px] leading-relaxed">{scene.text}</span>
              </div>
            ))}
          </div>
          <p className="text-[#C9BFE8] text-[14px] mt-7">
            The vehicle behind all of it? <span className="text-yellow font-bold">AI</span> — now cheap and simple enough that anyone can pick it up.
          </p>
        </div>
      </div>

      {/* Honest check */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="A quick gut check">How many of these sound like you?</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto mb-6">
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
          If two or more sound like your week, you don't need more hours. <span className="text-brand">You need a system that runs without you.</span>
        </p>
      </div>

      {/* Using vs building */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading>Using AI vs. Building with AI</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-7">
          <div className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-400 flex items-center justify-center"><MessageCircle className="w-4.5 h-4.5" /></div>
              <h3 className="font-display font-bold text-[15px] text-ink">Using AI</h3>
            </div>
            <ul className="space-y-2">
              {USING.map((t) => (
                <li key={t} className="flex items-start gap-2 text-[12.5px] text-body"><X className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /> <span>{t}</span></li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-[#181818] border-[2px] border-brand rounded-2xl p-5 shadow-[0_16px_36px_-18px_rgba(124,58,237,.4)]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#F3EBFF] dark:bg-brand/15 text-brand flex items-center justify-center"><Hammer className="w-4.5 h-4.5" /></div>
              <h3 className="font-display font-bold text-[15px] text-ink">Building with AI</h3>
            </div>
            <ul className="space-y-2">
              {BUILDING.map((t) => (
                <li key={t} className="flex items-start gap-2 text-[12.5px] text-body-strong font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-green mt-0.5 flex-shrink-0" /> <span>{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-center text-[14.5px] text-body">
          ChatGPT users consume AI. <span className="text-brand font-bold">AI Builders solve problems with it.</span>
        </p>
      </div>

      {/* Free guide CTA — replaces the live-demo section from the webinar */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-3xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#EAFAF1] dark:bg-green/10 text-green mb-3">
          Try it yourself — free
        </span>
        <h2 className="font-display font-extrabold text-[24px] sm:text-[34px] text-ink tracking-[-.8px] mb-3">
          Don't just read about it. Build something right now.
        </h2>
        <p className="text-[15px] text-body leading-relaxed max-w-xl mx-auto mb-6">
          Follow our free, beginner-friendly guide and have a working WhatsApp auto-reply bot running in about 40
          minutes — no credit card, no coding experience required.
        </p>
        <Link
          to="/whatsapp-bot-guide"
          className="inline-flex items-center gap-2 bg-white dark:bg-[#181818] border-[1.5px] border-brand text-brand font-extrabold text-base px-7 py-[15px] rounded-2xl hover:bg-[#F3EBFF] dark:hover:bg-brand/10 transition-colors"
        >
          Get the free guide <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-[12.5px] text-body mt-4 max-w-md mx-auto">
          Want the version built on Twilio's official WhatsApp Business API, trained on your own voice? That's the
          Advanced WhatsApp Auto-Reply Bot — one of 12 sessions inside Builder 1.
        </p>
      </div>

      {/* Wall of 12 */}
      <div id="what-you-build" className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto scroll-mt-20">
        <SectionHeading eyebrow="The wall of builders">Your first 12 AI agents</SectionHeading>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
          {wall.map((agent) => (
            <div key={agent.slug} className="relative flex flex-col items-center gap-1.5 bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-xl p-3 text-center">
              {agent.slug === 'whatsapp-auto-reply-bot' && (
                <span className="absolute -top-1.5 -right-1.5 text-[8px] font-extrabold uppercase tracking-wide text-white bg-rose rounded-full px-1.5 py-0.5">Free guide</span>
              )}
              <span className="text-xl">{agent.emoji}</span>
              <span className="text-[10.5px] font-bold text-body-strong leading-tight">{agent.title}</span>
            </div>
          ))}
        </div>
        <p className="text-center font-display font-bold text-[15px] sm:text-lg text-ink mt-7 max-w-lg mx-auto">
          By the end of Builder 1, you won't just understand AI — <span className="text-brand">you'll have built 12 real AI agents solving real business problems.</span>
        </p>
        {remaining > 0 && <p className="text-center text-[13px] text-body font-semibold mt-2">+ <span>{remaining}</span> more sessions across sales, data, and operations.</p>}
      </div>

      {/* Journey */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading>Your AI Builder journey</SectionHeading>
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-3 mb-9 max-w-3xl mx-auto">
          {TRACKS.map((track, i) => (
            <div key={track.title} className="flex items-center gap-3 flex-1">
              <div className={`bg-white dark:bg-[#181818] border ${track.border} rounded-2xl p-5 w-full text-left`}>
                <span className={`inline-flex items-center gap-1.5 font-bold text-[11px] px-2.5 py-1 rounded-full mb-3 ${track.tagClass}`}>{track.tag}</span>
                <h3 className="font-display font-extrabold text-base text-ink mb-1.5">{track.title}</h3>
                <p className="text-[12.5px] text-body leading-relaxed">{track.text}</p>
              </div>
              {i < TRACKS.length - 1 && <ChevronRight className="hidden lg:block w-5 h-5 text-gray-300 flex-shrink-0" />}
            </div>
          ))}
        </div>
        <p className="text-center text-[12.5px] font-bold uppercase tracking-wide text-body mb-4">After Builder 1, you'll be able to</p>
        <div className="grid sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto text-left">
          {CAPABILITIES.map((c) => (
            <div key={c} className="flex items-center gap-2.5 text-[13px] font-semibold text-body-strong">
              <CheckCircle2 className="w-4 h-4 text-green flex-shrink-0" /> <span>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Curriculum timeline — every count here is derived from src/data/
          agents.js, never hardcoded, so the page can't drift out of sync
          with the catalog the way a written-out "25 sessions" would. */}
      <div id="curriculum" className="bg-[#FBFAFF] dark:bg-[#141416] border-y border-border-soft px-4 sm:px-6 lg:px-[5vw] py-16">
        <div className="max-w-5xl mx-auto">
          <SectionHeading eyebrow="The full path">
            <span>{builder1Count + builder2Count}</span> sessions, start to finish.
          </SectionHeading>

          <div className="grid lg:grid-cols-[1.15fr_auto_1fr] gap-6 lg:gap-5 items-stretch">
            {/* Builder 1 — week by week */}
            <div className="bg-white dark:bg-[#181818] border-[2.5px] border-green rounded-[22px] p-6 flex flex-col">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="inline-flex items-center gap-1.5 bg-[#EAFAF1] dark:bg-green/10 text-green font-bold text-[11px] px-2.5 py-1 rounded-full">
                  🌱 Builder 1 · Start here
                </span>
                <span className="font-display font-extrabold text-2xl text-green leading-none">
                  <span>{builder1Count}</span>
                </span>
              </div>
              <p className="text-[12.5px] text-body mb-5">Four weeks, each built around one mechanism — not a random topic list.</p>

              <div className="flex flex-col">
                {builder1Weeks.map((week, i) => {
                  const main = week.agents.find((a) => a.isMainProject);
                  return (
                    <div key={week.week} className="flex gap-3.5">
                      {/* Rail */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-green text-white font-display font-extrabold text-[12px] flex items-center justify-center">
                          {week.week}
                        </div>
                        {i < builder1Weeks.length - 1 && <div className="w-0.5 flex-1 bg-green/25 my-1" />}
                      </div>
                      <div className={i < builder1Weeks.length - 1 ? 'pb-5' : ''}>
                        <p className="font-display font-bold text-[14px] text-ink leading-tight">{WEEK_THEMES[week.week]}</p>
                        <p className="text-[12px] text-body mt-1">
                          <span>{week.agents.length}</span> sessions
                          {main && <> · main build: <span className="text-body-strong font-semibold">{main.title}</span></>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="flex items-start gap-1.5 text-[11.5px] text-body mt-auto pt-4 border-t border-border-soft">
                <CheckCircle2 className="w-3.5 h-3.5 text-green mt-px flex-shrink-0" />
                Each week's main build earns a certificate on its own — the other two are optional.
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center h-full pt-20">
              <ChevronRight className="w-7 h-7 text-gray-300" />
            </div>

            {/* Builder 2 */}
            <div className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-[22px] p-6 flex flex-col">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="inline-flex items-center gap-1.5 bg-[#F3EBFF] dark:bg-brand/15 text-brand font-bold text-[11px] px-2.5 py-1 rounded-full">
                  ⚡ Builder 2 · What's next
                </span>
                <span className="font-display font-extrabold text-2xl text-brand leading-none">
                  <span>{builder2Count}</span>
                </span>
              </div>
              <p className="text-[12.5px] text-body mb-5">
                Multi-step agents that talk to real APIs — research, CRM, RAG support bots, invoice processing.
              </p>
              <ul className="flex flex-col gap-2.5">
                {BUILDER2_FEATURES.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[12.5px] text-body-strong">
                    <CheckCircle2 className="w-4 h-4 text-brand mt-px flex-shrink-0" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="flex items-start gap-1.5 text-[11.5px] text-body mt-auto pt-4 border-t border-border-soft">
                <Info className="w-3.5 h-3.5 mt-px flex-shrink-0" />
                A few of these connect to a third-party service and need a free API key of your own — each session says which, up front.
              </p>
            </div>
          </div>

          <p className="text-center font-display font-bold text-[15px] sm:text-lg text-ink mt-9 max-w-xl mx-auto">
            Every session ends with a write-up prompt — <span className="text-brand">LinkedIn post, resume bullets, project blurb.</span> You
            finish with a portfolio, not a certificate nobody asked for.
          </p>

          <div className="flex justify-center mt-6">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-white dark:bg-[#181818] border-[1.5px] border-border text-body-strong font-bold text-[14.5px] px-6 py-3 rounded-xl hover:border-brand hover:text-brand transition-colors"
            >
              See the full curriculum <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Who you become */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto text-center">
        <SectionHeading>Who you become</SectionHeading>
        <p className="text-body text-base -mt-6 mb-9 max-w-lg mx-auto">Every session earns real XP toward a real level — tracked, not a metaphor.</p>
        <div className="flex flex-wrap justify-center items-end gap-3 sm:gap-4 mb-10">
          {levels.map((level, i) => (
            <div
              key={level.name}
              className={`flex flex-col items-center gap-2 rounded-2xl px-5 py-5 ${i === 1 ? 'bg-brand text-white shadow-[0_16px_36px_-12px_rgba(124,58,237,.5)]' : 'bg-white dark:bg-[#181818] border-[1.5px] border-border-soft'}`}
              style={{ minWidth: 110 }}
            >
              <span className="text-3xl">{level.icon}</span>
              <span className={`font-display font-extrabold text-sm ${i === 1 ? 'text-white' : 'text-ink'}`}>{level.name}</span>
              {i === 1 && <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 rounded-full px-2 py-0.5">You start here</span>}
            </div>
          ))}
        </div>
        <p className="font-display font-extrabold text-xl sm:text-3xl text-ink max-w-2xl mx-auto leading-tight">
          You don't need permission to call yourself a builder.<br className="hidden sm:block" /> You need <span className="text-brand">one shipped agent.</span>
        </p>
      </div>

      {/* Get paid for this */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="Beyond your own work">You can get paid for this.</SectionHeading>
        <p className="text-center text-body text-[14px] -mt-6 mb-8 max-w-lg mx-auto">
          Every business has a version of John's problem — real work, nobody has time for it. Once you can build the fix, you can sell it.
        </p>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-5 max-w-2xl mx-auto mb-7">
          <img src="/john_uwem.jpg" alt="John Uwem" className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-border-soft" />
          <div className="text-center sm:text-left">
            <span className="font-display font-bold text-ink text-[15px] block mb-1">John Uwem</span>
            <span className="inline-block text-[11px] font-bold text-brand bg-[#F3EBFF] dark:bg-brand/15 rounded-full px-2.5 py-1 mb-2">
              Real client work — a US wedding ring brand
            </span>
            <p className="text-[13.5px] text-body-strong leading-relaxed m-0">
              Part of John's job was checking dozens of jewelry stores for a wedding ring brand — did they stock the
              rings, was pricing right, were the photos correct. We built him an AI agent that does it automatically,
              twice a day. He hasn't opened a browser tab for it in weeks.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-9">
          {MONEY_PATHS.map((p) => (
            <div key={p.label} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-4">
              <div className="w-9 h-9 rounded-lg bg-[#F3EBFF] dark:bg-brand/15 text-brand flex items-center justify-center mb-2.5"><p.icon className="w-4.5 h-4.5" /></div>
              <h3 className="font-display font-bold text-[13.5px] text-ink mb-1">{p.label}</h3>
              <p className="text-[12px] text-body leading-relaxed m-0">{p.text}</p>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto items-stretch">
          {FEATURED_TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading>Before you go further — your questions</SectionHeading>
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

      {/* Qualifier */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading>Are AI Agent Guides for you?</SectionHeading>
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

      {/* Offer — all three real plans, each permanent/guides-only. */}
      <div id="pricing" className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="The offer">Pick where you start.</SectionHeading>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left items-stretch">
          {/* Builder 1 — this page's entry offer */}
          <div className="rounded-[22px] border-[2.5px] border-green bg-white dark:bg-[#181818] p-6 flex flex-col relative">
            <span className="absolute -top-3.5 left-6 bg-green text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-full">
              START HERE
            </span>
            <div className="font-extrabold text-ink text-lg mt-1">🌱 Builder 1</div>
            <div className="flex items-baseline gap-2.5 mt-2.5 mb-0.5">
              <span className="font-display font-extrabold text-[32px] text-ink">₦<span>{BUILDER1_PRICE.toLocaleString()}</span></span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              <span className="inline-flex items-center gap-1 bg-[#EAFAF1] dark:bg-green/10 text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
                <InfinityIcon className="w-3 h-3" /> Yours forever — no expiry
              </span>
            </div>
            <p className="text-[13px] text-body mb-4">The foundation track. No prerequisite, no coding experience needed.</p>
            <ul className="flex flex-col gap-2.5 mb-5 flex-1">
              {BUILDER1_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13px] text-body-strong"><CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{f}</span></li>
              ))}
            </ul>
            <Link
              to="/pricing"
              className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep text-white font-extrabold px-5 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(124,58,237,.35)] transition-colors"
            >
              Claim Builder 1 →
            </Link>
          </div>

          {/* Builder 2 */}
          <div className="rounded-[22px] border-[1.5px] border-border-soft bg-white dark:bg-[#181818] p-6 flex flex-col">
            <div className="font-extrabold text-ink text-lg mt-1">⚡ Builder 2</div>
            <div className="flex items-baseline gap-2.5 mt-2.5 mb-0.5">
              <span className="font-display font-extrabold text-[32px] text-ink">₦<span>{BUILDER2_PRICE.toLocaleString()}</span></span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              <span className="inline-flex items-center gap-1 bg-[#EAFAF1] dark:bg-green/10 text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
                <InfinityIcon className="w-3 h-3" /> Yours forever — no expiry
              </span>
            </div>
            <p className="text-[13px] text-body mb-4">Best after Builder 1 — but nothing stops you jumping straight in.</p>
            <ul className="flex flex-col gap-2.5 mb-5 flex-1">
              {BUILDER2_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13px] text-body-strong"><CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{f}</span></li>
              ))}
            </ul>
            <Link
              to="/pricing"
              className="flex items-center justify-center gap-2 w-full bg-white dark:bg-[#181818] border-[1.5px] border-border text-body-strong hover:border-brand hover:text-brand font-extrabold px-5 py-3.5 rounded-xl transition-colors"
            >
              Get Builder 2 →
            </Link>
          </div>

          {/* Pro — both tracks */}
          <div
            className="rounded-[22px] border-[2.5px] border-brand p-6 flex flex-col relative bg-[#FAF7FF] dark:bg-[#181022]"
          >
            <span className="absolute -top-3.5 right-6 bg-brand text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-full">
              BEST VALUE
            </span>
            <div className="font-extrabold text-ink text-lg mt-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-brand" /> Pro
            </div>
            <div className="font-display font-extrabold text-[32px] text-ink mt-2.5 mb-0.5">
              ₦<span>{PRO_PRICE.toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              <span className="inline-flex items-center gap-1 bg-[#EAFAF1] dark:bg-green/10 text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
                <InfinityIcon className="w-3 h-3" /> Yours forever — no expiry
              </span>
            </div>
            <p className="text-[13px] text-body mb-4">Both tracks, one payment, no prerequisite — everything unlocks immediately.</p>
            <ul className="flex flex-col gap-2.5 mb-5 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13px] text-body-strong"><CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{f}</span></li>
              ))}
            </ul>
            <Link
              to="/pricing"
              className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep text-white font-extrabold px-5 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(124,58,237,.35)] transition-colors"
            >
              Get everything →
            </Link>
          </div>
        </div>

        {/* Expectation-setting before checkout, not after — these are the
            three things students actually get surprised by, and the refund
            policy (FAQ.jsx) has no change-your-mind window to fall back on. */}
        <div className="max-w-3xl mx-auto mt-7 flex flex-col gap-2">
          <p className="flex items-start gap-1.5 text-[12.5px] text-body">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            One-time payment, not a subscription. Access starts the moment you pay and never expires.
          </p>
          <p className="flex items-start gap-1.5 text-[12.5px] text-body">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            All you need is a free Gemini API key from Google AI Studio — no paid AI subscription required. A few
            Builder 2 sessions also need a free API key from a third-party service — each one tells you before you start.
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
            <h2 className="font-display font-extrabold text-2xl sm:text-[26px] text-white m-0">Ready to become an AI Builder?</h2>
            <p className="text-[#EDE4FF] mt-2 mb-0 text-[15px]">One-time payment. Permanent access. Start today.</p>
          </div>
          <Link
            to="/pricing"
            className="bg-yellow text-ink font-extrabold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,.18)] hover:brightness-95 transition-all flex-shrink-0"
          >
            Get AI Agent Guides →
          </Link>
        </div>
      </div>
    </div>
  );
}
