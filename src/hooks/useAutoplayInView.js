import { useEffect } from 'react';

// Both demo videos play like a GIF — autoplay, muted, looped, no player
// chrome — rather than requiring a click. Only plays while scrolled into
// view (pauses otherwise), same pause-when-offscreen courtesy as
// AgentsLiveFlowDiagram, since these are real ~10-25MB recordings, not
// lightweight loops.
//
// `respectReducedMotion` (the homepage video, which has player controls)
// leaves the video paused for visitors who ask for reduced motion. A pause the
// visitor makes with the controls also sticks: scrolling away and back doesn't
// restart it.
export function useAutoplayInView(ref, { respectReducedMotion = false } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (respectReducedMotion && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let userPaused = false;
    let autoPausing = false;
    const onPause = () => {
      if (!autoPausing) userPaused = true;
      autoPausing = false;
    };
    const onPlay = () => {
      userPaused = false;
    };
    el.addEventListener('pause', onPause);
    el.addEventListener('play', onPlay);

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!userPaused) el.play().catch(() => {});
      } else if (!el.paused) {
        autoPausing = true;
        el.pause();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      el.removeEventListener('pause', onPause);
      el.removeEventListener('play', onPlay);
    };
  }, [ref, respectReducedMotion]);
}
