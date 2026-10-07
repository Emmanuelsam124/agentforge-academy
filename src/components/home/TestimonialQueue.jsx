import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

// The same three WhatsApp screenshots the AI Agent Mastery page shows
// (AgentBuildTestimonials.jsx), from an earlier live class. First names only,
// approved by the founder; no photos, roles or links yet. Each quote is an
// exact excerpt of the screenshot, and the alt text transcribes the message.
const TESTIMONIALS = [
  {
    name: 'Richmond',
    quote: 'I used to think that building with AI is difficult. This is the first time I am building something real that solves problems.',
    src: '/testimonials/agentslive-testimonial-richmond.webp',
    width: 798,
    height: 1080,
    alt: 'WhatsApp message from Richmond: "Good morning sir. I used to think that building with AI is difficult. This is the first time I am building something real that solves problems. I am happy with this class."',
  },
  {
    name: 'Ibrahim',
    quote: 'I have successfully built my AI team on Thursday. My telegram and WhatsApp agents closed 7 deals for me.',
    src: '/testimonials/agentslive-testimonial-ibrahim.webp',
    width: 720,
    height: 994,
    alt: 'WhatsApp message from Ibrahim: "Hello, Mr Emma. I have successfully built my AI team on Thursday. My telegram and WhatsApp agents closed 7 deals for me. You need to increase the price of this class. It is too cheap for what I got."',
  },
  {
    name: 'Ijeoma',
    quote: 'Honestly, I never expected this level of depth in building AI agents.',
    src: '/testimonials/agentslive-testimonial-ijeoma.webp',
    width: 499,
    height: 1080,
    alt: 'WhatsApp message from Ijeoma: "Honestly, I never expected this level of depth in building AI agents. I want to thank you for this class that you and your team have put together. I built my first sales agent for a small business here in Aja and in fact, my first 500k just landed."',
  },
];

const ROTATE_MS = 6000;

// Where each queue slot sits once the container is at least 672px wide: the
// featured card on top, two compact ones below. Below that width the cards
// stack in one grid cell and only the featured one shows. Layout comes from a
// container query rather than measured pixels, so the prerendered snapshot is
// right at any width before the script runs.
const SLOT_CLASSES = [
  'z-[2] @2xl:top-0 @2xl:left-0 @2xl:w-full @2xl:h-[400px]',
  'z-[1] invisible opacity-0 @2xl:visible @2xl:opacity-100 @2xl:top-[432px] @2xl:left-0 @2xl:w-[calc(50%-12px)] @2xl:h-[150px]',
  'z-[1] invisible opacity-0 @2xl:visible @2xl:opacity-100 @2xl:top-[432px] @2xl:left-[calc(50%+12px)] @2xl:w-[calc(50%-12px)] @2xl:h-[150px]',
];

const EASE = 'cubic-bezier(.2,.7,.2,1)';
const CARD_TRANSITION = `top .7s ${EASE}, left .7s ${EASE}, width .7s ${EASE}, height .7s ${EASE}, opacity .5s ease-out, visibility .5s`;

function Initial({ name, className }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-full bg-white/15 text-[#F6F8FB] flex items-center justify-center font-display font-bold flex-shrink-0 ${className}`}
    >
      {name.charAt(0)}
    </div>
  );
}

function Card({ t, index, slot }) {
  const featured = slot === 0;
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${TESTIMONIALS.length}`}
      aria-hidden={featured ? undefined : 'true'}
      className={`[grid-area:1/1] relative @2xl:absolute rounded-2xl border border-white/20 bg-white/[0.08] overflow-hidden ${SLOT_CLASSES[slot]}`}
      style={{ transition: CARD_TRANSITION }}
    >
      {/* Full layer: the featured card */}
      <div
        className={`flex flex-col p-6 @2xl:absolute @2xl:inset-0 @2xl:flex-row @2xl:items-center @2xl:gap-10 @2xl:p-10 transition-opacity duration-[350ms] ease-out ${
          featured ? 'opacity-100 delay-300' : 'opacity-0'
        }`}
      >
        <div className="flex-1 min-w-0">
          <blockquote className="m-0 font-display font-bold text-[22px] leading-[1.25] @2xl:text-[clamp(22px,3cqw,30px)] @2xl:leading-[1.2] tracking-[-0.02em] text-[#F6F8FB] text-balance">
            “{t.quote}”
          </blockquote>
          <div className="flex items-center gap-3 @2xl:gap-3.5 my-5 @2xl:mb-0 @2xl:mt-7">
            <Initial name={t.name} className="w-11 h-11 text-[17px] @2xl:w-12 @2xl:h-12 @2xl:text-lg" />
            <div>
              <div className="font-bold text-base text-[#F6F8FB] leading-snug">{t.name}</div>
              <div className="text-sm text-[#F6F8FB]/80">Student</div>
            </div>
          </div>
        </div>
        <img
          src={t.src}
          alt={t.alt}
          width={t.width}
          height={t.height}
          loading="lazy"
          decoding="async"
          className="block w-full h-[230px] @2xl:w-[240px] @2xl:h-[320px] flex-shrink-0 object-cover object-top rounded-xl border border-white/20"
        />
      </div>

      {/* Compact layer: a card waiting in the queue (wide screens only) */}
      <div
        aria-hidden="true"
        className={`hidden @2xl:flex absolute inset-0 p-5 gap-4 transition-opacity duration-[350ms] ease-out ${
          featured ? 'opacity-0' : 'opacity-100 delay-300'
        }`}
      >
        <img
          src={t.src}
          alt=""
          width={t.width}
          height={t.height}
          loading="lazy"
          decoding="async"
          className="w-[88px] h-[108px] flex-shrink-0 object-cover object-top rounded-lg border border-white/20"
        />
        <div className="min-w-0 flex flex-col justify-between">
          <p className="m-0 text-[15px] leading-[1.55] text-[#F6F8FB] line-clamp-3">“{t.quote}”</p>
          <div className="text-sm leading-snug text-[#F6F8FB]/80">
            <strong className="text-[#F6F8FB]">{t.name}</strong> · Student
          </div>
        </div>
      </div>
    </div>
  );
}

function RoundButton({ label, onClick, className = 'flex', children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`w-11 h-11 rounded-full border-[1.5px] border-white/55 text-[#F6F8FB] items-center justify-center hover:bg-white/10 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

// One large testimonial and two queued. Every 6 seconds the next one takes the
// large slot and the featured one drops to the end of the queue. Rotation
// pauses while the pointer is over it, stops for good when it gets keyboard
// focus (until the visitor presses play), and starts stopped for visitors who
// ask for reduced motion.
export default function TestimonialQueue() {
  const [order, setOrder] = useState([0, 1, 2]);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const [hovered, setHovered] = useState(false);

  // A fresh 6 seconds after every change, including a manual one.
  useEffect(() => {
    if (paused || hovered) return undefined;
    const id = setTimeout(() => setOrder(([a, b, c]) => [b, c, a]), ROTATE_MS);
    return () => clearTimeout(id);
  }, [order, paused, hovered]);

  const next = () => setOrder(([a, b, c]) => [b, c, a]);
  const prev = () => setOrder(([a, b, c]) => [c, a, b]);
  const pick = (k) =>
    setOrder((o) => {
      let r = o;
      while (r[0] !== k) r = [r[1], r[2], r[0]];
      return r;
    });

  return (
    <div
      className="@container"
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={(e) => {
        if (e.target.matches?.(':focus-visible')) setPaused(true);
      }}
    >
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Student testimonials"
        aria-live={paused ? 'polite' : 'off'}
        className="grid @2xl:block @2xl:relative @2xl:h-[582px]"
      >
        {TESTIMONIALS.map((t, i) => (
          <Card key={t.name} t={t} index={i} slot={order.indexOf(i)} />
        ))}
      </div>

      <div className="mt-5 @2xl:mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-0.5 @2xl:gap-1">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              aria-current={order[0] === i ? 'true' : undefined}
              onClick={() => pick(i)}
              className="h-11 @2xl:h-6 px-1.5 @2xl:px-1 flex items-center"
            >
              <span
                className={`block h-2 rounded-full transition-[width,background-color] duration-300 ease-out ${
                  order[0] === i ? 'w-6 bg-yellow' : 'w-2 bg-white/55'
                }`}
              />
            </button>
          ))}
          <span className="hidden @2xl:inline ml-3 text-[13px] font-semibold text-[#F6F8FB]/80">
            {order[0] + 1} of {TESTIMONIALS.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RoundButton label="Previous testimonial" onClick={prev} className="hidden @2xl:flex">
            <ChevronLeft className="w-5 h-5" />
          </RoundButton>
          <RoundButton label={paused ? 'Play testimonials' : 'Pause testimonials'} onClick={() => setPaused((p) => !p)}>
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </RoundButton>
          <RoundButton label="Next testimonial" onClick={next} className="hidden @2xl:flex">
            <ChevronRight className="w-5 h-5" />
          </RoundButton>
        </div>
      </div>
    </div>
  );
}
