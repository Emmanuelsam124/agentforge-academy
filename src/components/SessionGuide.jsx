import { useState } from 'react';
import { Clock, Layers, Bot, Sparkles, ListChecks, CheckCircle2, Compass, Award, ChevronDown, AlertTriangle, Wrench, Play, ExternalLink } from 'lucide-react';
import PromptBox from './PromptBox';
import { Callout, GuideTable } from './guides/GuideParts';

// Optional per-step fields beyond instruction / prompt / verify, all backwards
// compatible (a step without them renders exactly as before):
//   promptKind: 'code'                   -> monospace "Code to paste" box
//               'example'                -> monospace "Example" box
//   table:   { caption?, header[], rows[][] }
//   callout: { variant: 'tip'|'warning', title?, text }   (**bold** allowed)
// Optional on the session itself:
//   video: { url, title?, duration?, text?, note? }  -> walkthrough link card

export default function SessionGuide({ session, troubleshooting }) {
  // Multi-guide: session is an array of guide objects
  if (Array.isArray(session)) {
    return <MultiGuide guides={session} fallbackTroubleshooting={troubleshooting} />;
  }
  // Single guide (all existing sessions)
  return <GuideContent session={session} troubleshooting={troubleshooting} />;
}

// ── Multi-guide switcher ──────────────────────────────────────────────────────

function MultiGuide({ guides, fallbackTroubleshooting }) {
  const [active, setActive] = useState(0);
  const guide = guides[active];
  return (
    <div className="space-y-6">
      {/* Switcher */}
      <div className="grid grid-cols-2 gap-0 rounded-xl border border-border-soft overflow-hidden">
        {guides.map((g, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`text-left px-4 py-3.5 transition-colors ${
              i === active
                ? 'bg-[#E8EDF3] dark:bg-brand/15'
                : 'bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3]/50 dark:hover:bg-brand/10'
            } ${i > 0 ? 'border-l border-border-soft' : ''}`}
          >
            <span className={`text-[9px] font-bold uppercase tracking-widest block mb-0.5 ${i === active ? 'text-link' : 'text-gray-400'}`}>
              {g.guideName}
            </span>
            <span className={`text-sm font-extrabold block leading-tight ${i === active ? 'text-ink' : 'text-body'}`}>
              {g.guideLabel}
            </span>
            <span className="text-[11px] text-gray-400 block mt-0.5">{g.guideSubtitle}</span>
          </button>
        ))}
      </div>
      {/* Active guide content */}
      <GuideContent
        session={guide}
        troubleshooting={guide.troubleshooting ?? fallbackTroubleshooting}
      />
    </div>
  );
}

// ── Single guide renderer (shared by both paths) ──────────────────────────────

function GuideContent({ session, troubleshooting }) {
  return (
    <div className="space-y-8">
      {/* Session header */}
      <div className="rounded-xl border border-brand/25 bg-[#E8EDF3] dark:bg-brand/10 p-4 flex flex-wrap gap-3">
        <Badge icon={Clock} label={`${session.totalTime} total`} />
        <Badge icon={Layers} label={`${session.buildCount} builds`} />
        <Badge icon={Bot} label={session.model} />
      </div>

      {session.video?.url && <VideoLink video={session.video} />}

      {/* By the end of this session */}
      <section className="rounded-xl border-[1.5px] border-green/25 bg-[#EAFAF1] dark:bg-green/10 p-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-green mb-3">
          <Sparkles className="w-4 h-4" /> By the end of this session
        </p>
        <ul className="space-y-2">
          {session.outcomes.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-body-strong">
              <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* What you need */}
      <section>
        <SectionTitle icon={ListChecks} title="What you need" />
        <ul className="space-y-1.5">
          {session.whatYouNeed.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-body">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Builds */}
      <div className="space-y-6">
        {session.builds.map((build) => (
          <BuildCard key={build.number} build={build} />
        ))}
      </div>

      {/* Troubleshooting */}
      {troubleshooting?.length > 0 && (
        <section id="troubleshooting">
          <SectionTitle icon={Wrench} title="Troubleshooting" />
          <div className="space-y-2.5">
            {troubleshooting.map((t) => (
              <div key={t.issue} className="flex gap-2.5 items-start text-sm bg-[#FEF9E7] dark:bg-amber-500/10 border border-amber/25 rounded-lg px-3.5 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-ink">{t.issue}</p>
                  <p className="text-body mt-0.5">{t.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Portfolio tie-in */}
      {session.portfolio && (
        <section id="portfolio" className="rounded-xl border border-amber/25 bg-[#FEF9E7] dark:bg-amber-500/10 p-4">
          <SectionTitle icon={Award} title="Add this to your portfolio" />
          <p className="text-sm text-body leading-relaxed">{session.portfolio}</p>
          {session.portfolioPrompt && <PortfolioPromptDropdown prompt={session.portfolioPrompt} />}
        </section>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

// A plain link to the recording, opened in a new tab so the browser's own
// player handles it and the student keeps their place in the guide.
function VideoLink({ video }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-xl border border-brand/25 bg-white dark:bg-[#131E2F] p-4 hover:border-brand/50 hover:bg-[#F6F8FB] dark:hover:bg-brand/10 transition-colors"
    >
      <span className="flex-shrink-0 w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center group-hover:bg-brand-deep transition-colors">
        <Play className="w-5 h-5 ml-0.5" fill="currentColor" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-link mb-0.5">Video walkthrough</span>
        <span className="block font-bold text-ink text-sm sm:text-base">
          {video.title || 'Watch the full build'}
          {video.duration && <span className="font-semibold text-body"> · {video.duration}</span>}
        </span>
        {video.text && <span className="block text-sm text-body mt-0.5">{video.text}</span>}
        {video.note && <span className="block text-xs text-body mt-1.5">{video.note}</span>}
        <span className="sr-only"> (opens in a new tab)</span>
      </span>
      <ExternalLink className="w-4 h-4 text-link flex-shrink-0" aria-hidden="true" />
    </a>
  );
}

function PortfolioPromptDropdown({ prompt }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-600 transition-colors"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        Need help writing it up? Use this prompt
      </button>
      {open && (
        <div className="mt-2">
          <PromptBox text={prompt} />
        </div>
      )}
    </div>
  );
}

function BuildCard({ build }) {
  return (
    <>
      {/* Optional phase divider — renders before the card when phaseLabel is set */}
      {build.phaseLabel && (
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-border-soft" />
          <span className="text-[11px] font-bold text-link bg-[#E8EDF3] dark:bg-brand/15 px-3 py-1 rounded-full whitespace-nowrap">
            {build.phaseLabel}
          </span>
          <div className="flex-1 h-px bg-border-soft" />
        </div>
      )}
      <div id={`build-${build.number}`} className="rounded-xl border border-border-soft bg-white dark:bg-[#131E2F] overflow-hidden scroll-mt-24">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border-soft bg-[#F6F8FB] dark:bg-white/5">
          <h4 className="font-bold text-ink text-sm sm:text-base">
            Build <span>{build.number}</span> · <span>{build.title}</span>
          </h4>
          <span className="flex items-center gap-1 text-xs font-semibold text-body flex-shrink-0">
            <Clock className="w-3.5 h-3.5" /> <span>{build.time}</span>
          </span>
        </div>

        <div className="px-4 sm:px-5 py-4 space-y-5">
          {build.description && (
            <p className="text-sm text-body">{build.description}</p>
          )}

          {build.steps.map((step, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm text-body-strong leading-relaxed">
                <span className="font-bold text-link"><span>{i + 1}</span>.</span> <span>{step.instruction}</span>
              </p>
              {step.prompt && <PromptBox text={step.prompt} variant={step.promptKind} />}
              {step.table && <GuideTable block={step.table} className="" />}
              {step.callout && <Callout block={step.callout} className="" />}
              {step.verify && (
                <div className="flex gap-2 items-start text-sm text-green bg-[#EAFAF1] dark:bg-green/10 border border-green/20 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><span className="font-bold">Check your work: </span>{step.verify}</span>
                </div>
              )}
            </div>
          ))}

          {build.goFurther && (
            <div className="flex gap-2 items-start text-sm text-link bg-[#E8EDF3] dark:bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
              <Compass className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><span className="font-bold">Go further: </span>{build.goFurther}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Badge({ icon: Icon, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold text-link bg-white dark:bg-[#131E2F] border border-brand/25 rounded-full px-3 py-1.5">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-link" />
      <h3 className="font-bold text-ink text-sm uppercase tracking-wide">{title}</h3>
    </div>
  );
}
