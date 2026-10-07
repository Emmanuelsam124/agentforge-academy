import { m } from 'framer-motion';
import { GraduationCap, Wrench, TrendingUp } from 'lucide-react';
import SlideShell from '../SlideShell';

const OFFERINGS = [
  { icon: GraduationCap, title: 'Workshops & Training', text: 'Turn complex AI concepts into actionable, hands-on skills.' },
  { icon: Wrench, title: 'Custom AI Solutions', text: 'Tailor-made agents that eliminate tedious tasks for real businesses.' },
  { icon: TrendingUp, title: 'Career & Skill Advancement', text: 'Help professionals and teams level up their tech capabilities.' },
];

export default function AboutSocialDevSlide() {
  return (
    <SlideShell>
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link mb-3">
          About Social Dev Technologies
        </span>
        <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px]">What we actually do</h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {OFFERINGS.map((o, i) => (
          <m.div
            key={o.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-5 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-[#E8EDF3] dark:bg-brand/15 text-link flex items-center justify-center mb-3">
              <o.icon className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-[15px] text-ink mb-1.5">{o.title}</h3>
            <p className="text-[13px] text-body leading-relaxed m-0">{o.text}</p>
          </m.div>
        ))}
      </div>
    </SlideShell>
  );
}
