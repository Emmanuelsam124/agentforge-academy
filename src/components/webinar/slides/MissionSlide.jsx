import { m } from 'framer-motion';
import { GraduationCap, Building2, HeartPulse, Sprout, Landmark, Church, Store } from 'lucide-react';
import SlideShell from '../SlideShell';
import SignatureLine from '../SignatureLine';

// Sectors the mission spans — a quick visual of breadth so the slide isn't
// carrying its point through text alone.
const SECTORS = [
  { icon: GraduationCap, label: 'Education' },
  { icon: Building2, label: 'Business' },
  { icon: HeartPulse, label: 'Healthcare' },
  { icon: Sprout, label: 'Agriculture' },
  { icon: Landmark, label: 'Government' },
  { icon: Church, label: 'Church' },
  { icon: Store, label: 'Small business' },
];

export default function MissionSlide() {
  return (
    <SlideShell background="#0F1A2A" contentClassName="text-center flex flex-col items-center">
      <m.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-[13px] font-bold uppercase tracking-[3px] mb-5"
        style={{ color: '#B8CCE4' }}
      >
        Why Africa needs AI Builders
      </m.span>

      <m.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="font-display font-extrabold text-[26px] sm:text-[40px] leading-[1.2] tracking-[-1px] max-w-2xl text-white"
      >
        Africa shouldn't just use AI.<br />
        <span className="text-yellow">Africa should build with AI.</span>
      </m.h2>

      <m.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-[#E2EAF3] text-[15px] leading-relaxed max-w-lg mt-6"
      >
        Our mission is to equip ordinary people with practical AI Builder skills — so they can solve real problems, create opportunities, and shape the future of work.
      </m.p>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap justify-center gap-2 mt-7 max-w-lg"
      >
        {SECTORS.map((s) => (
          <span
            key={s.label}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#E2EAF3] bg-white/[0.08] border border-white/10 rounded-full pl-2 pr-3 py-1.5"
          >
            <s.icon className="w-3.5 h-3.5 text-yellow" />
            {s.label}
          </span>
        ))}
      </m.div>

      <div className="border-t border-white/10 pt-6 mt-8 max-w-md">
        <SignatureLine variant="dark" delay={0.85} />
      </div>
    </SlideShell>
  );
}
