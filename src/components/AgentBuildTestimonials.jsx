import { useState } from 'react';

// Real feedback — actual WhatsApp screenshots (provided by the founder,
// 2026-09-27), shown as images rather than transcribed text, from an
// earlier live class covering this same kind of build — an agent
// connected to real messaging channels, doing real work. Originally shared
// with the AI Agents Live page (removed 2026-09-29); now used by
// AIAgentMastery.jsx.
// `alt` is a plain transcription for screen readers — the image is what
// actually renders.
const TESTIMONIALS = [
  {
    name: 'Ijeoma',
    role: 'Student',
    src: '/testimonials/agentslive-testimonial-ijeoma.png',
    alt: "WhatsApp message from Ijeoma: \"I never expected this level of depth in building AI agents. I built my first sales agent for a small business here in Aja, and my first ₦500k just landed...\"",
  },
  {
    name: 'Ibrahim',
    role: 'Student',
    src: '/testimonials/agentslive-testimonial-ibrahim.png',
    alt: "WhatsApp message from Ibrahim: \"I have successfully built my AI team. My Telegram and WhatsApp agents closed 7 deals for me. You need to increase the price of this class — it's too cheap for what I got.\"",
  },
  {
    name: 'Richmond',
    role: 'Student',
    src: '/testimonials/agentslive-testimonial-richmond.webp',
    alt: 'WhatsApp message from Richmond: "I used to think that building with AI is difficult. This is the first time I am building something real that solves problems."',
  },
];

export default function AgentBuildTestimonials() {
  const [lightbox, setLightbox] = useState(null);

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-[5vw] pb-16 max-w-5xl mx-auto">
        <div className="text-center mb-9">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#F3EBFF] dark:bg-brand/15 text-brand mb-3">
            Real feedback, real results
          </span>
          <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink tracking-[-.8px] max-w-2xl mx-auto">
            From an earlier class covering this same kind of build
          </h2>
        </div>
        <p className="text-center text-[12px] text-gray-400 -mt-6 mb-6">Tap a screenshot to read it in full</p>
        <div className="grid sm:grid-cols-3 gap-3.5 max-w-4xl mx-auto">
          {TESTIMONIALS.map((t) => (
            <button
              key={t.name}
              onClick={() => setLightbox(t)}
              className="text-left bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl overflow-hidden hover:border-brand transition-colors"
            >
              <img src={t.src} alt={t.alt} className="w-full h-auto block" loading="lazy" />
              <p className="text-[12px] font-bold text-ink px-4 py-3">{t.name} <span className="font-normal text-gray-400">· {t.role}</span></p>
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox.src} alt={lightbox.alt} className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </>
  );
}
