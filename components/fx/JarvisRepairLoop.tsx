'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PALETTE } from '@/lib/palette';

/**
 * JarvisRepairLoop — SVG cycle animation for JARVIS Error-Management-System
 * (TG1-10). Visualises the autonomous detect→analyze→repair→verify repair loop
 * as a diamond-shaped node graph with animated flow connections.
 *
 * Data is deterministic: fixed 4-phase cycle with sine-based timing (no
 * Math.random). Monochrome palette only (PALETTE tokens). Reduced-motion
 * shows all nodes and connections static.
 */

interface Phase {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
}

const NODES: Phase[] = [
  { id: 'detect', label: 'DETECT', x: 150, y: 62, r: 32 },
  { id: 'analyze', label: 'ANALYZE', x: 245, y: 150, r: 32 },
  { id: 'repair', label: 'REPAIR', x: 150, y: 238, r: 32 },
  { id: 'verify', label: 'VERIFY', x: 55, y: 150, r: 32 },
] as const;

/** Ordered edges: detect→analyze→repair→verify→detect */
const EDGES = [0, 1, 2, 3, 0] as const;

const CYCLE_INTERVAL_MS = 1200;

export default function JarvisRepairLoop({ className = '', project = 'Error-Management-System' }: { className?: string; project?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [activePhase, setActivePhase] = useState(0); // index into NODES
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Visibility change: pause/resume
  useEffect(() => {
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // IntersectionObserver — mark as in-view once
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Phase state machine — cycle through nodes
  useEffect(() => {
    if (!inView || prefersReducedMotion) return;

    const interval = setInterval(() => {
      if (pausedRef.current) return;
      setActivePhase((prev) => (prev + 1) % NODES.length);
    }, CYCLE_INTERVAL_MS);
    timerRef.current = interval;

    return () => clearInterval(interval);
  }, [inView, prefersReducedMotion]);

  const isStatic = prefersReducedMotion || !inView;

  // Status label for the active phase
  const activeLabel = NODES[activePhase].label;
  const statusText = isStatic
    ? 'AUTONOMOUS REPAIR LOOP'
    : `ACTIVE: ${activeLabel}`;

  return (
    <div
      ref={containerRef}
      data-testid="jarvis-repair-loop"
      data-project={project}
      className={className}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      <style jsx>{`
        div[data-testid="jarvis-repair-loop"] {
          width: 100%;
          max-width: 340px;
          aspect-ratio: 1 / 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 0.75rem;
        }
        .jr-loop-svg {
          width: 100%;
          height: auto;
        }
        .jr-status {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: var(--steel);
          opacity: 0.65;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 0.4rem;
          text-align: center;
        }
        @keyframes jr-flow-dash {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .jr-edge-flow {
          animation: jr-flow-dash 0.9s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .jr-edge-flow {
            animation: none !important;
          }
        }
      `}</style>

      <svg
        viewBox="0 0 300 300"
        className="jr-loop-svg"
        role="img"
        aria-label="JARVIS autonomous repair loop"
      >
        <defs>
          {/* Glow filter for active node */}
          <filter id="jr-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulse filter for active node ring */}
          <filter id="jr-pulse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections — drawn with motion.line and animated dash-offset for flow */}
        <AnimatedConnections
          nodes={NODES}
          isStatic={isStatic}
          activePhase={activePhase}
        />

        {/* Nodes */}
        {NODES.map((node, i) => {
          const isActive = i === activePhase && !isStatic;

          return (
            <g key={node.id}>
              {/* Outer glow ring when active */}
              {isActive && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r + 8}
                  fill="none"
                  stroke={PALETTE.accent}
                  strokeWidth="1.5"
                  strokeOpacity="0.3"
                  filter="url(#jr-pulse)"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: [0, 0.6, 0], scale: [0.85, 1.15, 0.85] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Node circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={isActive ? PALETTE.accent : PALETTE.ink700}
                fillOpacity={isActive ? 0.15 : 0.4}
                stroke={isActive ? PALETTE.accent : PALETTE.steel}
                strokeWidth={isActive ? 1.5 : 0.8}
                strokeOpacity={isActive ? 0.9 : 0.45}
                filter={isActive ? 'url(#jr-glow)' : undefined}
                initial={false}
                animate={{
                  fillOpacity: isActive ? 0.15 : 0.4,
                  strokeOpacity: isActive ? 0.9 : 0.45,
                }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />

              {/* Label text */}
              <motion.text
                x={node.x}
                y={node.y + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? PALETTE.accent : PALETTE.steel}
                fillOpacity={isActive ? 1 : 0.7}
                fontSize="8"
                fontFamily="var(--font-mono)"
                fontWeight={isActive ? 600 : 400}
                initial={false}
                animate={{
                  fillOpacity: isActive ? 1 : 0.7,
                }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                {node.label}
              </motion.text>
            </g>
          );
        })}

        {/* Center icon — JARVIS hexagonal motif */}
        <motion.circle
          cx={150}
          cy={150}
          r="14"
          fill="none"
          stroke={PALETTE.steel}
          strokeWidth="0.6"
          strokeOpacity="0.25"
          strokeDasharray="3 3"
          initial={false}
          animate={{ rotate: isStatic ? 0 : 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.text
          x={150}
          y={150.5}
          textAnchor="middle"
          dominantBaseline="central"
          fill={PALETTE.steel}
          fillOpacity="0.5"
          fontSize="6"
          fontFamily="var(--font-mono)"
        >
          J
        </motion.text>
      </svg>

      {/* Status indicator */}
      <motion.div
        className="jr-status"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <motion.span
          key={activeLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {statusText}
        </motion.span>
      </motion.div>
    </div>
  );
}

// ── Animated edge connections ──

interface AnimatedConnectionsProps {
  nodes: Phase[];
  isStatic: boolean;
  activePhase: number;
}

function AnimatedConnections({ nodes, isStatic, activePhase }: AnimatedConnectionsProps) {
  return (
    <>
      {EDGES.slice(0, -1).map((fromIdx, i) => {
        const toIdx = EDGES[i + 1];
        const from = nodes[fromIdx];
        const to = nodes[toIdx];
        const angle = Math.atan2(to.y - from.y, to.x - from.x);

        // Offset the line start/end to the node perimeter
        const x1 = from.x + Math.cos(angle) * from.r;
        const y1 = from.y + Math.sin(angle) * from.r;
        const x2 = to.x - Math.cos(angle) * to.r;
        const y2 = to.y - Math.sin(angle) * to.r;

        // Check if this edge is the currently active one (before active node)
        const edgeActive = i === activePhase && !isStatic;

        return (
          <g key={`edge-${from.id}-${to.id}`}>
            {/* Base connection line */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={PALETTE.steel}
              strokeWidth="0.6"
              strokeOpacity={edgeActive ? 0.6 : 0.2}
              strokeLinecap="round"
            />

            {/* Animated flow dashes (direction indicator) */}
            <motion.line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={PALETTE.accent}
              strokeWidth={edgeActive ? 1.5 : 0.8}
              strokeOpacity={edgeActive ? 0.9 : isStatic ? 0 : 0.3}
              strokeDasharray="6 18"
              strokeLinecap="round"
              initial={false}
              animate={
                isStatic
                  ? { strokeDashoffset: 0, strokeOpacity: 0 }
                  : { strokeDashoffset: [24, 0] }
              }
              transition={
                isStatic
                  ? { duration: 0 }
                  : { duration: 0.9, repeat: Infinity, ease: 'linear' }
              }
            />

            {/* Arrow tip at the endpoint — small triangle */}
            {(!isStatic || edgeActive) && (
              <motion.polygon
                points={`${x2},${y2} ${x2 - 4 * Math.cos(angle - 0.6)},${y2 - 4 * Math.sin(angle - 0.6)} ${x2 - 4 * Math.cos(angle + 0.6)},${y2 - 4 * Math.sin(angle + 0.6)}`}
                fill={PALETTE.accent}
                fillOpacity={edgeActive ? 0.7 : isStatic ? 0.3 : 0.15}
                initial={false}
                animate={{ fillOpacity: edgeActive ? 0.7 : isStatic ? 0.3 : 0.15 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </g>
        );
      })}
    </>
  );
}
