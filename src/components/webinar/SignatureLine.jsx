import { m } from 'framer-motion';

// The one repeated, memorable line of the whole webinar — same wording
// every time it appears, at a handful of emotionally load-bearing moments
// (Mission, Using vs. Building, Who You Become, Q&A), so the audience
// leaves able to finish the sentence themselves.
export default function SignatureLine({ variant = 'light', delay = 0, className = '' }) {
  const textColor = variant === 'dark' ? 'text-white' : 'text-ink';
  const accentColor = variant === 'dark' ? 'text-yellow' : 'text-link';

  return (
    <m.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`font-display font-bold text-base sm:text-lg leading-snug ${textColor} ${className}`}
    >
      The future won't belong to the people who use AI.
      <br className="hidden sm:block" /> It will belong to the people who <span className={accentColor}>build with it.</span>
    </m.p>
  );
}
