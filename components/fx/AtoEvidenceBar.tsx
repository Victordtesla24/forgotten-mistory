'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { PALETTE } from '@/lib/palette';

/**
 * AtoEvidenceBar — signature time-compression visualisation for the Australian
 * Taxation Office Payday Super entry (SPEC §7 / FR-SIGFX). A "Matter Facing →
 * Evidence Summary" comparison whose central timelapse bar collapses from 100% to
 * ~8% while a graduated ruler lights up: the residual 8.3% is ~15 min as a share of
 * ~3 h (180 min) of manual evidence per scenario — i.e. the ≈92% evidence-effort
 * cut delivered by the COBOL/mainframe test-evidence harness across 200+ SIT/E2E
 * scenarios and 8 squads. Every figure is resume-traceable (NN-3) — the bar's
 * collapse IS the ≈92% number, not an invented one.
 *
 * As it compresses, the bar morphs a legacy-terminal block (sharp corners,
 * monospace caret) into a pipeline lozenge (fully rounded). Colours come only from
 * lib/palette.ts. Under prefers-reduced-motion it renders the final compressed
 * state immediately, with no animation.
 */

const TICK_COUNT = 36;
const DURATION = 2.4; // s — the full time-compression sweep
// 15 min / 180 min ≈ 8.3%: the residual evidence effort after the ≈92% cut.
const COMPRESSED_PCT = 8.3;

export default function AtoEvidenceBar({ className = '' }: { className?: string }) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
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

  // Animate only for motion-allowing visitors; reduced motion snaps to the end state.
  const playing = inView && !reduced;
  const barTransition = reduced ? { duration: 0 } : { duration: DURATION, ease: 'easeInOut' as const };

  return (
    <div
      ref={ref}
      data-testid="ato-evidence-bar"
      className={`ato-evidence ${className}`.trim()}
      {...(reduced ? { 'data-reduced-motion': 'true' } : {})}
    >
      <div className="ato-head">ATO · evidence harness</div>

      {/* The two end states: legacy terminal (manual) → automated pipeline. */}
      <div className="ato-ends">
        <div className="ato-box ato-box--legacy" style={{ borderColor: PALETTE.steel }}>
          <span className="ato-box-label" style={{ color: PALETTE.steel }}>
            Matter Facing
          </span>
          <span className="ato-box-value" style={{ color: PALETTE.white }}>
            ~3 h
            <span className="ato-caret" style={{ background: PALETTE.steel }} aria-hidden />
          </span>
          <span className="ato-box-sub" style={{ color: PALETTE.steel }}>
            manual / scenario
          </span>
        </div>

        <span className="ato-arrow" style={{ color: PALETTE.steel }} aria-hidden>
          →
        </span>

        <div className="ato-box ato-box--pipeline" style={{ borderColor: PALETTE.white }}>
          <span className="ato-box-label" style={{ color: PALETTE.steel }}>
            Evidence Summary
          </span>
          <span className="ato-box-value" style={{ color: PALETTE.white }}>
            ~15 min
          </span>
          <span className="ato-box-sub" style={{ color: PALETTE.steel }}>
            automated / scenario
          </span>
        </div>
      </div>

      {/* Timelapse track: the bar collapses 100% → ~8% and morphs terminal→pipeline. */}
      <div className="ato-track" data-testid="ato-track" style={{ background: PALETTE.ink700 }}>
        <motion.div
          className="ato-timelapse"
          data-testid="ato-timelapse"
          // Geometry is set inline, NOT via the <style jsx> block below: styled-jsx adds
          // its scoping class to host DOM elements but not to framer-motion components, so
          // a scoped `.ato-timelapse { position:absolute; height:100% }` rule never matches
          // this motion.div — it would collapse to position:static / height:0 (invisible).
          // Inline styles always apply; framer still owns the animated width/borderRadius.
          // `width:'100%'` is the SSR / pre-hydration BASE so the bar always has a
          // measurable, visible box even before framer's motion values attach (an
          // absolutely-positioned div with no width collapses to 0 → `hidden`); framer's
          // `animate` then takes over and collapses the width to COMPRESSED_PCT.
          style={{ background: PALETTE.white, position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', opacity: 0.9 }}
          initial={{ width: '100%', borderRadius: 2 }}
          animate={inView ? { width: `${COMPRESSED_PCT}%`, borderRadius: 999 } : { width: '100%', borderRadius: 2 }}
          transition={barTransition}
        />
        <div className="ato-ticks" aria-hidden>
          {Array.from({ length: TICK_COUNT }).map((_, i) => (
            <motion.span
              key={i}
              data-testid="ato-tick"
              className="ato-tick"
              // Inline geometry — see the .ato-timelapse note (styled-jsx scoping misses motion.*).
              style={{ background: PALETTE.steel, width: '1px', height: '100%', display: 'block', mixBlendMode: 'difference' }}
              initial={{ opacity: 0.18 }}
              animate={inView ? { opacity: 0.85 } : { opacity: 0.18 }}
              transition={
                playing ? { duration: 0.18, delay: (i / TICK_COUNT) * DURATION } : { duration: 0 }
              }
            />
          ))}
        </div>
      </div>

      <div className="ato-metric" style={{ color: PALETTE.steel }}>
        <strong style={{ color: PALETTE.white }}>≈92%</strong> evidence-effort cut · 200+ SIT/E2E
        scenarios · 8 squads
      </div>

      <style jsx>{`
        .ato-evidence {
          width: 100%;
          max-width: 320px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .ato-head {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.6;
        }
        .ato-ends {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 0.5rem;
        }
        .ato-box {
          display: flex;
          flex-direction: column;
          gap: 0.18rem;
          padding: 0.55rem 0.6rem;
          border: 1px solid;
          background: rgba(255, 255, 255, 0.015);
        }
        /* legacy terminal: sharp corners + monospace */
        .ato-box--legacy {
          border-radius: 3px;
          font-family: var(--font-mono);
        }
        /* automated pipeline: rounded lozenge */
        .ato-box--pipeline {
          border-radius: 14px;
        }
        .ato-box-label {
          font-size: 0.58rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .ato-box-value {
          font-size: 1.05rem;
          font-weight: 600;
          display: inline-flex;
          align-items: baseline;
        }
        .ato-box-sub {
          font-size: 0.55rem;
          opacity: 0.8;
        }
        .ato-caret {
          display: inline-block;
          width: 0.45ch;
          height: 0.95em;
          margin-left: 2px;
          transform: translateY(0.08em);
          animation: ato-blink 1.1s steps(2, start) infinite;
        }
        .ato-arrow {
          font-size: 0.9rem;
          opacity: 0.7;
        }
        .ato-track {
          position: relative;
          width: 100%;
          height: 16px;
          border-radius: 999px;
          overflow: hidden;
        }
        /* .ato-timelapse and .ato-tick are framer-motion components; styled-jsx does not
           add its scoping class to them, so their geometry is set inline (see JSX above). */
        .ato-ticks {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          padding: 0 1px;
          pointer-events: none;
        }
        .ato-metric {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          line-height: 1.4;
        }
        .ato-metric strong {
          font-weight: 700;
        }
        @keyframes ato-blink {
          0%,
          50% {
            opacity: 1;
          }
          50.01%,
          100% {
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ato-caret {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
