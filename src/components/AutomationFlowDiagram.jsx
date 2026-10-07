import { useRef } from 'react';
import { Mail, Bot, GitBranch, MessageSquare, FileText, Sparkles, Brain, Zap, Check } from 'lucide-react';
import FlowDot from './FlowDot';
import { useFlowPause } from '../hooks/useFlowPause';

// One agent, one email: a drawing of the flow, not a live run. The only motion
// is a small dot that travels each connection in turn (email, agent, route,
// then the two results), once every 6 seconds; nothing pulses, floats or glows,
// and there is no made-up run log or uptime claim (the old version had "Active",
// "Last run succeeded" and a 24/7 line). The caption on the page says it is an
// illustration.
//
// Laid out on a 1000×440 grid shared by the SVG edges and the HTML nodes; node
// sizes use cqw so both layers scale together with the container.
const W = 1000;
const H = 440;

const pct = (x, y) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

// Right-pointing arrowhead whose tip sits at (x, y).
const arrow = (x, y) => `${x - 8},${y - 5} ${x},${y} ${x - 8},${y + 5}`;

function Label({ title, sub }) {
  return (
    <div className="absolute left-1/2 top-full -translate-x-1/2 mt-[1.1cqw] text-center whitespace-nowrap">
      <div className="font-display font-bold text-ink leading-tight" style={{ fontSize: 'clamp(11px, 1.35cqw, 14px)' }}>{title}</div>
      {sub && <div className="text-body leading-tight mt-0.5" style={{ fontSize: 'clamp(10px, 1.15cqw, 12px)' }}>{sub}</div>}
    </div>
  );
}

function Node({ x, y, icon: Icon, title, sub, shape = 'rounded-[1.3cqw]', badge = false }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(x, y)}>
      <div className={`relative w-[6.4cqw] h-[6.4cqw] bg-surface border-[1.5px] border-brand flex items-center justify-center text-link ${shape}`}>
        <Icon style={{ width: '2.4cqw', height: '2.4cqw' }} />
        {badge && (
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

export default function AutomationFlowDiagram() {
  const rootRef = useRef(null);
  useFlowPause(rootRef);
  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="Diagram of one agent: a new Gmail email triggers an AI agent, which uses Gemini and memory to decide, then routes the task to send a Slack reply and log a task in Notion."
      className="relative rounded-2xl border border-border bg-surface overflow-x-auto"
    >
      <div className="relative min-w-[600px]" style={{ containerType: 'inline-size' }}>
        <div style={{ paddingTop: `${(H / W) * 100}%` }} />
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
          <g fill="none" stroke="var(--color-link)" strokeWidth="2.2" strokeLinecap="round">
            <path d="M132 220H237" />
            <path d="M415 220H505" />
            <path d="M577 220H650M650 110V330M650 110H720M650 330H720" />
            <path d="M290 252V351M370 252V351" strokeWidth="1.6" strokeDasharray="4 5" />
          </g>
          <g fill="var(--color-link)">
            <polygon points={arrow(245, 220)} />
            <polygon points={arrow(513, 220)} />
            <polygon points={arrow(728, 110)} />
            <polygon points={arrow(728, 330)} />
          </g>
          <FlowDot d="M132 220H245" from={0.02} to={0.2} />
          <FlowDot d="M415 220H513" from={0.26} to={0.44} />
          <FlowDot d="M577 220H650V110H728" from={0.5} to={0.74} />
          <FlowDot d="M577 220H650V330H728" from={0.5} to={0.74} />
        </svg>

        <Node x={100} y={220} icon={Mail} title="New email" sub="Gmail trigger" shape="rounded-[3.2cqw_1.3cqw_1.3cqw_3.2cqw]" badge />

        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pct(330, 220)}>
          <div className="w-[17cqw] h-[6.4cqw] rounded-[1.3cqw] bg-brand flex items-center gap-[1.1cqw] px-[1.2cqw]">
            <div className="w-[4cqw] h-[4cqw] rounded-[1cqw] flex-shrink-0 flex items-center justify-center bg-yellow text-[#0F1A2A]">
              <Bot style={{ width: '2.3cqw', height: '2.3cqw' }} />
            </div>
            <div className="min-w-0 whitespace-nowrap">
              <div className="font-display font-extrabold text-white leading-tight" style={{ fontSize: 'clamp(12px, 1.5cqw, 15px)' }}>AI Agent</div>
              <div className="text-white/85 leading-tight mt-0.5" style={{ fontSize: 'clamp(10px, 1.15cqw, 12px)' }}>Reads, decides</div>
            </div>
          </div>
        </div>

        <Node x={545} y={220} icon={GitBranch} title="Route" sub="If urgent / else" />
        <Node x={760} y={110} icon={MessageSquare} title="Send reply" sub="Slack" />
        <Node x={760} y={330} icon={FileText} title="Log task" sub="Notion" />
        <SubNode x={290} y={375} icon={Sparkles} title="Gemini" />
        <SubNode x={370} y={375} icon={Brain} title="Memory" />
        <Result x={815} y={110} text="Reply drafted" />
        <Result x={815} y={330} text="Row added" />
      </div>
    </div>
  );
}
