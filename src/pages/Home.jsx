import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MessageCircle, Video } from 'lucide-react';
import AutomationFlowDiagram from '../components/AutomationFlowDiagram';
import YouTubeFacade from '../components/YouTubeFacade';
import EmojiIcon from '../components/EmojiIcon';
import ScholarshipBar from '../components/home/ScholarshipBar';
import ProgramsTable from '../components/home/ProgramsTable';
import MasterySection from '../components/home/MasterySection';
import TestimonialQueue from '../components/home/TestimonialQueue';
import VibeProjects from '../components/home/VibeProjects';
import HowGuidesWork from '../components/home/HowGuidesWork';
import { agents } from '../data/agents';
import { departments, isVisibleToPublic } from '../data/departments';
import { INSTRUCTOR } from '../data/instructor';
import { useCohortSchedule } from '../hooks/useCohortSchedule';
import { useNextAiMasteryCohortStart, formatCohortDay } from '../hooks/useNextAiMasteryCohort';
import { BUILDER1_PRICE } from '../data/pricing';

// Returns a display string for a cohort start date, or null if it's unset or
// already in the past — same rule Pricing.jsx uses, duplicated rather than
// shared since the two pages' surrounding date logic differs slightly.
function formatCohortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (date < new Date(new Date().toDateString())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

const YOUTUBE_VIDEO_ID = 'MYcREKgdAV4';
const YOUTUBE_VIDEO_TITLE = "Don't Get Left Behind: Learn AI Automation with Claude";

// Advanced/World Class are admin-only — every public-facing count on this
// marketing page is based on the public catalog only.
const publicAgents = agents.filter((a) => isVisibleToPublic(a.difficulty));
const totalHours = Math.round(publicAgents.reduce((sum, a) => sum + parseFloat(a.buildTime), 0));
const realDepartments = departments.filter((d) => d.id !== 'all');

// 500+ and 350+ are the founder's figures; the build count comes from the data.
const STATS = [
  { value: '500+', label: 'students taught' },
  { value: '350+', label: 'certificates awarded' },
  { value: String(publicAgents.length), label: 'guided agent builds' },
];

// Set expectations before checkout, not after — these are the things
// students actually get surprised by.
const BEFORE_YOU_START = [
  {
    title: 'No prior coding experience required',
    text: "Every build ships copy-paste-ready prompts. You're directing the AI, not writing code from scratch. Basic comfort with a browser and copy-paste is all you need to start.",
  },
  {
    title: 'No paid AI subscription needed',
    text: 'All you need is a free Gemini API key from Google AI Studio. The free tier is enough to complete every build. Nothing extra to pay for beyond your one-time course payment.',
  },
  {
    title: 'A few Builder 2 sessions need their own API key',
    text: "A handful of advanced builds connect to a third-party service (Pinecone, HubSpot, DataForSEO) to do their job. Most have a free tier that's enough to complete the session. Each build tells you exactly what it needs before you start.",
  },
];

// Made-up messages in a WhatsApp-style frame, captioned on the page as an
// illustration. Generic initials, no member count.
const CHAT_MESSAGES = [
  { who: 'A', text: 'Anyone else stuck on the Gmail agent OAuth step? 😩' },
  { who: 'D', text: 'yep, check the scope you granted, easy to miss one' },
  { who: null, text: 'that was it, thank you!! 🙏' },
];

// Sections share one content width: about 1008px at 1440 (the padding sits
// inside the max-width box). The hero alone uses the full 1152.
const INNER = 'px-4 sm:px-6 lg:px-[5vw] max-w-6xl mx-auto';
const SURFACE = 'bg-surface border-y border-border';

function Hero() {
  return (
    <section className="px-4 sm:px-6 lg:px-[5vw] py-12 md:py-16">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_.95fr] gap-10 lg:gap-14 items-center">
        <div className="min-w-0">
          <h1 className="t-display text-ink">Build an AI assistant, a web app or working AI agents.</h1>
          <p className="t-lead text-body mt-5 mb-7 md:mt-6 md:mb-8 max-w-[30em]">
            Join live classes on Zoom or learn at your own pace. Programs from ₦{BUILDER1_PRICE.toLocaleString()}.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-3.5">
            <Link to="/pricing" className="btn btn-primary w-full sm:w-auto">
              See programs and prices <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#mastery" className="btn btn-secondary w-full sm:w-auto">
              See what you'll build
            </a>
          </div>
        </div>
        <div className="min-w-0">
          <div className="h-[210px] sm:h-[280px] lg:h-[320px] rounded-2xl overflow-hidden bg-[#0F1A2A]">
            <YouTubeFacade
              className="w-full h-full"
              videoId={YOUTUBE_VIDEO_ID}
              title={YOUTUBE_VIDEO_TITLE}
              thumbnailSrc="/video-thumbnail.jpg"
              priority
            />
          </div>
          <p className="mt-2.5 md:mt-3 text-sm leading-normal text-body">Watch: {YOUTUBE_VIDEO_TITLE}</p>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <section className={`${SURFACE} py-8 md:py-10`}>
      <div className={`${INNER} flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-0`}>
        <div className="lg:flex-[1.5] min-w-0 lg:pr-8">
          <h2 className="font-display font-bold text-2xl md:text-[26px] leading-[1.15] tracking-[-0.02em] text-ink mb-2 md:mb-2.5">
            Bring AI into your actual work
          </h2>
          <p className="t-card text-body max-w-[26em]">
            Students walk into work already using AI skills their teams and managers are only just starting to ask for.
          </p>
        </div>
        <div className="flex lg:flex-[3] border-t border-border pt-5 lg:border-t-0 lg:pt-0">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex-1 min-w-0 px-3 lg:px-7 lg:py-1 border-l border-border first:border-l-0 first:pl-0 lg:first:border-l lg:first:pl-7 last:pr-0"
            >
              <div className="t-num text-[34px] lg:text-5xl text-link">{s.value}</div>
              <div className="text-[13px] lg:text-[15px] leading-snug text-body mt-2 lg:mt-2.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// The phone board leaves the diagram out: it needs about 600px to read.
function FlowShowcase() {
  return (
    <section className="hidden md:block pt-20 pb-[72px]">
      <div className={INNER}>
        <div className="max-w-[640px] mb-10">
          <h2 className="t-h2 text-ink">What one agent does with one email</h2>
          <p className="t-lead text-body mt-3.5">
            A new email arrives. The agent reads it, decides if it's urgent, replies in Slack and logs a task in Notion.
            You build agents like this in AI Agent Mastery and AI Agent Guides.
          </p>
          <p className="mt-2.5 text-[13px] text-body">Illustration of one agent.</p>
        </div>
        <AutomationFlowDiagram />
      </div>
    </section>
  );
}

function Programs() {
  return (
    <section className="pt-14 pb-14 md:pt-0 md:pb-20">
      <div className={INNER}>
        <h2 className="t-h2 text-ink mb-7 md:mb-8">Compare the three programs</h2>
        <ProgramsTable buildCount={publicAgents.length} totalHours={totalHours} />
      </div>
    </section>
  );
}

// "3-person" would otherwise break after its hyphen.
function keepHyphenatedWords(text) {
  return text.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? <span key={i} className="whitespace-nowrap">{part}</span> : part,
  );
}

function Instructor() {
  return (
    <section className="py-14 md:py-20">
      <div className={`${INNER} flex flex-col md:flex-row md:items-center gap-5 md:gap-12`}>
        <img
          src={INSTRUCTOR.photo}
          alt={`${INSTRUCTOR.name}, instructor`}
          width={200}
          height={200}
          loading="lazy"
          decoding="async"
          className="w-[120px] h-[120px] md:w-44 md:h-44 rounded-2xl md:rounded-[20px] object-cover flex-shrink-0"
        />
        <div className="min-w-0">
          <h2 className="t-h2 text-ink text-[28px] md:text-[clamp(28px,3vw,32px)]">{INSTRUCTOR.name}</h2>
          <p className="mt-1.5 mb-4 md:mb-5 text-base font-semibold text-link">{INSTRUCTOR.title}</p>
          <div className="flex flex-col gap-3 max-w-[40em]">
            {INSTRUCTOR.bio.map((p) => (
              <p key={p} className="t-body text-body">{keepHyphenatedWords(p)}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BeforeYouStart() {
  return (
    <section className="py-14 md:py-20">
      <div className={`${INNER} grid lg:grid-cols-[1fr_2fr] gap-7 lg:gap-12`}>
        <div className="min-w-0">
          <h2 className="t-h2 text-ink">Before you start</h2>
          <p className="t-lead text-body mt-3.5">What you actually need, with no surprises after checkout</p>
        </div>
        <ul className="list-none m-0 p-0 border-b border-border lg:border-b-0">
          {BEFORE_YOU_START.map((item) => (
            <li
              key={item.title}
              className="py-5 lg:py-6 border-t border-border lg:first:border-t-0 lg:first:pt-0 lg:last:pb-0"
            >
              <h3 className="t-h3 text-ink mb-2">{item.title}</h3>
              <p className="t-body text-body">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// The Vibe Coding date an admin set, otherwise the computed AI Agent Mastery
// start. The admin `aimastery` row is skipped on purpose: it no longer drives
// the Mastery page (CLAUDE.md) and is out of date. Client-only, like the date
// in the Mastery section.
function NextCohortPill() {
  const { vibecoding } = useCohortSchedule();
  const masteryStart = useNextAiMasteryCohortStart();
  const date = formatCohortDate(vibecoding) || (masteryStart && formatCohortDay(masteryStart));
  if (!date) return null;
  return (
    <p
      data-client-only
      className="inline-flex items-center gap-2 rounded-full bg-link/10 px-4 py-2 mb-5 md:mb-6 text-sm font-bold text-ink"
    >
      <CalendarDays className="w-4 h-4 text-link" />
      <span>Next cohort starts {date}</span>
    </p>
  );
}

function LiveClasses() {
  return (
    <section className={`${SURFACE} py-14 md:py-[72px]`}>
      <div className={`${INNER} grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-center`}>
        <div className="min-w-0">
          <h2 className="t-h2 text-ink mb-4">Prefer real classes over a self-paced library?</h2>
          <p className="t-body text-body mb-5 md:mb-6 max-w-[32em]">
            AI Agent Mastery and Vibe Coding Bootcamp are live cohorts on Zoom: walkthroughs, office hours and Q&amp;A. Miss a
            class and the recording is added to your replays.
          </p>
          <div>
            <NextCohortPill />
          </div>
          <Link to="/pricing" className="btn btn-primary w-full sm:w-auto">
            See the live cohorts <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <div className="min-w-0">
          <img
            src="/images/live-class-zoom.webp"
            alt="Zoom gallery view of a live session: students' video tiles with their names"
            width={1599}
            height={857}
            loading="lazy"
            decoding="async"
            className="block w-full h-auto rounded-2xl border border-border bg-[#0F1A2A]"
          />
          <p className="mt-2.5 text-[13px] leading-normal text-body">A live session on Zoom</p>
          {/* A drawing of the dashboard's live-session card, not a working button. */}
          <div aria-hidden="true" className="hidden md:block mt-4 rounded-xl border border-border bg-surface px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-link/10 text-link flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm leading-snug text-ink">AI Agent Mastery office hours</p>
                <p className="text-xs leading-snug text-body">AI Agent Mastery</p>
              </div>
              <span className="flex-shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-bold leading-none text-white">Join</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatIllustration() {
  return (
    <div aria-hidden="true" className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#075E54]">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white">
          <MessageCircle className="w-4 h-4" />
        </div>
        <p className="text-white font-bold text-sm leading-tight">Social Dev Builders</p>
      </div>
      <div className="p-4 flex flex-col gap-2.5 bg-[#E5DDD5]">
        {CHAT_MESSAGES.map((m) =>
          m.who ? (
            <div key={m.text} className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-[#22355B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {m.who}
              </div>
              <div className="max-w-[80%] lg:max-w-[75%] rounded-xl rounded-bl-[2px] bg-white px-3 py-2 text-[13px] leading-snug text-[#1F1F1F]">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.text} className="flex justify-end">
              <div className="max-w-[80%] lg:max-w-[75%] rounded-xl rounded-br-[2px] bg-[#DCF8C6] px-3 py-2 text-[13px] leading-snug text-[#1F1F1F]">
                {m.text}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function Community() {
  return (
    <section className="py-14 md:py-20">
      <div className={`${INNER} grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center`}>
        <div className="min-w-0 order-2 lg:order-1">
          <ChatIllustration />
          <p className="mt-2.5 text-[13px] text-body">Illustration, not a real conversation.</p>
        </div>
        <div className="min-w-0 order-1 lg:order-2">
          <h2 className="t-h2 text-ink mb-4">Stuck on a build? Ask in the WhatsApp group.</h2>
          <p className="t-body text-body mb-6 md:mb-7 max-w-[32em]">
            Every student joins our WhatsApp community. Ask a question, share what you've built, and get an answer from
            other students or from us the same day.
          </p>
          <Link to="/pricing" className="btn btn-primary w-full sm:w-auto">
            Get started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// No display class here: each chip adds its own, so `hidden` never fights `inline-flex`.
const CHIP =
  'items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold leading-none transition-colors hover:border-link hover:bg-link/5';

// Phones show the first five departments and a "View all" chip.
function Departments() {
  return (
    <section className={`${SURFACE} py-12 md:py-16`}>
      <div className={INNER}>
        <div className="flex items-baseline justify-between gap-4 mb-5 md:mb-6">
          <h2 className="t-h3 text-ink text-[26px] md:text-[28px] tracking-[-0.02em]">Browse by department</h2>
          <Link
            to="/catalog"
            className="hidden md:inline-flex items-center gap-1.5 whitespace-nowrap font-bold text-[15px] text-link hover:underline underline-offset-4"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {realDepartments.map((d, i) => (
            <Link
              key={d.id}
              to={`/catalog?department=${d.id}`}
              className={`${CHIP} text-ink ${i >= 5 ? 'hidden md:inline-flex' : 'inline-flex'}`}
            >
              <EmojiIcon emoji={d.icon} className="w-4 h-4 text-link" /> {d.name}
            </Link>
          ))}
          <Link to="/catalog" className={`${CHIP} inline-flex text-link md:hidden`}>
            View all departments <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="pt-12 pb-14 md:py-[72px]">
      <div className={INNER}>
        <div className="on-dark rounded-2xl bg-band px-6 py-7 md:px-11 md:py-10 flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-5 md:gap-6">
          <div className="min-w-0 md:flex-[1_1_360px]">
            <h2 className="t-h2 text-[26px] md:text-[clamp(26px,3vw,32px)] text-[#F6F8FB]">Ready to start building?</h2>
            <p className="t-body text-[#F6F8FB]/80 mt-2">
              AI Agent Mastery, AI Agent Guides, or Vibe Coding. Every program and price in one place.
            </p>
          </div>
          <Link to="/pricing" className="btn btn-accent w-full md:w-auto flex-shrink-0">
            See pricing <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div>
      {/* Under the sticky Navbar (it lives in App.jsx), only while applications are open. */}
      <ScholarshipBar />
      <Hero />
      <StatsStrip />
      <FlowShowcase />
      <Programs />

      <section id="mastery" className={`${SURFACE} py-14 md:py-20 scroll-mt-[70px]`}>
        <div className={INNER}>
          <MasterySection />
        </div>
      </section>

      <section className="on-dark bg-band py-14 md:py-20">
        <div className={INNER}>
          <p className="text-[13px] font-semibold text-[#F6F8FB]/80 mb-4 md:mb-5">
            From an earlier live class on the same kind of build
          </p>
          <TestimonialQueue />
        </div>
      </section>

      <section className={`${SURFACE} py-14 md:py-20`}>
        <div className={INNER}>
          <VibeProjects />
        </div>
      </section>

      <Instructor />

      <section className={`${SURFACE} py-14 md:py-[72px]`}>
        <div className={INNER}>
          <HowGuidesWork buildCount={publicAgents.length} />
        </div>
      </section>

      <BeforeYouStart />
      <LiveClasses />
      <Community />
      <Departments />
      <CtaBand />
    </div>
  );
}
