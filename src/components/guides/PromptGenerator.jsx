import { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';

// The interactive centerpiece of the brainstorming guide — five real
// techniques (not "give me ideas") combined with an audience frame and the
// user's own topic into a single ready-to-paste prompt. Pure client-side
// string composition, no API call: the whole point is a prompt the visitor
// pastes into their own Claude/ChatGPT conversation.

const CONTEXTS = [
  { id: 'business', label: 'Business & Innovation', frame: "You're acting as a blunt, experienced business strategy partner. Prioritize ideas that are actually achievable with limited time and budget, not just impressive-sounding ones." },
  { id: 'study', label: 'Study & Schoolwork', frame: "You're acting as a sharp, encouraging study partner. Explain any technical terms in plain language, and keep the tone like a study session, not a lecture." },
  { id: 'career', label: 'Career & Work', frame: "You're acting as a career coach who's seen a lot of career changes. Be honest, not just encouraging — call out ideas that sound good but wouldn't actually work." },
  { id: 'general', label: 'General / Creative', frame: "You're acting as a sharp creative thinking partner. Push past the obvious first answers." },
];

const TECHNIQUES = [
  {
    id: 'rapid',
    label: 'Rapid Idea List',
    blurb: 'Wide, fast, judge later — for when you have nothing yet.',
    needsCount: true,
    build: (topic, count) =>
      `Give me ${count} distinct ideas for: ${topic}\n\nRules:\n- One line per idea, no explanations yet\n- Order them from most conventional to most unconventional\n- Don't repeat variations of the same idea\n- Include at least 2 ideas that feel slightly uncomfortable or risky\n\nAfter the list, ask me which 2-3 to develop further.`,
  },
  {
    id: 'reverse',
    label: 'Reverse Brainstorm',
    blurb: 'List how it goes wrong, then flip each one into an idea.',
    build: (topic) =>
      `I want to brainstorm by working backwards on: ${topic}\n\nStep 1: List 8 realistic ways this could go wrong or get worse.\nStep 2: For each one, flip it into a concrete idea for what to do instead — not a vague opposite, an actual action.\nStep 3: Tell me which 2 of the flipped ideas are strongest and why.`,
  },
  {
    id: 'hats',
    label: 'Multiple Perspectives',
    blurb: 'Facts, optimism, criticism, and a wild card — kept separate.',
    build: (topic) =>
      `Help me think through this from multiple angles: ${topic}\n\nGo through each lens one at a time, 2-3 sentences each:\n1. Facts — what do we actually know, and what are we assuming?\n2. Optimistic case — what's the real upside if this works?\n3. Critical case — the strongest argument this fails, not a token objection\n4. Wild card — one unconventional angle nobody's mentioned\n5. Next step — the single smallest thing to do to learn more\n\nDon't blend the lenses together — keep them separate so I can see the tension between them.`,
  },
  {
    id: 'steelman',
    label: "Steelman vs. Devil's Advocate",
    blurb: 'Pressure-test one idea you already have, both directions.',
    build: (topic) =>
      `Here's an idea I have: ${topic}\n\nFirst, steelman it: make the strongest, most convincing case for why it would work — assume it succeeds and explain why.\nThen argue against it as hard as you genuinely can — the strongest case for why it fails. Don't soften this part.\nFinally, tell me: what would specifically need to be true for the "it works" case to hold? Be concrete, not motivational.`,
  },
  {
    id: 'constraint',
    label: 'Constraint-Forced Ideation',
    blurb: 'Fake limits (no budget, 48 hours) to force genuinely new angles.',
    build: (topic) =>
      `I want ideas for: ${topic}\n\nInstead of open-ended brainstorming, force creativity with constraints. Give me 2 ideas under each of these limits:\n- If I had zero budget\n- If I had to ship something in 48 hours\n- If I couldn't use the obvious tool or platform for this\n\nThen tell me which single idea, across all of them, is worth actually trying first.`,
  },
];

const DEFAULT_TOPIC = 'a way to get more customers to reply to our WhatsApp messages';

export default function PromptGenerator() {
  const [contextId, setContextId] = useState('business');
  const [techniqueId, setTechniqueId] = useState('rapid');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(8);
  const [copied, setCopied] = useState(false);

  const context = CONTEXTS.find((c) => c.id === contextId);
  const technique = TECHNIQUES.find((t) => t.id === techniqueId);
  const effectiveTopic = topic.trim() || DEFAULT_TOPIC;
  const prompt = `${context.frame}\n\n${technique.build(effectiveTopic, count)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <div className="rounded-2xl border-[1.5px] border-brand/30 bg-[#F8FAFD] dark:bg-brand/10 p-5 sm:p-6 my-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-link flex-shrink-0" />
        <h3 className="font-display font-bold text-[15px] text-ink">Brainstorming prompt generator</h3>
      </div>

      <label className="block text-[12.5px] font-bold text-body-strong mb-1.5">What are you trying to figure out?</label>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder={DEFAULT_TOPIC}
        className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40 mb-4"
      />

      <label className="block text-[12.5px] font-bold text-body-strong mb-1.5">Who's this for?</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {CONTEXTS.map((c) => (
          <button
            key={c.id}
            onClick={() => setContextId(c.id)}
            className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              contextId === c.id
                ? 'bg-brand text-white border-brand'
                : 'bg-white dark:bg-[#0C1420] text-body-strong border-border hover:border-brand/40'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <label className="block text-[12.5px] font-bold text-body-strong mb-1.5">Technique</label>
      <div className="flex flex-col gap-1.5 mb-4">
        {TECHNIQUES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTechniqueId(t.id)}
            className={`text-left px-3.5 py-2.5 rounded-xl border transition-colors ${
              techniqueId === t.id
                ? 'bg-white dark:bg-[#131E2F] border-brand'
                : 'bg-white/60 dark:bg-white/[0.03] border-border-soft hover:border-brand/40'
            }`}
          >
            <span className="block text-[13.5px] font-bold text-ink">{t.label}</span>
            <span className="block text-[12px] text-body mt-0.5">{t.blurb}</span>
          </button>
        ))}
      </div>

      {technique.needsCount && (
        <>
          <label className="block text-[12.5px] font-bold text-body-strong mb-1.5">How many ideas?</label>
          <div className="flex gap-2 mb-4">
            {[5, 8, 12].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`text-[12.5px] font-semibold w-12 py-1.5 rounded-lg border transition-colors ${
                  count === n
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-[#0C1420] text-body-strong border-border hover:border-brand/40'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="rounded-lg border border-brand/25 bg-white dark:bg-[#0C1420] overflow-hidden mt-2">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-brand/15 bg-brand/[0.06] dark:bg-brand/[0.1]">
          <span className="text-[11px] font-bold uppercase tracking-wide text-link">Your prompt</span>
          <button
            onClick={copy}
            className="flex items-center gap-1 text-xs font-semibold text-link hover:text-brand-deep transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="px-3.5 py-3 text-[13px] text-body-strong leading-relaxed whitespace-pre-wrap font-mono">{prompt}</p>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        Paste this into Claude, ChatGPT, or any AI chat — not a specific tool, just a well-structured starting message.
      </p>
    </div>
  );
}
