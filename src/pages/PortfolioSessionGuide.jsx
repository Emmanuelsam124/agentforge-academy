import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Copy, Check, ChevronDown, ExternalLink } from 'lucide-react';

const STEPS = [
  { eyebrow: 'Intro', label: 'Session Intro', time: '11 min' },
  { eyebrow: 'Build 1', label: 'Vibe-Code Portfolio', time: '15 min' },
  { eyebrow: 'Build 2', label: 'Extract Design DNA', time: '15 min' },
  { eyebrow: 'Build 3', label: 'Build Design Skill', time: '15 min' },
  { eyebrow: 'Build 4', label: 'Publish Portfolio', time: '20 min' },
  { eyebrow: 'Share', label: 'Share What You Built', time: '5 min' },
];

const HEADINGS = [
  'Level 1 · Session 1 — Build a real product with world-class design',
  'Build 1 — Vibe-code your AI portfolio',
  'Build 2 — Extract design DNA from an inspiration website',
  'Build 3 — Convert design DNA to an AI skill',
  'Build 4 — Design and publish your custom portfolio',
  'Share what you built',
];

const SUBTITLES = [
  'Vibe code your portfolio, extract design DNA, build a reusable design skill, and publish live. 90 min total · 4 builds · Sonnet 4.5',
  "We'll start by designing a portfolio website with AI in one prompt. Claude will interview you to get all the info needed to build a personalized portfolio.",
  'This build pulls out the exact colors, fonts, and layout rules from an inspiration website, so you can apply them to anything you build with AI.',
  'Now save that design document as a reusable skill. Then, with one slash command you can apply your style to anything you build from here on.',
  "You've got a portfolio scaffold and a design skill. Now put them together: style the portfolio, fill in your first two project cards, and publish it live.",
  'Drop your link or a screenshot of your published portfolio in the cohort WhatsApp channel.',
];

// ─── Shared UI components ────────────────────────────────────────────────────

function Callout({ type = 'info', icon, children }) {
  const styles = {
    info:    'bg-brand/10 border-l-4 border-brand',
    warn:    'bg-amber/10 border-l-4 border-amber',
    success: 'bg-green/10 border-l-4 border-green',
    tip:     'bg-[#E8EDF3] dark:bg-brand/10 border-l-4 border-brand',
  };
  return (
    <div className={`flex gap-3 rounded-xl p-4 mb-4 ${styles[type]}`}>
      <span className="text-xl leading-snug flex-shrink-0">{icon}</span>
      <div className="text-sm text-ink leading-relaxed">{children}</div>
    </div>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-bg border border-border rounded-2xl p-5 mb-4 ${className}`}>
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
    <details className="border border-border rounded-xl mb-2 overflow-hidden">
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
    navigator.clipboard.writeText(typeof children === 'string' ? children.trim() : children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="relative bg-ink dark:bg-[#0C1420] rounded-xl p-4 my-4 font-mono text-[12.5px] text-[#E7E5E4] leading-relaxed whitespace-pre-wrap overflow-x-auto">
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

function StepItem({ num, children }) {
  return (
    <div className="flex gap-3 text-sm text-ink leading-relaxed mb-4">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-ink text-bg flex items-center justify-center text-[11px] font-bold mt-0.5">{num}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function GoFurther({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-dashed border-brand/40 rounded-2xl mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-5 py-3.5 text-left"
      >
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-link mr-2">Go further</span>
          <span className="text-sm font-semibold text-ink">{label}</span>
          <span className="ml-2 text-body text-xs">🛠️🛠️🛠️</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-link flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 text-sm text-body leading-relaxed">{children}</div>}
    </div>
  );
}

function ConceptBox({ title, children }) {
  return (
    <div className="bg-[#F8FAFD] dark:bg-[#131E2F] border border-brand/20 rounded-2xl p-5 mb-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-link mb-2">Concept</div>
      <div className="font-bold text-sm text-ink mb-2">{title}</div>
      <div className="text-sm text-body leading-relaxed">{children}</div>
    </div>
  );
}

function BuildBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-brand/10 text-link text-[11px] font-bold px-2.5 py-1 rounded-full mr-2">{children}</span>
  );
}

function OutcomeList({ items }) {
  return (
    <ul className="space-y-2 mb-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
          <span className="text-green font-bold flex-shrink-0 mt-0.5">✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function ModelTable() {
  const rows = [
    ['Claude Sonnet 4.5', 'Everyday tasks, balanced use', 'Fast', '$$'],
    ['Claude Haiku 4.5', 'Quick, lightweight tasks', 'Fastest', '$'],
    ['Claude Opus 4', 'Complex reasoning, hard problems', 'Moderate', '$$$'],
    ['Claude Opus 4.5 / 5', 'Frontier tasks (if available)', 'Slower', '$$$$'],
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-border mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-border-soft">
            {['Model', 'Best for', 'Speed', 'Cost'].map((h) => (
              <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-body px-4 py-2.5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([model, best, speed, cost], i) => (
            <tr key={i} className={`border-t border-border ${i === 0 ? 'bg-brand/5' : ''}`}>
              <td className="px-4 py-2.5 font-mono text-xs text-ink font-semibold">{model}</td>
              <td className="px-4 py-2.5 text-body text-xs">{best}</td>
              <td className="px-4 py-2.5 text-body text-xs">{speed}</td>
              <td className="px-4 py-2.5 text-body text-xs">{cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompareTable() {
  const cols = ['Claude Chat', 'Claude Cowork', 'Claude Code'];
  const rows = [
    ['Interface', 'Web or desktop', 'Desktop app only', 'Terminal, desktop, or web'],
    ['Access', 'Free or paid', 'Paid plan required', 'Free or paid'],
    ['What it does', 'Conversation, research, writing, artifacts', 'Extended tasks on your local files and folders', 'Coding agent, multi-file edits, deploys'],
    ['Best for', 'Quick tasks, brainstorming', 'Document processing, file work, building visuals', 'Building and shipping code, scripting, git workflows'],
    ['File creation', 'Artifacts inside chat', 'Real files saved to your folders', 'Real files saved to your folders'],
    ['Scheduled tasks', '✗', '✓', '✓'],
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-border mb-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-border-soft">
            <th className="text-left text-[10px] font-bold uppercase tracking-widest text-body px-3 py-2.5 w-28"></th>
            {cols.map((c) => (
              <th key={c} className={`text-left text-[10px] font-bold uppercase tracking-widest px-3 py-2.5 ${c === 'Claude Cowork' ? 'text-link' : 'text-body'}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, ...vals], i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-3 py-2.5 font-bold text-body text-[10px] uppercase tracking-widest">{label}</td>
              {vals.map((v, j) => (
                <td key={j} className={`px-3 py-2.5 leading-snug ${j === 1 ? 'text-ink font-medium' : 'text-body'}`}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Panel content ────────────────────────────────────────────────────────────

const PANELS = [

  // 0 — Intro
  <>
    <Card title="By the end of this session">
      <OutcomeList items={[
        'A portfolio website scaffolded with your real content',
        'Design DNA extracted from a site you love',
        'A reusable design system AI skill',
        'A fully styled, published portfolio website live at a shareable URL',
      ]} />
    </Card>

    <div className="font-display font-bold text-base text-ink mb-3 mt-6">What you need for this session</div>
    <p className="text-sm text-body leading-relaxed mb-3">
      AI tools run best when your computer isn't competing with a dozen other apps for memory and processing power. A slow computer means slow AI responses, laggy interfaces, and frustrating wait times.
    </p>
    <ul className="list-none mb-6">
      <CheckItem>Close everything you don't need: other browser tabs, background apps, open files.</CheckItem>
      <CheckItem>Join the AI Builder WhatsApp community and open the app.</CheckItem>
      <CheckItem>Open Claude and make sure you're on the Pro plan.</CheckItem>
    </ul>

    <div className="font-display font-bold text-base text-ink mb-3">Become a Builder</div>
    <p className="text-sm text-body leading-relaxed mb-4">
      The express goal of this program is to change who you are: to help you become a builder. For most of our careers, we've been generating output — communication, slides, spreadsheets, documents, code, graphics, design. But after recent advances in AI, we can now build systems that generate output for us, and we can ship real software products without the skill and effort barriers that used to exist.
    </p>
    <p className="text-sm text-body leading-relaxed mb-4">
      A few things that builders do:
    </p>
    <ul className="space-y-2 mb-6">
      {[
        'Quickly identify specific opportunities in their roles where they can build, and take initiative to dive in right away',
        'Spend time building in their workdays and evenings, going further with the concepts and skills from sessions',
        'Share AI learnings, AI tips, AI news, and AI assets with others in the program, their companies, and their networks',
      ].map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-body">
          <span className="text-link font-bold flex-shrink-0 mt-0.5">→</span>
          {item}
        </li>
      ))}
    </ul>

    <div className="font-display font-bold text-base text-ink mb-3">How to learn in this program</div>
    <div className="space-y-2.5 mb-6">
      {[
        ['Build live with us', 'Do the full builds during the session, ask questions in chat, and learn from other students\' edges as they hit them.'],
        ['Watch + build after', 'Watch the demos, try what you can live, then finish the builds on your own time.'],
        ['Build ahead', 'Work through the session guide before the live session so you can focus on instruction and ask questions during class.'],
      ].map(([title, desc]) => (
        <div key={title} className="bg-bg border border-border rounded-xl p-4">
          <div className="font-bold text-sm text-ink mb-1">{title}</div>
          <div className="text-xs text-body leading-relaxed">{desc}</div>
        </div>
      ))}
    </div>

    <div className="font-display font-bold text-base text-ink mb-3">Program Overview</div>
    <p className="text-sm text-body leading-relaxed mb-3">By the end of Level 1, you'll have:</p>
    <OutcomeList items={[
      'A live, published AI portfolio website styled after a site you love',
      'A reusable design system AI skill',
      'An AI voice guide skill that writes in your style',
      'A scheduled email manager that handles your inbox',
      'A research presentation built entirely with AI',
      'A complete AI system you ship and demo at Demo Day',
    ]} />

    <div className="font-display font-bold text-base text-ink mb-3 mt-2">Opening Concepts</div>

    <ConceptBox title="Comparing AI ecosystems">
      <p className="mb-3">Every major AI lab now offers roughly the same suite of features: a chat app, a coding/agent tool, skills, and support for tool connectors. The three ecosystems you'll hear about most:</p>
      <div className="space-y-3">
        <div>
          <span className="font-bold text-ink">OpenAI: ChatGPT + Codex</span>
          <p className="mt-0.5">Built for handing off tasks to run in the background, especially coding. Strongest for developers and engineering-centric workflows.</p>
        </div>
        <div>
          <span className="font-bold text-ink">Google: Gemini + Gemini CLI</span>
          <p className="mt-0.5">Gemini's superpower is native Google Workspace integration. If your life lives in Gmail and Google Docs, Gemini will feel native. It can also hold more information in a single conversation than the others.</p>
        </div>
        <div>
          <span className="font-bold text-ink">Anthropic: Claude</span>
          <p className="mt-0.5">What this program is built around. Anthropic offers the widest spectrum of surfaces: Claude Chat for thinking, Cowork for extended knowledge work, Claude Code for maximum-control agent building.</p>
        </div>
      </div>
    </ConceptBox>

    <ConceptBox title="Claude Chat vs Cowork vs Code">
      <CompareTable />
      <p className="text-xs leading-relaxed">Today we use Claude directly. Use Chat for thinking and quick questions. Use Cowork for doing. Use Code for building and shipping with code.</p>
    </ConceptBox>

    <ConceptBox title="Tokens, context windows, and sessions">
      <div className="space-y-3 mb-3">
        {[
          ['Tokens', 'The basic units AI reads and writes, roughly a word or part of a word. Every model has a limit on how many tokens it can handle at once.'],
          ['Context window', "Everything the AI can see at one time: your instructions, the conversation so far, any files you shared, and its own responses. When the window fills up, older content drops out."],
          ['Session', 'One continuous conversation. Start a new session and the AI starts fresh. Stay in the same session and it remembers everything you\'ve shared.'],
        ].map(([term, def]) => (
          <div key={term}>
            <span className="font-bold text-ink"><span>{term}</span> — </span>
            <span>{def}</span>
          </div>
        ))}
      </div>
      <p className="mb-3">A model is a specific trained version of an AI system — same underlying technology, tuned for different trade-offs between capability, speed, and cost. Think of it like engines in a car: same body, different power.</p>
      <ModelTable />
      <p className="text-xs leading-relaxed">Sonnet 4.5 is the default for this program. We'll call out when a specific task warrants Haiku (fast, cheap) or Opus (genuinely hard problems). Model names update frequently — if you don't see these exact names, pick the equivalent tier.</p>
    </ConceptBox>
  </>,

  // 1 — Build 1
  <>
    <div className="flex items-center gap-2 mb-4">
      <BuildBadge>15 min</BuildBadge>
      <BuildBadge>Model · Sonnet 4.5</BuildBadge>
    </div>

    <ConceptBox title="What is Vibe-Coding?">
      <p className="mb-2">Vibe coding is building real software by describing what you want in plain language, without writing a single line of code yourself.</p>
      <p className="mb-2">For most of history, building software required learning to speak the machine's language. With AI, the machine speaks your language. This changes who gets to build things — a marketer can make a tool, a founder can ship a prototype, a coach can build a client portal.</p>
      <p className="mb-2">The limitation: AI output is only as good as the context you give it. Generic prompt → generic output.</p>
      <p className="mb-3">Vibe coding works best when you:</p>
      <ul className="space-y-1.5">
        {[
          'Start with a clear description of what you want and why',
          'Iterate in plain language ("make the header bigger", "add a contact section")',
          'Think in outcomes, not instructions',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className="text-link font-bold flex-shrink-0">·</span>
            {item}
          </li>
        ))}
      </ul>
    </ConceptBox>

    <StepItem num={1}>
      Open Claude (chat.claude.ai or the desktop app). Make sure you're logged in with your Pro account.
    </StepItem>

    <StepItem num={2}>
      <div>
        Select the <strong>Sonnet 4.5</strong> model, paste the prompt below into a new conversation, and hit enter. Claude will interview you for your name, title, and work — answer as much as you can.
        <div className="text-[10px] font-bold uppercase tracking-widest text-body mb-1 mt-4">Prompt</div>
        <Snippet>{`Build me a simple portfolio website as a single HTML page. Interview me about any info you don't have. Google Fonts are the only allowed external resource. Output as a complete, self-contained HTML file.

Sections:

Hero: "AI Builder Portfolio" with my name and title below
About: 2-3 sentences, conversational, written like you're talking to a friend
Work: 2-3 of my current focus areas or projects, each with a title and 1-2 sentence description
AI Projects: A grid of cards that each follow the same structure: project title, one-line description, a "How I Built This" link, and a "Documentation" link. Both links should open a popup, but leave all popups empty for now. Pre-fill the grid with these cards, all labeled "Coming Soon": Design System Skill, Portfolio Website, Voice Guide Skill, Email Manager Scheduled Task, Research Presentation, Spreadsheet Analysis, Data Dashboard, File Organization Process, Custom Workflow. Add 2-3 extra blank placeholder cards for future projects.
Contact: Simple, clean footer with contact info`}</Snippet>
        <p className="text-xs text-body mt-2 leading-relaxed">
          <strong className="text-ink">How this prompt works:</strong> The prompt hands Claude the full structure upfront so it builds the right skeleton on the first try, then delegates content-gathering to an interview. Pre-filling the AI Projects grid with "Coming Soon" cards means you won't need to add them manually as the program goes on.
        </p>
      </div>
    </StepItem>

    <Faq q="Claude is asking too many questions before building?">
      Add this to the end of your prompt: <em>"If you don't have the info you need, make your best guess and note what you assumed — I'll correct you."</em>
    </Faq>

    <Callout type="tip" icon="🎙️">
      <strong>Voice mode tip:</strong> When Claude interviews you for your bio and work, try answering out loud instead of typing. Claude has a built-in voice mode — click the microphone icon in the input box.
    </Callout>

    <StepItem num={3}>
      Once Claude outputs the HTML, copy the entire code, save it as <code className="bg-border-soft px-1 py-0.5 rounded text-link text-xs">portfolio.html</code> on your computer, and open it in Chrome to preview your site.
    </StepItem>

    <GoFurther label="Add an animated background to your portfolio">
      <p className="mb-3">Open a new Claude conversation, select Sonnet 4.5, and paste the prompt below. After it's built, replace the &lt;body&gt; section of your portfolio HTML with the animation code.</p>
      <Snippet>{`I want to add an animated background to my existing portfolio HTML file. Before you build anything, ask me 3-4 short questions to understand how I want it to look and feel - the mood, the movement style, the color palette, and how subtle or bold it should be.

Once I've answered, build the animation and embed it directly in my portfolio as a position: fixed layer behind all my content (z-index: -1). Use only CSS keyframes and vanilla JS - no external libraries.`}</Snippet>
    </GoFurther>

    <div className="mt-2 border border-green/30 bg-green/5 rounded-2xl px-5 py-4 flex items-center gap-3">
      <span className="text-2xl">🏗️</span>
      <div>
        <div className="font-bold text-sm text-ink">Build 1 complete</div>
        <div className="text-xs text-body">Portfolio website scaffolded with your real content</div>
      </div>
    </div>
  </>,

  // 2 — Build 2
  <>
    <div className="flex items-center gap-2 mb-4">
      <BuildBadge>15 min</BuildBadge>
      <BuildBadge>Model · Sonnet 4.5</BuildBadge>
    </div>

    <ConceptBox title="What is Claude in Chrome?">
      <p>Claude in Chrome is a browser extension by Anthropic that lets you open a Claude chat panel while viewing any webpage. It can read the page you're on, analyze visuals, and return structured output — all without leaving your browser.</p>
    </ConceptBox>

    <StepItem num={1}>
      If you don't have Chrome, download it at <a href="https://google.com/chrome" target="_blank" rel="noreferrer" className="text-link font-semibold">google.com/chrome</a> and run the installer.
    </StepItem>

    <StepItem num={2}>
      Open Chrome and go to the<span> </span>
      <a href="https://chromewebstore.google.com/publisher/anthropic" target="_blank" rel="noreferrer" className="text-link font-semibold inline-flex items-center gap-1">Claude in Chrome extension <ExternalLink className="w-3 h-3" /></a>.
      Click <strong>Add to Chrome</strong> then <strong>Add extension</strong>.
    </StepItem>

    <StepItem num={3}>
      Click the puzzle piece icon in your Chrome toolbar, then click the <strong>pin icon</strong> next to Claude so it stays visible.
    </StepItem>

    <StepItem num={4}>
      Click the Claude icon and sign in with your Anthropic account — same login as claude.ai.
    </StepItem>

    <StepItem num={5}>
      Navigate to your design inspiration website. If you want branded output, use your company's website. Otherwise, use any site whose visual style you love.
    </StepItem>

    <StepItem num={6}>
      <div>
        Click the Claude icon in your toolbar to open the chat panel. Select the <strong>Sonnet 4.5</strong> model in the top left, then paste this prompt:
        <div className="text-[10px] font-bold uppercase tracking-widest text-body mb-1 mt-4">Prompt</div>
        <Snippet>{`I'm going to build a portfolio website and I want it to feel like this site. Analyze this page and extract my design system: primary and accent colors (with hex codes if possible), typography style and feel, layout approach, and 5 words that capture the overall vibe. Format this as a structured design system that I can then take and paste back into Claude to create a design skill.`}</Snippet>
        <p className="text-xs text-body mt-2 leading-relaxed">
          <strong className="text-ink">How this prompt works:</strong> Asking for a "structured design system document" rather than just impressions means you get something formatted to paste directly into a future prompt. Requesting hex codes and vibe words forces specificity so you get values you can actually reuse, not just descriptions.
        </p>
      </div>
    </StepItem>

    <StepItem num={7}>
      If it asks you to <strong>Allow a request</strong>, click <strong>Always Allow</strong>. Don't scroll or click outside the Claude panel while it's working.
    </StepItem>

    <Faq q="Extension shows an error or blank panel?">
      Most common cause: you're not signed into Claude in Chrome with the same account as your claude.ai. Click the Claude icon, sign out, and sign back in with your claude.ai email.
    </Faq>

    <Faq q="Can't get the extension installed?">
      If the extension isn't authorized by your organization or you don't have Chrome, paste the same prompt with a link to the website or screenshots directly in Claude — it can pull design insights from there too.
    </Faq>

    <GoFurther label="Use your actual company branding">
      <p className="mb-3">Instead of a random inspiration site, extract a real brand design system from your company's website. Navigate to your company's homepage in Chrome, open the Claude in Chrome extension with Sonnet 4.5, and use the prompt below.</p>
      <Snippet>{`I work at [your company name]. Analyze this page and extract our official design system:
- Primary and accent colors with exact hex codes
- Typography: font families, weights, and sizes used
- Layout approach, visual rhythm, and spacing conventions
- Logo placement and usage style
- 5 words that capture our overall brand vibe

Format this as a structured design system document I can paste into future prompts. Be specific with hex codes - I'll use these values to style everything I build at work.`}</Snippet>
    </GoFurther>

    <div className="mt-2 border border-green/30 bg-green/5 rounded-2xl px-5 py-4 flex items-center gap-3">
      <span className="text-2xl">🎨</span>
      <div>
        <div className="font-bold text-sm text-ink">Build 2 complete</div>
        <div className="text-xs text-body">Design DNA extracted from a site you love</div>
      </div>
    </div>
  </>,

  // 3 — Build 3
  <>
    <div className="flex items-center gap-2 mb-4">
      <BuildBadge>15 min</BuildBadge>
      <BuildBadge>Model · Sonnet 4.5</BuildBadge>
    </div>

    <ConceptBox title="What is an AI skill?">
      <p className="mb-2">An AI skill is a set of instructions that tells AI how to do a specific task.</p>
      <p className="mb-2">Without a skill, every conversation starts from zero — you have to explain your preferences, standards, and processes over and over. A skill is stored in a <code className="bg-border-soft px-1 rounded text-link text-xs">.md</code> file and called with a slash command like <code className="bg-border-soft px-1 rounded text-link text-xs">/google-design</code>.</p>
      <p className="mb-3">A skill typically includes:</p>
      <ul className="space-y-1.5">
        {[
          'A short description of what it\'s for',
          'Your preferences and context',
          'The steps in your process',
          'A few examples of good output',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className="text-link font-bold flex-shrink-0">·</span>
            {item}
          </li>
        ))}
      </ul>
    </ConceptBox>

    <StepItem num={1}>
      Copy the full design documentation you received in Build 2.
    </StepItem>

    <StepItem num={2}>
      <div>
        Open a new Claude conversation with <strong>Sonnet 4.5</strong> selected. Paste your design documentation, then add this prompt — replace the brackets with your desired site name:
        <div className="text-[10px] font-bold uppercase tracking-widest text-body mb-1 mt-4">Prompt</div>
        <Snippet>{`Turn this design system into a reusable AI skill I can call from any conversation.

Save the skill as a markdown file called [site-name]-design.md (e.g. google-design.md). Structure it with:
- A brief description of what the skill does
- The complete color palette with hex codes and usage notes
- Typography specs (font family, weights, sizes)
- Layout principles and spacing rules
- The 5 vibe words as design intent
- A short example of how to apply this design system in a prompt

Format the file so I can paste it directly into any future prompt with /[site-name]-design and have Claude apply the full design system.`}</Snippet>
        <p className="text-xs text-body mt-2 leading-relaxed">
          <strong className="text-ink">How this prompt works:</strong> Defining your style once and calling it with one command means you never have to paste the same design brief twice. Every build from here matches your style automatically.
        </p>
      </div>
    </StepItem>

    <StepItem num={3}>
      Once Claude outputs the skill file, save it as <code className="bg-border-soft px-1 py-0.5 rounded text-link text-xs">[site-name]-design.md</code> in your <code className="bg-border-soft px-1 py-0.5 rounded text-link text-xs">ai-builder</code> folder. In future prompts, paste its contents at the top and Claude will apply the full design system.
    </StepItem>

    <Faq q="How do I use the skill in future builds?">
      At the start of any build prompt, paste the contents of your design skill file before your main instructions. Claude will read it and apply your full design system before writing any code.
    </Faq>

    <GoFurther label="Create a skill variation for a specific output type">
      <p className="mb-3">Your design skill works for portfolios, but the same visual system can power any output. Pick one output type — one-pagers, slide decks, email templates, or landing pages — and spin up a specialized version.</p>
      <Snippet>{`I have a design skill called [your-style]-design. I want to create a specialized version of it for [your chosen output type — e.g. slide decks, one-pagers, email templates].

Create a new variation called [style]-[output-type].md (for example: google-slides.md or google-onepager.md). This variation should:

- Inherit all the core visual identity from my existing skill (colors, typography, vibe words)
- Add specific rules for [output type]: typical layout conventions, which sections to always include, what to leave out, and any format-specific best practices
- Include 2-3 example structures or layout patterns I can follow

Save the output as a complete markdown file I can paste at the top of any [output type] prompt.`}</Snippet>
    </GoFurther>

    <div className="mt-2 border border-green/30 bg-green/5 rounded-2xl px-5 py-4 flex items-center gap-3">
      <span className="text-2xl">⚡</span>
      <div>
        <div className="font-bold text-sm text-ink">Build 3 complete</div>
        <div className="text-xs text-body">Reusable design system AI skill created</div>
      </div>
    </div>
  </>,

  // 4 — Build 4
  <>
    <div className="flex items-center gap-2 mb-4">
      <BuildBadge>20 min</BuildBadge>
      <BuildBadge>Model · Sonnet 4.5</BuildBadge>
    </div>

    <StepItem num={1}>
      <div>
        Open a new Claude conversation with <strong>Sonnet 4.5</strong>. Paste your full design skill at the top of the message, then add the prompt below — replacing the brackets with your skill name:
        <div className="text-[10px] font-bold uppercase tracking-widest text-body mb-1 mt-4">Prompt</div>
        <Snippet>{`[Paste your full design skill here]

---

Using the design system above, restyle my portfolio website. Interview me about any info you don't have. Google Fonts are the only allowed external resource.

Then build out these two AI Project cards:

Card 1 - "Design System Skill":
"How I Built This" popup: A visual step-by-step: 1. Found an inspiration website 2. Used Claude in Chrome to extract the design DNA 3. Turned it into a reusable skill 4. Now it works everywhere - paste the skill at the top of any build prompt and everything matches my style
"Documentation" popup: Display everything from my design skill on one popup - color swatches with hex codes and usage notes, typography samples with specs, layout principles, and my vibe words as styled tags. Style this popup using the design system itself so it's a live example of what it documents.

Card 2 - "Portfolio Website":
"How I Built This" popup: A visual step-by-step showing how this site was built: 1. Started with a scaffolded HTML page 2. Applied my design system to style it 3. Claude interviewed me to fill in real content 4. Built out project cards as I completed each session
"Documentation" popup: Two sections: key techniques used, and key prompts for building your own portfolio with a design skill.

Keep all other cards as "Coming Soon" with empty popups. Output as a complete, updated, self-contained HTML file.`}</Snippet>
        <p className="text-xs text-body mt-2 leading-relaxed">
          <strong className="text-ink">How this prompt works:</strong> Pasting your full design skill before the instructions ensures Claude reads your complete style spec before writing any CSS. Building both project cards in one prompt prevents visual inconsistencies.
        </p>
      </div>
    </StepItem>

    <StepItem num={2}>
      Save the updated HTML file, open it in Chrome, and review your styled portfolio.
    </StepItem>

    <StepItem num={3}>
      <div>
        Refine with follow-up prompts. Try things like:
        <ul className="mt-2 space-y-1.5">
          {[
            '"Make the hero section feel more [adjective from your vibe words]"',
            '"The about section is too formal. Rewrite it in a more conversational tone."',
            '"Change the primary color to [hex from your design system]"',
            '"Add a subtle fade-in animation to the hero section"',
          ].map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-body">
              <span className="text-link font-bold flex-shrink-0">·</span>
              <span className="italic">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </StepItem>

    <StepItem num={4}>
      When you're happy with your portfolio, you need to publish it. Go to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-link font-semibold">vercel.com</a> or <a href="https://tiiny.host" target="_blank" rel="noreferrer" className="text-link font-semibold">tiiny.host</a> and create a free account.
    </StepItem>

    <StepItem num={5}>
      On Tiiny Host: drag and drop your <code className="bg-border-soft px-1 py-0.5 rounded text-link text-xs">portfolio.html</code> file → choose a subdomain → click <strong>Upload</strong>. Your site will be live at <code className="text-link text-xs">yourname.tiiny.site</code> within seconds.
    </StepItem>

    <StepItem num={6}>
      Copy your shareable link and paste it into the WhatsApp cohort channel. Save it somewhere safe — you'll use it throughout the program.
    </StepItem>

    <GoFurther label="Add extra portfolio sections">
      <p className="mb-3">Make your portfolio tell a fuller story. Pick 2–3 sections: Career Timeline, Skills and Tools, What I'm Learning, Recommendations, or Certifications.</p>
      <Snippet>{`Open my portfolio HTML file and add the following new sections. Follow my design skill so everything stays visually consistent. Each new section should be responsive, match the existing layout style, and not break anything.

Here are the sections to add:

1. [Section name]: [Describe what it should contain and how it should feel]
2. [Section name]: [Describe what it should contain and how it should feel]
3. [Section name]: [Describe what it should contain and how it should feel]

After adding the sections, fix any spacing, alignment, or visual inconsistencies you notice.`}</Snippet>
    </GoFurther>

    <div className="mt-2 border border-green/30 bg-green/5 rounded-2xl px-5 py-4 flex items-center gap-3">
      <span className="text-2xl">🚀</span>
      <div>
        <div className="font-bold text-sm text-ink">Build 4 complete</div>
        <div className="text-xs text-body">Styled portfolio live at a shareable URL</div>
      </div>
    </div>
  </>,

  // 5 — Share
  <>
    <Card title="Share what you built">
      <p className="text-sm text-body leading-relaxed mb-4">
        Drop your published portfolio link or a screenshot in the cohort WhatsApp channel. Share on LinkedIn, X, and any other platform — tag <strong>@socialdevtechnologies</strong> so we can amplify you.
      </p>
      <ul className="list-none">
        <CheckItem>Shared portfolio link in the WhatsApp cohort channel</CheckItem>
        <CheckItem>Posted on LinkedIn with a note on what you built</CheckItem>
        <CheckItem>Portfolio URL saved somewhere I can find it</CheckItem>
      </ul>
    </Card>

    <Card title="AI Credit Giveaways">
      <div className="space-y-3">
        <div className="bg-amber/10 border border-amber/30 rounded-xl p-4">
          <div className="font-bold text-sm text-ink mb-1">🏆 ₦1,000 data — Best-Designed Portfolio</div>
          <div className="text-xs text-body leading-relaxed">Share your published portfolio URL in the cohort WhatsApp channel. Winner announced at the start of the next session.</div>
        </div>
        <div className="bg-brand/10 border border-brand/30 rounded-xl p-4">
          <div className="font-bold text-sm text-ink mb-1">🎯 ₦2,000 data — Best Use of Design System Outside This Session</div>
          <div className="text-xs text-body leading-relaxed">Apply your design skill to something outside this session — a presentation, a tool, a report — and share a screenshot in the WhatsApp channel before the next live session begins.</div>
        </div>
      </div>
    </Card>

    <Card title="What you built today">
      <OutcomeList items={[
        'A portfolio website scaffolded with your real content',
        'Design DNA extracted from a site you love, using Claude in Chrome',
        'A reusable design system AI skill',
        'A fully styled, published portfolio live at a shareable URL',
      ]} />
    </Card>

    <Callout type="success" icon="🎉">
      <strong>Session complete — nice work.</strong> In Session 2, you'll build an AI voice guide skill that writes in your style and a scheduled email manager that handles your inbox automatically.
    </Callout>
  </>,
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioSessionGuide() {
  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState(new Set());

  useEffect(() => {
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    document.title = 'Build a Real Product with World-Class Design — Social Dev Technologies';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Vibe code an AI portfolio, extract design DNA from a site you admire, turn it into a reusable design skill, and publish live — a hands-on 90-minute session.'
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
    canonicalEl.setAttribute('href', 'https://socialdevtechnologies.com/session/build-real-product');

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
      if (hadCanonical && prevCanonical) canonicalEl.setAttribute('href', prevCanonical);
      else canonicalEl.remove();
    };
  }, []);

  const goTo = (n) => {
    if (n === current) return;
    setCompleted(prev => {
      const next = new Set(prev);
      if (n > current) next.add(current);
      return next;
    });
    setCurrent(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => { if (current < STEPS.length - 1) goTo(current + 1); };
  const pct = Math.round(((current + 1) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-bg">
      {/* Top progress bar */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-border flex items-center gap-3 px-4 sm:px-6 h-12">
        <Link to="/builder-1-guide" className="text-xs text-body hover:text-ink transition-colors flex-shrink-0">← Getting Started</Link>
        <div className="flex-1 h-1.5 bg-border-soft rounded-full overflow-hidden">
          <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-body flex-shrink-0 font-medium tabular-nums">
          <span>{current < STEPS.length - 1 ? `${STEPS[current].time}` : 'Done'}</span> · <span>{current + 1}</span>/<span>{STEPS.length}</span>
        </span>
        <button
          onClick={next}
          disabled={current === STEPS.length - 1}
          className="flex-shrink-0 text-xs font-bold bg-brand hover:bg-brand-deep disabled:opacity-40 disabled:cursor-not-allowed text-white px-3.5 py-1.5 rounded-lg transition-colors"
        >
          {current === STEPS.length - 1 ? 'Complete ✓' : 'Next →'}
        </button>
      </div>

      <div className="flex max-w-5xl mx-auto">
        {/* Sidebar */}
        <aside className="hidden md:block w-60 flex-shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto border-r border-border p-5">
          <div className="font-display font-extrabold text-base text-ink mb-0.5">Level 1 · Session 1</div>
          <div className="text-xs text-body mb-5">Build a real product</div>
          <nav className="space-y-0.5">
            {STEPS.map((step, i) => {
              const isDone = completed.has(i);
              const isActive = current === i;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${isActive ? 'bg-brand/10' : 'hover:bg-border-soft'}`}
                >
                  <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all
                    ${isDone ? 'bg-green border-green text-white' : isActive ? 'border-brand text-link' : 'border-border text-body'}`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-body leading-none mb-0.5">{step.eyebrow}</div>
                    <div className={`text-[13px] leading-snug ${isActive ? 'font-bold text-ink' : 'font-medium text-body'}`}>{step.label}</div>
                    {step.time && <div className="text-[10px] text-body mt-0.5">{step.time}</div>}
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 pt-5 border-t border-border-soft">
            <div className="text-[10px] font-bold uppercase tracking-widest text-body mb-2">Session total</div>
            <div className="font-display font-extrabold text-2xl text-ink">90 min</div>
            <div className="text-xs text-body mt-0.5">4 builds · Sonnet 4.5</div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 px-5 sm:px-10 py-8 max-w-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest text-link mb-2">
            <span>{STEPS[current].eyebrow}</span> · Step <span>{current + 1}</span> of <span>{STEPS.length}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-[28px] font-extrabold text-ink mb-2 leading-tight" style={{ textWrap: 'balance' }}>
            {HEADINGS[current]}
          </h1>
          <p className="text-body text-sm mb-6 leading-relaxed">{SUBTITLES[current]}</p>

          {PANELS[current]}

          {/* Bottom nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-soft">
            <button
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              className="text-sm font-semibold text-body hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={next}
              disabled={current === STEPS.length - 1}
              className="flex items-center gap-1.5 text-sm font-bold bg-brand hover:bg-brand-deep disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl transition-colors"
            >
              {current === STEPS.length - 1 ? 'Session Complete ✓' : <>Next <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
