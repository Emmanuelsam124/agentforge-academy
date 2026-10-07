import { m } from 'framer-motion';
import SlideShell from '../SlideShell';
import { agentsBeginner } from '../../../data/agentsBeginner';

// The full "wall of builders" — every real Builder 1 session, not a curated
// subset. Breadth is the sell here: one glance should read as "12 real
// things," not a syllabus, so each card carries only an emoji and a title —
// no descriptions. Ordered for narrative flow rather than the source
// file's storage order (communication-first, ending on data/qualification).
const WALL_ORDER = [
  'gmail-ai-triage-agent',
  'whatsapp-auto-reply-bot',
  'slack-morning-briefing-bot',
  'daily-news-industry-summary-agent',
  'meeting-notes-formatter-agent',
  'simple-faq-chatbot',
  'social-media-post-generator',
  'document-summarizer-agent',
  'lead-capture-qualifier-bot',
  'price-competitor-monitor-agent',
  'calendar-task-prioritizer-agent',
  'basic-data-extractor-agent',
];

const wall = WALL_ORDER.map((slug) => agentsBeginner.find((a) => a.slug === slug)).filter(Boolean);

export default function WhatYouCanBuildSlide() {
  return (
    <SlideShell>
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link mb-3">
          The wall of builders
        </span>
        <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px]">Your first 12 AI agents</h2>
      </div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center text-body text-[13.5px] mb-6 max-w-lg mx-auto"
      >
        Everything you just saw came from exactly the same thinking process Samuel used.
      </m.p>

      {/* Grouped by row (of 4, matching sm:grid-cols-4) rather than one
          smooth per-card cascade — the point is for each row to visibly
          land as its own beat ("there's another row... and another"),
          not for all 12 to blur into a single fade-in. */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
        {wall.map((agent, i) => {
          const row = Math.floor(i / 4);
          return (
            <m.div
              key={agent.slug}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + row * 0.4 + (i % 4) * 0.06 }}
              className="relative flex flex-col items-center gap-1.5 bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-xl p-3 text-center"
            >
              {agent.slug === 'whatsapp-auto-reply-bot' && (
                <span className="absolute -top-1.5 -right-1.5 text-[8px] font-extrabold uppercase tracking-wide text-white bg-rose rounded-full px-1.5 py-0.5">
                  Live
                </span>
              )}
              <span className="text-xl">{agent.emoji}</span>
              <span className="text-[10.5px] font-bold text-body-strong leading-tight">{agent.title}</span>
            </m.div>
          );
        })}
      </div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9 }}
        className="text-center font-display font-bold text-[15px] sm:text-lg text-ink mt-7 max-w-lg mx-auto"
      >
        By the end of Builder 1, you won't just understand AI — <span className="text-link">you'll have built 12 real AI agents solving real business problems.</span>
      </m.p>
    </SlideShell>
  );
}
