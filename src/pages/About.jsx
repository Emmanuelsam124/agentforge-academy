import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Hammer, Briefcase, Wallet, Users } from 'lucide-react';
import { agents } from '../data/agents';
import { departments, isVisibleToPublic } from '../data/departments';
import { usePageSeo } from '../hooks/usePageSeo';

const publicAgents = agents.filter((a) => isVisibleToPublic(a.difficulty));
const realDepartments = departments.filter((d) => d.id !== 'all');
const totalHours = Math.round(publicAgents.reduce((sum, a) => sum + parseFloat(a.buildTime), 0));

const PRINCIPLES = [
  {
    icon: Hammer,
    title: 'Build, don\'t just watch',
    text: 'Every session ships a working agent, not a passive video. You paste real prompts into Claude and connect real tools — Gmail, Slack, Notion — not a simulated sandbox.',
  },
  {
    icon: Briefcase,
    title: 'Portfolio over certificates',
    text: 'Each session ends with a write-up prompt — a LinkedIn post, a resume bullet, a project blurb — so what you build is something you can actually show, not just a badge.',
  },
  {
    icon: Wallet,
    title: 'Priced for where we teach',
    text: 'One-time payments, not recurring subscriptions you forget to cancel. Built with African students and career-switchers in mind, not priced like a Silicon Valley bootcamp.',
  },
  {
    icon: Users,
    title: 'Real support, not a forum you\'ll never check',
    text: 'Stuck on a build? You can reach us directly — this isn\'t a self-serve library you\'re left alone with.',
  },
];

export default function About() {
  usePageSeo({
    title: 'About — Social Dev Technologies',
    description: 'Why Social Dev Technologies teaches AI agent building through hands-on sessions instead of passive video courses — our approach, principles, and who it\'s for.',
    canonicalPath: '/about',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <m.div initial={false} animate={{ opacity: 1, y: 0 }}>
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#F3EBFF] dark:bg-brand/15 text-brand">
          About us
        </span>
        <h1 className="font-display font-extrabold text-[32px] sm:text-[42px] leading-[1.1] text-ink tracking-[-1px] mt-4 mb-4">
          AI skills you actually ship, not just watch.
        </h1>
        <p className="text-body text-base sm:text-lg leading-relaxed max-w-2xl">
          Most "learn AI" content is a video explaining what a prompt is. We built Social Dev Technologies because
          the gap isn't understanding AI conceptually — it's never having built anything real with it. So every
          session here is a guided, hands-on build: a real integration, a real output, a real thing you can put in
          your portfolio.
        </p>
      </m.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 mb-14">
        <Stat value={publicAgents.length} label="Guided sessions" />
        <Stat value={realDepartments.length} label="Departments covered" />
        <Stat value={`${totalHours}+`} label="Hours of content" />
        <Stat value="6 mo" label="Access per plan" />
      </div>

      <h2 className="font-display font-extrabold text-2xl text-ink mb-6">What we believe</h2>
      <div className="grid sm:grid-cols-2 gap-5 mb-14">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-[20px] p-6">
            <div className="w-11 h-11 rounded-xl bg-[#F3EBFF] dark:bg-brand/15 text-brand flex items-center justify-center mb-4">
              <p.icon className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink mb-2">{p.title}</h3>
            <p className="text-sm leading-relaxed text-body m-0">{p.text}</p>
          </div>
        ))}
      </div>

      <div
        className="rounded-[24px] px-8 sm:px-10 py-9 flex items-center justify-between flex-wrap gap-5 shadow-[0_20px_44px_-16px_rgba(124,58,237,.6)]"
        style={{ background: 'linear-gradient(120deg, #7C3AED, #9D5CFF)' }}
      >
        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-[26px] text-white m-0">Ready to build your first agent?</h2>
          <p className="text-[#EDE4FF] mt-2 mb-0 text-[15px]">Browse all <span>{publicAgents.length}</span> sessions and pick where to start.</p>
        </div>
        <Link
          to="/catalog"
          className="bg-yellow text-ink font-extrabold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,.18)] hover:brightness-95 transition-all flex-shrink-0"
        >
          Browse catalog →
        </Link>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="bg-[#F3EBFF] dark:bg-[#181818] rounded-[18px] px-5 py-5.5 text-center">
      <div className="font-display font-extrabold text-[28px] sm:text-[34px] text-brand">{value}</div>
      <div className="text-[13px] text-body font-semibold mt-0.5">{label}</div>
    </div>
  );
}
