import { m } from 'framer-motion';
import { MessageCircle, Hammer, X, Check, Building2, Briefcase, GraduationCap, BookOpen, Rocket, Headphones, Church } from 'lucide-react';
import SlideShell from '../SlideShell';

const USING = ['Opens ChatGPT when they remember to', 'Asks the same question every time', "Nothing happens unless they're there, typing"];
const BUILDING = ['Builds a system that runs the task automatically', 'Solves a problem once — permanently', "Keeps working even when they're not there"];

// Role labels only, no on-screen value copy — the presenter picks 2-3
// relevant ones live from chat and speaks the value directly (see
// presenter notes), which keeps this legible on a shared Zoom screen
// instead of stacking seven sentences.
const ROLES = [
  { icon: Building2, label: 'Business owner' },
  { icon: Briefcase, label: 'Professional' },
  { icon: GraduationCap, label: 'Graduate' },
  { icon: BookOpen, label: 'Teacher' },
  { icon: Rocket, label: 'Entrepreneur' },
  { icon: Headphones, label: 'Customer support' },
  { icon: Church, label: 'Church leader' },
];

export default function AIUsersVsBuildersSlide() {
  return (
    <SlideShell>
      <h2 className="font-display font-extrabold text-[24px] sm:text-[34px] text-ink text-center tracking-[-.7px] mb-7">
        Using AI vs. Building with AI
      </h2>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-[18px] p-5"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-400 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-display font-bold text-[15px] text-ink">Using AI</h3>
          </div>
          <ul className="space-y-2">
            {USING.map((t) => (
              <li key={t} className="flex items-start gap-2 text-[12.5px] text-body">
                <X className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /> {t}
              </li>
            ))}
          </ul>
        </m.div>

        <m.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#131E2F] border-[2px] border-brand rounded-[18px] p-5 shadow-[0_16px_36px_-18px_rgba(15,26,42,.4)]"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8EDF3] dark:bg-brand/15 text-link flex items-center justify-center flex-shrink-0">
              <Hammer className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-display font-bold text-[15px] text-ink">Building with AI</h3>
          </div>
          <ul className="space-y-2">
            {BUILDING.map((t) => (
              <li key={t} className="flex items-start gap-2 text-[12.5px] text-body-strong font-medium">
                <Check className="w-3.5 h-3.5 text-green mt-0.5 flex-shrink-0" /> {t}
              </li>
            ))}
          </ul>
        </m.div>
      </div>

      <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-center text-[13px] text-body font-semibold mb-4">
        What does that mean for you?
      </m.p>

      <div className="flex flex-wrap justify-center gap-2.5">
        {ROLES.map((r, i) => (
          <m.span
            key={r.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + i * 0.05 }}
            className="inline-flex items-center gap-2 text-[13px] font-bold text-body-strong bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-full pl-2.5 pr-4 py-2"
          >
            <span className="w-6 h-6 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link flex items-center justify-center flex-shrink-0">
              <r.icon className="w-3.5 h-3.5" />
            </span>
            {r.label}
          </m.span>
        ))}
      </div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-center font-display font-bold text-base sm:text-lg text-ink mt-8"
      >
        People who build with AI become <span className="text-link">AI Builders.</span>
      </m.p>
    </SlideShell>
  );
}
