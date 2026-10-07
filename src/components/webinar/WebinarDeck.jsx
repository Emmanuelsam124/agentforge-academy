import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { ChevronRight, Maximize, Minimize, NotebookText } from 'lucide-react';
import { webinarSlides } from '../../data/webinarSlides';
import SlideNav from './SlideNav';
import PresenterNotes from './PresenterNotes';
import WelcomeSlide from './slides/WelcomeSlide';
import MeetTheHostSlide from './slides/MeetTheHostSlide';
import TheWorldHasChangedSlide from './slides/TheWorldHasChangedSlide';
import TheHonestCheckSlide from './slides/TheHonestCheckSlide';
import MissionSlide from './slides/MissionSlide';
import AboutSocialDevSlide from './slides/AboutSocialDevSlide';
import AIUsersVsBuildersSlide from './slides/AIUsersVsBuildersSlide';
import HowBuildersThinkSlide from './slides/HowBuildersThinkSlide';
import MeetSamuelKingSlide from './slides/MeetSamuelKingSlide';
import LiveDemoSlide from './slides/LiveDemoSlide';
import WhatYouCanBuildSlide from './slides/WhatYouCanBuildSlide';
import LearningTrackSlide from './slides/LearningTrackSlide';
import IdentityLadderSlide from './slides/IdentityLadderSlide';
import MakeMoneyFromThisSlide from './slides/MakeMoneyFromThisSlide';
import FAQSlide from './slides/FAQSlide';
import WhoThisIsForSlide from './slides/WhoThisIsForSlide';
import TheOfferSlide from './slides/TheOfferSlide';
import FinalCtaSlide from './slides/FinalCtaSlide';
import QASlide from './slides/QASlide';

// Order must match webinarSlides in src/data/webinarSlides.js — index i's
// component renders slide metadata i's presenter notes.
const SLIDE_COMPONENTS = [
  WelcomeSlide,
  MeetTheHostSlide,
  TheWorldHasChangedSlide,
  TheHonestCheckSlide,
  MissionSlide,
  AboutSocialDevSlide,
  AIUsersVsBuildersSlide,
  HowBuildersThinkSlide,
  MeetSamuelKingSlide,
  LiveDemoSlide,
  WhatYouCanBuildSlide,
  LearningTrackSlide,
  IdentityLadderSlide,
  MakeMoneyFromThisSlide,
  FAQSlide,
  WhoThisIsForSlide,
  TheOfferSlide,
  FinalCtaSlide,
  QASlide,
];

const TOTAL = webinarSlides.length;

function clampSlide(n) {
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n, 0), TOTAL - 1);
}

export default function WebinarDeck() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [index, setIndex] = useState(() => clampSlide(parseInt(searchParams.get('slide'), 10) - 1));
  const [direction, setDirection] = useState(1);
  const [presenterMode, setPresenterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef(null);
  const reducedMotion = useReducedMotion();

  const goTo = useCallback((next) => {
    setIndex((current) => {
      const clamped = clampSlide(next);
      setDirection(clamped >= current ? 1 : -1);
      return clamped;
    });
    setHasInteracted(true);
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Keeps the URL shareable/refreshable (?slide=N, 1-indexed) without ever
  // losing your place mid-presentation.
  useEffect(() => {
    const target = String(index + 1);
    if (searchParams.get('slide') !== target) {
      setSearchParams({ slide: target }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          goTo(0);
          break;
        case 'End':
          e.preventDefault();
          goTo(TOTAL - 1);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'n':
        case 'N':
        case 'p':
        case 'P':
          setPresenterMode((p) => !p);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev, goTo, toggleFullscreen]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Tap-to-navigate for touch/click on the stage itself — clicks on real
  // interactive elements inside a slide (links, buttons) are left alone so
  // the CTAs still work instead of firing a slide change underneath them.
  const handleStageClick = (e) => {
    if (e.target.closest('a, button, input, textarea, [role="button"]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX > rect.width / 2) next();
    else prev();
  };

  const CurrentSlide = SLIDE_COMPONENTS[index];
  const meta = webinarSlides[index];

  const variants = {
    enter: (dir) => ({ opacity: 0, x: reducedMotion ? 0 : dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: reducedMotion ? 0 : dir > 0 ? -40 : 40 }),
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-bg text-ink flex flex-col z-50">
      <div className="h-1 w-full bg-border-soft flex-shrink-0">
        <m.div
          className="h-full bg-brand"
          animate={{ width: `${((index + 1) / TOTAL) * 100}%` }}
          transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src="/logo-icon.webp" alt="" className="w-7 h-7 object-contain rounded-md" />
          <span className="hidden sm:inline font-display font-extrabold text-sm text-ink tracking-tight">
            Social Dev<span className="text-link"> Technologies</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/pricing"
            className="hidden sm:inline-flex items-center gap-1.5 bg-brand text-white font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_6px_16px_rgba(15,26,42,.35)] hover:bg-brand-deep transition-colors"
          >
            Get Builder 1 →
          </Link>
          <button
            onClick={() => setPresenterMode((p) => !p)}
            aria-pressed={presenterMode}
            aria-label="Toggle presenter notes"
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              presenterMode ? 'bg-brand text-white' : 'bg-[#E8EDF3] dark:bg-white/10 text-link'
            }`}
          >
            <NotebookText className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#E8EDF3] dark:bg-white/10 text-link transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        Slide {index + 1} of {TOTAL}: {meta.label}
      </p>

      <div
        className="relative flex-1 min-h-0"
        onClick={handleStageClick}
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${index + 1} of ${TOTAL}: ${meta.label}`}
      >
        {/* mode="sync" (the default) mounts the incoming slide immediately
            instead of waiting for the outgoing one's exit animation to
            finish — with mode="wait", a stalled/throttled animation frame
            (backgrounded tab, low-power mode) would leave the deck stuck on
            the previous slide even though the index has already advanced,
            which is a real risk mid-presentation. */}
        <AnimatePresence custom={direction}>
          <m.div
            key={meta.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reducedMotion ? 0.01 : 0.35, ease: 'easeOut' }}
            className="absolute inset-0 overflow-y-auto"
          >
            <CurrentSlide />
          </m.div>
        </AnimatePresence>

        {!hasInteracted && index === 0 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[12.5px] font-semibold text-body flex items-center gap-1.5 pointer-events-none"
          >
            Press → or tap to continue <ChevronRight className="w-3.5 h-3.5" />
          </m.div>
        )}
      </div>

      <SlideNav index={index} total={TOTAL} slides={webinarSlides} onNext={next} onPrev={prev} onJump={goTo} />

      <PresenterNotes
        open={presenterMode}
        onClose={() => setPresenterMode(false)}
        notes={meta.notes}
        slideLabel={meta.label}
        index={index}
        total={TOTAL}
      />
    </div>
  );
}
