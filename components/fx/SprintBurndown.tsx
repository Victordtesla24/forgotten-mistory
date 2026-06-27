'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * SprintBurndown — Animated SVG burndown/burnup infographic for the
 * EFDDH-Jira-Analytics-Dashboard project card (SPEC §7 #3). Shows ideal line
 * and actual remaining story points converging over a 10-day sprint.
 *
 * Data is static, resume-sourced (~40 pts/sprint, 8-sprint PI cadence).
 * Colours: CSS tokens only. Reduced-motion fallback shows final chart state.
 */

const SPRINT_DAYS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const IDEAL_REMAINING = [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0];
const ACTUAL_REMAINING = [40, 38, 35, 31, 26, 22, 17, 13, 9, 5, 0];
// Third series — the velocity-fitted trend the team tracks against the ideal.
const TREND_REMAINING = [40, 36.5, 33, 29.5, 25, 21, 17, 13, 9, 5, 1];

const WIDTH = 300;
const HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 30, left: 35 };
const CHART_W = WIDTH - PADDING.left - PADDING.right;
const CHART_H = HEIGHT - PADDING.top - PADDING.bottom;

function toPath(data: number[]): string {
  return data
    .map((v, i) => {
      const x = PADDING.left + (i / (data.length - 1)) * CHART_W;
      const y = PADDING.top + (1 - v / 40) * CHART_H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

const idealPath = toPath(IDEAL_REMAINING);
const actualPath = toPath(ACTUAL_REMAINING);
const trendPath = toPath(TREND_REMAINING);
// Closed area under the actual line (down to the day-0 baseline) for the gradient fill.
const BASELINE_Y = PADDING.top + CHART_H;
const areaPath = `${actualPath} L${(PADDING.left + CHART_W).toFixed(1)},${BASELINE_Y.toFixed(
  1,
)} L${PADDING.left.toFixed(1)},${BASELINE_Y.toFixed(1)} Z`;

function pathLength(path: string): number {
  if (typeof document === 'undefined') return 500;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', path);
  svg.appendChild(p);
  document.body.appendChild(svg);
  const len = p.getTotalLength();
  document.body.removeChild(svg);
  return len;
}

export default function SprintBurndown({ className = '', project }: { className?: string; project?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [idealLen, setIdealLen] = useState(500);
  const [actualLen, setActualLen] = useState(500);
  const [trendLen, setTrendLen] = useState(500);

  useEffect(() => {
    setIdealLen(pathLength(idealPath));
    setActualLen(pathLength(actualPath));
    setTrendLen(pathLength(trendPath));
  }, []);

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

  const animate = inView && !prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      data-testid="sprint-burndown" data-project={project}
      className={`sprint-burndown ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="burndown-svg"
        role="img"
        aria-label="Sprint burndown chart"
      >
        <defs>
          <linearGradient id="burndown-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--white)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--white)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gradient area fill under the actual line. */}
        <motion.path
          data-burndown-area
          d={areaPath}
          fill="url(#burndown-area-grad)"
          stroke="none"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: animate ? 0.9 : 1 }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.5 }}
        />

        {/* Y-axis labels */}
        <g className="burndown-axis-y" fill="var(--mist-400)" fontSize="9" fontFamily="var(--font-mono)">
          <text x={PADDING.left - 8} y={PADDING.top + 2} textAnchor="end">40</text>
          <text x={PADDING.left - 8} y={PADDING.top + CHART_H / 2 + 2} textAnchor="end">20</text>
          <text x={PADDING.left - 8} y={PADDING.top + CHART_H + 2} textAnchor="end">0</text>
        </g>

        {/* X-axis labels */}
        <g className="burndown-axis-x" fill="var(--mist-400)" fontSize="8" fontFamily="var(--font-mono)">
          {[0, 5, 10].map((day) => (
            <text
              key={day}
              x={PADDING.left + (day / 10) * CHART_W}
              y={HEIGHT - 8}
              textAnchor="middle"
            >
              D{day}
            </text>
          ))}
        </g>

        {/* Grid lines */}
        <g className="burndown-grid" stroke="var(--ink-500)" strokeOpacity="0.3" strokeWidth="0.5">
          {[0, 0.5, 1].map((frac) => (
            <line
              key={frac}
              x1={PADDING.left}
              y1={PADDING.top + frac * CHART_H}
              x2={PADDING.left + CHART_W}
              y2={PADDING.top + frac * CHART_H}
            />
          ))}
        </g>

        {/* Ideal line */}
        <motion.path
          data-testid="burndown-ideal"
          d={idealPath}
          fill="none"
          stroke="var(--mist-400)"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeDashoffset={animate ? idealLen : 0}
          initial={prefersReducedMotion ? false : { strokeDashoffset: idealLen }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          style={{ strokeDasharray: idealLen }}
        />

        {/* Trend line (velocity-fitted projection) */}
        <motion.path
          data-testid="burndown-trend"
          d={trendPath}
          fill="none"
          stroke="var(--steel)"
          strokeWidth="1.5"
          strokeDasharray="1 4"
          strokeLinecap="round"
          opacity="0.6"
          strokeDashoffset={animate ? trendLen : 0}
          initial={prefersReducedMotion ? false : { strokeDashoffset: trendLen }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.3, ease: 'easeOut', delay: 0.25 }}
          style={{ strokeDasharray: trendLen }}
        />

        {/* Actual line */}
        <motion.path
          data-testid="burndown-actual"
          d={actualPath}
          fill="none"
          stroke="var(--white)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDashoffset={animate ? actualLen : 0}
          initial={prefersReducedMotion ? false : { strokeDashoffset: actualLen }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
          style={{ strokeDasharray: actualLen }}
        />

        {/* Data points (actual) */}
        {ACTUAL_REMAINING.map((v, i) => {
          const cx = PADDING.left + (i / 10) * CHART_W;
          const cy = PADDING.top + (1 - v / 40) * CHART_H;
          return (
            <motion.circle
              key={i}
              cx={cx}
              cy={cy}
              r="4"
              fill="var(--ink-800)"
              stroke="var(--white)"
              strokeWidth="1.5"
              initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.3, type: 'spring' }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.4 }}
              className="burndown-dot"
            />
          );
        })}
      </svg>

      <div className="burndown-label">~40 pts / sprint</div>

      <style jsx>{`
        .sprint-burndown {
          width: 100%;
          max-width: 320px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .burndown-svg {
          width: 100%;
          height: auto;
        }
        .burndown-axis-y,
        .burndown-axis-x {
          animation: burndownAxisIn 0.9s ease both;
        }
        @keyframes burndownAxisIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .burndown-label {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--steel);
        }
        @media (prefers-reduced-motion: reduce) {
          .burndown-dot {
            transform: none !important;
          }
          .burndown-axis-y,
          .burndown-axis-x {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
