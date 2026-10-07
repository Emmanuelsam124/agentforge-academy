import { m } from 'framer-motion';
import { Clock, Repeat, TrendingDown, Box } from 'lucide-react';
import SlideShell from '../SlideShell';

// A self-diagnostic rather than a claim — personalizes "the opportunity has
// changed" onto the attendee's actual week before asking them to believe
// anything about AI. Written broad enough to land across the whole
// audience (not just business owners with staff to cut), unlike the
// "fire your team" framing this pattern is adapted from.
const GROUPS = [
  {
    icon: Clock,
    title: 'Your time is draining',
    items: [
      'You spend evenings finishing the paperwork part of something you already did',
      'You answer the same question over and over, one person at a time',
    ],
  },
  {
    icon: Repeat,
    title: "You're stuck doing repeatable work",
    items: [
      'You do the same multi-step check by hand, every single day',
      'Work a computer could do while you sleep is costing you hours',
    ],
  },
  {
    icon: TrendingDown,
    title: "You're leaving things on the table",
    items: [
      'People message you and move on while they wait for your reply',
      'You keep saying "I\'ll get to that" about the thing you never automate',
    ],
  },
  {
    icon: Box,
    title: 'You are the bottleneck',
    items: ['Nothing moves — at work, in class, in your business — until you personally touch it'],
  },
];

export default function TheHonestCheckSlide() {
  return (
    <SlideShell>
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link mb-3">
          A quick gut check
        </span>
        <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px]">How many of these sound like you?</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto mb-7">
        {GROUPS.map((group, i) => (
          <m.div
            key={group.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-4.5"
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E8EDF3] dark:bg-brand/15 text-link flex items-center justify-center flex-shrink-0">
                <group.icon className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-[14px] text-ink">{group.title}</span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <li key={item} className="text-[12.5px] text-body leading-relaxed pl-1">
                  {item}
                </li>
              ))}
            </ul>
          </m.div>
        ))}
      </div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center font-display font-bold text-[15px] sm:text-lg text-ink max-w-xl mx-auto"
      >
        If two or more sound like your week, you don't need more hours. <span className="text-link">You need a system that runs without you.</span>
      </m.p>
    </SlideShell>
  );
}
