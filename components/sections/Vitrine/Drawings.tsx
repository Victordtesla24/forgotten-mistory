'use client';

import { useEffect, useRef } from 'react';
import type { JSX } from 'react';

import type { DrawingId } from '@/app/data/portfolio/vitrine';

import styles from './Drawings.module.css';

/**
 * Six mechanism drawings, one per plate.
 *
 * Rules, and they are the reason this file exists rather than a folder of
 * screenshots:
 *
 *   - Never a screenshot, a logo, or a laptop mockup. A screenshot shows what a
 *     repository looks like; a mechanism drawing shows what it *does*, which is
 *     the only thing a technical reader is actually assessing.
 *   - Hairlines only, in currentColor. No fills, no gradients, no hue — the
 *     drawings inherit the plate's colour so the raking light falls on them.
 *   - Every drawing is `role="img"` with a title and a description, because a
 *     diagram that only exists visually explains the work to some readers and
 *     nothing at all to the rest.
 */

const VIEWBOX = '0 0 320 200';

interface DrawingProps {
  id: DrawingId;
}

/** 01 — Aether: twenty engines in a line, and the guard that reverts a claim. */
function PipelineGate() {
  const nodes = Array.from({ length: 20 }, (_, i) => 18 + i * 12.4);
  return (
    <svg viewBox={VIEWBOX} className={styles.drawing} role="img" aria-labelledby="d1t d1d">
      <title id="d1t">The application pipeline and its fabrication guard</title>
      <desc id="d1d">
        Twenty engine nodes in a line carry one job application from left to right. Near the
        end, a vertical gate intercepts a proposed sentence and strikes it through, reverting
        any claim the résumé does not support.
      </desc>
      {/* The line the application travels — scaffolding, held below the gate. */}
      <line pathLength="1" className={`${styles.stroke} ${styles.guide}`} x1="12" y1="96" x2="308" y2="96" stroke="currentColor" />
      {nodes.map((x, i) => (
        <circle pathLength="1" className={`${styles.stroke} ${i === 19 ? styles.primary : styles.guide}`}
          key={x}
          cx={x}
          cy="96"
          r={i === 19 ? 3 : 1.8}
          fill="none"
          stroke="currentColor"
        />
      ))}
      {/* The gate — the mechanism, at primary weight. */}
      <line pathLength="1" className={`${styles.stroke} ${styles.primary}`} x1="248" y1="34" x2="248" y2="158" stroke="currentColor" />
      <text x="248" y="28" className={styles.label} textAnchor="middle">
        GUARD
      </text>
      {/* A proposed sentence, struck through and reverted. The wide halo behind
          the overstrike is a decorative accent (bare .stroke); the overstrike
          itself and the revert arrow carry the mechanism. */}
      <line pathLength="1" className={styles.stroke} x1="196" y1="62" x2="292" y2="62" stroke="currentColor" strokeWidth="3" opacity="0.66" />
      <line pathLength="1" className={`${styles.stroke} ${styles.primary}`} x1="196" y1="62" x2="292" y2="62" stroke="currentColor" />
      <path pathLength="1" className={`${styles.stroke} ${styles.guide}`}
        d="M292 74 L262 74"
        stroke="currentColor"
        markerEnd="url(#arrow)"
      />
      <text x="196" y="86" className={styles.label}>
        REVERTED
      </text>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="currentColor" strokeWidth="0.75" />
        </marker>
      </defs>
    </svg>
  );
}

/** 02 — AB Entertainment: a push rebuilds the container, and a probe decides. */
function RebuildLoop() {
  return (
    <svg viewBox="0 58 320 122" className={styles.drawing} role="img" aria-labelledby="d2t d2d">
      <title id="d2t">The deploy loop behind a live client site</title>
      <desc id="d2d">
        A push enters at the left, rebuilds a container image, and is released only after a
        health probe answers. A failed probe returns along the lower path to the previous image.
      </desc>
      {/* Four stages across the full 320-unit viewBox. The geometry is derived
          rather than typed so the last box cannot run past the right edge —
          which is exactly what the first version of this drawing did. */}
      {['PUSH', 'BUILD', 'PROBE', 'LIVE'].map((label, i) => {
        const width = 56;
        const gap = 20;
        const x = 22 + i * (width + gap);
        return (
          <g key={label}>
            <rect pathLength="1" className={`${styles.stroke} ${styles.primary}`}
              x={x}
              y="76"
              width={width}
              height="34"
              fill="none"
              stroke="currentColor"
            />
            <text x={x + width / 2} y="97" className={styles.label} textAnchor="middle">
              {label}
            </text>
            {i < 3 && (
              <line pathLength="1" className={`${styles.stroke} ${styles.guide}`}
                x1={x + width}
                y1="93"
                x2={x + width + gap}
                y2="93"
                stroke="currentColor"
              />
            )}
          </g>
        );
      })}
      {/* The rollback path: solid, because it is a real branch, not a caveat. */}
      <path pathLength="1" className={`${styles.stroke} ${styles.primary}`}
        d="M250 110 L250 148 L50 148 L50 110"
        fill="none"
        stroke="currentColor"
      />
      <text x="150" y="162" className={styles.label} textAnchor="middle">
        PROBE FAILS → PREVIOUS IMAGE
      </text>
    </svg>
  );
}

/** 03 — Ralph Loop: four stages, one exit, held shut by a signature. */
function VerifierLoop() {
  const stages = ['GENERATE', 'CRITIQUE', 'JUDGE', 'REMEDIATE'];
  const cx = 128;
  const cy = 100;
  const r = 62;
  return (
    <svg viewBox={VIEWBOX} className={styles.drawing} role="img" aria-labelledby="d3t d3d">
      <title id="d3t">An agent loop with a single signed exit</title>
      <desc id="d3d">
        Four stages — generate, critique, judge, remediate — run as a closed circuit. The one
        exit on the right stays shut until a signed verifier reports a pass; the repository
        generates and checks those contract hashes in its own hooks.
      </desc>
      {/* The circuit itself is the mechanism — primary weight. */}
      <circle pathLength="1" className={`${styles.stroke} ${styles.primary}`} cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" />
      {stages.map((label, i) => {
        const angle = (i / stages.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        return (
          <g key={label}>
            <circle pathLength="1" className={`${styles.stroke} ${styles.primary}`} cx={x} cy={y} r="3" fill="none" stroke="currentColor" />
            <text
              x={x + Math.cos(angle) * 16}
              y={y + Math.sin(angle) * 16 + 3}
              className={styles.label}
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      })}
      {/* The exit (guide), and the signature holding it shut (primary). */}
      <line pathLength="1" className={`${styles.stroke} ${styles.guide}`} x1={cx + r} y1={cy} x2="272" y2={cy} stroke="currentColor" />
      <line pathLength="1" className={`${styles.stroke} ${styles.primary}`} x1="252" y1="82" x2="252" y2="118" stroke="currentColor" />
      <text x="272" y={cy - 8} className={styles.label} textAnchor="end">
        EXIT
      </text>
      <text x="272" y={cy + 18} className={styles.label} textAnchor="end">
        SIGNED VERIFIER
      </text>
    </svg>
  );
}

/** 04 — Prompt reconstruction: noise in, a ruled specification out. */
function ReconstructionBands() {
  return (
    <svg viewBox={VIEWBOX} className={styles.drawing} role="img" aria-labelledby="d4t d4d">
      <title id="d4t">A raw prompt reconstructed into a specification</title>
      <desc id="d4d">
        Unstructured text enters at the top as broken bands. Five passes narrow it into evenly
        ruled lines leaving the bottom. A brighter hairline marks the fallback taken when a
        model declines the request.
      </desc>
      {/* Noise entering — scaffolding the passes resolve, so it stays a guide. */}
      {Array.from({ length: 7 }, (_, i) => {
        const y = 22 + i * 5;
        const x = 40 + ((i * 37) % 60);
        const w = 40 + ((i * 53) % 90);
        return (
          <line pathLength="1" className={`${styles.stroke} ${styles.guide}`}
            key={y}
            x1={x}
            y1={y}
            x2={x + w}
            y2={y}
            stroke="currentColor"
          />
        );
      })}
      {/* The five passes — the mechanism resolving noise into rule. */}
      {Array.from({ length: 5 }, (_, i) => {
        const y = 74 + i * 12;
        return (
          <line pathLength="1" className={`${styles.stroke} ${styles.primary}`}
            key={y}
            x1="32"
            y1={y}
            x2="288"
            y2={y}
            stroke="currentColor"
          />
        );
      })}
      {/* The fallback branch: brighter, never a second colour. */}
      <path pathLength="1" className={`${styles.stroke} ${styles.primary}`}
        d="M288 86 L302 86 L302 122 L288 122"
        fill="none"
        stroke="currentColor"
      />
      <text x="302" y="134" className={styles.label} textAnchor="end">
        FALLBACK
      </text>
      {/* The specification leaving. */}
      {Array.from({ length: 4 }, (_, i) => {
        const y = 150 + i * 8;
        return (
          <line pathLength="1" className={`${styles.stroke} ${styles.primary}`}
            key={y}
            x1="60"
            y1={y}
            x2="228"
            y2={y}
            stroke="currentColor"
          />
        );
      })}
    </svg>
  );
}

/** 05 — Jyotish Shastra: the chart, and the accuracy gate that guards it. */
function DiamondChart() {
  return (
    <svg viewBox={VIEWBOX} className={styles.drawing} role="img" aria-labelledby="d5t d5d">
      <title id="d5t">A North Indian chart and its ephemeris accuracy gate</title>
      <desc id="d5d">
        The twelve houses of a North Indian chart drawn in hairlines. One house is isolated by a
        caliper reading the Lahiri ayanamsa the repository configures as its default; a drift
        beyond tolerance fails the build.
      </desc>
      {/* The chart frame and its inner diamond are the mechanism (primary); the
          two diagonals are scaffolding (guide). */}
      <rect pathLength="1" className={`${styles.stroke} ${styles.primary}`} x="70" y="26" width="148" height="148" fill="none" stroke="currentColor" />
      <line pathLength="1" className={`${styles.stroke} ${styles.guide}`} x1="70" y1="26" x2="218" y2="174" stroke="currentColor" />
      <line pathLength="1" className={`${styles.stroke} ${styles.guide}`} x1="218" y1="26" x2="70" y2="174" stroke="currentColor" />
      <path pathLength="1" className={`${styles.stroke} ${styles.primary}`}
        d="M144 26 L218 100 L144 174 L70 100 Z"
        fill="none"
        stroke="currentColor"
      />
      {/* The isolated house. */}
      <path d="M144 26 L181 63 L144 100 L107 63 Z" fill="currentColor" opacity="0.07" />
      {/* A caliper closing onto the measurement. */}
      <line pathLength="1" className={`${styles.stroke} ${styles.primary}`} x1="232" y1="40" x2="232" y2="86" stroke="currentColor" />
      <line pathLength="1" className={`${styles.stroke} ${styles.primary}`} x1="228" y1="40" x2="236" y2="40" stroke="currentColor" />
      <line pathLength="1" className={`${styles.stroke} ${styles.primary}`} x1="228" y1="86" x2="236" y2="86" stroke="currentColor" />
      <text x="242" y="60" className={styles.label}>
        ayanamsa
      </text>
      <text x="242" y="72" className={styles.label}>
        23.85° LAHIRI
      </text>
    </svg>
  );
}

/** 06 — This site: the rail you are travelling down. */
function ScrollRail() {
  return (
    <svg viewBox={VIEWBOX} className={styles.drawing} role="img" aria-labelledby="d6t d6d">
      <title id="d6t">The reading rail of this page</title>
      <desc id="d6d">
        A vertical rail with six ticks, one for each section of this site, and a single node
        travelling down it — the position you are currently reading from.
      </desc>
      {/* The rail is the mechanism — primary weight down its full length. */}
      <line pathLength="1" className={`${styles.stroke} ${styles.primary}`} x1="160" y1="20" x2="160" y2="180" stroke="currentColor" />
      {Array.from({ length: 6 }, (_, i) => {
        const y = 26 + i * 29;
        const active = i === 4;
        return (
          <g key={y}>
            <line pathLength="1" className={`${styles.stroke} ${active ? styles.primary : styles.guide}`}
              x1={active ? 142 : 150}
              y1={y}
              x2={active ? 178 : 170}
              y2={y}
              stroke="currentColor"
            />
            <text x="188" y={y + 3} className={styles.label} opacity={active ? 1 : 0.55}>
              {['HERO', 'ABOUT', 'EXPERIENCE', 'SKILLS', 'VITRINE', 'LISTEN'][i]}
            </text>
          </g>
        );
      })}
      {/* The node marking the reader's position — primary. */}
      <circle pathLength="1" className={`${styles.stroke} ${styles.primary}`} cx="160" cy="142" r="3.5" fill="none" stroke="currentColor" />
      <text x="132" y="146" className={styles.label} textAnchor="end">
        YOU ARE HERE
      </text>
    </svg>
  );
}

const DRAWINGS: Record<DrawingId, () => JSX.Element> = {
  'pipeline-gate': PipelineGate,
  'rebuild-loop': RebuildLoop,
  'verifier-loop': VerifierLoop,
  'reconstruction-bands': ReconstructionBands,
  'diamond-chart': DiamondChart,
  'scroll-rail': ScrollRail,
};

export default function Drawing({ id }: DrawingProps) {
  const Component = DRAWINGS[id];
  const frame = useRef<HTMLSpanElement>(null);

  // Draw order is document order. Each stroke learns its index once, and the
  // frame learns how many there are; the stagger of the trace-on is computed
  // from both in CSS (Drawings.module.css `.stroke`) so the whole drawing lands
  // inside one cinematic band whether it has seven strokes or twenty-five, and
  // a drawing can be re-authored without renumbering anything.
  useEffect(() => {
    const host = frame.current;
    if (!host) return;
    const strokes = host.querySelectorAll<SVGElement>(`.${styles.stroke}`);
    host.style.setProperty('--n', String(strokes.length));
    strokes.forEach((element, k) => element.style.setProperty('--k', String(k)));
  }, [id]);

  return (
    <span ref={frame} className={styles.frame}>
      <Component />
    </span>
  );
}
