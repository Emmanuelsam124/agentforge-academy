import { useCallback, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, CalendarDays, Info, CircleHelp, Loader2, AlertCircle, Timer,
  Code2, Database, Rocket, Wrench,
} from 'lucide-react';
import { usePro } from '../hooks/usePro';
import { useCohortSchedule } from '../hooks/useCohortSchedule';
import { usePaystackCheckout } from '../hooks/usePaystackCheckout';
import CheckoutAuthModal from '../components/CheckoutAuthModal';
import { usePageSeo } from '../hooks/usePageSeo';
import { VIBECODING_PRICE } from '../data/pricing';

import EmojiIcon from '../components/EmojiIcon';
// This page sells ONE product: the Vibe Coding bootcamp. Unlike Pricing.jsx
// / AIBuilder.jsx (which sell builder1/builder2/pro), checkout here is
// hardcoded to plan: 'vibecoding' — this page never offers the automation
// tracks, by design (confirmed with the project owner 2026-09-08).

const VIBE_STEPS = [
  { letter: 'V', word: 'Vision', text: 'Clearly define what you want to build and why.' },
  { letter: 'I', word: 'Instructions', text: 'Give AI clear, structured instructions and requirements.' },
  { letter: 'B', word: 'Build', text: 'Work with AI to build the application step by step.' },
  { letter: 'E', word: 'Evaluate', text: 'Test, inspect, debug, improve, and verify what AI creates.' },
];

const PROJECTS = [
  { icon: '🌐', name: 'Personal Portfolio Website', text: 'A professional responsive website showcasing your skills, projects, and experience.' },
  { icon: '✅', name: 'Interactive To-Do App', text: 'Tasks, editing, deletion, completion, and real user interaction.' },
  { icon: '💰', name: 'Expense Tracker', text: 'Recording expenses, categories, dates, and spending totals.' },
  { icon: '🎓', name: 'Student Management System', text: 'A real database-connected application using Supabase.' },
  { icon: '🤖', name: 'AI-Powered Application', text: 'An AI assistant, content tool, study assistant, or support prototype.' },
  { icon: '🚀', name: 'Your Own Product', text: 'Take an idea of your own and turn it into a working application.' },
];

const LEARN = [
  'Use AI as a development partner', 'Write better prompts for software development', 'Plan applications before coding',
  'Build responsive websites', 'Understand HTML, CSS, and JavaScript fundamentals', 'Build interactive web applications',
  'Work with forms and user input', 'Store and manage application data', 'Understand databases', 'Use Supabase',
  'Perform CRUD operations', 'Understand APIs', 'Build AI-powered applications', 'Debug AI-generated code',
  'Review and improve AI-generated code', 'Protect API keys and sensitive information', 'Deploy applications online',
];

const WHO_FOR = [
  { title: 'Beginners', text: "You've never coded before but want to learn how modern AI-assisted development works." },
  { title: 'Entrepreneurs', text: 'You have product ideas and want to understand how to turn them into working prototypes.' },
  { title: 'Business owners', text: 'You want to experiment with internal tools without depending on developers for every small idea.' },
  { title: 'Students', text: 'You want practical experience building real applications with modern AI tools.' },
  { title: 'Creators', text: 'You want to turn your ideas into websites, tools, and digital products.' },
  { title: 'Aspiring developers', text: 'You want to learn a modern development workflow alongside fundamental web dev concepts.' },
];

const TOOLKIT = [
  { icon: Code2, name: 'Visual Studio Code', text: 'Your development environment for creating and editing projects.' },
  { icon: Wrench, name: 'GitHub', text: 'Learn the basics of saving and managing your project code.' },
  { icon: Database, name: 'Supabase', text: 'Learn how to add a real database to your applications.' },
  { icon: Rocket, name: 'Netlify / Vercel', text: 'Learn how to put your applications online.' },
];

const WEEKS = [
  { week: 1, title: 'Understand AI Vibe Coding', text: 'Learn the VIBE Method, set up your tools, learn how to communicate with AI, and build your first website.', project: 'Personal Portfolio' },
  { week: 2, title: 'Build Interactive Applications', text: 'Learn how websites become interactive applications and build apps that work with user input and stored data.', project: 'To-Do App + Expense Tracker' },
  { week: 3, title: 'Build With Real Data', text: 'Understand databases, backends, APIs, CRUD, and Supabase.', project: 'Student Management System' },
  { week: 4, title: 'Build With AI + Your Own Product', text: 'Learn AI-powered applications, debugging, security, deployment, and complete your capstone project.', project: 'AI Application + Your Own Product' },
];

const FAQS = [
  { q: 'Is this course suitable for complete beginners?', a: 'Yes. The bootcamp is designed for beginners and explains the fundamentals before moving into more advanced projects.' },
  { q: 'Do I need to know how to code?', a: 'No professional coding experience is required — just willingness to learn basic concepts like HTML, CSS, JavaScript, and databases.' },
  { q: 'Do I need to pay for tools?', a: 'The course minimizes additional costs — GitHub, Supabase, and deployment platforms all have free options suitable for learning.' },
  { q: 'What if I miss a live class?', a: 'Class recordings are available so you can catch up, though attending live is strongly recommended.' },
  { q: 'How long will I have access?', a: "You'll have access for 6 months — live classes, recordings, resources, and your projects." },
  { q: 'Do I get a certificate?', a: 'Yes. Students who complete the bootcamp requirements receive a certificate of completion.' },
];

function formatCohortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (date < new Date(new Date().toDateString())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function subscribeToTick(onChange) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

// Same pattern as AIBuilder.jsx's CohortCountdown — see that file's comment
// for why useSyncExternalStore (not useState+useEffect) matters here: this
// page is prerendered, and a frozen countdown baked into the static HTML
// would mismatch on hydration (React #418).
function CohortCountdown({ dateStr }) {
  const getSnapshot = useCallback(() => {
    if (!dateStr) return 0;
    return Math.max(0, Math.floor((new Date(`${dateStr}T00:00:00`).getTime() - Date.now()) / 1000));
  }, [dateStr]);

  const secondsLeft = useSyncExternalStore(subscribeToTick, getSnapshot, () => null);
  if (secondsLeft === null || secondsLeft <= 0) return null;

  const days = Math.floor(secondsLeft / 86400);
  const units = [
    { value: days, label: days === 1 ? 'day' : 'days' },
    { value: Math.floor(secondsLeft / 3600) % 24, label: 'hrs' },
    { value: Math.floor(secondsLeft / 60) % 60, label: 'min' },
    { value: secondsLeft % 60, label: 'sec' },
  ];

  return (
    <div data-client-only className="flex flex-col items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-body">
        <Timer className="w-3.5 h-3.5 text-link" /> Next launch cohort starts in
      </span>
      <div className="flex items-center gap-2 sm:gap-2.5">
        {units.map((unit) => (
          <div key={unit.label} className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-xl px-3 sm:px-3.5 py-2 min-w-[58px] sm:min-w-[64px] text-center">
            <div className="font-display font-extrabold text-xl sm:text-2xl text-ink tabular-nums leading-none">{String(unit.value).padStart(2, '0')}</div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400 mt-1">{unit.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, children }) {
  return (
    <div className="text-center mb-9">
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px] max-w-2xl mx-auto">{children}</h2>
    </div>
  );
}

export default function VibeCoding() {
  const { hasVibeCoding } = usePro();
  const { vibecoding: vibecodingCohortDate } = useCohortSchedule();
  const cohortDate = formatCohortDate(vibecodingCohortDate);

  const {
    checkout, loadingKey: checkoutLoading, error: checkoutError,
    authModalOpen, closeAuthModal, handleAuthenticated,
  } = usePaystackCheckout();

  usePageSeo({
    title: 'AI Vibe Coding Bootcamp | Social Dev Technologies',
    description: `Turn your ideas into real websites and web applications with AI. 4 weeks, 8 live classes, ₦${VIBECODING_PRICE.toLocaleString()} one-time, 6 months access.`,
    canonicalPath: '/vibe-coding',
  });

  const handleCheckout = () => checkout('vibecoding');

  return (
    <div>
      {/* Hero */}
      <div
        className="relative overflow-hidden pt-16 pb-14 px-4 sm:px-6 lg:px-[5vw] text-center"
        style={{ background: '#F6F8FB' }}
      >
        <div className="relative max-w-3xl mx-auto">
          <span
            className="inline-flex items-center gap-2 bg-white dark:bg-[#131E2F] border-[1.5px] border-border text-link font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(15,26,42,.1)]"
          >
            🚀 Launch cohort — enrollment open
          </span>

          <h1
            className="font-display font-extrabold text-[36px] sm:text-[54px] leading-[1.05] text-ink tracking-[-1.5px] mt-5"
          >
            Stop just using AI. <span className="text-link">Start building with it.</span>
          </h1>

          <p
            className="text-[17px] leading-relaxed text-body mt-5 max-w-lg mx-auto"
          >
            Turn your ideas into real websites, web applications, and AI-powered products — even if you've never
            been a professional programmer. Learn to use AI as your development partner.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3.5 items-center justify-center mt-8"
          >
            <a
              href="#pricing"
              className="bg-brand text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-[0_10px_22px_rgba(15,26,42,.4)] hover:bg-brand-deep transition-colors"
            >
              Join the launch cohort — ₦{VIBECODING_PRICE.toLocaleString()} →
            </a>
            <a href="#what-youll-build" className="text-body-strong font-bold text-[14.5px] hover:text-link transition-colors">
              See what you'll build ↓
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-6 text-[13px] text-body font-semibold">
            <span>4 weeks</span><span>·</span><span>8 live classes</span><span>·</span><span>6 months access</span>
          </div>
        </div>
      </div>

      {/* You have ideas */}
      <div className="bg-[#0F1A2A] py-16 px-4 sm:px-6 lg:px-[5vw]">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[13px] font-bold uppercase tracking-[3px] mb-5 inline-block" style={{ color: '#B8CCE4' }}>
            You have ideas
          </span>
          <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] leading-[1.15] tracking-[-1px] text-white">
            Now learn how to build them.
          </h2>
          <p className="text-[#E2EAF3] text-[15px] leading-relaxed mt-4 max-w-lg mx-auto">
            You may think you need to become a professional programmer before you can build a website, a business
            tool, an online platform, or an AI assistant. <span className="text-yellow font-bold">You don't.</span> With the right
            workflow, you can describe an idea, work with AI to plan it, generate and understand code, test what you
            build, fix problems, and turn your idea into a working product.
          </p>
          <p className="text-[#D5DEE9] text-[14px] mt-7">
            Africa shouldn't just use AI. <span className="text-yellow font-bold">Africa should build with AI.</span>
          </p>
        </div>
      </div>

      {/* VIBE Method */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="The Social Dev VIBE Method">The framework behind every project</SectionHeading>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-4xl mx-auto">
          {VIBE_STEPS.map((step) => (
            <div key={step.letter} className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-5 text-center">
              <div className="w-11 h-11 mx-auto rounded-full bg-brand text-white font-display font-extrabold text-lg flex items-center justify-center mb-3">
                {step.letter}
              </div>
              <h3 className="font-display font-bold text-[14.5px] text-ink mb-1.5">{step.word}</h3>
              <p className="text-[12.5px] text-body leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What you'll build */}
      <div id="what-youll-build" className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto scroll-mt-20">
        <SectionHeading eyebrow="Six real projects">What you'll build</SectionHeading>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-4xl mx-auto">
          {PROJECTS.map((p, i) => (
            <div key={p.name} className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2.5">
                <EmojiIcon emoji={p.icon} className="w-5 h-5 text-link" />
                <span className="text-[10.5px] font-bold uppercase tracking-wide text-link">Project {i + 1}</span>
              </div>
              <h3 className="font-display font-bold text-[14px] text-ink mb-1.5">{p.name}</h3>
              <p className="text-[12.5px] text-body leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4-week timeline */}
      <div id="curriculum" className="bg-[#F6F8FB] dark:bg-[#141416] border-y border-border-soft px-4 sm:px-6 lg:px-[5vw] py-16">
        <div className="max-w-4xl mx-auto">
          <SectionHeading eyebrow="4 weeks, 8 live classes">Your bootcamp, week by week</SectionHeading>
          <div className="flex flex-col gap-3">
            {WEEKS.map((w, i) => (
              <div key={w.week} className="flex gap-3.5">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-brand text-white font-display font-extrabold text-[13px] flex items-center justify-center">
                    {w.week}
                  </div>
                  {i < WEEKS.length - 1 && <div className="w-0.5 flex-1 bg-brand/25 my-1" />}
                </div>
                <div className={`bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-4.5 flex-1 ${i < WEEKS.length - 1 ? 'mb-1' : ''}`}>
                  <p className="font-display font-bold text-[14.5px] text-ink leading-tight">Week {w.week} — {w.title}</p>
                  <p className="text-[12.5px] text-body mt-1.5 leading-relaxed">{w.text}</p>
                  <p className="text-[11.5px] text-link font-bold mt-2">Project: {w.project}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What you'll learn */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading>What you'll learn</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-2.5 max-w-3xl mx-auto text-left">
          {LEARN.map((item) => (
            <div key={item} className="flex items-start gap-2.5 text-[13px] font-semibold text-body-strong">
              <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Who is this for */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="Who is this for">You don't need to be a programmer</SectionHeading>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
          {WHO_FOR.map((w) => (
            <div key={w.title} className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-4.5">
              <h3 className="font-display font-bold text-[13.5px] text-ink mb-1.5">{w.title}</h3>
              <p className="text-[12px] text-body leading-relaxed">{w.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Toolkit */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading eyebrow="Your AI development toolkit">The tools you'll use</SectionHeading>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {TOOLKIT.map((t) => (
            <div key={t.name} className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-4 text-center">
              <div className="w-9 h-9 mx-auto rounded-lg bg-[#E8EDF3] dark:bg-brand/15 text-link flex items-center justify-center mb-2.5"><t.icon className="w-4.5 h-4.5" /></div>
              <h3 className="font-display font-bold text-[12.5px] text-ink mb-1">{t.name}</h3>
              <p className="text-[11px] text-body leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-5xl mx-auto">
        <SectionHeading>Your questions, answered</SectionHeading>
        <div className="grid sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto">
          {FAQS.map((item) => (
            <div key={item.q} className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-4.5">
              <div className="flex items-start gap-2.5 mb-1.5">
                <CircleHelp className="w-4 h-4 text-link mt-0.5 flex-shrink-0" />
                <span className="font-display font-bold text-[14px] text-ink">{item.q}</span>
              </div>
              <p className="text-[13px] text-body leading-relaxed m-0 pl-6.5">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing / offer — the ONLY plan sold on this page */}
      <div id="pricing" className="px-4 sm:px-6 lg:px-[5vw] py-16 max-w-3xl mx-auto scroll-mt-20">
        <SectionHeading eyebrow="Your investment">Join the launch cohort</SectionHeading>

        {cohortDate && (
          <div className="flex justify-center -mt-4 mb-9">
            <CohortCountdown dateStr={vibecodingCohortDate} />
          </div>
        )}

        {checkoutError && (
          <div className="max-w-md mx-auto mb-6 flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {checkoutError}
          </div>
        )}

        <div className="rounded-[24px] border-[2.5px] border-brand bg-[#F6F8FB] dark:bg-[#131E2F] p-7 sm:p-8 relative">
          <span className="absolute -top-3.5 left-7 bg-brand text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-full">
            LAUNCH COHORT
          </span>
          <div className="font-display font-extrabold text-[36px] text-ink mt-2 mb-1">
            ₦{VIBECODING_PRICE.toLocaleString()} <span className="text-base font-bold text-body">one-time</span>
          </div>
          {cohortDate && (
            <span className="inline-flex items-center gap-1 bg-white dark:bg-[#131E2F] text-link font-bold text-[12px] px-2.5 py-1 rounded-full w-fit mb-4">
              <CalendarDays className="w-3.5 h-3.5" /> Cohort starts {cohortDate}
            </span>
          )}
          <ul className="flex flex-col gap-2.5 mb-6">
            {[
              '8 live instructor-led classes',
              '4 weeks of training',
              '6 months access',
              'Class recordings',
              'Practical projects',
              'AI development prompt library',
              'Course resources',
              'Community/support',
              'Final capstone project',
              'Certificate of completion',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong"><CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{f}</span></li>
            ))}
          </ul>

          {hasVibeCoding ? (
            <Link
              to="/vibe-coding/course"
              className="flex items-center justify-center gap-2 w-full bg-green text-white font-extrabold px-5 py-3.5 rounded-xl transition-colors"
            >
              You're enrolled — go to your classes →
            </Link>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading === 'vibecoding'}
              className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(15,26,42,.35)] transition-colors"
            >
              {checkoutLoading === 'vibecoding' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {checkoutLoading === 'vibecoding' ? 'Starting checkout…' : `Join the launch cohort — ₦${VIBECODING_PRICE.toLocaleString()} →`}
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
          className="rounded-[24px] px-8 sm:px-10 py-9 flex items-center justify-between flex-wrap gap-5 shadow-[0_20px_44px_-16px_rgba(15,26,42,.6)]"
          style={{ background: '#264D73' }}
        >
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-[26px] text-white m-0">Ready to build with AI?</h2>
            <p className="text-[#D5DEE9] mt-2 mb-0 text-[15px]">4 weeks. 8 live classes. Your own product, shipped.</p>
          </div>
          <a
            href="#pricing"
            className="bg-yellow text-ink font-extrabold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,.18)] hover:brightness-95 transition-all flex-shrink-0 flex items-center gap-2"
          >
            Join the cohort <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <CheckoutAuthModal open={authModalOpen} onClose={closeAuthModal} onAuthenticated={handleAuthenticated} />
    </div>
  );
}
