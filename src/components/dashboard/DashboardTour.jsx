import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

// First-visit walkthrough of the student dashboard: a dimmed page with a
// highlight ring on the real nav item and a short card beside it. Targets are
// found by `data-tour="<id>"` attributes on the sidebar / mobile nav
// (DashboardSidebar.jsx). The desktop sidebar and the phone bottom bar both
// carry the same ids, so each step picks whichever match is actually visible;
// items that only live inside the phone's "More" sheet fall back to the
// "More" button, with their own title and text so the heading matches what is
// actually highlighted. Steps with no visible target at all (e.g. "My Courses"
// for someone who owns none) are skipped rather than shown pointing at nothing.
//
// Auto-start is desktop-only (the `lg` layout, where the sidebar is showing).
// On phones the bottom bar is just Home / Live Sessions / Community / More, and
// the labels already say what they are — a modal tour there was mostly
// friction: it ran over the first screen a new buyer sees after paying (Paystack
// returns them to /dashboard), and its controls were small tap targets. Phones
// can still run it on purpose from Help ("Take the dashboard tour" fires the
// START_EVENT below).
//
// "Seen" is remembered per signed-in user in localStorage and is written the
// moment the tour is shown, not when it is finished: leaving part-way (back
// gesture, switching apps, the OS discarding the tab) used to restart it from
// step 1 on every visit until someone found Skip. It is a per-device
// convenience, not shared state — worst case someone on a new device sees it
// once more.
export const TOUR_START_EVENT = 'sdt:start-dashboard-tour';
const storageKey = (userId) => `sdt_dashboard_tour_v1_${userId}`;

// The breakpoint DashboardSidebar / DashboardMobileNav swap on: Tailwind `lg`,
// 64rem (src/index.css doesn't override it). Written in rem, like Tailwind's
// own media query, so the two stay in step even when someone's browser default
// font size isn't 16px. Without matchMedia, don't auto-start.
const DESKTOP_QUERY = '(min-width: 64rem)';
const isDesktop = () => Boolean(window.matchMedia?.(DESKTOP_QUERY).matches);

function markSeen(userId) {
  try {
    localStorage.setItem(storageKey(userId), '1');
  } catch {
    // storage blocked — the tour may show again on the next visit
  }
}

const STEPS = [
  {
    title: 'Welcome to your dashboard',
    body: "Here's a 30-second look at where everything lives. You can skip any time.",
    targets: [],
  },
  {
    title: 'Home',
    body: 'Your starting point — what to do next, upcoming classes and your progress.',
    targets: [{ id: 'home' }],
  },
  {
    title: 'Live Sessions',
    body: 'Your class schedule and the links to join each live class.',
    targets: [{ id: 'live-sessions' }],
  },
  {
    title: 'Community',
    body: 'Chat with classmates. There is a general room plus one for each course you joined. A red dot means unread messages.',
    targets: [{ id: 'community' }],
  },
  {
    title: 'Replays',
    body: 'Missed a class? Recordings show up here after each session.',
    // On a phone none of the next three have their own button: they all fall
    // back to "More", so the first of them shows as a single "More" step that
    // covers all of it and the other two are dropped as duplicates (see
    // resolveSteps). A fallback needs its own `title`, or the heading would say
    // "Replays" while the highlight sits on "More".
    targets: [
      { id: 'replays' },
      {
        id: 'more',
        title: 'More',
        body: 'Replays, your courses, your account and Help are all under “More”. Missed a class? Recordings are under Replays.',
      },
    ],
  },
  {
    title: 'My Courses',
    body: 'Your classes and guides — open the course you enrolled in to see its sessions and materials.',
    targets: [
      { id: 'my-courses' },
      { id: 'more', title: 'More', body: 'Your enrolled courses are under “More” — tap it to see them.' },
    ],
  },
  {
    title: 'Account & Help',
    body: 'Your profile and certificates live under Account. Stuck on anything? Help has WhatsApp and email support.',
    targets: [
      { id: 'account' },
      { id: 'more', title: 'More' },
    ],
  },
  {
    title: "You're all set",
    body: 'You can replay this tour any time from Help. See you in class!',
    targets: [],
  },
];

// The first element with this data-tour id that is actually displayed.
function findVisible(id) {
  return [...document.querySelectorAll(`[data-tour="${id}"]`)].find((el) => el.getClientRects().length > 0) || null;
}

function resolveSteps() {
  const out = [];
  let lastEl = null;
  for (const step of STEPS) {
    if (step.targets.length === 0) {
      out.push({ ...step, el: null });
      lastEl = null;
      continue;
    }
    let picked = null;
    for (const t of step.targets) {
      const el = findVisible(t.id);
      if (el) {
        picked = { el, title: t.title || step.title, body: t.body || step.body };
        break;
      }
    }
    // Skip steps with nothing to point at, and don't show the same "More"
    // button twice in a row on phones.
    if (!picked || picked.el === lastEl) continue;
    out.push({ ...step, title: picked.title, body: picked.body, el: picked.el });
    lastEl = picked.el;
  }
  return out;
}

export default function DashboardTour({ userId, paused = false }) {
  const [steps, setSteps] = useState(null); // null = closed
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const cardRef = useRef(null);

  // Marked seen as soon as it is shown (not on finish) so it can never nag.
  const start = useCallback(() => {
    markSeen(userId);
    setIndex(0);
    setSteps(resolveSteps());
  }, [userId]);

  const finish = useCallback(() => setSteps(null), []);

  // Auto-start once per user, a beat after the dashboard has painted so the
  // targets exist and the page isn't fighting the first render.
  useEffect(() => {
    let seen;
    try {
      seen = localStorage.getItem(storageKey(userId)) === '1';
    } catch {
      seen = true; // can't remember it -> don't nag
    }
    // Held back while another first-login popup (e.g. create-password) is up,
    // and on phones/tablets, where it only starts when asked for (see the
    // header comment).
    if (seen || paused || !isDesktop()) return undefined;
    const id = setTimeout(start, 900);
    return () => clearTimeout(id);
  }, [userId, start, paused]);

  useEffect(() => {
    window.addEventListener(TOUR_START_EVENT, start);
    return () => window.removeEventListener(TOUR_START_EVENT, start);
  }, [start]);

  const step = steps ? steps[index] : null;

  // Keep the highlight glued to its target through scroll/resize.
  useEffect(() => {
    if (!step) return undefined;
    const measure = () => setRect(step.el ? step.el.getBoundingClientRect() : null);
    if (step.el) step.el.scrollIntoView({ block: 'nearest' });
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  useEffect(() => {
    if (!step) return undefined;
    cardRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, finish]);

  if (!step) return null;

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const CARD_W = Math.min(320, vw - 32);

  // Card placement: beside a sidebar item on desktop, above a bottom-bar item
  // on phones, below anything else; centered when there's no target.
  let cardStyle = { width: CARD_W, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  if (rect) {
    if (vw >= 1024 && rect.right < 320) {
      cardStyle = { width: CARD_W, left: rect.right + 16, top: Math.min(Math.max(rect.top - 8, 16), vh - 260) };
    } else if (rect.top > vh * 0.55) {
      cardStyle = { width: CARD_W, left: Math.min(Math.max(rect.left + rect.width / 2 - CARD_W / 2, 16), vw - CARD_W - 16), bottom: vh - rect.top + 14 };
    } else {
      cardStyle = { width: CARD_W, left: Math.min(Math.max(rect.left, 16), vw - CARD_W - 16), top: rect.bottom + 14 };
    }
  }

  return (
    <div className="fixed inset-0 z-[110]" role="presentation">
      {rect ? (
        <div
          className="fixed rounded-xl pointer-events-none transition-all duration-200"
          style={{
            left: rect.left - 4,
            top: rect.top - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: '0 0 0 9999px rgba(15,26,42,0.6), 0 0 0 3px #264D73',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(15,26,42,0.6)]" />
      )}
      {/* Click-catcher so the page underneath can't be used mid-tour. */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-tour-title"
        className="fixed bg-white dark:bg-[#131E2F] rounded-2xl p-5 shadow-[0_20px_50px_-12px_rgba(15,26,42,.55)] outline-none"
        style={cardStyle}
      >
        {/* Tap targets: the close / Skip / Back controls have a 44px hit area (the
            usual touch minimum) at every size without moving anything — padding
            grows the button and an equal negative margin takes the growth back,
            so the icon / label stays exactly where it was. The filled primary
            button is taller below `lg` (py-3) and keeps its compact desktop
            height (py-2). */}
        <button
          type="button"
          onClick={finish}
          aria-label="Skip tour"
          className="absolute top-3.5 right-3.5 -m-[13px] p-[13px] text-gray-400 hover:text-ink transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>
        <p className="text-[11px] font-bold uppercase tracking-wide text-link mb-1">
          {index + 1} of {steps.length}
        </p>
        <h2 id="dashboard-tour-title" className="font-display font-extrabold text-[17px] text-ink pr-6">{step.title}</h2>
        <p className="text-[13.5px] text-body leading-relaxed mt-1.5">{step.body}</p>
        <div className="flex items-center justify-between mt-4">
          {isFirst ? (
            <button
              type="button"
              onClick={finish}
              className="-ml-3 -my-3.5 px-3 py-3.5 text-xs font-semibold text-gray-500 hover:text-ink"
            >
              Skip tour
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((i) => i - 1)}
              className="inline-flex items-center gap-1 -ml-3 -my-3.5 px-3 py-3.5 text-xs font-semibold text-gray-500 hover:text-ink"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <button
            type="button"
            onClick={isLast ? finish : () => setIndex((i) => i + 1)}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-deep text-white text-sm font-bold px-4 py-3 lg:py-2 rounded-xl transition-colors"
          >
            {isLast ? 'Got it' : isFirst ? 'Start tour' : 'Next'}
            {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
