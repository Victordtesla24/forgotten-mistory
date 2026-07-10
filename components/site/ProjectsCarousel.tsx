'use client';

import { useRef, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { ProjectCard } from '@/app/data/siteContent';

interface ProjectsCarouselProps {
  projects: ProjectCard[];
}

/* ── Micro-effect previews (SPEC §7 / MOTION §5: one dedicated miniature per repo) ── */

/** Mini sprint burndown chart — SVG bars with animated stroke-dash draw-in.
 *  Maps to: EFDDH-Jira-Analytics-Dashboard → SPEC §7 #3 (SprintBurndown). */
function MiniSprintBurndown() {
  const bars = [75, 55, 62, 48, 30, 22, 15, 8, 6, 5, 5, 5];
  const max = Math.max(...bars);
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <polyline
        fill="none"
        stroke="var(--steel)"
        strokeWidth="0.6"
        strokeDasharray="2 3"
        points="10,85 160,15"
      />
      {bars.map((v, i) => {
        const h = (v / max) * 70;
        const x = 14 + i * 14;
        const y = 85 - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="10"
            height={h}
            rx="2"
            fill="var(--accent-color)"
            opacity={0.6 + (i / bars.length) * 0.4}
          >
            <animate
              attributeName="height"
              from="0"
              to={h}
              dur="1.2s"
              begin={`${i * 0.08}s`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.22 1 0.36 1"
            />
            <animate
              attributeName="y"
              from="85"
              to={y}
              dur="1.2s"
              begin={`${i * 0.08}s`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.22 1 0.36 1"
            />
          </rect>
        );
      })}
    </svg>
  );
}

/** Mini résumé↔JD keyword-match arcs — SVG connecting arcs.
 *  Maps to: tailor-resume-with-ai → SPEC §7 #6. */
function MiniResumeArcs() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      {['AI', 'Agile', 'Cloud', 'Python', 'React'].map((_, i) => (
        <circle key={`l-${i}`} cx="25" cy={20 + i * 18} r="3" fill="var(--steel)" />
      ))}
      {['LLM', 'Scrum', 'Azure', 'TypeScript', 'Next.js'].map((_, i) => (
        <circle key={`r-${i}`} cx="155" cy={20 + i * 18} r="3" fill="var(--steel)" />
      ))}
      {[
        [0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [0, 3], [2, 0],
      ].map(([li, ri], idx) => (
        <path
          key={idx}
          d={`M 28 ${20 + li * 18} Q ${91 + idx * 2} ${10 + idx * 3}, 152 ${20 + ri * 18}`}
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="0.7"
          opacity="0.55"
          strokeDasharray="1 1000"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1000"
            to="0"
            dur="0.8s"
            begin={`${idx * 0.12}s`}
            fill="freeze"
          />
        </path>
      ))}
    </svg>
  );
}

/** Mini event-arc customer-journey timeline — SVG timeline dots + arcs.
 *  Maps to: relationship-timeline-feature → SPEC §7 #7. */
function MiniJourneyTimeline() {
  const events = [
    { x: 20, label: 'Onboard' },
    { x: 50, label: 'Engage' },
    { x: 80, label: 'Convert' },
    { x: 110, label: 'Retain' },
    { x: 140, label: 'Advocate' },
  ];
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <line x1="10" y1="75" x2="170" y2="75" stroke="var(--steel)" strokeWidth="0.4" opacity="0.3" />
      {events.map((ev, i) => (
        <g key={i}>
          <line x1={ev.x} y1="75" x2={ev.x} y2={35 - i * 5} stroke="var(--steel)" strokeWidth="0.5" opacity="0.5" />
          <circle cx={ev.x} cy={35 - i * 5} r="4" fill="none" stroke="var(--accent-color)" strokeWidth="1">
            <animate attributeName="r" from="0" to="4" dur="0.5s" begin={`${i * 0.2}s`} fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" />
            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${i * 0.2}s`} fill="freeze" />
          </circle>
        </g>
      ))}
      {events.slice(0, -1).map((ev, i) => {
        const next = events[i + 1];
        return (
          <path
            key={i}
            d={`M ${ev.x} ${35 - i * 5} Q ${(ev.x + next.x) / 2} ${15 - i * 3}, ${next.x} ${35 - (i + 1) * 5}`}
            fill="none"
            stroke="var(--accent-color)"
            strokeWidth="0.6"
            opacity="0.3"
            strokeDasharray="1 1000"
          >
            <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="0.7s" begin={`${(i + 1) * 0.25}s`} fill="freeze" />
          </path>
        );
      })}
    </svg>
  );
}

/** Mini inbox-triage funnel — SVG funnel visualization.
 *  Maps to: AI-Gmail-Mailbox-Manager → SPEC §7 #5. */
function MiniInboxFunnel() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <rect x="10" y="8" width="160" height="12" rx="2" fill="var(--steel)" opacity="0.3">
        <animate attributeName="width" from="0" to="160" dur="0.6s" begin="0s" fill="freeze" />
      </rect>
      <rect x="30" y="28" width="120" height="12" rx="2" fill="var(--steel)" opacity="0.4">
        <animate attributeName="width" from="0" to="120" dur="0.6s" begin="0.2s" fill="freeze" />
      </rect>
      <rect x="50" y="48" width="80" height="12" rx="2" fill="var(--steel)" opacity="0.5">
        <animate attributeName="width" from="0" to="80" dur="0.6s" begin="0.4s" fill="freeze" />
      </rect>
      <rect x="70" y="68" width="40" height="12" rx="2" fill="var(--accent-color)" opacity="0.7">
        <animate attributeName="width" from="0" to="40" dur="0.6s" begin="0.6s" fill="freeze" />
      </rect>
      {[{ x: 90, y: 20 }, { x: 75, y: 40 }, { x: 85, y: 60 }].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="var(--accent-color)">
          <animate attributeName="cy" from={p.y - 8} to={p.y} dur="0.5s" begin={`${0.3 + i * 0.3}s`} fill="freeze" />
          <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin={`${0.3 + i * 0.3}s`} fill="freeze" />
        </circle>
      ))}
    </svg>
  );
}

/** Mini telemetry HUD — radial gauges + sparkline.
 *  Maps to: jarvis → SPEC §7 #1. */
function MiniTelemetryHud() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <circle cx="45" cy="50" r="28" fill="none" stroke="var(--steel)" strokeWidth="0.6" opacity="0.2" />
      <circle cx="45" cy="50" r="22" fill="none" stroke="var(--accent-color)" strokeWidth="1.2" strokeDasharray="0 138" opacity="0.8">
        <animate attributeName="stroke-dasharray" from="0 138" to="110 138" dur="1s" begin="0.2s" fill="freeze" />
      </circle>
      <text x="45" y="54" textAnchor="middle" fontSize="8" fill="var(--accent)" fontFamily="var(--font-mono)" opacity="0.9">78%</text>
      <polyline fill="none" stroke="var(--accent-color)" strokeWidth="0.7" points="95,70 110,60 125,65 140,45 155,50 170,35" opacity="0.6">
        <animate attributeName="stroke-dashoffset" from="100" to="0" dur="0.8s" begin="0.4s" fill="freeze" />
      </polyline>
    </svg>
  );
}

/** Mini packet-flow — particles along edges.
 *  Maps to: telemetry-server/tesla-api → SPEC §7 #2. */
function MiniPacketFlow() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      {[[15, 70, 60, 25], [60, 25, 120, 25], [120, 25, 165, 70], [60, 25, 60, 80], [120, 25, 120, 80]].map(([x1, y1, x2, y2], i) => (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--steel)" strokeWidth="0.4" opacity="0.25" />
          <circle r="2" fill="var(--accent-color)" opacity="0.8">
            <animateMotion dur="1.5s" begin={`${i * 0.2}s`} repeatCount="indefinite" path={`M${x1},${y1} L${x2},${y2}`} />
          </circle>
        </g>
      ))}
    </svg>
  );
}

/** Mini evidence-bar — time compression bar.
 *  Maps to: ATO COBOL evidence-harness → SPEC §7 #4. */
function MiniEvidenceBar() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <rect x="20" y="55" width="140" height="16" rx="3" fill="var(--steel)" opacity="0.15" />
      <rect x="20" y="55" width="0" height="16" rx="3" fill="var(--accent-color)" opacity="0.6">
        <animate attributeName="width" from="0" to="140" dur="1.5s" begin="0.2s" fill="freeze" />
      </rect>
      <text x="90" y="40" textAnchor="middle" fontSize="9" fill="var(--white)" fontFamily="var(--font-mono)" opacity="0.8">
        <animate attributeName="opacity" from="0" to="0.8" dur="0.5s" begin="1.5s" fill="freeze" />
        3h → 15min
      </text>
      <text x="90" y="87" textAnchor="middle" fontSize="6" fill="var(--steel)" fontFamily="var(--font-mono)" opacity="0.6">≈92% reduction</text>
    </svg>
  );
}

/** Mini celestial sphere — orbiting body.
 *  Maps to: Birth-Time-Rectifier → SPEC §7 #8. */
function MiniCelestialSphere() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <circle cx="90" cy="50" r="35" fill="none" stroke="var(--steel)" strokeWidth="0.4" opacity="0.2" />
      <ellipse cx="90" cy="50" rx="35" ry="12" fill="none" stroke="var(--steel)" strokeWidth="0.3" opacity="0.15" />
      <circle r="3" fill="var(--accent-color)" opacity="0.8">
        <animateMotion dur="4s" repeatCount="indefinite" path="M55,50 A35,35 0 1,1 125,50 A35,35 0 1,1 55,50" />
      </circle>
      <circle cx="90" cy="50" r="5" fill="var(--white)" opacity="0.15" />
    </svg>
  );
}

/** Mini clearance stepper — vertical timeline.
 *  Maps to: agsva-security-clearance → SPEC §7 #9. */
function MiniClearanceStepper() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <line x1="90" y1="12" x2="90" y2="88" stroke="var(--steel)" strokeWidth="0.5" opacity="0.25" />
      {[20, 42, 64].map((cy, i) => (
        <g key={i}>
          <circle cx="90" cy={cy} r="5" fill="var(--ink-900)" stroke="var(--accent-color)" strokeWidth="1" opacity={i < 2 ? 0.7 : 0.4}>
            {i < 2 && <animate attributeName="opacity" from="0" to="0.7" dur="0.5s" begin={`${i * 0.4}s`} fill="freeze" />}
          </circle>
          {i < 2 && (
            <path d={`M 92 ${cy - 2} L 89 ${cy + 2} L 96 ${cy - 3}`} fill="none" stroke="var(--accent-color)" strokeWidth="0.7" opacity="0">
              <animate attributeName="opacity" from="0" to="0.8" dur="0.5s" begin={`${i * 0.4 + 0.3}s`} fill="freeze" />
            </path>
          )}
        </g>
      ))}
    </svg>
  );
}

/** Mini repair loop — self-healing pipeline.
 *  Maps to: Error-Management-System → SPEC §7 #10. */
function MiniRepairLoop() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <rect x="20" y="20" width="40" height="16" rx="3" fill="var(--steel)" opacity="0.2" />
      <rect x="70" y="20" width="40" height="16" rx="3" fill="var(--steel)" opacity="0.2" />
      <rect x="120" y="20" width="40" height="16" rx="3" fill="var(--steel)" opacity="0.2" />
      {[[20, 28, 70, 28], [70, 28, 120, 28], [120, 28, 150, 50], [150, 50, 90, 72], [90, 72, 30, 72], [30, 72, 20, 50], [20, 50, 20, 36]].map(([x1, y1, x2, y2], i) => (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--steel)" strokeWidth="0.4" opacity="0.25" />
          <circle r="1.5" fill="var(--accent-color)" opacity="0">
            <animateMotion dur="2s" begin={`${i * 0.15}s`} repeatCount="indefinite" path={`M${x1},${y1} L${x2},${y2}`} />
            <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      <text x="90" y="92" textAnchor="middle" fontSize="5" fill="var(--steel)" fontFamily="var(--font-mono)" opacity="0.5">ERROR → AUTO-FIX</text>
    </svg>
  );
}

/** Mini image enhancer — split comparison.
 *  Maps to: Image-Enhancer → SPEC §7 #11. */
function MiniImageEnhancer() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <rect x="10" y="10" width="80" height="80" rx="3" fill="var(--steel)" opacity="0.15" />
      {[[15, 15, 20, 20], [30, 25, 28, 32], [50, 15, 22, 18], [70, 30, 18, 25], [25, 50, 30, 22], [60, 55, 24, 20]].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="1" fill="var(--steel)" opacity="0.3">
          <animate attributeName="opacity" from="0.1" to="0.3" dur="0.5s" begin={`${i * 0.08}s`} fill="freeze" />
        </rect>
      ))}
      <line x1="90" y1="10" x2="90" y2="90" stroke="var(--white)" strokeWidth="1.5" opacity="0.8" />
      <rect x="90" y="10" width="80" height="80" rx="3" fill="var(--accent)" opacity="0.08" />
      {[[95, 15, 16, 18], [115, 25, 24, 20], [135, 15, 30, 22], [100, 50, 26, 28], [130, 50, 35, 16], [105, 70, 25, 12], [140, 70, 28, 14]].map(([x, y, w, h], i) => (
        <rect key={`a-${i}`} x={x} y={y} width={w} height={h} rx="1" fill="var(--accent)" opacity="0.25">
          <animate attributeName="opacity" from="0.05" to="0.25" dur="0.5s" begin={`${0.4 + i * 0.06}s`} fill="freeze" />
        </rect>
      ))}
    </svg>
  );
}

/** Mini orchestration — agent graph nodes.
 *  Maps to: multi-agent-architecture → SPEC §7 #12. */
function MiniOrchestration() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      {[[40, 30], [90, 20], [140, 30], [65, 65], [115, 65]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="8" fill="none" stroke="var(--steel)" strokeWidth="0.6" opacity="0.5">
            <animate attributeName="opacity" from="0" to="0.5" dur="0.4s" begin={`${i * 0.12}s`} fill="freeze" />
          </circle>
          <circle cx={cx} cy={cy} r="3" fill="var(--accent-color)" opacity="0.6">
            <animate attributeName="opacity" from="0" to="0.6" dur="0.4s" begin={`${i * 0.12 + 0.1}s`} fill="freeze" />
          </circle>
        </g>
      ))}
      {[[40, 30, 90, 20], [90, 20, 140, 30], [40, 30, 65, 65], [90, 20, 65, 65], [90, 20, 115, 65], [140, 30, 115, 65], [65, 65, 115, 65]].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--steel)" strokeWidth="0.3" opacity="0.2">
          <animate attributeName="opacity" from="0" to="0.2" dur="0.3s" begin={`${0.6 + i * 0.06}s`} fill="freeze" />
        </line>
      ))}
    </svg>
  );
}

/** Mini key signing — key approach + pulse.
 *  Maps to: public-key-server → SPEC §7 #13. */
function MiniKeySigning() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <circle cx="60" cy="50" r="12" fill="none" stroke="var(--accent-color)" strokeWidth="0.8" opacity="0.6">
        <animate attributeName="cx" from="30" to="60" dur="0.6s" begin="0s" fill="freeze" />
      </circle>
      <circle cx="120" cy="50" r="12" fill="none" stroke="var(--white)" strokeWidth="0.8" opacity="0.6">
        <animate attributeName="cx" from="150" to="120" dur="0.6s" begin="0s" fill="freeze" />
      </circle>
      <circle cx="90" cy="50" r="4" fill="var(--accent-color)" opacity="0">
        <animate attributeName="r" values="4;20" dur="1s" begin="0.6s" repeatCount="2" fill="freeze" />
        <animate attributeName="opacity" values="0.8;0" dur="1s" begin="0.6s" repeatCount="2" fill="freeze" />
      </circle>
      <path d="M 87 50 L 90 53 L 95 47" fill="none" stroke="var(--accent-color)" strokeWidth="1" opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.5s" fill="freeze" />
      </path>
    </svg>
  );
}

/** Mini token reflow — two columns with flow arrows.
 *  Maps to: prompt-reconstruct → SPEC §7 #14. */
function MiniTokenReflow() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      {[[25, 20], [25, 40], [25, 60]].map(([x, y], i) => (
        <rect key={`raw-${i}`} x={x} y={y} width="40" height="12" rx="3" fill="var(--steel)" opacity="0.25">
          <animate attributeName="opacity" from="0" to="0.25" dur="0.4s" begin={`${i * 0.1}s`} fill="freeze" />
        </rect>
      ))}
      {[[115, 20], [115, 40], [115, 60]].map(([x, y], i) => (
        <rect key={`opt-${i}`} x={x} y={y} width="40" height="12" rx="3" fill="var(--accent-color)" opacity="0.35">
          <animate attributeName="opacity" from="0" to="0.35" dur="0.4s" begin={`${0.3 + i * 0.1}s`} fill="freeze" />
        </rect>
      ))}
      {[[65, 26, 115, 26], [65, 46, 115, 46], [65, 66, 115, 66]].map(([x1, y1, x2, y2], i) => (
        <g key={`arr-${i}`}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent-color)" strokeWidth="0.5" opacity="0.3">
            <animate attributeName="opacity" from="0" to="0.3" dur="0.3s" begin={`${0.6 + i * 0.1}s`} fill="freeze" />
          </line>
        </g>
      ))}
    </svg>
  );
}

/** Mini event seat — seat grid shimmer.
 *  Maps to: abentertainment → SPEC §7 #15. */
function MiniEventSeat() {
  const rows = 4, cols = 6;
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      <rect x="48" y="4" width="84" height="6" rx="2" fill="var(--accent)" opacity="0.12" />
      {Array.from({ length: rows }, (_, ri) =>
        Array.from({ length: cols }, (_, ci) => {
          const x = 30 + ci * 20;
          const y = 22 + ri * 16;
          return (
            <rect key={`${ri}-${ci}`} x={x} y={y} width="12" height="10" rx="2" fill="var(--steel)" opacity="0">
              <animate attributeName="opacity" from="0" to="0.4" dur="0.3s" begin={`${(ri * cols + ci) * 0.04}s`} fill="freeze" />
            </rect>
          );
        })
      )}
      <text x="90" y="92" textAnchor="middle" fontSize="5" fill="var(--steel)" fontFamily="var(--font-mono)" opacity="0.5">500+ GUESTS</text>
    </svg>
  );
}

/** Dedicated micro-effect per project visual type (SPEC §7 1:1 mapping). */
function ProjectMicroEffect({ visual }: { visual: ProjectCard['visual'] }) {
  switch (visual) {
    case 'dashboard': return <MiniSprintBurndown />;
    case 'doc': return <MiniResumeArcs />;
    case 'waveform': return <MiniJourneyTimeline />;
    case 'terminal': return <MiniInboxFunnel />;
    case 'telemetry-hud': return <MiniTelemetryHud />;
    case 'packet-flow': return <MiniPacketFlow />;
    case 'evidence-bar': return <MiniEvidenceBar />;
    case 'celestial': return <MiniCelestialSphere />;
    case 'clearance': return <MiniClearanceStepper />;
    case 'repair-loop': return <MiniRepairLoop />;
    case 'image-compare': return <MiniImageEnhancer />;
    case 'orchestration': return <MiniOrchestration />;
    case 'key-signing': return <MiniKeySigning />;
    case 'token-flow': return <MiniTokenReflow />;
    case 'event-seat': return <MiniEventSeat />;
  }
}

/* ── Carousel component ── */

/**
 * Disney+ inspired horizontal poster-row — dark full-bleed, monochrome cards,
 * each with a dedicated micro-effect preview (SPEC §7). Wrapped in `.projects-row`
 * for GSAP T5 vertical→horizontal ScrollTrigger binding.
 *
 * Reduced-motion: vertical static card grid.
 */
export default function ProjectsCarousel({ projects }: ProjectsCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const dragState = useRef<{ startX: number; startScroll: number; dragging: boolean; moved: boolean; lastX: number; lastT: number; velocity: number }>({
    startX: 0,
    startScroll: 0,
    dragging: false,
    moved: false,
    lastX: 0,
    lastT: 0,
    velocity: 0,
  });
  const momentumRaf = useRef(0);

  const stopMomentum = () => {
    if (momentumRaf.current) {
      cancelAnimationFrame(momentumRaf.current);
      momentumRaf.current = 0;
    }
  };

  useEffect(() => stopMomentum, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const handleLeave = () => setHoveredIndex(null);
    rail.addEventListener('pointerleave', handleLeave);
    return () => rail.removeEventListener('pointerleave', handleLeave);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || prefersReducedMotion) return;

    const syncActive = () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLAnchorElement[];
      if (!cards.length) return;
      const mid = rail.scrollLeft + rail.clientWidth / 2;
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      cards.forEach((card, i) => {
        const center = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActiveIndex(best);
    };

    syncActive();
    rail.addEventListener('scroll', syncActive, { passive: true });
    window.addEventListener('resize', syncActive);
    return () => {
      rail.removeEventListener('scroll', syncActive);
      window.removeEventListener('resize', syncActive);
    };
  }, [prefersReducedMotion, projects.length]);

  const scrollToIndex = (index: number) => {
    const rail = railRef.current;
    const card = cardRefs.current[index];
    if (!rail || !card) return;
    stopMomentum();
    const left = card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    setActiveIndex(index);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const rail = railRef.current;
    if (!rail || e.pointerType === 'touch') return;
    e.preventDefault();
    stopMomentum();
    dragState.current = {
      startX: e.clientX,
      startScroll: rail.scrollLeft,
      dragging: true,
      moved: false,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
    };
    rail.setPointerCapture(e.pointerId);
    rail.dataset.dragging = 'true';
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rail = railRef.current;
    const s = dragState.current;
    if (!rail || !s.dragging) return;
    const delta = e.clientX - s.startX;
    if (Math.abs(delta) > 4) s.moved = true;
    rail.scrollLeft = s.startScroll - delta;
    const dt = e.timeStamp - s.lastT;
    if (dt > 0) {
      s.velocity = -(e.clientX - s.lastX) / dt;
      s.lastX = e.clientX;
      s.lastT = e.timeStamp;
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const rail = railRef.current;
    const s = dragState.current;
    if (rail?.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
    s.dragging = false;
    if (rail) delete rail.dataset.dragging;
    if (!rail || prefersReducedMotion) return;

    let velocity = s.velocity * 16;
    if (Math.abs(velocity) < 0.6) {
      // Settle to nearest card after a short drag without fling.
      if (s.moved) scrollToIndex(activeIndex);
      return;
    }
    const FRICTION = 0.94;
    const step = () => {
      velocity *= FRICTION;
      rail.scrollLeft += velocity;
      const atStart = rail.scrollLeft <= 0;
      const atEnd = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1;
      if (Math.abs(velocity) > 0.4 && !atStart && !atEnd) {
        momentumRaf.current = requestAnimationFrame(step);
      } else {
        momentumRaf.current = 0;
        // Snap to nearest after inertial coast.
        const cards = cardRefs.current.filter(Boolean) as HTMLAnchorElement[];
        if (cards.length) {
          const mid = rail.scrollLeft + rail.clientWidth / 2;
          let best = 0;
          let bestDist = Number.POSITIVE_INFINITY;
          cards.forEach((card, i) => {
            const center = card.offsetLeft + card.offsetWidth / 2;
            const dist = Math.abs(center - mid);
            if (dist < bestDist) {
              bestDist = dist;
              best = i;
            }
          });
          scrollToIndex(best);
        }
      }
    };
    momentumRaf.current = requestAnimationFrame(step);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToIndex(Math.min(projects.length - 1, activeIndex + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToIndex(Math.max(0, activeIndex - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToIndex(projects.length - 1);
    }
  };

  return (
    <div className="carousel-wrapper catalogue-row" data-carousel="true">
      <div
        ref={railRef}
        className={`projects-carousel${prefersReducedMotion ? '' : ' catalogue-scroll'}`}
        id="projects-carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="Project catalogue"
        tabIndex={0}
        data-carousel-stagger=""
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        <div className={`projects-row${prefersReducedMotion ? ' projects-grid' : ''}`}>
          {projects.map((project, index) => {
            const isActive = activeIndex === index;
            const isHovered = hoveredIndex === index;
            return (
              <a
                key={project.href}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className={`project-card catalogue-card${isActive ? ' is-active' : ''}`}
                draggable={false}
                aria-current={isActive ? 'true' : undefined}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => {
                  setHoveredIndex(index);
                  setActiveIndex(index);
                }}
                onBlur={() => setHoveredIndex(null)}
              >
                <div className="project-poster">
                  <ProjectMicroEffect visual={project.visual} />
                  <div className={`poster-overlay${isHovered || isActive ? ' overlay-lifted' : ''}`} />
                  <div className={`poster-info${isHovered ? ' info-visible' : ''}`} aria-hidden={!isHovered}>
                    <p className="poster-desc">{project.description}</p>
                    <span className="poster-link-hint">View on GitHub →</span>
                  </div>
                </div>
                <div className="poster-meta">
                  <span className="poster-badge">{project.badge}</span>
                  <p className="poster-title">{project.title}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
      {!prefersReducedMotion && projects.length > 1 ? (
        <div className="carousel-progress" role="tablist" aria-label="Catalogue position">
          {projects.map((project, index) => (
            <button
              key={`dot-${project.href}`}
              type="button"
              className="carousel-progress-dot"
              role="tab"
              aria-label={`Show ${project.title}`}
              aria-current={activeIndex === index ? 'true' : undefined}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

