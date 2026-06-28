'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PALETTE } from '@/lib/palette';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * TokenStreamMatch — SVG/Framer Motion token-match stream effect for the
 * tailor-resume-with-ai project (TG1-02). Theme: CV↔JD token/embedding
 * matching. Two columns of token pills (CV Terms / JD Terms) connected by
 * animated SVG arcs for matched pairs.
 *
 * Deterministic data — hardcoded tokens and explicit match pairs (no
 * Math.random). Monochrome palette via PALETTE + CSS tokens. Reduced-
 * motion fallback shows all tokens and connections static.
 */

// ─── Deterministic data ────────────────────────────────────────────────

interface TokenDef {
  id: string;
  label: string;
}

interface MatchPair {
  cvId: string;
  jdId: string;
}

const CV_TOKENS: TokenDef[] = [
  { id: 'cv1', label: 'Python' },
  { id: 'cv2', label: 'React' },
  { id: 'cv3', label: 'TypeScript' },
  { id: 'cv4', label: 'CI/CD' },
  { id: 'cv5', label: 'Docker' },
  { id: 'cv6', label: 'Agile' },
  { id: 'cv7', label: 'REST APIs' },
];

const JD_TOKENS: TokenDef[] = [
  { id: 'jd1', label: 'Python' },
  { id: 'jd2', label: 'TypeScript' },
  { id: 'jd3', label: 'React' },
  { id: 'jd4', label: 'Kubernetes' },
  { id: 'jd5', label: 'Docker' },
  { id: 'jd6', label: 'Scrum' },
  { id: 'jd7', label: 'CI/CD' },
  { id: 'jd8', label: 'Microservices' },
];

const MATCH_PAIRS: MatchPair[] = [
  { cvId: 'cv1', jdId: 'jd1' }, // Python       ↔ Python
  { cvId: 'cv2', jdId: 'jd3' }, // React        ↔ React
  { cvId: 'cv3', jdId: 'jd2' }, // TypeScript   ↔ TypeScript
  { cvId: 'cv4', jdId: 'jd7' }, // CI/CD        ↔ CI/CD
  { cvId: 'cv5', jdId: 'jd5' }, // Docker       ↔ Docker
];

// ─── Arc geometry ──────────────────────────────────────────────────────
//
// Tokens are rendered as HTML pills in two flex columns.  The SVG overlay
// sits above them (pointer-events: none) and draws quadratic-bezier arcs
// from the right edge of each CV pill to the left edge of its matched JD
// pill.  Y positions are computed from token index * 32 + 42.

interface ArcDef {
  id: string;
  d: string;
}

function buildArc(cvIdx: number, jdIdx: number, id: string): ArcDef {
  const x1 = 125;
  const x2 = 235;
  const y1 = 42 + cvIdx * 32;
  const y2 = 42 + jdIdx * 32;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dy = y2 - y1;
  const curvature = dy === 0 ? 18 : Math.abs(dy) * 0.35 + 12;
  const cpY = midY - curvature;
  return {
    id,
    d: `M${x1},${y1} Q${midX},${cpY} ${x2},${y2}`,
  };
}

const ARCS: ArcDef[] = [
  buildArc(0, 0, 'arc-python'),     // Python   CV 0→y42  JD 0→y42
  buildArc(1, 2, 'arc-react'),      // React    CV 1→y74  JD 2→y106
  buildArc(2, 1, 'arc-typescript'), // TS       CV 2→y106 JD 1→y74
  buildArc(3, 6, 'arc-cicd'),       // CI/CD    CV 3→y138 JD 6→y234
  buildArc(4, 4, 'arc-docker'),     // Docker   CV 4→y170 JD 4→y170
];

// ─── Component ─────────────────────────────────────────────────────────

export default React.memo(function TokenStreamMatch({
  className = '',
  project = 'tailor-resume-with-ai',
}: {
  className?: string;
  project?: string;
}) {
  const prefersReducedMotion = useReducedMotionSafe();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<'entering' | 'connecting' | 'settled'>('entering');
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pause animation when tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // IntersectionObserver — fire once at threshold 0.3
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

  // Phase sequencing: entering → connecting → settled
  useEffect(() => {
    if (!inView || prefersReducedMotion) return;

    const t1 = setTimeout(() => {
      if (!pausedRef.current) setPhase('connecting');
    }, 700);

    const t2 = setTimeout(() => {
      if (!pausedRef.current) setPhase('settled');
    }, 2000);

    timerRef.current = t1 as unknown as ReturnType<typeof setTimeout>;

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView, prefersReducedMotion]);

  const showConnections = phase === 'connecting' || phase === 'settled' || prefersReducedMotion;
  const isSettled = phase === 'settled' || prefersReducedMotion;

  const matchedCvIds = new Set(MATCH_PAIRS.map((p) => p.cvId));
  const matchedJdIds = new Set(MATCH_PAIRS.map((p) => p.jdId));

  return (
    <div
      ref={containerRef}
      data-testid="token-stream-match"
      data-project={project}
      className={`token-stream-match ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      {/* ── SVG overlay: connecting arcs between matched tokens ── */}
      <svg
        className="stream-arcs-svg"
        viewBox="0 0 360 280"
        role="img"
        aria-label="CV to JD token matching streams"
      >
        {ARCS.map((arc) => (
          <motion.path
            key={arc.id}
            data-testid="stream-arc"
            d={arc.d}
            fill="none"
            stroke={PALETTE.steel}
            strokeWidth={1.2}
            strokeOpacity={0.6}
            strokeLinecap="round"
            initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={
              showConnections
                ? { pathLength: 1, opacity: 0.6 }
                : { pathLength: 0, opacity: 0 }
            }
            transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.1 }}
          />
        ))}

        {/* Endpoint dots on settled */}
        {showConnections &&
          ARCS.map((arc) => {
            const m = arc.d.match(/^M([\d.]+),([\d.]+)/);
            const endM = arc.d.match(/([\d.]+),([\d.]+)$/);
            if (!m || !endM) return null;
            return (
              <g key={`dots-${arc.id}`}>
                <motion.circle
                  cx={parseFloat(m[1])}
                  cy={parseFloat(m[2])}
                  r={3}
                  fill={PALETTE.white}
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: isSettled ? 0.9 : 0.5 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                />
                <motion.circle
                  cx={parseFloat(endM[1])}
                  cy={parseFloat(endM[2])}
                  r={3}
                  fill={PALETTE.accent}
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: isSettled ? 0.9 : 0.5 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                />
              </g>
            );
          })}
      </svg>

      {/* ── Two-column pill layout ── */}
      <div className="stream-columns">
        {/* CV Terms column */}
        <div className="stream-col stream-col--cv">
          <span className="stream-col-label">CV Terms</span>
          <div className="stream-token-list">
            {CV_TOKENS.map((token, idx) => {
              const matched = matchedCvIds.has(token.id);
              return (
                <motion.span
                  key={token.id}
                  data-testid="match-token"
                  className={`stream-token${matched ? ' stream-token--matched' : ''}`}
                  data-matched={matched ? 'true' : 'false'}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -6 }}
                  animate={
                    inView || prefersReducedMotion
                      ? {
                          opacity: isSettled && !matched ? 0.4 : isSettled ? 0.95 : 0.85,
                          x: 0,
                        }
                      : { opacity: 0, x: -6 }
                  }
                  transition={{ delay: idx * 0.06, duration: 0.25, ease: 'easeOut' }}
                >
                  {token.label}
                </motion.span>
              );
            })}
          </div>
        </div>

        {/* JD Terms column */}
        <div className="stream-col stream-col--jd">
          <span className="stream-col-label">JD Terms</span>
          <div className="stream-token-list">
            {JD_TOKENS.map((token, idx) => {
              const matched = matchedJdIds.has(token.id);
              return (
                <motion.span
                  key={token.id}
                  data-testid="match-token"
                  className={`stream-token${matched ? ' stream-token--matched' : ''}`}
                  data-matched={matched ? 'true' : 'false'}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: 6 }}
                  animate={
                    inView || prefersReducedMotion
                      ? {
                          opacity: isSettled && !matched ? 0.4 : isSettled ? 0.95 : 0.85,
                          x: 0,
                        }
                      : { opacity: 0, x: 6 }
                  }
                  transition={{ delay: idx * 0.06, duration: 0.25, ease: 'easeOut' }}
                >
                  {token.label}
                </motion.span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer: match count ── */}
      <motion.div
        className="stream-footer"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: isSettled ? 1 : 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <span className="stream-stat">{MATCH_PAIRS.length} token matches</span>
        <span className="stream-stat-sep">·</span>
        <span className="stream-stat">embedding similarity</span>
      </motion.div>

      {/* ── Scoped styles (BEM: token-stream-match, stream-*, …) ── */}
      <style jsx>{`
        .token-stream-match {
          position: relative;
          width: 100%;
          max-width: 360px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow: hidden;
        }

        .stream-arcs-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .stream-columns {
          display: flex;
          gap: 1rem;
          position: relative;
          z-index: 2;
        }

        .stream-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .stream-col-label {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--mist-400);
          margin-bottom: 0.15rem;
        }

        .stream-token-list {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .stream-footer {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--steel);
          opacity: 0.8;
          position: relative;
          z-index: 2;
        }

        .stream-stat-sep {
          opacity: 0.4;
        }

        @media (prefers-reduced-motion: reduce) {
          .stream-token {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* ── Global styles for token pills (reused by other fx components) ── */}
      <style jsx global>{`
        .stream-token {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--white);
          background: var(--ink-700);
          border: 1px solid var(--mist-400);
          border-radius: 10px;
          white-space: nowrap;
          text-align: center;
        }

        .stream-token--matched {
          border-color: var(--white);
        }

        .stream-col--cv .stream-token {
          align-self: flex-end;
        }

        .stream-col--jd .stream-token {
          align-self: flex-start;
        }

        @media (prefers-reduced-motion: reduce) {
          .stream-token {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
});
