import { ArrowRight, Check, Copy, Rocket } from 'lucide-react';

// Three drawn panels of one build (a prompt to copy, the terminal running it,
// the launched project), captioned on the page as an illustration rather than
// passed off as screenshots. Steps 1 and 3 keep the existing homepage lines
// about prompts and the write-up; step 2 is new copy the founder approved.
const STEPS = [
  {
    title: 'Copy the prompt',
    text: 'Every build ships a clear, step-by-step guide with ready-to-use prompts. No blank page, just follow along and build.',
  },
  {
    title: 'Execute',
    text: 'Paste it into your AI tool and run what it builds, following the guide step by step.',
  },
  {
    title: 'Launch',
    text: 'Each session ends with a write-up prompt: LinkedIn post, resume bullets, project blurb.',
  },
];

const PANEL = 'h-[200px] md:h-[244px] rounded-2xl';

function PromptPanel() {
  return (
    <div className={`${PANEL} bg-bg border border-border p-3.5 md:p-4 flex flex-col`}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-body">Prompt</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-yellow text-[#0F1A2A] text-[13px] font-bold px-3 py-1.5">
          <Copy className="w-4 h-4" /> Copy
        </span>
      </div>
      <div className="flex-1 mt-2.5 md:mt-3 rounded-[10px] border border-border bg-surface p-3 md:p-3.5 font-mono text-[13px] leading-[1.65] text-ink">
        Write a Python agent that reads my unread Gmail, labels each email by priority and drafts a reply.
      </div>
    </div>
  );
}

function TerminalPanel() {
  return (
    <div className={`${PANEL} bg-[#0F1A2A] dark:border dark:border-border overflow-hidden`}>
      <div className="flex items-center gap-1.5 px-3.5 md:px-4 py-3 border-b border-white/15">
        <span className="w-[9px] h-[9px] rounded-full bg-white/30" />
        <span className="w-[9px] h-[9px] rounded-full bg-white/30" />
        <span className="w-[9px] h-[9px] rounded-full bg-white/30" />
        <span className="ml-2 text-xs text-white/70">Terminal</span>
      </div>
      <div className="p-3.5 md:p-4 font-mono text-[13px] leading-[1.9] text-white/90">
        <div><span className="text-yellow">$</span> python triage_agent.py</div>
        <div className="text-white/70">Reading unread emails…</div>
        <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Labelled by priority</div>
        <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Drafted replies</div>
      </div>
    </div>
  );
}

function LaunchPanel() {
  return (
    <div className={`${PANEL} bg-bg border border-border p-3.5 md:p-4 flex flex-col gap-2.5 md:gap-3`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Rocket className="w-5 h-5 flex-shrink-0 text-link" />
          <span className="font-bold text-sm text-ink truncate">Gmail AI Triage Agent</span>
        </div>
        <span className="inline-flex items-center gap-1.5 flex-shrink-0 rounded-full border border-green/35 bg-green/10 px-2.5 py-0.5 text-xs font-bold text-link">
          <span className="w-1.5 h-1.5 rounded-full bg-green" /> Launched
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {['LinkedIn post', 'Resume bullets', 'Project blurb'].map((item) => (
          <div key={item} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 md:py-[9px] text-sm text-ink">
            <Check className="w-4 h-4 text-link" /> {item}
          </div>
        ))}
      </div>
    </div>
  );
}

const PANELS = [PromptPanel, TerminalPanel, LaunchPanel];

export default function HowGuidesWork({ buildCount }) {
  return (
    <>
      <div className="max-w-[640px] mb-8 md:mb-11">
        <h2 className="t-h2 text-ink">How AI Agent Guides work</h2>
        <p className="t-lead text-body mt-3.5">
          Each of the <span>{buildCount}</span> builds follows the same three steps.
        </p>
      </div>

      {/* The panels have a fixed height, so the captions line up across the row. */}
      <ol className="grid lg:grid-cols-3 gap-8 lg:gap-9 list-none p-0 m-0">
        {STEPS.map((step, i) => {
          const Panel = PANELS[i];
          return (
            <li key={step.title} className="relative min-w-0">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="hidden lg:flex absolute top-[108px] -left-8 z-[2] w-7 h-7 rounded-full bg-brand text-white items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
              <div aria-hidden="true">
                <Panel />
              </div>
              <div className="flex gap-3.5 md:gap-4 mt-4 md:mt-7">
                <div className="t-num w-9 h-9 md:w-10 md:h-10 rounded-[10px] md:rounded-xl bg-brand text-white text-base md:text-lg flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="t-h3 text-ink mb-1 md:mb-1.5">{step.title}</h3>
                  <p className="t-card text-body">{step.text}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-[13px] text-body">Illustration of one build.</p>
    </>
  );
}
