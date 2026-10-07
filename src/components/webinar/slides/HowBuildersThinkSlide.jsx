import { m } from 'framer-motion';
import { Search, FileText, MessageSquareText, Plug, FlaskConical, Wrench, Rocket } from 'lucide-react';
import SlideShell from '../SlideShell';

const LOOP = [
  { icon: Search, label: 'Find a problem' },
  { icon: FileText, label: 'Describe it' },
  { icon: MessageSquareText, label: 'Give AI instructions' },
  { icon: Plug, label: 'Connect a tool' },
  { icon: FlaskConical, label: 'Test' },
  { icon: Wrench, label: 'Improve' },
  { icon: Rocket, label: 'Deploy' },
];

export default function HowBuildersThinkSlide() {
  return (
    <SlideShell decorations>
      <div className="text-center mb-9">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link mb-3">
          The universal pattern
        </span>
        <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px]">How AI Builders think</h2>
      </div>

      {/* Each step reveals on its own beat (~0.45s apart) rather than all
          popping in almost at once — this is the slide people should
          remember, so the loop itself unfolds like the presenter is
          counting it out live. */}
      <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto">
        {LOOP.map((step, i) => (
          <m.div
            key={step.label}
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.45 * i, duration: 0.4, ease: 'easeOut' }}
            className="flex items-center gap-2.5 bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-full pl-2.5 pr-4 py-2"
          >
            <span className="w-7 h-7 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link flex items-center justify-center flex-shrink-0 font-display font-extrabold text-[11px]">
              {i + 1}
            </span>
            <step.icon className="w-4 h-4 text-link flex-shrink-0" />
            <span className="text-[13px] font-bold text-body-strong whitespace-nowrap">{step.label}</span>
          </m.div>
        ))}
      </div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 * LOOP.length + 0.3 }}
        className="text-center text-body text-[13.5px] mt-9 max-w-md mx-auto"
      >
        This loop never changes. Only the problem changes, session to session.
      </m.p>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 * LOOP.length + 0.55 }}
        className="text-center font-display font-bold text-[13.5px] text-link mt-2 max-w-md mx-auto"
      >
        Every AI system you've ever admired follows this same pattern.
      </m.p>
    </SlideShell>
  );
}
