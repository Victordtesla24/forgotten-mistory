'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * TokenReflow — Prompt-optimisation visualiser for prompt-reconstruct /
 * Advanced-Prompt-Creator project cards (SPEC §7 #14). Two columns: "Raw input"
 * (scattered tokens) → animated flow → "Optimised" (tokens settle into order).
 *
 * Uses Framer Motion layoutId for shared layout animations. All positions are
 * fixed (no Math.random()). Colours: CSS tokens only. Reduced-motion fallback
 * shows both columns static side-by-side.
 */

interface Token {
  id: string;
  label: string;
  rawX: number;
  rawY: number;
}

const TOKENS: Token[] = [
  { id: 't1', label: 'ROLE', rawX: 15, rawY: 25 },
  { id: 't2', label: 'CONTEXT', rawX: 60, rawY: 10 },
  { id: 't3', label: 'CONSTRAINT', rawX: 8, rawY: 55 },
  { id: 't4', label: 'EXAMPLE', rawX: 50, rawY: 45 },
  { id: 't5', label: 'CHAIN-OF-THOUGHT', rawX: 20, rawY: 75 },
  { id: 't6', label: 'OUTPUT-FORMAT', rawX: 55, rawY: 70 },
  { id: 't7', label: 'PERSONA', rawX: 5, rawY: 40 },
  { id: 't8', label: 'TASK', rawX: 65, rawY: 30 },
  { id: 't9', label: 'STYLE', rawX: 30, rawY: 60 },
  { id: 't10', label: 'SAFETY', rawX: 70, rawY: 55 },
  { id: 't11', label: 'CITATION', rawX: 12, rawY: 85 },
  { id: 't12', label: 'DELIMITER', rawX: 48, rawY: 88 },
];

const OPTIMAL_ORDER = [
  'ROLE',
  'PERSONA',
  'CONTEXT',
  'TASK',
  'CONSTRAINT',
  'CHAIN-OF-THOUGHT',
  'OUTPUT-FORMAT',
  'STYLE',
  'EXAMPLE',
  'SAFETY',
  'CITATION',
  'DELIMITER',
];

export default function TokenReflow({ className = '' }: { className?: string }) {
  const prefersReducedMotion = useReducedMotionSafe();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<'raw' | 'optimised'>('raw');

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
    const timeout = setTimeout(() => setPhase('optimised'), 1000);
    return () => clearTimeout(timeout);
  }, [inView, prefersReducedMotion]);

  const showOptimised = phase === 'optimised' || prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      data-testid="token-reflow"
      className={`token-reflow ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      {/* Raw column */}
      <div className="reflow-col reflow-raw">
        <span className="reflow-label">Raw input</span>
        <div className="reflow-area">
          {!showOptimised &&
            TOKENS.map((token, idx) => (
              <motion.span
                key={token.id}
                data-testid="token-pill"
                layoutId={prefersReducedMotion ? undefined : token.id}
                className="token-pill"
                style={{ left: `${token.rawX}%`, top: `${token.rawY}%` }}
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
              >
                {token.label}
              </motion.span>
            ))}
          {prefersReducedMotion &&
            TOKENS.map((token) => (
              <span
                key={token.id}
                data-testid="token-pill"
                className="token-pill"
                style={{ left: `${token.rawX}%`, top: `${token.rawY}%` }}
              >
                {token.label}
              </span>
            ))}
        </div>
      </div>

      {/* Flow arrow — a dashed stream flows rightward; flow particles ride the gap. */}
      <div className="reflow-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--steel)">
          <path
            data-reflow-arrow
            d="M5 12h14M12 5l7 7-7 7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {inView && !prefersReducedMotion && (
          <div className="reflow-particles" data-reflow-particles>
            {Array.from({ length: 6 }, (_, i) => (
              <span
                key={i}
                className="reflow-particle"
                data-reflow-particle
                style={{ animationDelay: `${(i * 0.32).toFixed(2)}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Optimised column */}
      <div className="reflow-col reflow-optimised">
        <span className="reflow-label">Optimised</span>
        <span className="reflow-glow" data-reflow-glow aria-hidden="true" />
        <div className="reflow-list">
          <AnimatePresence>
            {showOptimised &&
              OPTIMAL_ORDER.map((label, idx) => {
                const token = TOKENS.find((t) => t.label === label);
                if (!token) return null;
                return (
                  <motion.span
                    key={token.id}
                    data-testid="token-pill"
                    layoutId={prefersReducedMotion ? undefined : token.id}
                    className="token-pill stacked"
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3, type: 'spring', stiffness: 200 }}
                  >
                    {token.label}
                  </motion.span>
                );
              })}
          </AnimatePresence>
        </div>
      </div>

      <style jsx>{`
        .token-reflow {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          max-width: 360px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .reflow-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .reflow-optimised {
          position: relative;
        }
        .reflow-glow {
          position: absolute;
          inset: -6px -8px;
          border-radius: 12px;
          pointer-events: none;
          background: radial-gradient(circle at 50% 38%, rgba(244, 246, 250, 0.13), transparent 70%);
          opacity: 0.15;
          animation: reflowGlow 2.6s ease-in-out infinite;
        }
        .reflow-label {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--mist-400);
          margin-bottom: 0.25rem;
        }
        .reflow-area {
          position: relative;
          height: 140px;
        }
        .reflow-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-height: 140px;
        }
        .reflow-arrow {
          position: relative;
          flex-shrink: 0;
          opacity: 0.75;
        }
        [data-reflow-arrow] {
          stroke-dasharray: 6 6;
          animation: reflowArrowFlow 0.9s linear infinite;
        }
        .reflow-particles {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -18px;
          right: -18px;
          pointer-events: none;
        }
        .reflow-particle {
          position: absolute;
          top: 50%;
          left: 0;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: var(--white);
          box-shadow: 0 0 6px rgba(244, 246, 250, 0.7);
          opacity: 0;
          animation: reflowParticle 1.3s linear infinite;
        }
        @keyframes reflowArrowFlow {
          to {
            stroke-dashoffset: -12;
          }
        }
        @keyframes reflowGlow {
          0%,
          100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes reflowParticle {
          0% {
            transform: translate(-4px, -50%) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(48px, -50%) scale(0.85);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-reflow-arrow] {
            animation: none;
          }
          .reflow-glow {
            animation: none;
          }
          .reflow-particle {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
      <style jsx global>{`
        .token-pill {
          position: absolute;
          display: inline-block;
          padding: 0.2rem 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--white);
          background: var(--ink-700);
          border: 1px solid var(--mist-400);
          border-radius: 10px;
          white-space: nowrap;
        }
        .token-pill.stacked {
          position: relative;
          left: 0;
          top: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .token-pill {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
