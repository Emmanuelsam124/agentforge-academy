import { useRef } from 'react';
import { Send, MessageCircle, Bot, Sparkles, Brain, Zap, Check, Search, PenLine, ListChecks } from 'lucide-react';
import FlowDot from './FlowDot';
import { useFlowPause } from '../hooks/useFlowPause';

// The AI Agent Mastery page's system diagram, drawn the same way as the
// homepage's AutomationFlowDiagram: theme colours, solid arrows, and one small
// dot that travels each connection in turn (the two channels into the agent,
// then the agent out to the three board agents), once every 6 seconds. Two
// message channels reach one agent (Day 1), which hands work to three agents
// sharing a dashboard (Day 2). It used to pulse, float and glow, and carried a
// made-up run log ("Runs automatically, 24/7", "Last run succeeded · 6 steps ·
// 2.1s"); the pulsing and the log are gone, and the page captions it as an
// illustration. The component keeps its old AgentsLive name; renaming it is
// churn with no user impact.
//
// Laid out on a 1000×440 grid shared by the SVG edges and the HTML nodes; node
// sizes use cqw so both layers scale together with the container.
const W = 1000;
const H = 440;

const pct = (x, y) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

// Right-pointing arrowhead whose tip sits at (x, y).
const arrow = (x, y) => `${x - 8},${y - 5} ${x},${y} ${x - 8},${y + 5}`;

const TRIGGERS = [
  { x: 95, y: 130, icon: Send, title: 'New message', sub: 'Telegram' },
  { x: 95, y: 310, icon: MessageCircle, title: 'New message', sub: 'WhatsApp' },
];

const BOARD_AGENTS = [
  { x: 650, y: 100, icon: Search, title: 'Research agent', sub: 'Gathering context', result: 'Lead researched' },
  { x: 650, y: 220, icon: PenLine, title: 'Reply agent', sub: 'Drafting response', result: 'Reply sent' },
  { x: 650, y: 340, icon: ListChecks, title: 'Ops agent', sub: 'Logging task', result: 'Task logged' },
];

const SUB_NODES = [
  { x: 290, y: 375, icon: Sparkles, title: 'Model' },
  { x: 370, y: 375, icon: Brain, title: 'Memory' },
];

function Label({ title, sub }) {
  return (
    <div className="absolute left-1/2 top-full -translate-x-1/2 mt-[1.1cqw] text-center whitespace-nowrap">
      <div className="font-display font-bold text-ink leading-tight" style={{ fontSize: 'clamp(10px, 1.3cqw, 13.5px)' }}>{title}</div>
      {sub && <div className="text-body leading-tight mt-0.5" style={{ fontSize: 'clamp(9px, 1.1cqw, 11.5px)' }}>{sub}</div>}
    </div>
  );
}

function Node({ x, y, icon: Icon, title, sub, trigger = false }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(x, y)}>
      <div
        className={`relative w-[6.4cqw] h-[6.4cqw] bg-surface border-[1.5px] border-brand flex items-center justify-center text-link ${
          trigger ? 'rounded-[3.2cqw_1.3cqw_1.3cqw_3.2cqw]' : 'rounded-[1.3cqw]'
        }`}
      >
        <Icon style={{ width: '2.4cqw', height: '2.4cqw' }} />
        {trigger && (
          <span className="absolute -top-[0.9cqw] -left-[0.9cqw] w-[2.4cqw] h-[2.4cqw] rounded-full bg-yellow flex items-center justify-center text-[#0F1A2A]">
            <Zap style={{ width: '1.4cqw', height: '1.4cqw' }} />
          </span>
        )}
      </div>
      <Label title={title} sub={sub} />
    </div>
  );
}

function SubNode({ x, y, icon: Icon, title }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(x, y)}>
      <div className="w-[4.8cqw] h-[4.8cqw] rounded-full bg-surface border-[1.5px] border-dashed border-brand flex items-center justify-center text-link">
        <Icon style={{ width: '2cqw', height: '2cqw' }} />
      </div>
      <Label title={title} />
    </div>
  );
}

function Result({ x, y, text }) {
  return (
    <div className="absolute -translate-y-1/2" style={pct(x, y)}>
      <div className="flex items-center gap-[0.6cqw] rounded-full border border-border bg-surface px-[1cqw] py-[0.5cqw] whitespace-nowrap">
        <span className="w-[1.9cqw] h-[1.9cqw] rounded-full bg-green flex items-center justify-center text-white">
          <Check style={{ width: '1.2cqw', height: '1.2cqw' }} strokeWidth={2.5} />
        </span>
        <span className="font-bold text-ink" style={{ fontSize: 'clamp(10px, 1.2cqw, 13px)' }}>{text}</span>
      </div>
    </div>
  );
}

export default function AgentsLiveFlowDiagram() {
  const rootRef = useRef(null);
  useFlowPause(rootRef);
  return (
    <>
      <div
        ref={rootRef}
        role="img"
        aria-label="Diagram of the system you build: a message on Telegram or WhatsApp reaches your AI agent, which uses a model and memory and hands work to three agents on one shared dashboard. One researches, one drafts the reply, and one logs the task."
        className="relative rounded-2xl border border-border bg-surface overflow-x-auto"
      >
        <div className="relative min-w-[600px]" style={{ containerType: 'inline-size' }}>
          {/* A normal-flow spacer whose percentage padding resolves against the
              container's width, in every browser. Deliberately not
              `aspect-[1000/440]`: that needs the engine to derive a height from an
              aspect ratio on a non-replaced element that also has
              container-type: inline-size, a combination engines have
              disagreed on. */}
          <div style={{ paddingTop: `${(H / W) * 100}%` }} />
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
            {/* The dashboard panel that groups the three board agents */}
            <rect x="565" y="40" width="390" height="388" rx="16" fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" strokeDasharray="6 6" />
            <g fill="none" stroke="var(--color-link)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M127 130 C 185 130 185 196 237 196" />
              <path d="M127 310 C 185 310 185 244 237 244" />
              <path d="M415 196 C 500 196 530 100 610 100" />
              <path d="M415 220 H610" />
              <path d="M415 244 C 500 244 530 340 610 340" />
              <path d="M290 252V351M370 252V351" strokeWidth="1.6" strokeDasharray="4 5" />
            </g>
            <g fill="var(--color-link)">
              <polygon points={arrow(245, 196)} />
              <polygon points={arrow(245, 244)} />
              <polygon points={arrow(618, 100)} />
              <polygon points={arrow(618, 220)} />
              <polygon points={arrow(618, 340)} />
            </g>
            <FlowDot d="M127 130 C 185 130 185 196 237 196 H245" from={0.02} to={0.2} />
            <FlowDot d="M127 310 C 185 310 185 244 237 244 H245" from={0.08} to={0.26} />
            <FlowDot d="M415 196 C 500 196 530 100 610 100 H618" from={0.4} to={0.62} />
            <FlowDot d="M415 220 H618" from={0.4} to={0.62} />
            <FlowDot d="M415 244 C 500 244 530 340 610 340 H618" from={0.4} to={0.62} />
          </svg>

          <span
            className="absolute -translate-y-1/2 bg-surface px-[0.8cqw] font-semibold text-body"
            style={{ ...pct(575, 40), fontSize: 'clamp(9px, 1.15cqw, 12px)' }}
          >
            Multi-agent dashboard
          </span>

          {TRIGGERS.map((n) => <Node key={n.sub} {...n} trigger />)}

          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(330, 220)}>
            <div className="w-[17cqw] h-[6.4cqw] rounded-[1.3cqw] bg-brand flex items-center gap-[1.1cqw] px-[1.2cqw]">
              <div className="w-[4cqw] h-[4cqw] rounded-[1cqw] flex-shrink-0 flex items-center justify-center bg-yellow text-[#0F1A2A]">
                <Bot style={{ width: '2.3cqw', height: '2.3cqw' }} />
              </div>
              <div className="min-w-0 whitespace-nowrap">
                <div className="font-display font-extrabold text-white leading-tight" style={{ fontSize: 'clamp(11px, 1.45cqw, 15px)' }}>Your agent</div>
                <div className="text-white/85 leading-tight mt-0.5" style={{ fontSize: 'clamp(9px, 1.1cqw, 11.5px)' }}>Coordinating</div>
              </div>
            </div>
          </div>

          {BOARD_AGENTS.map((a) => <Node key={a.title} x={a.x} y={a.y} icon={a.icon} title={a.title} sub={a.sub} />)}
          {SUB_NODES.map((n) => <SubNode key={n.title} {...n} />)}
          {BOARD_AGENTS.map((a) => <Result key={a.result} x={800} y={a.y} text={a.result} />)}
        </div>
      </div>
      <p className="mt-2.5 text-[13px] text-body text-center">
        Illustration of the system you'll build.
        <span className="sm:hidden"> Swipe to see the full flow.</span>
      </p>
    </>
  );
}
