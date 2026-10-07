import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Folder, MessageSquareText, Save, Settings, Terminal, Smartphone, PartyPopper,
  AlertTriangle, Lightbulb, CheckCircle2, Zap, UserCircle2, GraduationCap, Lock,
} from 'lucide-react';
import PromptBox from '../components/PromptBox';
import { useAuth } from '../context/AuthContext';

import EmojiIcon, { EmojiText } from '../components/EmojiIcon';
const CLAUDE_PROMPT = `I want to build a free AI WhatsApp auto-reply bot using Node.js, whatsapp-web.js, and Groq's free API (no credit card needed). Please create exactly 3 files for me — do not tell me how to install anything yet, just give me the files:

1. package.json — with these dependencies: groq-sdk, whatsapp-web.js, qrcode-terminal, dotenv

2. .env.example — with placeholders for:
   - GROQ_API_KEY
   - GROQ_MODEL (default to llama-3.1-8b-instant, since it has a much higher free daily limit than the 70B model)
   - PUPPETEER_EXECUTABLE_PATH (path to my installed Chrome, since I don't want the bot downloading its own copy)

3. index.js — the bot itself. It must include ALL of these features:
   - Use my installed Chrome via PUPPETEER_EXECUTABLE_PATH, not a downloaded one
   - Two manual safety constants near the top: TEST_MODE (default true) and OUTBOUND_ENABLED (default false). A message may only actually be sent if TEST_MODE is false AND OUTBOUND_ENABLED is true — both must be hand-edited and the process restarted, nothing in the code should ever flip them automatically
   - When sending isn't allowed, print a clear console preview of what would have been sent, instead of sending it
   - A circuit breaker: never send more than 3 messages within any rolling 60-second window, and never more than 50 messages total in one run — if either limit is hit, force-stop the whole process immediately (process.exit)
   - Ignore messages from myself and from "status@broadcast"
   - Ignore any message from a group chat (JID ending in "@g.us")
   - Ignore any message timestamped before the bot started (no replying to backlog)
   - Ignore empty or non-text messages (check the message type, not just the body)
   - A random 1.5-4 second delay before any real send, so replies don't look instant/robotic
   - Cap each AI reply at a low max_tokens (around 200) to conserve Groq's free-tier token budget
   - If Groq returns a 429 rate-limit error, retry using the server's retry-after value, up to 2 retries, before giving up and logging the error — don't just drop the message
   - Process incoming messages one at a time through a simple queue, not in parallel, so multiple messages arriving close together don't fire simultaneous Groq requests and burn through the rate limit faster
   - A simple SYSTEM_PROMPT variable near the top I can edit in plain English to change the bot's personality — including an instruction that it must say it's an automated assistant if directly asked, never claim to be human

Explain each safety feature briefly in comments. Give me only the 3 files — no install instructions, no setup steps, just the files.`;

const NAV_SECTIONS = [
  { id: 'before-you-start', label: 'Before you start' },
  { id: 'step-1', label: 'Folder' },
  { id: 'step-2', label: 'Generate' },
  { id: 'step-3', label: 'Save files' },
  { id: 'step-4', label: 'Settings' },
  { id: 'step-5', label: 'Terminal' },
  { id: 'step-6', label: 'Test & go live' },
];

const WRAP_UP = [
  { icon: Folder, title: 'All in one folder', text: 'Everything lives in whatsapp-bot on your Desktop — easy to find, easy to redo.' },
  { icon: Terminal, title: 'Minimal typing', text: 'Only 3 things typed into the black window, once.' },
  { icon: CheckCircle2, title: 'Self-protecting', text: 'Auto warm-up and a circuit breaker — nothing sends by accident.' },
  { icon: Zap, title: 'Zero cost', text: 'No subscription, no card — 100% free tools.' },
];

const COMPARISON = {
  basic: [
    'whatsapp-web.js — tied to your phone staying connected to WhatsApp Web',
    'A generic system prompt you edit by hand',
    'Resets every time you restart the process',
  ],
  advanced: [
    "Built on Twilio's official WhatsApp Business API — not tied to your phone",
    'Trained on a persona file — replies in your own voice, not a generic one',
    'One of 12 real Builder 1 sessions — guided, with support if you get stuck',
  ],
};

function StepNumber({ n }) {
  return (
    <div className="w-8 h-8 rounded-full bg-[#E8EDF3] dark:bg-brand/15 border border-border-soft flex items-center justify-center font-display font-extrabold text-[13px] text-link flex-shrink-0">
      {n}
    </div>
  );
}

function Callout({ variant = 'tip', title, children }) {
  const isWarning = variant === 'warning';
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3.5 my-3 ${
        isWarning ? 'bg-[#FEF9E7] dark:bg-amber-500/10 border border-amber/30' : 'bg-[#E8EDF3] dark:bg-brand/10 border border-brand/20'
      }`}
    >
      {isWarning ? (
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
      ) : (
        <Lightbulb className="w-4 h-4 text-link mt-0.5 flex-shrink-0" />
      )}
      <p className="text-[13.5px] text-body-strong leading-relaxed m-0">
        <strong className="text-ink">{title}</strong> <span>{children}</span>
      </p>
    </div>
  );
}

function CodeBlock({ label, children }) {
  return (
    <div className="bg-[#0F1A2A] rounded-lg overflow-hidden my-2.5">
      {label && <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#B8CCE4] px-3.5 pt-3 pb-1">{label}</div>}
      <pre className="text-[13px] text-[#EAFAF1] font-mono px-3.5 pb-3.5 pt-1 overflow-x-auto whitespace-pre-wrap m-0">{children}</pre>
    </div>
  );
}

function Section({ id, icon: Icon, badge, time, title, desc, children }) {
  return (
    <div id={id} className="py-10 border-b border-border-soft scroll-mt-[130px]">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-link bg-[#E8EDF3] dark:bg-brand/15 rounded-full px-2.5 py-1">
          <Icon className="w-3.5 h-3.5" /> <span>{badge}</span>
        </span>
        {time && <span className="text-[12.5px] text-body font-semibold ml-auto">{time}</span>}
      </div>
      <h2 className="font-display font-extrabold text-xl sm:text-2xl text-ink mb-1.5">{title}</h2>
      {desc && <p className="text-[14px] text-body leading-relaxed mb-5 max-w-2xl">{desc}</p>}
      {children}
    </div>
  );
}

// Shown in place of the actual step-by-step guide for signed-out visitors —
// the hero above stays visible either way (it's the marketing pitch, and
// keeping it renderable without an account is what makes this page still
// worth indexing/linking to for organic + ad traffic), but the real
// instructions are the "free resource," so creating an account is the ask
// in exchange for it — same locked-card pattern AgentModal already uses for
// Pro-gated session content, just gated on having any account rather than a
// paid one.
function SignUpToUnlock() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="flex flex-col items-center text-center gap-3 py-16 px-6 border-2 border-dashed border-border rounded-2xl">
        <Lock className="w-8 h-8 text-link" />
        <p className="font-display font-bold text-xl text-ink">Create a free account to unlock this guide</p>
        <p className="text-sm text-body max-w-sm">
          The full step-by-step instructions and the copy-paste Claude prompt are free once you're signed in —
          just takes a minute, no card needed.
        </p>
        <Link
          to="/welcome"
          className="mt-2 inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Sign up free →
        </Link>
      </div>
    </div>
  );
}

export default function WhatsAppBotGuide() {
  // Gated on `user` alone, not the AuthContext `loading` flag — this page is
  // prerendered, and by prerender/snapshot time `loading` has already
  // resolved to false with no session, so the snapshot always shows the
  // signed-out (locked) branch. `user` starts null on both the snapshot AND
  // the client's very first hydration render (before getSession() resolves),
  // so hydrating on `user` matches; branching on `loading` instead would
  // flash a spinner on first paint that the static snapshot never had,
  // which is exactly the hydration-mismatch class documented in App.jsx.
  const { user } = useAuth();

  useEffect(() => {
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    document.title = 'Free Guide: Build an AI WhatsApp Auto-Reply Bot | Social Dev Technologies';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'A free, step-by-step guide to building your own AI WhatsApp auto-reply bot with Claude, Node.js, and Groq — no coding experience or credit card required.'
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
    canonicalEl.setAttribute('href', 'https://socialdevtechnologies.com/whatsapp-bot-guide');

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
      if (hadCanonical && prevCanonical) canonicalEl.setAttribute('href', prevCanonical);
      else canonicalEl.remove();
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <div
        className="relative overflow-hidden pt-14 pb-10 px-4 sm:px-6 lg:px-[5vw] bg-bg"
      >
        <div className="relative max-w-3xl mx-auto">
          <span
            className="inline-flex items-center gap-2 bg-white dark:bg-[#131E2F] border-[1.5px] border-border text-link font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(15,26,42,.1)]"
          >
            <EmojiText>{'📁 Free guide · Mostly file explorer, minimal typing'}</EmojiText>
          </span>

          <h1
            className="font-display font-extrabold text-[34px] sm:text-[46px] leading-[1.08] text-ink tracking-[-1px] mt-5"
          >
            Build your own <span className="text-link">AI WhatsApp<br className="hidden sm:block" /> auto-reply bot.</span>
          </h1>

          <p
            className="text-[16px] leading-relaxed text-body mt-5 max-w-xl"
          >
            Almost everything here happens in folders you can see and click — Claude, File Explorer, Notepad. The
            black command window is only opened <strong className="text-ink">once</strong>, for about 2 minutes, to
            install and start the bot.
          </p>

          <div
            className="flex flex-wrap gap-4 mt-6 text-[13px] text-body font-semibold"
          >
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand" /> ~40 min total</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand" /> 1 terminal visit</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand" /> 100% free</span>
          </div>
        </div>
      </div>

      {!user ? (
        <SignUpToUnlock />
      ) : (
        <>
          {/* Sticky in-page nav */}
          <div className="sticky top-[70px] z-30 bg-[#FFFFFF]/95 dark:bg-[#0C1420]/95 backdrop-blur border-b border-[#E7ECF2] dark:border-[#26364B]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex gap-4 overflow-x-auto">
              {NAV_SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="text-[12.5px] font-semibold text-body hover:text-link whitespace-nowrap transition-colors">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intro banner */}
        <div className="flex items-start gap-3.5 bg-white dark:bg-[#131E2F] border-[1.5px] border-brand/30 rounded-2xl p-5 my-8">
          <EmojiIcon emoji="📁" className="w-6 h-6 text-link flex-shrink-0" />
          <div>
            <h3 className="font-display font-bold text-[15px] text-ink mb-1">The whole idea of this guide</h3>
            <p className="text-[13.5px] text-body leading-relaxed m-0">
              You'll spend almost all your time in a normal folder on your computer — creating it, saving files into
              it, opening files in Notepad to edit them. The command window only comes out for the "install and
              start" step, then you're done with it.
            </p>
          </div>
        </div>

        <Section id="before-you-start" icon={CheckCircle2} badge="Before you start" title="What you need">
          <ul className="flex flex-col gap-2.5 mb-3">
            {[
              'A laptop with Google Chrome and Node.js installed (nodejs.org — download the LTS version)',
              'A free Claude account, to generate your files',
              'A WhatsApp number to connect (ideally a spare one, not your main personal number)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{item}</span>
              </li>
            ))}
          </ul>
          <Callout variant="warning" title="Windows users:">
            Create your folder somewhere NOT inside OneDrive (avoid "Documents" if it's synced). Your Desktop is a
            safe, simple choice.
          </Callout>
        </Section>

        <Section id="step-1" icon={Folder} badge="File Explorer" time="2 min" title="Create your folder">
          <div className="flex flex-col gap-3.5 mb-4">
            <div className="flex gap-3">
              <StepNumber n={1} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                Right-click on your Desktop → <strong className="text-ink">New</strong> → <strong className="text-ink">Folder</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <StepNumber n={2} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                Name it <strong className="text-ink">whatsapp-bot</strong>. This is the only folder you'll use for everything.
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="step-2"
          icon={MessageSquareText}
          badge="Claude"
          time="5 min"
          title="Generate your 3 files"
          desc="Open your Claude account and paste this in exactly as written."
        >
          <PromptBox text={CLAUDE_PROMPT} />
        </Section>

        <Section id="step-3" icon={Save} badge="Notepad + Folder" time="10 min" title="Save the files into your folder">
          <div className="flex flex-col gap-4 mb-3">
            <div className="flex gap-3">
              <StepNumber n={1} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                For <strong className="text-ink">index.js</strong>: copy everything Claude wrote for it, open Notepad, paste it in. Click<span> </span>
                <strong className="text-ink">File → Save As</strong>. Navigate to your <strong className="text-ink">whatsapp-bot</strong> folder.
                In the "Save as type" dropdown, choose <strong className="text-ink">All Files</strong>. Type the filename exactly:<span> </span>
                <code className="text-link font-semibold">index.js</code>. Click Save.
              </p>
            </div>
            <div className="flex gap-3">
              <StepNumber n={2} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                Do the same for <strong className="text-ink">package.json</strong> — new Notepad window, paste, Save As, "All Files" type,
                filename exactly <code className="text-link font-semibold">package.json</code>, save into the same folder.
              </p>
            </div>
            <div className="flex gap-3">
              <StepNumber n={3} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                For the settings file — this one's a little different. Copy what Claude gave you for<span> </span>
                <strong className="text-ink">.env.example</strong>, paste into a new Notepad window, but this time Save As with the filename
                exactly <code className="text-link font-semibold">.env</code> (not .env.example — save it directly as your real settings
                file, one step, done).
              </p>
            </div>
          </div>
          <Callout title="Why “All Files” matters:">
            Notepad secretly adds ".txt" to the end of filenames unless you pick "All Files" in that dropdown first.
            This is the #1 reason files end up named wrong — always check that dropdown before clicking Save.
          </Callout>
        </Section>

        <Section id="step-4" icon={Settings} badge="Notepad" time="5 min" title="Fill in your settings">
          <div className="flex flex-col gap-4 mb-1">
            <div className="flex gap-3">
              <StepNumber n={1} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                Go to <strong className="text-ink">console.groq.com</strong>, sign up, click<span> </span>
                <strong className="text-ink">API Keys → Create API Key</strong>. Copy it — it starts with<span> </span>
                <code className="text-link font-semibold">gsk_</code>.
              </p>
            </div>
            <div className="flex gap-3">
              <StepNumber n={2} />
              <div className="flex-1">
                <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5 mb-1">
                  In your folder, double-click <strong className="text-ink">.env</strong> to open it in Notepad. Paste your key in and check
                  your Chrome path:
                </p>
                <CodeBlock>
                  {'GROQ_API_KEY=gsk_your_real_key_here\nGROQ_MODEL=llama-3.1-8b-instant\nPUPPETEER_EXECUTABLE_PATH=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}
                </CodeBlock>
                <p className="text-[12.5px] text-body">
                  Check that last path is right by opening File Explorer and pasting "C:\Program Files\Google\Chrome\Application" into the
                  address bar — if chrome.exe is there, you're good.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <StepNumber n={3} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">Save (Ctrl+S) and close Notepad.</p>
            </div>
          </div>
        </Section>

        <Section
          id="step-5"
          icon={Terminal}
          badge="One terminal visit"
          time="5 min"
          title="Install & start — the only command window step"
          desc="This is the one and only time you need the black window. Here's the easy way in, with no path-typing."
        >
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-link bg-[#E8EDF3] dark:bg-brand/15 rounded-full px-3 py-1 mb-4">
            <EmojiText>{"🖥️ You'll type 3 things, total, in this whole guide"}</EmojiText>
          </span>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <StepNumber n={1} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                Click the Windows Start button, type <strong className="text-ink">cmd</strong>, press Enter to open Command Prompt.
              </p>
            </div>
            <div className="flex gap-3">
              <StepNumber n={2} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                Type <code className="text-link font-semibold">cd</code> followed by one space — don't press Enter yet. Now open File
                Explorer, find your <strong className="text-ink">whatsapp-bot</strong> folder, and<span> </span>
                <strong className="text-ink">drag the folder icon</strong> directly into the Command Prompt window. The full path types
                itself in. Now press Enter.
              </p>
            </div>
            <div className="flex gap-3">
              <StepNumber n={3} />
              <div className="flex-1">
                <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5 mb-1">
                  <strong className="text-ink">Windows only</strong> — type this first, it's a one-time setting for this window:
                </p>
                <CodeBlock label="type this — command 1 of 3">set PUPPETEER_SKIP_DOWNLOAD=true</CodeBlock>
              </div>
            </div>
            <div className="flex gap-3">
              <StepNumber n={4} />
              <div className="flex-1">
                <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5 mb-1">Now install everything your files need:</p>
                <CodeBlock label="type this — command 2 of 3">npm install</CodeBlock>
                <p className="text-[12.5px] text-body">Takes 1-3 minutes. Yellow "npm warn" text is normal — ignore it.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <StepNumber n={5} />
              <div className="flex-1">
                <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5 mb-1">Start the bot:</p>
                <CodeBlock label="type this — command 3 of 3">npm start</CodeBlock>
                <p className="text-[12.5px] text-body">That's it — no more typing needed for the rest of this guide. Leave this window open.</p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="step-6" icon={Smartphone} badge="Phone only" time="10 min" title="Connect & test">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <StepNumber n={1} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                A QR code appears in the black window. On your phone: WhatsApp → Settings → Linked Devices → Link a Device → scan it.
              </p>
            </div>
            <div className="flex gap-3">
              <StepNumber n={2} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                From a second phone, send it a message. You'll see it show up in the window as a preview — nothing is sent yet, that's
                normal. Send 2 more the same way.
              </p>
            </div>
            <div className="flex gap-3">
              <StepNumber n={3} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                After the 3rd test message, the window shows "Warm-up complete." Send one more message — this time a real reply arrives
                on WhatsApp within a few seconds.
              </p>
            </div>
            <div className="flex gap-3">
              <StepNumber n={4} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                <strong className="text-ink">To stop the bot:</strong> click into the black window and press<span> </span>
                <strong className="text-ink">Ctrl+C</strong>, or just close the window.
              </p>
            </div>
            <div className="flex gap-3">
              <StepNumber n={5} />
              <p className="text-[14px] text-body-strong leading-relaxed m-0 pt-0.5">
                <strong className="text-ink">To start it again later:</strong> open Command Prompt, drag your folder in after typing<span> </span>
                <code className="text-link font-semibold">cd </code> again, then just type<span> </span>
                <code className="text-link font-semibold">npm start</code> — no need to reinstall.
              </p>
            </div>
          </div>
        </Section>

        {/* Wrap up */}
        <div className="py-10">
          <div className="flex items-center gap-2 mb-1.5">
            <PartyPopper className="w-5 h-5 text-link" />
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-ink">What you built</h2>
          </div>
          <div className="grid grid-cols-2 gap-3.5 mt-5">
            {WRAP_UP.map((w) => (
              <div key={w.title} className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-4.5">
                <w.icon className="w-5 h-5 text-link mb-2.5" />
                <h4 className="font-display font-bold text-[14px] text-ink mb-1">{w.title}</h4>
                <p className="text-[12.5px] text-body leading-relaxed m-0">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
          </div>
        </>
      )}

      {/* Advanced upsell */}
      <div className="px-4 sm:px-6 lg:px-[5vw] py-14 max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link mb-3">
            This is the free, DIY version
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-[32px] text-ink tracking-[-.8px]">
            Builder 1 has the real one.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-9">
          <div className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <UserCircle2 className="w-4.5 h-4.5 text-gray-400" />
              <h3 className="font-display font-bold text-[14px] text-ink">This free guide</h3>
            </div>
            <ul className="flex flex-col gap-2">
              {COMPARISON.basic.map((c) => (
                <li key={c} className="text-[12.5px] text-body leading-relaxed">{c}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-[#131E2F] border-[2px] border-brand rounded-2xl p-5 shadow-[0_16px_36px_-16px_rgba(15,26,42,.4)]">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4.5 h-4.5 text-link" />
              <h3 className="font-display font-bold text-[14px] text-ink">Builder 1's version</h3>
            </div>
            <ul className="flex flex-col gap-2">
              {COMPARISON.advanced.map((c) => (
                <li key={c} className="text-[12.5px] text-body-strong font-medium leading-relaxed">{c}</li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="rounded-[24px] px-8 sm:px-10 py-9 flex items-center justify-between flex-wrap gap-5 shadow-[0_20px_44px_-16px_rgba(15,26,42,.6)] max-w-4xl mx-auto"
          style={{ background: '#264D73' }}
        >
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-[26px] text-white m-0">Ready for the real thing?</h2>
            <p className="text-[#D5DEE9] mt-2 mb-0 text-[15px]">
              The Advanced WhatsApp Auto-Reply Bot is one of 12 real sessions inside Builder 1 — guided, with support.
            </p>
          </div>
          <Link
            to="/builder-1/whatsapp-auto-reply-bot"
            className="bg-yellow text-ink font-extrabold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,.18)] hover:brightness-95 transition-all flex-shrink-0"
          >
            Get the Advanced version →
          </Link>
        </div>
      </div>
    </div>
  );
}
