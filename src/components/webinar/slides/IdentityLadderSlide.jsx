import { m } from 'framer-motion';
import SlideShell from '../SlideShell';
import SignatureLine from '../SignatureLine';
import { levels } from '../../../data/departments';

import EmojiIcon from '../../EmojiIcon';
export default function IdentityLadderSlide() {
  return (
    <SlideShell decorations contentClassName="text-center">
      <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px] mb-2">
        Who you become
      </h2>
      <p className="text-body text-base mb-10 max-w-lg mx-auto">
        Every session earns real XP toward a real level — tracked, not a metaphor.
      </p>

      <div className="flex flex-wrap justify-center items-end gap-3 sm:gap-4 mb-10">
        {levels.map((level, i) => (
          <m.div
            key={level.name}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 * i, duration: 0.5 }}
            className={`flex flex-col items-center gap-2 rounded-2xl px-5 py-5 ${
              i === 1 ? 'bg-brand text-white shadow-[0_16px_36px_-12px_rgba(15,26,42,.5)]' : 'bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft'
            }`}
            style={{ minWidth: 110 }}
          >
            <EmojiIcon emoji={level.icon} className="w-8 h-8 text-link" />
            <span className={`font-display font-extrabold text-sm ${i === 1 ? 'text-white' : 'text-ink'}`}>{level.name}</span>
            {i === 1 && <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 rounded-full px-2 py-0.5">You start here</span>}
          </m.div>
        ))}
      </div>

      <div className="max-w-xl mx-auto">
        <SignatureLine variant="light" delay={0.85} />
      </div>

      <m.p
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.3, duration: 0.6, ease: 'easeOut' }}
        className="font-display font-extrabold text-2xl sm:text-4xl text-ink leading-tight max-w-2xl mx-auto mt-8"
      >
        You don't need permission to call yourself a builder.<br className="hidden sm:block" /> You need <span className="text-link">one shipped agent.</span>
      </m.p>
    </SlideShell>
  );
}
