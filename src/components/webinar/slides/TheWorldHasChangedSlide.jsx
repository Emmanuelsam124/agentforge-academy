import { m } from 'framer-motion';
import SlideShell from '../SlideShell';

import EmojiIcon from '../../EmojiIcon';
const WANTS = ['More money', 'More time', 'A better job', 'A growing business', 'To stay ahead'];

// Tiny illustrative scenes, not claimed-as-real case studies (those live in
// the Real Builders / testimonials slide, sourced from actual approved
// testimonial rows). Written as vivid present-tense vignettes rather than
// icon+label facts, per the note that this slide needed more emotional
// weight, not more information.
const SCENES = [
  { icon: '🎓', text: "Everyone in her class has the same degree. She has three AI agents she actually built — that's the interview conversation starter." },
  { icon: '🏪', text: 'He used to close his shop to answer messages. Now a bot replies while he sleeps, and sales never stop for the night.' },
  { icon: '👩‍🏫', text: 'She used to spend Sunday nights grading. Now she walks into Monday already prepared — and already ahead.' },
];

export default function TheWorldHasChangedSlide() {
  return (
    <SlideShell background="#0F1A2A" contentClassName="text-center flex flex-col items-center">
      <m.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-[13px] font-bold uppercase tracking-[3px] mb-5"
        style={{ color: '#B8CCE4' }}
      >
        Why this matters now
      </m.span>

      <m.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-display font-extrabold text-[28px] sm:text-[42px] leading-[1.15] tracking-[-1px] max-w-2xl text-white"
      >
        The opportunity has changed.
      </m.h2>

      <m.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.22 }}
        className="text-[#E2EAF3] text-[15px] leading-relaxed max-w-lg mt-3"
      >
        The people getting ahead aren't necessarily the smartest. They're the ones learning how to work differently.
      </m.p>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex flex-wrap justify-center gap-2 mt-6 mb-8 max-w-xl"
      >
        {WANTS.map((w) => (
          <span key={w} className="text-[12px] font-bold text-[#E2EAF3] bg-white/[0.08] border border-white/10 rounded-full px-3 py-1.5">
            {w}
          </span>
        ))}
      </m.div>

      {/* First scene carries a touch more visual weight than the other two
          — three equal-weight rows read as flat; this gives the eye a clear
          entry point without dropping the other two audiences. */}
      <div className="flex flex-col gap-2.5 w-full max-w-xl">
        {SCENES.map((scene, i) => (
          <m.div
            key={scene.text}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.15 }}
            className={`flex items-center gap-3.5 rounded-2xl text-left ${
              i === 0
                ? 'bg-white/10 border-[1.5px] border-yellow/30 px-5 py-5'
                : 'bg-white/[0.06] border border-white/10 px-5 py-3.5'
            }`}
          >
            <EmojiIcon emoji={scene.icon} className={i === 0 ? 'w-6 h-6 text-link flex-shrink-0' : 'w-5 h-5 text-link flex-shrink-0'} />
            <span className={`text-[#E2EAF3] leading-relaxed ${i === 0 ? 'text-[14.5px] font-medium' : 'text-[13px]'}`}>{scene.text}</span>
          </m.div>
        ))}
      </div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.05 }}
        className="text-[#D5DEE9] text-[14px] mt-7 max-w-md"
      >
        The vehicle behind all of it? <span className="text-yellow font-bold">AI</span> — now cheap and simple enough that anyone can pick it up.
      </m.p>
    </SlideShell>
  );
}
