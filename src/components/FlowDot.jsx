// One small dot that travels along a single connection of a flow diagram, once
// per cycle, then waits. This is the only motion the diagrams have: no pulsing
// nodes, floating chips or glows. `d` is the connection's path (ending at the
// arrow tip); `from` and `to` are fractions of the cycle (0 to 1, with `to` below
// 1) during which the dot is visible and moving, so a diagram can run its steps
// in order. It sits at opacity 0 until its turn, so the first frame (and the
// prerendered snapshot) is the complete static drawing. SMIL, not CSS offset-path:
// it moves an SVG element along a path in every current browser. The
// `.flow-dot` rule in index.css hides these for visitors who ask for reduced
// motion, and useFlowPause pauses them while the diagram is off screen.
export default function FlowDot({ d, from, to, dur = 6 }) {
  const fade = `0;${from};${from + 0.03};${to - 0.03};${to};1`;
  return (
    <g className="flow-dot" opacity="0" aria-hidden="true">
      <circle r="4" strokeWidth="1.5" className="fill-yellow stroke-surface" />
      <animateMotion
        dur={`${dur}s`}
        repeatCount="indefinite"
        calcMode="linear"
        path={d}
        keyPoints="0;0;1;1"
        keyTimes={`0;${from};${to};1`}
      />
      <animate
        attributeName="opacity"
        dur={`${dur}s`}
        repeatCount="indefinite"
        values="0;0;1;1;0;0"
        keyTimes={fade}
      />
    </g>
  );
}
