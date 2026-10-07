import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, LayoutGrid } from 'lucide-react';
import { useAutoplayInView } from '../../hooks/useAutoplayInView';
import { useNextAiMasteryCohortStart, formatCohortDay } from '../../hooks/useNextAiMasteryCohort';
import { AI_AGENT_MASTERY_PRICE } from '../../data/pricing';
import { DEMO_LOOP } from '../../data/demoMedia';

// Every line here is copied from the AI Agent Mastery page (its program card,
// CAPABILITIES and CURRICULUM_DAYS); only the punctuation changed, since the
// homepage has no em dashes. Keep the two in step if the page changes.
const POINTS = [
  '3 live evenings at 7 PM WAT, with day 3 on monetizing your new skill',
  '6 months access to classes, replays, and resources',
  'Certificate of completion',
];

const CAPABILITIES = [
  { name: 'Inbox', text: 'Reads, triages, and drafts replies to your email before you even open it.' },
  { name: 'Calendar', text: 'Finds time, schedules meetings, and untangles conflicts on your behalf.' },
  { name: 'Research', text: 'Pulls together answers, summaries, and briefings from across the web.' },
  { name: 'Messaging', text: 'Drafts and sends messages in your voice, on the channels you already use.' },
];

const DAYS = [
  {
    day: 'Day 1',
    title: 'Agent Architecture & Your First Connections',
    text: 'Design an agent that holds context across tasks, then wire it into your real inbox and calendar so it starts triaging and scheduling for you.',
  },
  {
    day: 'Day 2',
    title: 'Memory, Multi-Step Tasks & Guardrails',
    text: "Give your agent memory so it improves with use, teach it to handle research and messaging tasks it can't finish in one shot, and add the guardrails that keep it asking before it acts.",
  },
  {
    day: 'Day 3',
    title: 'Monetizing Your New Skill',
    text: 'Turn what you just built into an income stream: how to package and offer this same kind of build as a paid service to other businesses.',
  },
];

// Rendered only in the browser (and stripped from the prerendered snapshot),
// so the date is always the real next Friday cohort.
function NextCohort() {
  const start = useNextAiMasteryCohortStart();
  if (!start) return null;
  return <span data-client-only> Next cohort starts {formatCohortDay(start)}.</span>;
}

function DemoVideo() {
  const ref = useRef(null);
  useAutoplayInView(ref, { respectReducedMotion: true });
  return (
    <video
      ref={ref}
      src="/videos/dashboard-demo-web.mp4"
      poster="/videos/dashboard-demo-poster.jpg"
      width={1280}
      height={576}
      muted
      loop
      playsInline
      controls
      preload="metadata"
      aria-label="Screen recording of the multi-agent dashboard: several agents moving tasks across a shared board"
      className="block w-full h-auto aspect-[20/9] object-cover bg-[#0F1A2A]"
    />
  );
}

export default function MasterySection() {
  return (
    <>
      <div className="grid lg:grid-cols-[1fr_1.15fr] gap-9 lg:gap-14 items-center mb-11 lg:mb-16">
        <div className="min-w-0">
          <h2 className="t-h2 text-ink">Build your own AI personal assistant</h2>
          <p className="t-lead text-body mt-4 mb-5 lg:mb-6 max-w-[30em]">
            Live cohort. Build one integrated assistant that triages your inbox, runs your calendar, does research, and
            drafts messages, with guardrails built in.
          </p>
          <ul className="flex flex-col gap-2.5 mb-6 lg:mb-7">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px] leading-normal text-ink">
                <Check className="w-4 h-4 mt-[3px] flex-shrink-0 text-link" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-3.5">
            <Link to="/ai-agent-mastery" className="btn btn-primary w-full sm:w-auto">
              See AI Agent Mastery <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-[15px] font-semibold text-body text-center sm:text-left">
              <span>₦{AI_AGENT_MASTERY_PRICE.toLocaleString()} one-time.</span>
              <NextCohort />
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="rounded-2xl overflow-hidden border border-border bg-[#0F1A2A]">
            <DemoVideo />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2.5 mb-1.5">
              <LayoutGrid className="w-5 h-5 text-link hidden lg:block" />
              <h3 className="t-h3 text-ink text-lg">{DEMO_LOOP.title}</h3>
            </div>
            <p className="t-card text-body">{DEMO_LOOP.text}</p>
          </div>
        </div>
      </div>

      <h3 className="t-h3 text-ink text-2xl lg:text-[28px] tracking-[-0.02em] mb-3 lg:mb-4">What your assistant does</h3>
      <dl className="mb-11 lg:mb-14 border-b border-border">
        {CAPABILITIES.map((c) => (
          <div key={c.name} className="flex flex-col sm:flex-row sm:gap-8 border-t border-border py-3.5 lg:py-4">
            <dt className="sm:w-[140px] flex-shrink-0 font-bold text-base text-ink">{c.name}</dt>
            <dd className="m-0 flex-1 min-w-0 text-[15px] lg:text-base leading-relaxed text-body">{c.text}</dd>
          </div>
        ))}
      </dl>

      <h3 className="t-h3 text-ink text-2xl lg:text-[28px] tracking-[-0.02em] mb-3 lg:mb-4">The three live evenings</h3>
      <ol className="list-none m-0 p-0 border-b border-border">
        {DAYS.map((d) => (
          <li key={d.day} className="flex flex-col sm:flex-row gap-1.5 sm:gap-8 border-t border-border py-[18px] lg:py-[22px]">
            <div className="t-h3 text-link sm:w-[140px] flex-shrink-0">{d.day}</div>
            <div className="flex-1 min-w-0">
              <h4 className="t-h3 text-ink mb-1.5">{d.title}</h4>
              <p className="t-card text-body">{d.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
