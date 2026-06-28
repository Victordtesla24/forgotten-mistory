'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * AtoEvidenceBar — SVG time-compression bar for the ATO Payday Super
 * test-evidence automation harness (SPEC §7 #4). Shows a bar collapsing from
 * ~3 hours → ~15 minutes (≈92% reduction) across 200+ SIT/E2E scenario ticks,
 * with a legacy-terminal panel morphing into an automated pipeline.
 *
 * Data is static, resume-sourced (ATO evidence harness: 3h→15min, 200+
 * scenarios, 92% effort cut). Colours: CSS tokens only. Reduced-motion
 * fallback shows the final compressed state with static labels.
 */

const TOTAL_TICKS = 220;
const START_MINUTES = 180; // 3 hours
const END_MINUTES = 15;    // ~15 minutes
const REDUCTION_PCT = 92;

const BAR_WIDTH = 260;
const BAR_HEIGHT = 16;
const PADDING_X = 28;

interface Tick {
  x: number;
  h: number;
}

function generateTicks(): Tick[] {
  const ticks: Tick[] = [];
  const chartW = BAR_WIDTH - PADDING_X * 2;
  for (let i = 0; i < TOTAL_TICKS; i++) {
    const frac = i / (TOTAL_TICKS - 1);
    // Ease: starts slow (manual), steep drop mid-harness, settles at automated floor
    const eased = 1 - Math.pow(frac, 0.55);
    const minutes = START_MINUTES - eased * (START_MINUTES - END_MINUTES);
    const h = Math.max(2, (minutes / START_MINUTES) * BAR_HEIGHT);
    ticks.push({ x: PADDING_X + frac * chartW, h });
  }
  return ticks;
}

const TICKS = generateTicks();

export default React.memo(function AtoEvidenceBar({ className = '', project }: { className?: string; project?: string }) {
  const prefersReducedMotion = useReducedMotionSafe();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<'terminal' | 'morphing' | 'pipeline'>('terminal');
  const [tickProgress, setTickProgress] = useState(0);
  const pausedRef = useRef(false);

  // Visibility change: pause/resume
  useEffect(() => {
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
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

  useEffect(() => {
    if (!inView || prefersReducedMotion) return;

    // Phase 1: show terminal state 0.6s
    const t1 = setTimeout(() => setPhase('morphing'), 600);

    // Phase 2: tick through the bar collapse over ~2.5s
    const startTick = Date.now();
    const tickDuration = 2500;
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - startTick;
      const progress = Math.min(elapsed / tickDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 2.5);
      setTickProgress(Math.floor(eased * TOTAL_TICKS));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase('pipeline');
      }
    };

    const t2 = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [inView, prefersReducedMotion]);

  const showStatic = prefersReducedMotion || !inView;
  const finalPhase = showStatic ? 'pipeline' : phase;
  const finalProgress = showStatic ? TOTAL_TICKS : tickProgress;

  const barPathD = (() => {
    if (finalProgress === 0) return '';
    const active = TICKS.slice(0, finalProgress);
    if (active.length === 0) return '';
    let d = `M${active[0].x},${BAR_HEIGHT - active[0].h}`;
    for (let i = 1; i < active.length; i++) {
      d += `L${active[i].x.toFixed(1)},${(BAR_HEIGHT - active[i].h).toFixed(1)}`;
    }
    // Fill the rest to create the bar
    const lastTick = active[active.length - 1];
    d += `L${lastTick.x.toFixed(1)},${BAR_HEIGHT}`;
    d += `L${active[0].x},${BAR_HEIGHT}`;
    d += 'Z';
    return d;
  })();

  return (
    <div
      ref={containerRef}
      data-testid="ato-evidence-bar" data-project={project}
      className={`ato-evidence-bar ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      {/* Terminal → Pipeline morph panel */}
      <div className="ato-display">
        {/* Legacy terminal (fades out) */}
        <motion.div
          className="ato-terminal"
          data-testid="ato-terminal"
          animate={{
            opacity: finalPhase === 'terminal' || finalPhase === 'morphing' ? 1 : 0.15,
            scale: finalPhase === 'pipeline' ? 0.97 : 1,
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <div className="ato-terminal-header">
            <span className="ato-dot" />
            <span className="ato-dot" />
            <span className="ato-dot" />
            <span className="ato-terminal-title">MAINFRAME — SIT EVIDENCE</span>
          </div>
          <div className="ato-terminal-body">
            <div className="ato-terminal-line">$ REXX SCRAPE SMF-0472 --scenario-count=220</div>
            <div className="ato-terminal-line ato-dim">Fetching SIT batch logs...</div>
            <div className="ato-terminal-line ato-dim">E2E evidence: 3h estimated / scenario</div>
          </div>
        </motion.div>

        {/* Automated pipeline (fades in) */}
        <motion.div
          className="ato-pipeline"
          data-testid="ato-pipeline"
          animate={{
            opacity: finalPhase === 'pipeline' ? 1 : 0.15,
            scale: finalPhase === 'pipeline' ? 1 : 1.03,
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <div className="ato-pipeline-header">
            <span className="ato-pipeline-badge">AUTOMATED</span>
            <span className="ato-pipeline-title">HARNESS PIPELINE</span>
          </div>
          <div className="ato-pipeline-body">
            <div className="ato-pipeline-node">REXX</div>
            <div className="ato-pipeline-arrow">→</div>
            <div className="ato-pipeline-node">SMF</div>
            <div className="ato-pipeline-arrow">→</div>
            <div className="ato-pipeline-node">SDSF</div>
            <div className="ato-pipeline-arrow">→</div>
            <div className="ato-pipeline-node ato-pipeline-node-active">EVIDENCE</div>
          </div>
        </motion.div>
      </div>

      {/* Time-compression bar */}
      <div className="ato-bar-container">
        <svg
          viewBox={`0 0 ${BAR_WIDTH} ${BAR_HEIGHT + 8}`}
          className="ato-bar-svg"
          role="img"
          aria-label="Evidence time compression: 3 hours to 15 minutes"
        >
          {/* Baseline */}
          <line
            x1={PADDING_X}
            y1={BAR_HEIGHT}
            x2={BAR_WIDTH - PADDING_X}
            y2={BAR_HEIGHT}
            stroke="var(--ink-700)"
            strokeWidth="1"
          />

          {/* Start marker */}
          <line
            x1={PADDING_X}
            y1={BAR_HEIGHT - BAR_HEIGHT}
            x2={PADDING_X}
            y2={BAR_HEIGHT + 4}
            stroke="var(--mist-400)"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
          <text
            x={PADDING_X}
            y={BAR_HEIGHT + 8}
            textAnchor="middle"
            fill="var(--mist-400)"
            fontSize="6"
            fontFamily="var(--font-mono)"
          >
            3h
          </text>

          {/* End marker */}
          <line
            x1={BAR_WIDTH - PADDING_X}
            y1={BAR_HEIGHT - (END_MINUTES / START_MINUTES) * BAR_HEIGHT}
            x2={BAR_WIDTH - PADDING_X}
            y2={BAR_HEIGHT + 4}
            stroke="var(--steel)"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
          <text
            x={BAR_WIDTH - PADDING_X}
            y={BAR_HEIGHT + 8}
            textAnchor="middle"
            fill="var(--steel)"
            fontSize="6"
            fontFamily="var(--font-mono)"
          >
            15m
          </text>

          {/* Bar fill */}
          {barPathD && (
            <motion.path
              data-testid="ato-bar-fill"
              d={barPathD}
              fill="var(--white)"
              fillOpacity="0.85"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          )}

          {/* Top edge line */}
          {finalProgress > 1 && (
            <path
              d={(() => {
                const active = TICKS.slice(0, finalProgress);
                return active
                  .map((t, i) =>
                    `${i === 0 ? 'M' : 'L'}${t.x.toFixed(1)},${(BAR_HEIGHT - t.h).toFixed(1)}`
                  )
                  .join(' ');
              })()}
              fill="none"
              stroke="var(--white)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Tick marks for the remaining height */}
          {finalProgress > 0 && TICKS.slice(0, finalProgress).filter((_, i) => i % 8 === 0).map((t, i) => (
            <line
              key={i}
              x1={t.x}
              y1={BAR_HEIGHT - t.h - 1}
              x2={t.x}
              y2={BAR_HEIGHT - t.h + 1}
              stroke="var(--steel)"
              strokeWidth="0.5"
              opacity="0.5"
            />
          ))}
        </svg>
      </div>

      {/* Metrics readout */}
      <div className="ato-metrics">
        <motion.span
          className="ato-metric"
          data-testid="ato-reduction"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          ≈{showStatic ? REDUCTION_PCT : Math.round((tickProgress / TOTAL_TICKS) * REDUCTION_PCT)}% reduction
        </motion.span>
        <span className="ato-metric-sep">·</span>
        <motion.span
          className="ato-metric"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          {TOTAL_TICKS}+ SIT/E2E scenarios
        </motion.span>
        <span className="ato-metric-sep">·</span>
        <motion.span
          className="ato-metric"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          Zero new InfoSec approvals
        </motion.span>
      </div>

      <style jsx>{`
        .ato-evidence-bar {
          width: 100%;
          max-width: 340px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          position: relative;
          overflow: hidden;
        }
        .ato-display {
          position: relative;
          height: 72px;
        }
        .ato-terminal,
        .ato-pipeline {
          position: absolute;
          inset: 0;
          background: var(--ink-900);
          border: 1px solid var(--ink-700);
          border-radius: 8px;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .ato-terminal-header {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          margin-bottom: 0.2rem;
        }
        .ato-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--steel);
          opacity: 0.5;
        }
        .ato-terminal-title {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: var(--steel);
          margin-left: 0.3rem;
          letter-spacing: 0.5px;
        }
        .ato-terminal-body {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .ato-terminal-line {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: var(--mist-200);
        }
        .ato-terminal-line.ato-dim {
          color: var(--mist-400);
          opacity: 0.7;
        }
        .ato-pipeline-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.3rem;
        }
        .ato-pipeline-badge {
          font-family: var(--font-mono);
          font-size: 0.5rem;
          color: var(--ink-900);
          background: var(--white);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
        .ato-pipeline-title {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: var(--white);
          letter-spacing: 0.5px;
        }
        .ato-pipeline-body {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .ato-pipeline-node {
          font-family: var(--font-mono);
          font-size: 0.5rem;
          color: var(--steel);
          padding: 0.15rem 0.35rem;
          border: 1px solid var(--ink-700);
          border-radius: 4px;
        }
        .ato-pipeline-node-active {
          color: var(--white);
          border-color: var(--steel);
          background: rgba(255, 255, 255, 0.06);
        }
        .ato-pipeline-arrow {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: var(--mist-400);
          opacity: 0.6;
        }
        .ato-bar-container {
          width: 100%;
        }
        .ato-bar-svg {
          width: 100%;
          height: auto;
        }
        .ato-metrics {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.4rem;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--steel);
        }
        .ato-metric {
          font-variant-numeric: tabular-nums;
        }
        .ato-metric-sep {
          opacity: 0.4;
        }
        @media (prefers-reduced-motion: reduce) {
          .ato-terminal,
          .ato-pipeline {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
})
