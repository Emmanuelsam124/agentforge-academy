import { useState } from 'react';
import { Play } from 'lucide-react';

// Lightweight "click-to-load" YouTube embed. The real iframe pulls in
// ~1.5MB of YouTube's own JS/CSS plus third-party cookies the instant it's
// in the DOM — loading that unconditionally on page load (as a plain
// <iframe src="youtube.com/embed/...">) was the single biggest render-
// blocking / third-party-cookie contributor on the homepage per Lighthouse.
// This renders just a thumbnail + play button until the user actually
// wants the video, and only then swaps in the real iframe.
// `priority` marks this instance as the page's LCP element (the homepage
// hero). It renders the thumbnail as a real <img fetchpriority="high"> rather
// than a CSS background, because a background-image can't be found by the
// preload scanner and can't carry a fetch priority — Lighthouse flagged both
// ("fetchpriority=high should be applied"). Set it only where the thumbnail
// really is the largest paint; elsewhere (AgentModal) the image stays lazy.
export default function YouTubeFacade({ videoId, title, className = '', thumbnailSrc, priority = false }) {
  const [playing, setPlaying] = useState(false);
  // Defaults to YouTube's own CDN (i.ytimg.com), which only serves a 2-hour
  // cache lifetime — fine for the many different per-agent thumbnails in
  // AgentModal, but the homepage hero passes a self-hosted thumbnailSrc
  // (see public/video-thumbnail-hd.jpg) so that one specific always-loaded
  // image gets our own long-lived Cache-Control (vercel.json) instead.
  const thumbnail = thumbnailSrc || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (playing) {
    return (
      <iframe
        className={className}
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className={`${className} relative flex items-center justify-center overflow-hidden group`}
    >
      <img
        src={thumbnail}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority={priority ? 'high' : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
      <span className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
      <span className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center">
        <Play className="w-6 h-6 sm:w-7 sm:h-7 text-[#264D73] ml-1" fill="currentColor" />
      </span>
    </button>
  );
}
