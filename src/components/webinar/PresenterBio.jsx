import { m } from 'framer-motion';

// Shared layout for the two presenter-introduction slides — avatar-with-
// initials rather than a photo (none supplied for either presenter, and a
// generic stock headshot would be worse than an honest initials badge).
export default function PresenterBio({ initials, name, title, credentials, closingLine }) {
  return (
    <div className="flex flex-col items-center text-center">
      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 rounded-full bg-brand text-white flex items-center justify-center font-display font-extrabold text-2xl mb-4 shadow-[0_12px_28px_-8px_rgba(15,26,42,.4)]"
      >
        {initials}
      </m.div>

      <m.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-display font-extrabold text-2xl text-ink"
      >
        {name}
      </m.h2>

      <m.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-body-strong text-[14px] font-semibold mt-1 mb-5"
      >
        {title}
      </m.p>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-2 max-w-xl mb-6"
      >
        {credentials.map((c) => (
          <span
            key={c}
            className="text-[12.5px] font-bold text-body-strong bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-full px-3.5 py-1.5"
          >
            {c}
          </span>
        ))}
      </m.div>

      {closingLine && (
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-body text-[13.5px] italic max-w-md"
        >
          {closingLine}
        </m.p>
      )}
    </div>
  );
}
