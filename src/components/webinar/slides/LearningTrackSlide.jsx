import { m } from 'framer-motion';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import SlideShell from '../SlideShell';
import { agents } from '../../../data/agents';

const builder1Count = agents.filter((a) => a.difficulty === 'Builder 1').length;
const builder2Count = agents.filter((a) => a.difficulty === 'Builder 2').length;

const TRACKS = [
  {
    tag: '🌱 Builder 1 · Start here',
    tagClass: 'bg-[#EAFAF1] dark:bg-green/10 text-green',
    borderClass: 'border-green border-[2.5px]',
    title: 'The foundation',
    text: `${builder1Count} single-tool builds designed for zero-to-one confidence. No prerequisite except curiosity.`,
  },
  {
    tag: "⚡ Builder 2 · What's next",
    tagClass: 'bg-[#E8EDF3] dark:bg-brand/15 text-link',
    borderClass: 'border-border-soft border-[1.5px]',
    title: 'The next level',
    text: `${builder2Count} multi-step, API-integrated builds — waiting once you've shipped your first few agents.`,
  },
  {
    tag: '⚡🌱 Pro · Both, no wait',
    tagClass: 'bg-[#FEF9E7] dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
    borderClass: 'border-border-soft border-[1.5px]',
    title: 'Everything, now',
    text: 'One payment, no prerequisite — both tracks unlock immediately if you already know you want it all.',
  },
];

// Bridges "12 projects" to an actual new capability — what changes for the
// person, not what they clicked through.
const CAPABILITIES = [
  'Spot work worth automating',
  'Design an AI solution',
  'Build agents with Claude',
  'Connect AI to real tools',
  'Build a real portfolio',
  'Move on to Builder 2',
];

export default function LearningTrackSlide() {
  return (
    <SlideShell contentClassName="text-center">
      <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px] mb-9">
        Your AI Builder journey
      </h2>

      <div className="flex flex-col lg:flex-row items-stretch justify-center gap-3 mb-9">
        {TRACKS.map((track, i) => (
          <div key={track.title} className="flex items-center gap-3 flex-1">
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.15 }}
              className={`bg-white dark:bg-[#131E2F] border ${track.borderClass} rounded-2xl p-5 w-full text-left`}
            >
              <span className={`inline-flex items-center gap-1.5 font-bold text-[11px] px-2.5 py-1 rounded-full mb-3 ${track.tagClass}`}>
                {track.tag}
              </span>
              <h3 className="font-display font-extrabold text-base text-ink mb-1.5">{track.title}</h3>
              <p className="text-[12.5px] text-body leading-relaxed">{track.text}</p>
            </m.div>
            {i < TRACKS.length - 1 && <ChevronRight className="hidden lg:block w-5 h-5 text-gray-300 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-[12.5px] font-bold uppercase tracking-wide text-body mb-4"
      >
        After Builder 1, you'll be able to
      </m.p>

      <div className="grid sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto text-left">
        {CAPABILITIES.map((c, i) => (
          <m.div
            key={c}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.08 }}
            className="flex items-center gap-2.5 text-[13px] font-semibold text-body-strong"
          >
            <CheckCircle2 className="w-4 h-4 text-green flex-shrink-0" />
            {c}
          </m.div>
        ))}
      </div>
    </SlideShell>
  );
}
