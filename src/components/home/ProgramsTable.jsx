import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { AI_AGENT_MASTERY_PRICE, BUILDER1_PRICE, VIBECODING_PRICE } from '../../data/pricing';

// One comparison instead of three equal cards. Every cell repeats a fact from
// that program's own page: prices from pricing.js, "3 live evenings, 7 PM WAT"
// and "6 months" from AI Agent Mastery, "4 weeks, 8 live classes" and "6 months"
// from Vibe Coding, "Permanent" from AI Agent Guides. "Best for" is condensed
// from each page's own audience list.
function programs({ buildCount, totalHours }) {
  return [
    {
      to: '/ai-agent-mastery',
      name: 'AI Agent Mastery',
      price: `₦${AI_AGENT_MASTERY_PRICE.toLocaleString()}`,
      format: 'Live cohort on Zoom',
      bestFor: 'Founders, operators, consultants and freelancers',
      length: '3 live evenings, 7 PM WAT',
      access: '6 months, with replays and resources',
      build: 'One assistant that triages your inbox, runs your calendar, does research and drafts messages, with guardrails built in',
      includes: ['Live instructor-led classes', 'One assistant, built end to end', 'Certificate of completion'],
    },
    {
      to: '/ai-builder',
      name: 'AI Agent Guides',
      price: `From ₦${BUILDER1_PRICE.toLocaleString()}`,
      format: 'Self-paced guides',
      bestFor: 'Self-paced learners who want to build, not just watch videos',
      length: `${buildCount} builds, about ${totalHours} hours in total`,
      access: 'Permanent',
      build: 'A portfolio of working agents: Gmail triage, WhatsApp bots, invoice processing and more',
      includes: ['Runs on your own free Gemini key', 'Portfolio write-up every session'],
    },
    {
      to: '/vibe-coding',
      name: 'Vibe Coding Bootcamp',
      price: `₦${VIBECODING_PRICE.toLocaleString()}`,
      format: 'Live cohort on Zoom',
      bestFor: 'Beginners, entrepreneurs, business owners, students and creators',
      length: '4 weeks, 8 live classes',
      access: '6 months, with recordings and your projects',
      build: 'A deployed website, web app and AI-powered product. No coding experience required',
      includes: ['Live instructor-led classes', 'Portfolio site, to-do app, Supabase CRUD app and more', 'Certificate of completion'],
    },
  ];
}

const ROWS = [
  ['Format', 'format'],
  ['Best for', 'bestFor'],
  ['Length', 'length'],
  ['Access', 'access'],
  ['You build', 'build'],
  ['Includes', 'includes'],
];

function Includes({ items }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check className="w-4 h-4 mt-1 flex-shrink-0 text-link" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SeeDetails({ to }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 font-bold text-[15px] text-link hover:underline underline-offset-4">
      See details <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

export default function ProgramsTable({ buildCount, totalHours }) {
  const list = programs({ buildCount, totalHours });

  return (
    <>
      {/* Wide screens: one table */}
      <div className="hidden lg:block rounded-2xl border border-border bg-surface overflow-hidden">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">Compare AI Agent Mastery, AI Agent Guides and Vibe Coding Bootcamp</caption>
          <thead>
            <tr className="border-b border-border">
              <td className="w-[168px]" />
              {list.map((p) => (
                <th key={p.name} scope="col" className="align-top p-5 border-l border-border font-normal">
                  <Link to={p.to} className="block group">
                    <div className="t-h3 text-ink text-lg group-hover:underline underline-offset-4">{p.name}</div>
                    <div className="t-num text-[28px] text-link mt-2.5">{p.price}</div>
                    <div className="text-[13px] text-body mt-1">one-time</div>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, key]) => (
              <tr key={key} className="border-b border-border">
                <th scope="row" className="align-top px-5 py-4 text-[13px] font-semibold text-body w-[168px]">{label}</th>
                {list.map((p) => (
                  <td key={p.name} className="align-top px-5 py-4 border-l border-border text-[15px] leading-[1.55] text-ink">
                    {key === 'includes' ? <Includes items={p.includes} /> : p[key]}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td />
              {list.map((p) => (
                <td key={p.name} className="px-5 py-4 border-l border-border">
                  <SeeDetails to={p.to} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Phones and tablets: one block per program */}
      <div className="lg:hidden flex flex-col gap-4">
        {list.map((p) => (
          <div key={p.name} className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="t-h3 text-ink text-lg">{p.name}</h3>
            <div className="t-num text-[28px] text-link mt-2">{p.price}</div>
            <div className="text-[13px] text-body mb-4">one-time</div>
            {ROWS.map(([label, key]) => (
              <div key={key} className="border-t border-border py-3">
                <div className="text-[13px] font-semibold text-body leading-snug mb-0.5">{label}</div>
                <div className="text-[15px] leading-[1.55] text-ink">
                  {key === 'includes' ? p.includes.join('. ') + '.' : p[key]}
                </div>
              </div>
            ))}
            <div className="pt-1"><SeeDetails to={p.to} /></div>
          </div>
        ))}
      </div>
    </>
  );
}
