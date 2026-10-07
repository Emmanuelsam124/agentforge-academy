import { m } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import SlideShell from '../SlideShell';

import { EmojiText } from '../../EmojiIcon';
// Attendees this webinar is actually for — shown as a mirror, not a pitch,
// so everyone in the Zoom room sees themselves in the first 30 seconds.
const AUDIENCE = ['Student', 'Graduate', 'Business owner', 'Professional', 'Teacher', 'Customer support', 'Entrepreneur', 'Church leader'];

export default function WelcomeSlide() {
  const { theme } = useTheme();
  const bg = theme === 'dark'
    ? '#0C1420'
    : '#F6F8FB';

  return (
    <SlideShell background={bg} decorations contentClassName="text-center flex flex-col items-center">
      <m.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 bg-white dark:bg-[#131E2F] border-[1.5px] border-border text-link font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(15,26,42,.1)] mb-7"
      >
        <EmojiText>🎥 Live session</EmojiText>
      </m.span>

      <m.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="font-display font-extrabold text-[32px] sm:text-[46px] leading-[1.12] text-ink tracking-[-1px] sm:tracking-[-1.5px] max-w-2xl"
      >
        Welcome to <span className="text-link">The AI Builder Workshop.</span>
      </m.h1>

      <m.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-body-strong text-lg leading-relaxed mt-5 max-w-lg font-medium"
      >
        Thank you for investing your time in yourself today.
      </m.p>

      <m.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.42 }}
        className="text-body text-base leading-relaxed mt-4 max-w-lg"
      >
        Before we start — tell us who you are in the chat.
      </m.p>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="flex flex-wrap justify-center gap-2.5 mt-7 max-w-2xl"
      >
        {AUDIENCE.map((a) => (
          <span
            key={a}
            className="text-[13.5px] font-bold text-body-strong bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-full px-4 py-2"
          >
            {a}
          </span>
        ))}
      </m.div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-body text-sm mt-8 max-w-md"
      >
        Whoever you are — there's a reason this hour matters for you specifically.
      </m.p>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-body-strong font-semibold text-sm mt-3 max-w-md"
      >
        By the end of today, you'll understand how ordinary people are building AI systems — and you'll know how you can too.
      </m.p>
    </SlideShell>
  );
}
