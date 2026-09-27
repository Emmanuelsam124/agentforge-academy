import { useRef } from 'react';
import { useAutoplayInView } from '../hooks/useAutoplayInView';

// Blocking the context menu removes the obvious "Save video as…" path — a
// casual-user deterrent, not real protection, since the browser still
// fetches the actual file to play it.
export function DemoVideo({ demo }) {
  const videoRef = useRef(null);
  useAutoplayInView(videoRef);

  return (
    <div className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl overflow-hidden">
      <div className="aspect-video bg-[#0A090F] flex items-center justify-center relative">
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full"
        >
          <source src={demo.src} type="video/mp4" />
        </video>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-1.5">
          <demo.icon className="w-4 h-4 text-brand flex-shrink-0" />
          <h3 className="font-display font-bold text-[14.5px] text-ink">{demo.title}</h3>
        </div>
        <p className="text-[12.5px] text-body leading-relaxed">{demo.text}</p>
      </div>
    </div>
  );
}

// Given full-width, bolder treatment (thicker brand border, glow, larger
// type) rather than sharing the plain video card style — this is the one
// demo meant to stand out on the page.
export function DemoLoop({ demo }) {
  const videoRef = useRef(null);
  useAutoplayInView(videoRef);

  return (
    <div className="bg-white dark:bg-[#181818] border-[2.5px] border-brand rounded-[20px] overflow-hidden shadow-[0_24px_48px_-20px_rgba(124,58,237,.55)]">
      <div className="aspect-video bg-[#0A090F] flex items-center justify-center relative">
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full"
        >
          <source src={demo.src} type="video/mp4" />
        </video>
      </div>
      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-2.5 mb-2">
          <demo.icon className="w-5 h-5 text-brand flex-shrink-0" />
          <h3 className="font-display font-extrabold text-[17px] sm:text-[19px] text-ink">{demo.title}</h3>
        </div>
        <p className="text-[13.5px] sm:text-[14.5px] text-body leading-relaxed">{demo.text}</p>
      </div>
    </div>
  );
}
