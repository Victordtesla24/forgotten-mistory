'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * PacketFlowGraph — WebSocket packet-flow visualisation for telemetry-server /
 * tesla-api / ride-with-vic-app project cards (SPEC §7 #2). Force-directed SVG
 * graph with particles travelling along edges and a real readout animating to
 * resume-sourced values (P95 < 200 ms, 10 k devices).
 *
 * Colours: CSS tokens only (no raw hex). Reduced-motion fallback shows a static
 * graph with final values (no particles, no animation).
 */

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
  path: string;
}

const NODES: Node[] = [
  { id: 'device', label: 'Device', x: 40, y: 110 },
  { id: 'edge', label: 'Edge', x: 110, y: 50 },
  { id: 'gateway', label: 'API Gateway', x: 180, y: 110 },
  { id: 'metrics', label: 'Metrics Engine', x: 250, y: 50 },
  { id: 'alert', label: 'Alert Bus', x: 290, y: 130 },
];

const EDGES: Edge[] = [
  { from: 'device', to: 'edge', path: 'M50,110 Q80,70 110,55' },
  { from: 'edge', to: 'gateway', path: 'M120,55 Q145,80 175,105' },
  { from: 'gateway', to: 'metrics', path: 'M190,105 Q215,70 245,55' },
  { from: 'gateway', to: 'alert', path: 'M195,115 Q230,130 280,130' },
  { from: 'metrics', to: 'alert', path: 'M260,60 Q280,90 285,125' },
];

const P95_FINAL = 198;
const DEVICES_FINAL = 10000;

function useCountUp(target: number, duration: number, enabled: boolean) {
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);

  return value;
}

export default function PacketFlowGraph({ className = '' }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const animateReadout = inView && !prefersReducedMotion;
  const p95 = useCountUp(P95_FINAL, 1200, animateReadout);
  const devices = useCountUp(DEVICES_FINAL, 1200, animateReadout);

  return (
    <div
      ref={containerRef}
      data-testid="packet-flow-graph"
      className={`packet-flow-graph ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      <svg
        viewBox="0 0 320 180"
        className="packet-flow-svg"
        role="img"
        aria-label="WebSocket packet flow graph"
      >
        <defs>
          <linearGradient id="pfg-edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--mist-400)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--steel)" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Edges */}
        <g className="pfg-edges">
          {EDGES.map((edge) => (
            <path
              key={`${edge.from}-${edge.to}`}
              d={edge.path}
              fill="none"
              stroke="url(#pfg-edge-grad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Particles (animated only if motion allowed) */}
        {!prefersReducedMotion &&
          EDGES.map((edge, idx) => (
            <circle
              key={`particle-${edge.from}-${edge.to}`}
              r="3"
              fill="var(--white)"
              opacity="0.85"
              className="pfg-particle"
            >
              <animateMotion
                dur={`${1.8 + idx * 0.3}s`}
                repeatCount="indefinite"
                path={edge.path}
                begin={`${idx * 0.4}s`}
              />
            </circle>
          ))}

        {/* Nodes */}
        <g className="pfg-nodes">
          {NODES.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <circle r="14" fill="var(--ink-700)" stroke="var(--steel)" strokeWidth="1.5" />
              <text
                y="28"
                textAnchor="middle"
                fill="var(--mist-200)"
                fontSize="8"
                fontFamily="var(--font-mono)"
              >
                {node.label}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Readout */}
      <div data-testid="pfg-readout" className="pfg-readout">
        <motion.span
          className="pfg-stat"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          P95 &lt; {p95} ms
        </motion.span>
        <span className="pfg-sep">·</span>
        <motion.span
          className="pfg-stat"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {devices.toLocaleString()} devices
        </motion.span>
      </div>

      <style jsx>{`
        .packet-flow-graph {
          width: 100%;
          max-width: 320px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .packet-flow-svg {
          width: 100%;
          height: auto;
        }
        .pfg-readout {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--steel);
        }
        .pfg-stat {
          font-variant-numeric: tabular-nums;
        }
        .pfg-sep {
          opacity: 0.5;
        }
        @media (prefers-reduced-motion: reduce) {
          .pfg-particle {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
