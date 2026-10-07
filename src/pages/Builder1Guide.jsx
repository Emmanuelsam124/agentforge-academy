import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Copy, Check, ChevronDown } from 'lucide-react';
import { getAgentsByDifficulty, getBuilderPagePath, groupAgentsByWeek } from '../data/agents';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../context/AuthContext';
import CourseSidebar from '../components/CourseSidebar';

import EmojiIcon, { EmojiText } from '../components/EmojiIcon';
// Single scrollable page (not a wizard) — this lives as item 0 in the same
// Builder 1 sequence CourseSidebar/BuilderSession already use, so it needs
// to feel like one course with one Previous/Next, not a separate app glued
// on the front. See CourseSidebar.jsx for how it's slotted into the list,
// and BuilderSession.jsx for the Previous link back to this page from
// Session 1. The in-page nav below (sticky, anchor-based) is the same
// pattern WhatsAppBotGuide.jsx uses for a long single-page guide.
//
// Rewritten 2026-09-22: this page used to onboard people into a live
// Saturday cohort ("Builder 1 starts Saturday, August 15, 2026") and
// treated a paid Claude Pro subscription as mandatory. Builder 1 has no
// live component anymore (founder-confirmed) — permanent, self-paced
// guides only, running on a free Gemini API key. The curriculum section
// also used to be a fictional 13-session, 3-module outline that never
// matched the real Builder 1 catalog (12 real agents) — now pulled live
// from the same agent data BuilderSession.jsx/CourseSidebar.jsx use, so
// it can't drift out of sync with the real sessions again.
const COMMUNITY_WHATSAPP_LINK = 'https://chat.whatsapp.com/JoZQehOdBmGISFs77HKVSk';

const NAV_SECTIONS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'setup', label: 'Setup' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'pace', label: 'Pace' },
  { id: 'community', label: 'Community' },
];

function Callout({ type = 'info', icon, children }) {
  const styles = {
    info:    'bg-brand/10 border-l-4 border-brand',
    warn:    'bg-amber/10 border-l-4 border-amber',
    success: 'bg-green/10 border-l-4 border-green',
  };
  return (
    <div className={`flex gap-3 rounded-xl p-4 mb-4 ${styles[type]}`}>
      <EmojiIcon emoji={icon} className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="text-sm text-ink leading-relaxed">{children}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-bg border border-border rounded-2xl p-5 mb-4">
      {title && (
        <div className="text-[10px] font-bold tracking-widest uppercase text-body mb-3">{title}</div>
      )}
      {children}
    </div>
  );
}

function Faq({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="border border-border rounded-xl mb-2 overflow-hidden" open={open}>
      <summary
        className="flex items-center justify-between gap-2 px-4 py-3 font-semibold text-sm cursor-pointer text-ink list-none select-none"
        onClick={(e) => { e.preventDefault(); setOpen(!open); }}
      >
        {q}
        <ChevronDown className={`w-4 h-4 text-body flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </summary>
      {open && <div className="px-4 pb-4 text-sm text-body leading-relaxed">{children}</div>}
    </details>
  );
}

function Snippet({ children }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="relative bg-ink dark:bg-[#0C1420] rounded-xl p-4 my-4 font-mono text-[13px] text-[#E7E5E4] leading-relaxed whitespace-pre-wrap overflow-x-auto">
      <button
        onClick={copy}
        className="absolute top-3 right-3 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white/80 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      {children}
    </div>
  );
}

function CheckItem({ children }) {
  const [checked, setChecked] = useState(false);
  return (
    <li
      className={`flex items-start gap-3 py-3 border-b border-border-soft last:border-none cursor-pointer select-none transition-opacity ${checked ? 'opacity-60' : ''}`}
      onClick={() => setChecked(!checked)}
    >
      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-green border-green' : 'border-border'}`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className={`text-sm leading-relaxed ${checked ? 'line-through text-body' : 'text-ink'}`}>{children}</span>
    </li>
  );
}

function StepList({ items }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm text-ink leading-relaxed">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ink text-bg flex items-center justify-center text-[11px] font-bold mt-0.5">{i + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function ReqRow({ icon, title, cost, desc, link, linkLabel }) {
  return (
    <div className="flex gap-3 py-4 border-b border-border-soft last:border-none">
      <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 text-link"><EmojiIcon emoji={icon} className="w-5 h-5" /></div>
      <div>
        <div className="font-bold text-sm text-ink mb-0.5">
          {title}{cost && <span className="ml-1.5 text-amber font-semibold">{cost}</span>}
        </div>
        <div className="text-xs text-body leading-relaxed mb-1">{desc}</div>
        {link && <a href={link} target="_blank" rel="noreferrer" className="text-xs font-bold text-link hover:underline">{linkLabel}</a>}
      </div>
    </div>
  );
}

function SchedRow({ n, title, desc, badge }) {
  return (
    <div className="flex items-start gap-3 bg-bg border border-border rounded-xl p-3.5">
      <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{n}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-ink mb-0.5">{title}</div>
        <div className="text-xs text-body leading-relaxed">{desc}</div>
      </div>
      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md flex-shrink-0 self-start bg-brand/10 text-link">{badge}</span>
    </div>
  );
}

// as="h1" only for the page's very first Section (Welcome) — the page had
// no true <h1> at all, every Section rendering h2. Rather than change the
// component's default (which would still leave the page without a real
// top-level heading), the first section alone gets the real one; the rest
// stay h2 so the outline still reads top-down.
function Section({ id, eyebrow, title, subtitle, children, as: HeadingTag = 'h2' }) {
  return (
    <section id={id} className="py-10 border-b border-border-soft last:border-none scroll-mt-24">
      <div className="text-[10px] font-bold uppercase tracking-widest text-link mb-2">{eyebrow}</div>
      <HeadingTag className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-2" style={{ textWrap: 'balance' }}>{title}</HeadingTag>
      {subtitle && <p className="text-body text-sm mb-6 leading-relaxed max-w-xl">{subtitle}</p>}
      {children}
    </section>
  );
}

export default function Builder1Guide() {
  const { user } = useAuth();
  const progress = useProgress(user);
  const tierAgents = getAgentsByDifficulty('Builder 1');
  const firstAgent = tierAgents[0];
  const builder1Weeks = groupAgentsByWeek(tierAgents);

  useEffect(() => {
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    document.title = 'Builder 1 Guide — Social Dev Technologies';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        `Getting started with Builder 1 — requirements, setup, and how the ${tierAgents.length}-session sequence works before you build your first AI agent.`
      );
    }

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    const hadCanonical = Boolean(canonicalEl);
    const prevCanonical = canonicalEl?.getAttribute('href');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', 'https://socialdevtechnologies.com/builder-1-guide');

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
      if (hadCanonical && prevCanonical) canonicalEl.setAttribute('href', prevCanonical);
      else canonicalEl.remove();
    };
  }, [tierAgents.length]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
        <CourseSidebar tier="Builder 1" tierAgents={tierAgents} currentSlug={null} progress={progress} />

        <div className="min-w-0">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-link transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>

          <Callout type="success" icon="🚀">
            <strong>Your Builder 1 access is live right now — permanent, no deadline.</strong> Use this guide to get set up, then start building whenever you're ready.
            <a
              href={COMMUNITY_WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 flex w-fit items-center gap-1.5 text-sm font-bold text-green hover:underline"
            >
              <EmojiText>{'💬 Join the Builder community on WhatsApp →'}</EmojiText>
            </a>
          </Callout>

          {/* Sticky in-page nav — same pattern as WhatsAppBotGuide.jsx */}
          <div className="sticky top-20 z-20 -mx-1 px-1 bg-bg/95 backdrop-blur border-b border-border-soft mb-2">
            <div className="flex gap-4 overflow-x-auto py-2.5">
              {NAV_SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="text-[12.5px] font-semibold text-body hover:text-link whitespace-nowrap transition-colors">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <Section id="welcome" eyebrow="Welcome" title="Welcome to Builder 1 — you're in." as="h1">
            <Card title="What is Builder 1?">
              <p className="text-sm text-body leading-relaxed mb-4">
                Builder 1 is the first tier of Social Dev Technologies' AI agent training. Hands-on from session one — no lengthy theory, no slide decks. You build real agents with your own free Gemini API key, session by session, and ship something portfolio-worthy by the end. Permanent access, at your own pace.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {[[String(tierAgents.length), 'Sessions'], ['Self-paced', 'Learn anytime'], ['Real', 'Agent projects'], ['0', 'Prerequisites']].map(([n, l]) => (
                  <div key={l} className="border border-border rounded-xl p-3.5">
                    <div className="text-xl font-extrabold text-link font-display">{n}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-body mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Faq q="Who is this for?">
              Anyone who wants to build AI agents — not just talk about them. You don't need a coding background. You need curiosity, a willingness to try things, and the tools listed below.
            </Faq>
            <Faq q="What if I get stuck?">
              Every session's guide is available right away — no class to wait for. Reach out on WhatsApp or email and we'll help you move forward.
            </Faq>
          </Section>

          <Section id="requirements" eyebrow="Requirements" title="What you need to get started" subtitle="These are the only things required to work through Builder 1 — get them sorted, then start whenever you're ready.">
            <Card>
              <ReqRow icon="✨" title="A free Gemini API key"
                desc="Every build runs on your own free Gemini API key from Google AI Studio — no paid AI subscription required."
                link="https://aistudio.google.com/apikey" linkLabel="→ Get your key at Google AI Studio" />
              <ReqRow icon="💻" title="A computer with internet access"
                desc="Any modern laptop or desktop — Windows, Mac, or Linux. Fast enough to browse and type." />
              <ReqRow icon="🔑" title="Your Social Dev Technologies account"
                desc="You already have Builder 1 access. Make sure you can log in and see your sessions."
                link="/dashboard" linkLabel="→ Check your dashboard" />
              <ReqRow icon="📱" title="WhatsApp (for support & community)"
                desc="Ask questions, share what you build, and get unstuck alongside other builders."
                link={COMMUNITY_WHATSAPP_LINK} linkLabel="→ Join the community group" />
            </Card>
          </Section>

          <Section id="setup" eyebrow="Setup" title="Get your free Gemini API key" subtitle="Do this once and you're ready for every session — it costs nothing.">
            <Card title="Get a free Gemini API key">
              <StepList items={[
                <>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-link font-semibold">aistudio.google.com/apikey</a> in your browser</>,
                <>Sign in with a Google account, or create one — it's free</>,
                <>Click <strong>"Create API key"</strong></>,
                <>Copy the key — each session tells you exactly where to paste it</>,
              ]} />
            </Card>
            <Card title="Test that it's working">
              <p className="text-sm text-body mb-2">Send Gemini this prompt — if it responds clearly and at length, you're all set:</p>
              <Snippet>{`You are an AI assistant helping me learn to build AI agents. In 3 sentences, explain what an AI agent is and give me one real-world example of how someone in Africa could use one to solve a business problem.`}</Snippet>
            </Card>
            <Faq q="Do I have to use Gemini specifically?">
              The sessions are built around Gemini's free tier, so that's the easiest path with nothing to pay for. If you already have access to another AI tool, you can adapt the prompts — the core concepts are the same either way.
            </Faq>
          </Section>

          <Section id="curriculum" eyebrow="Curriculum" title="What you'll build in Builder 1" subtitle={`${tierAgents.length} sessions, all hands-on. Each one produces something you can actually use or show — not just notes.`}>
            {builder1Weeks.length > 0 ? (
              builder1Weeks.map((w) => (
                <Card key={w.week} title={`Week ${w.week}`}>
                  <ul className="list-none">
                    {w.agents.map((a) => <CheckItem key={a.id}>{a.title}</CheckItem>)}
                  </ul>
                </Card>
              ))
            ) : (
              <Card>
                <ul className="list-none">
                  {tierAgents.map((a) => <CheckItem key={a.id}>{a.title}</CheckItem>)}
                </ul>
              </Card>
            )}
          </Section>

          <Section id="pace" eyebrow="Pace" title="There's no schedule — go at your own pace" subtitle="Builder 1 is fully self-paced. Here's a rhythm that works well if you want a guideline.">
            <Card title="A pace that works well">
              <div className="space-y-2.5">
                <SchedRow n="1" title="2–3 sessions a week" badge="Suggested"
                  desc="Most students finish Builder 1 in 4–6 weeks at this pace — but there's no deadline, so go faster or slower." />
                <SchedRow n="2" title="Every guide, unlocked immediately" badge="Self-paced"
                  desc="Each session's full written guide is available the moment you start — go deeper, experiment, revisit anytime." />
                <SchedRow n="3" title="Ongoing community support" badge="Community"
                  desc="Share your agents in the WhatsApp group. Get feedback from other builders and the team, any day of the week." />
              </div>
            </Card>
            <Faq q="How long does my Builder 1 access last?">
              Forever — it's a one-time payment for permanent access, not a subscription. No expiry, nothing to renew.
            </Faq>
          </Section>

          <Section id="community" eyebrow="Community" title="Support, community & next steps" subtitle="You're not building alone. Here's how to stay connected and get help when you need it.">
            <Card title="How to get help">
              <ReqRow icon="💬" title="WhatsApp Community"
                desc="Primary space for questions, updates, and sharing what you build."
                link={COMMUNITY_WHATSAPP_LINK} linkLabel="→ Join the community group" />
              <ReqRow icon="📧" title="Email"
                desc="For account issues, billing, or anything that needs a longer conversation."
                link="mailto:support@socialdevtechnologies.com" linkLabel="→ support@socialdevtechnologies.com" />
              <ReqRow icon="🖥️" title="Your Dashboard"
                desc="Sessions, guides, XP, and certificates all live here. Bookmark it."
                link="/dashboard" linkLabel="→ Go to your dashboard" />
            </Card>
            <Card title="Before you dive in — a quick checklist">
              <ul className="list-none">
                <CheckItem>Got my free Gemini API key from Google AI Studio</CheckItem>
                <CheckItem>Tested it with the prompt from the Setup section — it responded well</CheckItem>
                <CheckItem>Can log in to the Social Dev Technologies dashboard</CheckItem>
                <CheckItem>
                  <span>Joined the </span>
                  <a
                    href={COMMUNITY_WHATSAPP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-link font-bold hover:underline"
                  >
                    WhatsApp community group
                  </a>
                </CheckItem>
              </ul>
            </Card>
            <div className="flex items-center gap-3 bg-green/10 border border-green/30 rounded-2xl px-5 py-4 mt-2 font-bold text-green text-base">
              🎉 You're all set — go build your first agent whenever you're ready!
            </div>

            <div className="mt-5 bg-[#F8FAFD] dark:bg-[#131E2F] border border-brand/25 rounded-2xl p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-link mb-2">Session 1 Guide</div>
              <div className="font-display font-bold text-base text-ink mb-1.5">Ready to start building?</div>
              <p className="text-sm text-body leading-relaxed mb-4">
                Work through Session 1 at your own pace — build your portfolio, extract design DNA, create a reusable design skill, and publish live.
              </p>
              <Link
                to="/session/build-real-product"
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-[0_6px_16px_rgba(15,26,42,.35)]"
              >
                Build a real product, extract design DNA, build a reusable design skill and publish live →
              </Link>
            </div>
          </Section>

          {/* Next — straight into the real first session, same mechanism
              BuilderSession.jsx uses for every other Previous/Next hop. */}
          {firstAgent && (
            <div className="flex justify-end pt-6">
              <Link
                to={getBuilderPagePath(firstAgent)}
                className="flex items-center gap-2 bg-brand hover:bg-brand-deep text-white rounded-xl pl-4 pr-2.5 py-2.5 transition-colors"
              >
                <span className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-white/70">Start</span>
                  <span className="block text-sm font-bold">{firstAgent.title}</span>
                </span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
