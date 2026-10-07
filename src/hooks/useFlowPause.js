import { useEffect } from 'react';

// Pauses a flow diagram's SVG (SMIL) animation while the diagram is scrolled
// out of view, and resumes it when it comes back, so a page with a diagram
// below the fold isn't animating something nobody can see.
export function useFlowPause(ref) {
  useEffect(() => {
    const root = ref.current;
    const svg = root?.querySelector('svg');
    if (!svg || typeof svg.pauseAnimations !== 'function') return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) svg.unpauseAnimations();
      else svg.pauseAnimations();
    });
    io.observe(root);
    return () => io.disconnect();
  }, [ref]);
}
