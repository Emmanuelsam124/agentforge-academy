import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';

const FAQS = [
  {
    q: 'Do I need coding experience to start?',
    a: 'No. Builder 1 assumes no prior coding experience — sessions walk through copy-paste prompts and step-by-step setup. Builder 2 builds on that with more advanced, multi-step, API-integrated agents.',
  },
  {
    q: 'What do I need to actually follow along?',
    a: 'A free Gemini API key from Google AI Studio — no paid AI subscription required. Beyond that, just the free tools each session connects to (Gmail, Slack, Notion, etc., depending on the build).',
  },
  {
    q: 'Is access instant?',
    a: 'Instant. Buying a plan unlocks your sessions immediately and it\'s fully self-paced, permanent access — no cohort or start date to wait for.',
  },
  {
    q: 'How long does my access last?',
    a: 'Every plan — Builder 1, Builder 2, or Pro — is a one-time payment for permanent access. There\'s no expiry, no auto-renewal, and nothing recurring to remember to cancel.',
  },
  {
    q: 'What\'s the refund policy?',
    a: 'Because a purchase unlocks full access to every session in that tier immediately, there generally isn\'t a change-your-mind window once you\'ve bought a plan. If something went wrong with your payment or account, email support@socialdevtechnologies.com and we\'ll sort it out.',
  },
  {
    q: 'Do I have to do Builder 1 before Builder 2?',
    a: 'Builder 2 is designed to build on Builder 1\'s foundations, so that\'s the recommended order — but nothing technically stops you from starting with Builder 2, or getting both at once with Pro.',
  },
  {
    q: 'Do I get a certificate?',
    a: 'Yes. Completing sessions earns XP, and at defined proficiency thresholds you get an auto-issued certificate with a public verification link — no extra request needed.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Payments are processed securely by Paystack. Bank transfer, USSD, mobile money, and Visa/Mastercard are all accepted.',
  },
  {
    q: 'I\'m stuck on a build — what do I do?',
    a: 'Reach us on WhatsApp (wa.me/2349066006963) or email support@socialdevtechnologies.com. Each session also has a troubleshooting section for common issues.',
  },
  {
    q: 'Is this only for people already working in tech?',
    a: 'No — sessions span Sales, Marketing, Operations, Finance, HR, Legal, Customer Support, Engineering, Data, and Strategy. It\'s built for professionals automating their own work, not just developers.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  usePageSeo({
    title: 'FAQ — Social Dev Technologies',
    description: 'Common questions about Social Dev Technologies — pricing, access, refunds, certificates, and what you need to get started building AI agents.',
    canonicalPath: '/faq',
  });

  // FAQPage structured data — eligible for FAQ rich results in Google Search.
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <m.div initial={false} animate={{ opacity: 1, y: 0 }}>
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#F3EBFF] dark:bg-brand/15 text-brand">
          FAQ
        </span>
        <h1 className="font-display font-extrabold text-[32px] sm:text-[42px] leading-[1.1] text-ink tracking-[-1px] mt-4 mb-10">
          Frequently asked questions
        </h1>

        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => {
            const open = openIndex === i;
            const panelId = `faq-panel-${i}`;
            return (
              <div
                key={f.q}
                className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(open ? -1 : i)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-bold text-ink text-[15px]">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <p id={panelId} className="px-5 pb-4 text-sm leading-relaxed text-body">{f.a}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-border-soft text-center">
          <p className="text-sm text-body mb-3">Still have questions?</p>
          <div className="flex items-center justify-center gap-4 text-sm font-bold">
            <a href="https://wa.me/2349066006963" target="_blank" rel="noreferrer" className="text-brand hover:underline">
              Message us on WhatsApp
            </a>
            <Link to="/" className="text-brand hover:underline">← Back to home</Link>
          </div>
        </div>
      </m.div>
    </div>
  );
}
