import { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

// Real screenshots of one build, the Daily News & Industry Summary Agent
// (Builder 1, built in Make): the prompt box in the guide, the Make scenario it
// runs in, and the briefing email it sends. Supplied by the founder; the prompt
// is cropped to its opening lines on purpose, since the full prompt is part of
// the paid guide. The step headings and text are the existing homepage copy.
// Each shot opens full size in a dialog, because at card width the text in them
// is too small to read.
const STEPS = [
  {
    title: 'Copy the prompt',
    text: 'Every build ships a clear, step-by-step guide with ready-to-use prompts. No blank page, just follow along and build.',
    label: 'The prompt box in the guide',
    shot: {
      src: '/images/guides-step-1-prompt.webp',
      width: 753,
      height: 168,
      alt: 'Screenshot of the "Prompt to use" box in a guide, with a Copy button. It shows the first lines of the prompt: "You are an elite industry analyst preparing a 5-minute morning briefing for a business executive. Here are today\'s top raw industry news articles: [Insert Text Aggregator Output Variable Here]".',
    },
  },
  {
    title: 'Execute',
    text: 'Paste it into your AI tool and run what it builds, following the guide step by step.',
    label: 'The build running in Make',
    shot: {
      src: '/images/guides-step-2-make.webp',
      width: 1400,
      height: 627,
      alt: 'Screenshot of the Make scenario for this build. Four connected modules, each with a green check: an RSS feed, a text aggregator, Google Gemini "Generate a response", and Gmail "Send an email". The scenario is set to run daily at 9:00 AM.',
    },
  },
  {
    title: 'Launch',
    text: 'Each session ends with a write-up prompt: LinkedIn post, resume bullets, project blurb.',
    label: 'The briefing email it sends',
    shot: {
      src: '/images/guides-step-3-email.webp',
      width: 1310,
      height: 645,
      alt: 'Screenshot of the finished briefing email open in Gmail. It has a red headline, a bold two-sentence summary, a short paragraph of context, and a closing red line beginning "Why this matters".',
    },
  },
];

function Shot({ step, onOpen }) {
  const { shot } = step;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Enlarge screenshot: ${step.label}`}
      className="flex w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl border border-border bg-bg p-3 text-left hover:border-link transition-colors lg:h-[170px]"
    >
      <img
        src={shot.src}
        alt={shot.alt}
        width={shot.width}
        height={shot.height}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full rounded-lg border border-border object-contain lg:w-auto lg:max-h-full lg:max-w-full"
      />
    </button>
  );
}

// One shared dialog. showModal() traps focus and closes on Esc; a click on the
// backdrop (the dialog element itself, outside the content) closes it too.
function Lightbox({ step, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (step && !dialog.open) dialog.showModal();
    if (!step && dialog.open) dialog.close();
    return undefined;
  }, [step]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={step ? `Screenshot: ${step.label}` : undefined}
      className="m-auto w-[min(1100px,94vw)] max-h-[92vh] overflow-auto rounded-2xl border border-border bg-surface p-3 md:p-4 text-ink backdrop:bg-black/70"
    >
      {step && (
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-deep transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={step.shot.src}
            alt={step.shot.alt}
            width={step.shot.width}
            height={step.shot.height}
            className="block h-auto w-full rounded-lg"
          />
          <p className="mt-3 text-sm text-body">{step.label}</p>
        </div>
      )}
    </dialog>
  );
}

export default function HowGuidesWork({ buildCount }) {
  const [openStep, setOpenStep] = useState(null);

  return (
    <>
      <div className="max-w-[640px] mb-8 md:mb-11">
        <h2 className="t-h2 text-ink">How AI Agent Guides work</h2>
        <p className="t-lead text-body mt-3.5">
          Each of the <span>{buildCount}</span> builds follows the same three steps.
        </p>
      </div>

      {/* In the three-column row the cards have a fixed height, so the captions line
          up; stacked on smaller screens each card just fits its screenshot. */}
      <ol className="grid lg:grid-cols-3 gap-8 lg:gap-9 list-none p-0 m-0">
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative min-w-0">
            {i > 0 && (
              <span
                aria-hidden="true"
                className="hidden lg:flex absolute top-[71px] -left-8 z-[2] w-7 h-7 rounded-full bg-brand text-white items-center justify-center"
              >
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
            <Shot step={step} onOpen={() => setOpenStep(step)} />
            <p className="mt-2 text-[13px] leading-snug text-body">{step.label}</p>
            <div className="flex gap-3.5 md:gap-4 mt-4 md:mt-5">
              <div className="t-num w-9 h-9 md:w-10 md:h-10 rounded-[10px] md:rounded-xl bg-brand text-white text-base md:text-lg flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="t-h3 text-ink mb-1 md:mb-1.5">{step.title}</h3>
                <p className="t-card text-body">{step.text}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-[13px] text-body">
        Screenshots from the Daily News &amp; Industry Summary Agent build. Select one to enlarge it.
      </p>

      <Lightbox step={openStep} onClose={() => setOpenStep(null)} />
    </>
  );
}
