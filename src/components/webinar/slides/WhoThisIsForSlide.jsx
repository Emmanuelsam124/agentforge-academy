import { m } from 'framer-motion';
import { Check, X } from 'lucide-react';
import SlideShell from '../SlideShell';

// A qualifying / disqualifying pair right before the offer — builds trust
// by being selective rather than implying everyone should buy. Written to
// match what Builder 1 actually is (project-based, self-paced, hands-on),
// not generic "are you serious enough" language.
const FOR_YOU = [
  "You want to build something, not just watch a video",
  "You've tried AI tools and felt like you weren't getting real results",
  'You can commit an hour or two per session, at your own pace',
  'You want a skill you can point to, not just a certificate',
];

const NOT_FOR_YOU = [
  "You're looking for a magic button that needs zero effort from you",
  'You want theory with no hands-on building',
  "You're not willing to actually open Claude and follow along",
];

export default function WhoThisIsForSlide() {
  return (
    <SlideShell decorations>
      <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink text-center tracking-[-.8px] mb-9">
        Is Builder 1 for you?
      </h2>

      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#131E2F] border-[2px] border-green rounded-2xl p-6"
        >
          <h3 className="font-display font-bold text-base text-ink mb-4">This is for you if…</h3>
          <ul className="flex flex-col gap-2.5">
            {FOR_YOU.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] text-body-strong font-medium">
                <Check className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </m.div>

        <m.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-6"
        >
          <h3 className="font-display font-bold text-base text-ink mb-4">This might not be for you if…</h3>
          <ul className="flex flex-col gap-2.5">
            {NOT_FOR_YOU.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] text-body">
                <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </m.div>
      </div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-center text-body text-[14px] mt-8 max-w-lg mx-auto"
      >
        If that's you on the left — here's exactly what's included.
      </m.p>
    </SlideShell>
  );
}
