import { useEffect, useRef } from 'react';
import { Send, MessageCircle, Bot, Sparkles, Brain, Zap, Check, Search, PenLine, ListChecks } from 'lucide-react';

// Same engineering pattern as AutomationFlowDiagram.jsx (the homepage's
// automation-flow showcase): everything loops forever from a fully-visible
// first frame (CSS + SVG SMIL, no framer-motion mount transitions), so a
// prerender snapshot or a crawler's render pass never catches it half-hidden.
// A dedicated component rather than a generalized/shared one — the shape
// (2 triggers fanning into a hub, then fanning out to 3 board agents) is
// different enough from the homepage's single-branch layout that sharing
// would mean threading a pile of position/color props through it.

const W = 1000;
const H = 440;
const CYCLE = 5;

// Two message channels feeding the same hub — this is Day 1 of the
// workshop. Telegram/WhatsApp accent colors are the real brand colors,
// used only as accents (no logos), same way the rest of the page names
// the channels directly without naming the underlying agent framework.
const TRIGGERS = [
  { id: 'telegram', x: 95, y: 130, icon: Send, accent: '#29B6F6', title: 'New message', sub: 'Telegram', delay: 0, trigger: true },
  { id: 'whatsapp', x: 95, y: 310, icon: MessageCircle, accent: '#25D366', title: 'New message', sub: 'WhatsApp', delay: 0.03, trigger: true },
];

// The multi-agent dashboard — Day 2. Three agents sharing one task board,
// each with its own job, feeding off the same hub.
const BOARD_AGENTS = [
  { id: 'research', x: 650, y: 100, icon: Search, accent: '#60A5FA', title: 'Research agent', sub: 'Gathering context', delay: 0.5 },
  { id: 'reply', x: 650, y: 220, icon: PenLine, accent: '#F5D90A', title: 'Reply agent', sub: 'Drafting response', delay: 0.5 },
  { id: 'ops', x: 650, y: 340, icon: ListChecks, accent: '#34D399', title: 'Ops agent', sub: 'Logging task', delay: 0.5 },
];

const SUB_NODES = [
  { id: 'model', x: 290, y: 375, icon: Sparkles, accent: '#60A5FA', title: 'Model', delay: 0.3 },
  { id: 'memory', x: 370, y: 375, icon: Brain, accent: '#C084FC', title: 'Memory', delay: 0.3 },
];

const EDGES = [
  { d: 'M127 130 C 175 130 205 165 248 192', from: 0, to: 0.16, color: '#29B6F6' },
  { d: 'M127 310 C 175 310 205 275 248 248', from: 0.02, to: 0.18, color: '#25D366' },
  { d: 'M412 196 C 480 160 555 122 626 100', from: 0.42, to: 0.62, color: '#60A5FA' },
  { d: 'M415 220 C 480 220 555 220 626 220', from: 0.42, to: 0.62, color: '#F5D90A' },
  { d: 'M412 244 C 480 280 555 318 626 340', from: 0.42, to: 0.62, color: '#34D399' },
];

const SUB_EDGES = [
  { d: 'M300 252 C 300 300 290 305 290 351', from: 0.2, to: 0.4, color: '#60A5FA' },
  { d: 'M360 252 C 360 300 370 305 370 351', from: 0.2, to: 0.4, color: '#C084FC' },
];

const HANDLES = [
  [127, 130], [127, 310], [248, 192], [248, 248], [412, 196], [415, 220], [412, 244], [626, 100], [626, 220], [626, 340],
];

const RESULTS = [
  { x: 800, y: 100, text: 'Lead researched', color: '#60A5FA' },
  { x: 800, y: 220, text: 'Reply sent', color: '#F5D90A' },
  { x: 800, y: 340, text: 'Task logged', color: '#34D399' },
];

const pct = (x, y) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

function Packet({ d, from, to, color, roundTrip }) {
  const mid = (from + to) / 2;
  const motion = roundTrip
    ? { keyPoints: '0;0;1;0;0', keyTimes: `0;${from};${mid};${to};1` }
    : { keyPoints: '0;0;1;1', keyTimes: `0;${from};${to};1` };
  const fade = `0;${from};${from + 0.02};${to - 0.02};${to};1`;
  return (
    <g className="flow-packet" opacity="0">
      <circle r="9" fill={color} opacity="0.35" filter="url(#ald-glow)" />
      <circle r="4" fill="#fff" />
      <animateMotion dur={`${CYCLE}s`} repeatCount="indefinite" calcMode="linear" path={d} {...motion} />
      <animate attributeName="opacity" dur={`${CYCLE}s`} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={fade} />
    </g>
  );
}

function Ping({ color, delay, scale = 1.4 }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 animate-node-ping"
      style={{ borderRadius: 'inherit', background: color, animationDelay: `${delay * CYCLE}s`, '--ping-scale': scale }}
    />
  );
}

function NodeLabel({ title, sub }) {
  return (
    <div className="absolute left-1/2 top-full -translate-x-1/2 mt-[1.1cqw] text-center whitespace-nowrap">
      <div className="font-display font-bold text-white leading-tight" style={{ fontSize: 'clamp(10px, 1.3cqw, 13.5px)' }}>{title}</div>
      {sub && <div className="text-[#A99BD6] leading-tight mt-0.5" style={{ fontSize: 'clamp(9px, 1.1cqw, 11.5px)' }}>{sub}</div>}
    </div>
  );
}

function FlowNode({ x, y, icon: Icon, accent, title, sub, delay, trigger }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(x, y)}>
      <div
        className="relative w-[6.4cqw] h-[6.4cqw]"
        style={{ borderRadius: trigger ? '3.2cqw 1.3cqw 1.3cqw 3.2cqw' : '1.3cqw' }}
      >
        <Ping color={`${accent}99`} delay={delay} />
        <div
          className="absolute inset-0 flex items-center justify-center border-[1.5px]"
          style={{
            borderRadius: 'inherit',
            borderColor: `${accent}B3`,
            background: 'linear-gradient(145deg, #2C2350 0%, #1B1433 100%)',
            boxShadow: `0 10px 24px -10px ${accent}80, inset 0 1px 0 rgba(255,255,255,.06)`,
          }}
        >
          <Icon style={{ width: '2.7cqw', height: '2.7cqw', color: accent }} strokeWidth={2.2} />
        </div>
        {trigger && (
          <span className="absolute -top-[0.9cqw] -left-[0.9cqw] w-[2.4cqw] h-[2.4cqw] rounded-full bg-[#F5D90A] flex items-center justify-center shadow-[0_4px_10px_rgba(245,217,10,.45)]">
            <Zap style={{ width: '1.4cqw', height: '1.4cqw' }} className="text-[#1A1333]" fill="currentColor" />
          </span>
        )}
      </div>
      <NodeLabel title={title} sub={sub} />
    </div>
  );
}

function SubNode({ x, y, icon: Icon, accent, title, delay }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(x, y)}>
      <div className="relative w-[4.8cqw] h-[4.8cqw] rounded-full">
        <Ping color={`${accent}99`} delay={delay} scale={1.5} />
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center border-[1.5px] border-dashed"
          style={{ borderColor: `${accent}B3`, background: 'linear-gradient(145deg, #2C2350 0%, #1B1433 100%)' }}
        >
          <Icon style={{ width: '2cqw', height: '2cqw', color: accent }} strokeWidth={2.2} />
        </div>
      </div>
      <NodeLabel title={title} />
    </div>
  );
}

function HubNode() {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(330, 220)}>
      <div className="relative w-[17cqw] h-[6.4cqw] rounded-[1.3cqw]">
        <Ping color="#A78BFA99" delay={0.18} scale={1.15} />
        <div
          className="absolute inset-0 rounded-[1.3cqw] border-[1.5px] border-[#A78BFA] flex items-center gap-[1.1cqw] px-[1.2cqw]"
          style={{
            background: 'linear-gradient(135deg, #3B2A6E 0%, #221941 60%, #1B1433 100%)',
            boxShadow: '0 14px 32px -10px rgba(124,58,237,.7), inset 0 1px 0 rgba(255,255,255,.08)',
          }}
        >
          <div className="w-[4cqw] h-[4cqw] rounded-[1cqw] flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#9D5CFF] to-[#7C3AED] animate-node-breathe">
            <Bot style={{ width: '2.3cqw', height: '2.3cqw' }} className="text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 whitespace-nowrap">
            <div className="font-display font-extrabold text-white leading-tight" style={{ fontSize: 'clamp(11px, 1.45cqw, 15px)' }}>Your agent</div>
            <div className="flex items-center gap-1 text-[#C9BFE8] leading-tight mt-0.5" style={{ fontSize: 'clamp(9px, 1.1cqw, 11.5px)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" /> Coordinating…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentsLiveFlowDiagram() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const svg = root.querySelector('svg');
    svg.setCurrentTime(0);
    root.getAnimations({ subtree: true }).forEach((a) => { a.currentTime = 0; });

    const io = new IntersectionObserver(([entry]) => {
      root.dataset.flowPaused = String(!entry.isIntersecting);
      if (entry.isIntersecting) svg.unpauseAnimations();
      else svg.pauseAnimations();
    });
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="Animated diagram: a message on Telegram or WhatsApp reaches your AI agent, which coordinates a team of agents sharing one dashboard — one researches, one drafts the reply, one logs the task — each confirming when it's done."
      className="relative rounded-[24px] overflow-hidden border border-white/10 bg-[#130E24] shadow-[0_30px_60px_-24px_rgba(80,40,160,.6)]"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 70% at 30% 45%, rgba(124,58,237,.28) 0%, transparent 70%), radial-gradient(45% 55% at 88% 75%, rgba(52,211,153,.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/10 bg-white/[.03]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[12.5px] font-semibold text-[#C9BFE8] truncate">agent-team.dashboard</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline text-[11.5px] text-[#8E82B8]">Runs automatically, 24/7</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/25 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" /> Active
          </span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="relative min-w-[600px] aspect-[1000/440]" style={{ containerType: 'inline-size' }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
            <defs>
              <pattern id="ald-grid" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="11" cy="11" r="1.2" fill="rgba(255,255,255,.09)" />
              </pattern>
              <filter id="ald-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
              <linearGradient id="ald-flow" gradientUnits="userSpaceOnUse" x1="95" y1="0" x2="800" y2="0">
                <stop offset="0%" stopColor="#29B6F6" />
                <stop offset="18%" stopColor="#25D366" />
                <stop offset="48%" stopColor="#A78BFA" />
                <stop offset="74%" stopColor="#F5D90A" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>

            <rect width={W} height={H} fill="url(#ald-grid)" />

            {/* Dashboard panel — groups the 3 board agents visually so the
                "multi-agent dashboard" reads as one shared surface, not
                three unrelated branches. */}
            <rect x="565" y="40" width="390" height="360" rx="18" fill="rgba(167,139,250,.05)" stroke="#A78BFA" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="6 6" />

            {EDGES.map((e) => (
              <g key={e.d}>
                <path d={e.d} fill="none" stroke="url(#ald-flow)" strokeWidth="6" strokeOpacity="0.14" strokeLinecap="round" />
                <path d={e.d} fill="none" stroke="url(#ald-flow)" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="7 5" className="animate-dash-flow" />
              </g>
            ))}
            {SUB_EDGES.map((e) => (
              <path key={e.d} d={e.d} fill="none" stroke={e.color} strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="3 5" strokeLinecap="round" />
            ))}

            {HANDLES.map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" fill="#130E24" stroke="#8E82B8" strokeWidth="1.5" />
            ))}

            {EDGES.map((e) => <Packet key={e.d} {...e} />)}
            {SUB_EDGES.map((e) => <Packet key={e.d} {...e} roundTrip />)}
          </svg>

          <span
            className="absolute font-bold uppercase tracking-wide text-[#A78BFA] bg-[#130E24] px-[0.8cqw]"
            style={{ ...pct(575, 40), fontSize: 'clamp(8.5px, 1cqw, 10.5px)' }}
          >
            Multi-agent dashboard
          </span>

          {TRIGGERS.map((n) => <FlowNode key={n.id} {...n} />)}
          {BOARD_AGENTS.map((n) => <FlowNode key={n.id} {...n} />)}
          {SUB_NODES.map((n) => <SubNode key={n.id} {...n} />)}
          <HubNode />

          {RESULTS.map((r, i) => (
            <div key={r.text} className="absolute -translate-y-1/2" style={pct(r.x, r.y)}>
              <div
                className="flex items-center gap-[0.6cqw] rounded-full border px-[1cqw] py-[0.5cqw] bg-[#1B1433]/90 backdrop-blur animate-floaty whitespace-nowrap"
                style={{ borderColor: `${r.color}55`, animationDelay: `${i * 0.8}s` }}
              >
                <span className="w-[1.7cqw] h-[1.7cqw] rounded-full flex items-center justify-center" style={{ background: r.color }}>
                  <Check style={{ width: '1.1cqw', height: '1.1cqw' }} className="text-[#130E24]" strokeWidth={3} />
                </span>
                <span className="font-bold text-white" style={{ fontSize: 'clamp(9.5px, 1.15cqw, 12px)' }}>{r.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-3 flex-wrap px-4 sm:px-5 py-3 border-t border-white/10 text-[11.5px] text-[#8E82B8]">
        <span className="inline-flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-[#34D399]" strokeWidth={3} /> Last run succeeded · 6 steps · 2.1s
        </span>
        <span className="sm:hidden">Swipe to see the full flow →</span>
      </div>
    </div>
  );
}
