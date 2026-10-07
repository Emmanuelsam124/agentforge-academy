import { m } from 'framer-motion';
import { Briefcase, Repeat, Building2 } from 'lucide-react';
import SlideShell from '../SlideShell';

// A real client outcome, not a course-graduate testimonial — John didn't
// build this himself, he uses an agent we built for his employer's work.
// Framed as service-delivery proof for the monetization pitch, not as
// "Real Builders" proof (that slide was retired since we don't yet have an
// accurate real-builder story to show).
const CLIENT_STORY = {
  name: 'John Uwem',
  photo: '/john_uwem.jpg',
  tag: 'Real client work — a US wedding ring brand',
  summary:
    "Part of John's job was checking dozens of jewelry stores for a wedding ring brand — did they stock the rings, was pricing right, were the photos correct. We built him an AI agent that does it automatically, twice a day. He hasn't opened a browser tab for it in weeks.",
};

const PATHS = [
  { icon: Briefcase, label: 'Freelance builds', text: 'One-off automations for local businesses who need exactly one problem solved' },
  { icon: Repeat, label: 'Ongoing retainers', text: 'Maintain and improve agents for clients over time, not just a one-time project' },
  { icon: Building2, label: 'Become the "AI person"', text: 'The one who makes your own workplace faster — like John, without a title change' },
];

export default function MakeMoneyFromThisSlide() {
  return (
    <SlideShell decorations>
      <div className="text-center mb-7">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link mb-3">
          Beyond your own work
        </span>
        <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px]">You can get paid for this.</h2>
        <p className="text-body text-[14px] mt-2 max-w-lg mx-auto">
          Every business has a version of John's problem — real work, nobody has time for it. Once you can build the fix, you can sell it.
        </p>
      </div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-5 max-w-2xl mx-auto mb-7"
      >
        <img
          src={CLIENT_STORY.photo}
          alt={CLIENT_STORY.name}
          className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-border-soft"
        />
        <div className="text-center sm:text-left">
          <span className="font-display font-bold text-ink text-[15px] block mb-1">{CLIENT_STORY.name}</span>
          <span className="inline-block text-[11px] font-bold text-link bg-[#E8EDF3] dark:bg-brand/15 rounded-full px-2.5 py-1 mb-2">
            {CLIENT_STORY.tag}
          </span>
          <p className="text-[13.5px] text-body-strong leading-relaxed m-0">{CLIENT_STORY.summary}</p>
        </div>
      </m.div>

      <div className="grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {PATHS.map((p, i) => (
          <m.div
            key={p.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + 0.1 * i }}
            className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-4"
          >
            <div className="w-9 h-9 rounded-lg bg-[#E8EDF3] dark:bg-brand/15 text-link flex items-center justify-center mb-2.5">
              <p.icon className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-display font-bold text-[13.5px] text-ink mb-1">{p.label}</h3>
            <p className="text-[12px] text-body leading-relaxed m-0">{p.text}</p>
          </m.div>
        ))}
      </div>
    </SlideShell>
  );
}
