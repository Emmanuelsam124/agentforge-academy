import { m } from 'framer-motion';
import { CircleHelp } from 'lucide-react';
import SlideShell from '../SlideShell';

// Answers grounded in real site facts (Pricing.jsx, About.jsx principles) —
// no softened or invented claims, since this slide's whole job is to be
// honest enough that it actually clears objections instead of dodging them.
// Short enough to read in ~3 seconds each — a live Zoom audience is
// listening to the spoken answer, not reading a paragraph off the screen.
const FAQS = [
  { q: 'Do I need coding experience?', a: 'No. Every session starts with copy-paste prompts.' },
  { q: "What if I've never programmed at all?", a: "That's who Builder 1 is for. Follow steps, copy-paste, done." },
  { q: "What if I don't know what to build?", a: "Every session is project-based. You're never starting blank." },
  { q: "What if I'm busy?", a: 'Self-paced. 1.5–3 hrs per session. 6 months of access.' },
  { q: 'Why do I need Claude Pro?', a: 'Real production AI, not a toy — the free tier hits limits fast.' },
  { q: 'What support do I get?', a: 'Direct support. Reach out, get an answer. Never alone.' },
  { q: 'What if I get stuck?', a: "Reach out anytime — we'll help you move forward." },
  { q: 'What if AI changes?', a: "You learn principles, not tools. That doesn't expire." },
];

export default function FAQSlide() {
  return (
    <SlideShell>
      <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink text-center tracking-[-.8px] mb-9">
        Before we go further — your questions
      </h2>

      <div className="grid sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto">
        {FAQS.map((item, i) => (
          <m.div
            key={item.q}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i }}
            className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-4.5"
          >
            <div className="flex items-start gap-2.5 mb-1.5">
              <CircleHelp className="w-4 h-4 text-link mt-0.5 flex-shrink-0" />
              <span className="font-display font-bold text-[14px] text-ink">{item.q}</span>
            </div>
            <p className="text-[13px] text-body leading-relaxed m-0 pl-6.5">{item.a}</p>
          </m.div>
        ))}
      </div>
    </SlideShell>
  );
}
