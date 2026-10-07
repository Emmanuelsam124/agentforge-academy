import { useEffect, useRef } from 'react';
import { Mail, Bot, GitBranch, MessageSquare, FileText, Sparkles, Brain, Zap, Check } from 'lucide-react';

// Everything here loops forever from a fully-visible first frame (CSS + SVG
// SMIL, no framer-motion mount transitions), so a prerender snapshot or a
// crawler's render pass never catches the diagram half-hidden.

// Laid out on a 1000×440 grid shared by the SVG edges and the HTML nodes;
// node sizes use cqw so both layers scale together with the container.
const W = 1000;
const H = 440;
const CYCLE = 4;

const NODES = [
  { id: 'trigger', x: 100, y: 220, icon: Mail, accent: '#F87171', title: 'New email', sub: 'Gmail trigger', delay: 0, trigger: true },
  { id: 'router', x: 545, y: 220, icon: GitBranch, accent: '#F2A93B', title: 'Route', sub: 'If urgent / else', delay: 0.58 },
  { id: 'slack', x: 760, y: 110, icon: MessageSquare, accent: '#34D399', title: 'Send reply', sub: 'Slack', delay: 0.82 },
  { id: 'notion', x: 760, y: 330, icon: FileText, accent: '#91B0D5', title: 'Log task', sub: 'Notion', delay: 0.82 },
];

const SUB_NODES = [
  { id: 'model', x: 290, y: 375, icon: Sparkles, accent: '#60A5FA', title: 'Gemini', delay: 0.3 },
  { id: 'memory', x: 370, y: 375, icon: Brain, accent: '#A4BDDC', title: 'Memory', delay: 0.3 },
];

const EDGES = [
  { d: 'M132 220 C 175 220 202 220 245 220', from: 0, to: 0.18, color: '#F87171' },
  { d: 'M415 220 C 455 220 473 220 513 220', from: 0.42, to: 0.58, color: '#A7C0DE' },
  { d: 'M577 220 C 655 220 650 110 728 110', from: 0.62, to: 0.82, color: '#34D399' },
  { d: 'M577 220 C 655 220 650 330 728 330', from: 0.62, to: 0.82, color: '#91B0D5' },
];

const SUB_EDGES = [
  { d: 'M300 252 C 300 300 290 305 290 351', from: 0.2, to: 0.4, color: '#60A5FA' },
  { d: 'M360 252 C 360 300 370 305 370 351', from: 0.2, to: 0.4, color: '#A4BDDC' },
];

const HANDLES = [
  [132, 220], [245, 220], [415, 220], [513, 220], [577, 220], [728, 110], [728, 330],
];

const RESULTS = [
  { x: 815, y: 110, text: 'Reply drafted', color: '#34D399' },
  { x: 815, y: 330, text: 'Row added', color: '#91B0D5' },
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
      <circle r="9" fill={color} opacity="0.35" filter="url(#afd-glow)" />
      <circle r="4" fill="#fff" />
      <animateMotion dur={`${CYCLE}s`} repeatCount="indefinite" calcMode="linear" path={d} {...motion} />
      <animate attributeName="opacity" dur={`${CYCLE}s`} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={fade} />
    </g>
  );
}

// transform/opacity only, so the pulse stays on the compositor instead of
// repainting a box-shadow every frame.
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
      {sub && <div className="text-[#A2B1C3] leading-tight mt-0.5" style={{ fontSize: 'clamp(9px, 1.1cqw, 11.5px)' }}>{sub}</div>}
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
            background: '#1B2A3E',
            boxShadow: `0 10px 24px -10px ${accent}80, inset 0 1px 0 rgba(255,255,255,.06)`,
          }}
        >
          <Icon style={{ width: '2.7cqw', height: '2.7cqw', color: accent }} strokeWidth={2.2} />
        </div>
        {trigger && (
          <span className="absolute -top-[0.9cqw] -left-[0.9cqw] w-[2.4cqw] h-[2.4cqw] rounded-full bg-[#F2A93B] flex items-center justify-center shadow-[0_4px_10px_rgba(245,217,10,.45)]">
            <Zap style={{ width: '1.4cqw', height: '1.4cqw' }} className="text-[#0F1A2A]" fill="currentColor" />
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
          style={{ borderColor: `${accent}B3`, background: '#1B2A3E' }}
        >
          <Icon style={{ width: '2cqw', height: '2cqw', color: accent }} strokeWidth={2.2} />
        </div>
      </div>
      <NodeLabel title={title} />
    </div>
  );
}

function AgentNode() {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(330, 220)}>
      <div className="relative w-[17cqw] h-[6.4cqw] rounded-[1.3cqw]">
        <Ping color="#A7C0DE99" delay={0.18} scale={1.15} />
        <div
          className="absolute inset-0 rounded-[1.3cqw] border-[1.5px] border-[#A7C0DE] flex items-center gap-[1.1cqw] px-[1.2cqw]"
          style={{
            background: '#1B2A3E',
            boxShadow: '0 14px 32px -10px rgba(15,26,42,.7), inset 0 1px 0 rgba(255,255,255,.08)',
          }}
        >
          <div className="w-[4cqw] h-[4cqw] rounded-[1cqw] flex-shrink-0 flex items-center justify-center bg-brand animate-node-breathe">
            <Bot style={{ width: '2.3cqw', height: '2.3cqw' }} className="text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 whitespace-nowrap">
            <div className="font-display font-extrabold text-white leading-tight" style={{ fontSize: 'clamp(11px, 1.45cqw, 15px)' }}>AI Agent</div>
            <div className="flex items-center gap-1 text-[#D5DEE9] leading-tight mt-0.5" style={{ fontSize: 'clamp(9px, 1.1cqw, 11.5px)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" /> Thinking…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AutomationFlowDiagram() {
  const rootRef = useRef(null);

  // Pause everything while scrolled out of view, and restart the SMIL and CSS
  // clocks together so packets arrive in step with the node pulses.
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
      aria-label="Animated automation workflow: a new Gmail email triggers an AI agent, which uses Gemini and memory to decide, then routes the task to send a Slack reply and log it in Notion."
      className="relative rounded-[24px] overflow-hidden border border-white/10 bg-[#0F1A2A] shadow-[0_30px_60px_-24px_rgba(15,26,42,.6)]"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'transparent',
        }}
      />

      <div className="relative flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/10 bg-white/[.03]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[12.5px] font-semibold text-[#D5DEE9] truncate">inbox-triage-agent</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline text-[11.5px] text-[#7A8CA0]">Runs automatically, 24/7</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/25 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" /> Active
          </span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="relative min-w-[600px]" style={{ containerType: 'inline-size' }}>
          {/* See AgentsLiveFlowDiagram.jsx's identical comment — a
              padding-top spacer instead of `aspect-[1000/440]`, since that
              shorthand needs the browser to derive height from an
              aspect-ratio on a non-replaced element that also establishes
              size containment (container-type: inline-size), which at
              least one real device rendered as a blank box. */}
          <div style={{ paddingTop: `${(H / W) * 100}%` }} />
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
            <defs>
              <pattern id="afd-grid" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="11" cy="11" r="1.2" fill="rgba(255,255,255,.09)" />
              </pattern>
              <filter id="afd-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>

            <rect width={W} height={H} fill="url(#afd-grid)" />

            {EDGES.map((e) => (
              <g key={e.d}>
                <path d={e.d} fill="none" stroke="#86B4E6" strokeWidth="6" strokeOpacity="0.14" strokeLinecap="round" />
                <path d={e.d} fill="none" stroke="#86B4E6" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="7 5" className="animate-dash-flow" />
              </g>
            ))}
            {SUB_EDGES.map((e) => (
              <path key={e.d} d={e.d} fill="none" stroke={e.color} strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="3 5" strokeLinecap="round" />
            ))}

            {HANDLES.map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" fill="#0F1A2A" stroke="#7A8CA0" strokeWidth="1.5" />
            ))}

            {EDGES.map((e) => <Packet key={e.d} {...e} />)}
            {SUB_EDGES.map((e) => <Packet key={e.d} {...e} roundTrip />)}
          </svg>

          {NODES.map((n) => <FlowNode key={n.id} {...n} />)}
          {SUB_NODES.map((n) => <SubNode key={n.id} {...n} />)}
          <AgentNode />

          {RESULTS.map((r, i) => (
            <div key={r.text} className="absolute -translate-y-1/2" style={pct(r.x, r.y)}>
              <div
                className="flex items-center gap-[0.6cqw] rounded-full border px-[1cqw] py-[0.5cqw] bg-[#131E2F]/90 backdrop-blur animate-floaty whitespace-nowrap"
                style={{ borderColor: `${r.color}55`, animationDelay: `${i * 0.8}s` }}
              >
                <span className="w-[1.7cqw] h-[1.7cqw] rounded-full flex items-center justify-center" style={{ background: r.color }}>
                  <Check style={{ width: '1.1cqw', height: '1.1cqw' }} className="text-[#0F1A2A]" strokeWidth={3} />
                </span>
                <span className="font-bold text-white" style={{ fontSize: 'clamp(9.5px, 1.15cqw, 12px)' }}>{r.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-3 flex-wrap px-4 sm:px-5 py-3 border-t border-white/10 text-[11.5px] text-[#7A8CA0]">
        <span className="inline-flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-[#34D399]" strokeWidth={3} /> Last run succeeded · 5 steps · 1.4s
        </span>
        <span className="sm:hidden">Swipe to see the full flow →</span>
      </div>
    </div>
  );
}
