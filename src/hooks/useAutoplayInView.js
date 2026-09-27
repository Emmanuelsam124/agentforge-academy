import { useEffect } from 'react';

// Both demo videos play like a GIF — autoplay, muted, looped, no player
// chrome — rather than requiring a click. Only plays while scrolled into
// view (pauses otherwise), same pause-when-offscreen courtesy as
// AgentsLiveFlowDiagram, since these are real ~10-25MB recordings, not
// lightweight loops.
export function useAutoplayInView(ref) {
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {});
      else el.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
