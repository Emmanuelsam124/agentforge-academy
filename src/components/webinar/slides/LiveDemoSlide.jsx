import { m } from 'framer-motion';
import SlideShell from '../SlideShell';

import { EmojiText } from '../../EmojiIcon';
// The full Problem→Prompt→Reasoning→Automation→Value / seven-step loop
// already lives on HowBuildersThinkSlide, immediately before this one —
// repeating it here would be redundant. This slide is deliberately just a
// clean, low-noise backdrop for the co-presenter's real, live screen-share;
// it carries no simulated build content of its own.
const LOOP_REFERENCE = 'Find a problem → Describe it → Give AI instructions → Connect a tool → Test → Improve → Deploy';

export default function LiveDemoSlide() {
  return (
    <SlideShell contentClassName="text-center flex flex-col items-center">
      <m.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#FBEAE9] dark:bg-rose/15 text-rose mb-5"
      >
        <EmojiText>🎬 Live now</EmojiText>
      </m.span>

      <m.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-display font-extrabold text-[28px] sm:text-[44px] leading-[1.1] text-ink tracking-[-.8px] max-w-2xl"
      >
        Watch an AI Builder think.
      </m.h2>

      <m.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22 }}
        className="text-body text-sm font-semibold mt-3"
      >
        Samuel is building the WhatsApp Auto-Reply Bot — live.
      </m.p>

      <m.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="text-body text-base mt-5 max-w-md"
      >
        For the next few minutes, don't watch Samuel build.
      </m.p>

      <m.p
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="font-display font-extrabold text-xl sm:text-2xl text-link mt-2 max-w-md"
      >
        Answer one question: "Could I learn to build this?"
      </m.p>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-[11.5px] font-semibold text-gray-400 mt-10 max-w-xl"
      >
        {LOOP_REFERENCE}
      </m.p>
    </SlideShell>
  );
}
