'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { Brain, Database, Laptop, Network, Satellite, Scale } from 'lucide-react';

/** Radial spread of the flow-switch burst (deterministic — no per-render randomness). */
const BURST_PARTICLES = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  const dist = 42 + (i % 3) * 12;
  return { id: i, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
});

type FlowId = 'chat' | 'telemetry' | 'governance';

interface FlowDefinition {
  label: string;
  badge: string;
  description: string;
  note: string;
  nodes: string[];
  lines: string[];
  metrics: { latency: string; throughput: string; vectorHits: string };
}

const FLOWS: Record<FlowId, FlowDefinition> = {
  chat: {
    label: 'LLM Chat Path',
    badge: 'Live feed',
    description:
      'A chat request enters at the edge, is throttled and routed by the gateway, enriched with vector-store context, and answered by the Gemini inference core.',
    note: 'Edge → API → Vector → Gemini → Telemetry → Governance',
    nodes: ['edge', 'api', 'vector', 'llm'],
    lines: ['edge-api', 'api-vector', 'vector-llm', 'llm-api'],
    metrics: { latency: '~180 ms', throughput: '~12k req/s', vectorHits: '3 shards' },
  },
  telemetry: {
    label: 'Telemetry Stream',
    badge: 'Metric bus',
    description:
      'Every hop emits structured metrics onto the telemetry bus — latency histograms, error budgets, and heartbeat feeds that drive the live dashboards.',
    note: 'Edge → API → Telemetry → Governance',
    nodes: ['edge', 'api', 'telemetry'],
    lines: ['edge-api', 'api-telemetry', 'telemetry-governance'],
    metrics: { latency: '~40 ms', throughput: '~85k events/s', vectorHits: 'n/a' },
  },
  governance: {
    label: 'Governance & Quality',
    badge: 'Policy gate',
    description:
      'Quality and risk loops evaluate sampled traffic against policy — safety filters, evaluation suites, and compliance checks feed back to the edge.',
    note: 'Telemetry → Governance → Edge (feedback loop)',
    nodes: ['telemetry', 'governance', 'edge'],
    lines: ['telemetry-governance', 'governance-edge'],
    metrics: { latency: '~2 s eval', throughput: '100% sampled', vectorHits: 'audit log' },
  },
};

const CHIPS: { id: string; title: string; desc: string; Icon: typeof Laptop; className: string }[] = [
  { id: 'edge', title: 'Edge', desc: 'Clients & Sensors', Icon: Laptop, className: 'edge-chip' },
  { id: 'api', title: 'API Gateway', desc: 'Rate limit & Route', Icon: Network, className: 'api-chip' },
  { id: 'vector', title: 'Vector DB', desc: 'Embeddings', Icon: Database, className: 'vector-chip' },
  { id: 'llm', title: 'Gemini', desc: 'Inference Core', Icon: Brain, className: 'llm-chip' },
  { id: 'telemetry', title: 'Telemetry', desc: 'Metric Bus', Icon: Satellite, className: 'telemetry-chip' },
  { id: 'governance', title: 'Governance', desc: 'Policy & Risk', Icon: Scale, className: 'governance-chip' },
];

const LINE_PATHS: Record<string, string> = {
  'edge-api': 'M 26 35 L 36 35',
  'api-vector': 'M 56 35 C 60 35, 60 20, 66 20',
  'vector-llm': 'M 88 20 L 96 20',
  'llm-api': 'M 96 24 C 85 24, 70 38, 56 38',
  'api-telemetry': 'M 56 35 C 60 35, 60 56, 66 56',
  'telemetry-governance': 'M 88 56 L 96 56',
  'governance-edge': 'M 105 64 C 105 75, 16 75, 16 42',
};

const LEGEND: { id: string; name: string; desc: string }[] = [
  { id: 'edge', name: 'Edge clients', desc: 'Browsers, mobile, and sensor kits.' },
  { id: 'api', name: 'API gateway', desc: 'Front door, throttling, metadata.' },
  { id: 'vector', name: 'Vector store', desc: 'Distributed cache of embeddings.' },
  { id: 'llm', name: 'Gemini', desc: 'LLM core with safety filters.' },
  { id: 'telemetry', name: 'Telemetry', desc: 'Metric bus and heartbeat feeds.' },
  { id: 'governance', name: 'Governance', desc: 'QA, risk, and compliance loops.' },
];

/**
 * Interactive architecture map. Selecting a flow highlights its nodes and
 * connections (via the existing `.active` CSS states) and animates packet
 * dots along the active SVG paths using stroke-dash animation.
 */
export default function ArchitectureMap() {
  const prefersReducedMotion = useReducedMotionSafe();
  const [flow, setFlow] = useState<FlowId>('chat');
  const [burstKey, setBurstKey] = useState(0);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const firstRun = useRef(true);
  const active = FLOWS[flow];

  // Restart the packet animation whenever the flow changes, and fire a one-shot
  // particle burst on every real switch (skipping the initial mount).
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (svgRef.current) {
      const paths = svgRef.current.querySelectorAll<SVGPathElement>('.arch-connection.active');
      paths.forEach((path) => {
        path.style.animation = 'none';
        // Force reflow so the dash animation restarts from zero.
        void path.getBoundingClientRect();
        path.style.animation = '';
      });
    }
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setBurstKey((k) => k + 1);
  }, [flow, prefersReducedMotion]);

  return (
    <div className="arch-wrapper glass-card">
      <div className="arch-diagram">
        <div className="arch-diagram-halo" aria-hidden="true" />
        <div className="arch-diagram-grid" aria-hidden="true" />
        <svg
          ref={svgRef}
          className="arch-svg"
          viewBox="0 0 120 70"
          role="img"
          aria-label={`Architecture flow diagram, highlighting: ${active.label}`}
        >
          <defs>
            {Object.entries(LINE_PATHS).map(([id, d]) => (
              <path key={`path-${id}`} id={`path-${id}`} d={d} fill="none" />
            ))}
          </defs>
          {Object.entries(LINE_PATHS).map(([id, d]) => (
            <path
              key={id}
              d={d}
              fill="none"
              className={`arch-connection${active.lines.includes(id) ? ' active' : ''}`}
            />
          ))}
          {/* Draw-in overlay: re-keyed on flow change so each active line strokes itself
              on from edge to edge (stroke-dasharray reveal). Suppressed for reduced motion. */}
          {!prefersReducedMotion &&
            active.lines.map((lineId) => (
              <path
                key={`draw-${flow}-${lineId}`}
                d={LINE_PATHS[lineId]}
                className="arch-connection-draw"
                data-conn-draw
                pathLength={1}
                fill="none"
              />
            ))}
          {active.lines.map((lineId) => (
            <circle
              key={`trail-${lineId}`}
              r="2.6"
              className="flow-dot-trail"
              data-flow-trail
              style={prefersReducedMotion ? { animationPlayState: 'paused' } : undefined}
            >
              <animateMotion
                dur="3s"
                begin="-0.18s"
                repeatCount="indefinite"
                fill={prefersReducedMotion ? 'freeze' : 'remove'}
              >
                <mpath xlinkHref={`#path-${lineId}`} />
              </animateMotion>
            </circle>
          ))}
          {active.lines.map((lineId) => (
            <circle
              key={`dot-${lineId}`}
              r="1.5"
              className="flow-dot"
              data-testid="flow-dot"
              style={prefersReducedMotion ? { animationPlayState: 'paused' } : undefined}
            >
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                fill={prefersReducedMotion ? 'freeze' : 'remove'}
              >
                <mpath xlinkHref={`#path-${lineId}`} />
              </animateMotion>
            </circle>
          ))}
        </svg>
        <div className="arch-node-chips">
          {CHIPS.map(({ id, title, desc, Icon, className }) => (
            <div
              key={id}
              className={`arch-node-chip ${className}${active.nodes.includes(id) ? ' active' : ''}`}
            >
              <div className="chip-icon">
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className="chip-content">
                <span className="chip-title">{title}</span>
                <span className="chip-desc">{desc}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Particle burst — a short radial spray fired from the board centre on each
            flow switch (scale + opacity spring). Not rendered under reduced motion. */}
        <div className="arch-burst" data-flow-burst aria-hidden="true">
          {!prefersReducedMotion && burstKey > 0 && (
            <div className="arch-burst-group" key={burstKey}>
              {BURST_PARTICLES.map((p) => (
                <motion.span
                  key={p.id}
                  className="arch-burst-dot"
                  data-burst-particle
                  initial={{ x: 0, y: 0, scale: 0.2, opacity: 0.85 }}
                  animate={{ x: p.x, y: p.y, scale: 1, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.6 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="arch-sidebar">
        <div className="arch-metrics" role="status" aria-live="polite">
          <div className="arch-metric">
            <p className="arch-metric-label">P95 latency</p>
            <p className="arch-metric-value">{active.metrics.latency}</p>
            <span className="arch-metric-subtext">Edge → Gemini</span>
          </div>
          <div className="arch-metric">
            <p className="arch-metric-label">Throughput</p>
            <p className="arch-metric-value">{active.metrics.throughput}</p>
            <span className="arch-metric-subtext">Parallel reader sessions</span>
          </div>
          <div className="arch-metric">
            <p className="arch-metric-label">Vector hit accuracy</p>
            <p className="arch-metric-value">{active.metrics.vectorHits}</p>
            <span className="arch-metric-subtext">Multi-region cache</span>
          </div>
        </div>
        <div className="arch-legend">
          <p className="arch-legend-title">Path components</p>
          <p className="arch-legend-subtitle">Node states across the journey</p>
          <div className="arch-legend-grid">
            {LEGEND.map((item) => (
              <div
                key={item.id}
                className={`arch-legend-item${active.nodes.includes(item.id) ? ' active' : ''}`}
                data-legend-node={item.id}
              >
                <span className="arch-legend-dot" />
                <div>
                  <p className="arch-legend-name">{item.name}</p>
                  <p className="arch-legend-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="arch-actions">
          {(Object.keys(FLOWS) as FlowId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`arch-btn${flow === id ? ' active' : ''}`}
              aria-pressed={flow === id}
              onClick={() => setFlow(id)}
            >
              {FLOWS[id].label}
            </button>
          ))}
        </div>
        <div className="arch-explainer" id="arch-explainer">
          <p className="arch-explainer-title">{active.label}</p>
          <p className="arch-explainer-body">{active.description}</p>
          <div className="arch-explainer-callout">
            <span className="arch-explainer-badge">{active.badge}</span>
            <p className="arch-explainer-note">{active.note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
