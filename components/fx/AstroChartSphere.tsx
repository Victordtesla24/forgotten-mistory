'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PALETTE } from '@/lib/palette';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * AstroChartSphere — SVG-based Vedic astrology chart wheel for the
 * jyotish-shastra project card (TG1-06). Renders a circular chart with
 * 12 houses, planet-like dots at deterministic positions, and a slow
 * rotational animation when in view.
 *
 * Monochrome palette via PALETTE. Reduced-motion shows a static chart.
 * All data is deterministic — no Math.random().
 */

// ── Deterministic chart data ──

const HOUSE_LABELS = [
  '1-Asc',
  '2-Wealth',
  '3-Sibling',
  '4-Home',
  '5-Creativity',
  '6-Health',
  '7-Partner',
  '8-Transformation',
  '9-Fortune',
  '10-Career',
  '11-Gains',
  '12-Spirit',
] as const;

// Planet positions: { name, house, houseFraction, orbitFraction, size }
// house: 1-12; houseFraction: 0-1 position within the 30° house span
// orbitFraction: 0 (inner edge) to 1 (outer edge) radial position
const PLANETS = [
  { name: 'Su', house: 5, houseFraction: 0.35, orbitFraction: 0.55, size: 5.0 },
  { name: 'Mo', house: 4, houseFraction: 0.45, orbitFraction: 0.45, size: 4.5 },
  { name: 'Ma', house: 10, houseFraction: 0.25, orbitFraction: 0.72, size: 4.0 },
  { name: 'Me', house: 6, houseFraction: 0.55, orbitFraction: 0.40, size: 3.5 },
  { name: 'Ju', house: 9, houseFraction: 0.40, orbitFraction: 0.65, size: 5.5 },
  { name: 'Ve', house: 7, houseFraction: 0.60, orbitFraction: 0.50, size: 4.5 },
  { name: 'Sa', house: 12, houseFraction: 0.30, orbitFraction: 0.78, size: 4.0 },
  { name: 'Ra', house: 11, houseFraction: 0.70, orbitFraction: 0.62, size: 3.0 },
  { name: 'Ke', house: 5, houseFraction: 0.65, orbitFraction: 0.35, size: 3.0 },
] as const;

// ── Layout constants ──

const VIEWBOX = 400;
const CENTER = VIEWBOX / 2;
const OUTER_R = 172;
const INNER_R = 48;
const MID_R = 128;
const LABEL_R = 190;

function houseAngleDeg(house: number, fraction: number): number {
  // House 1 starts at the top (-90° in standard SVG orientation) and
  // proceeds clockwise (increasing angle). Each house spans 30°.
  return -90 + (house - 1) * 30 + fraction * 30;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function polarX(angleDeg: number, radius: number): number {
  return CENTER + radius * Math.cos(toRad(angleDeg));
}

function polarY(angleDeg: number, radius: number): number {
  return CENTER + radius * Math.sin(toRad(angleDeg));
}

// ── Sub-components ──

function HouseLines() {
  const lines = [];
  for (let i = 0; i < 12; i++) {
    const angle = -90 + i * 30;
    const x = polarX(angle, OUTER_R);
    const y = polarY(angle, OUTER_R);
    lines.push(
      <line
        key={`hl-${i}`}
        x1={CENTER}
        y1={CENTER}
        x2={x}
        y2={y}
        stroke={PALETTE.steel}
        strokeOpacity={0.2}
        strokeWidth={0.8}
      />,
    );
  }
  return <g className="acs-house-lines">{lines}</g>;
}

function HouseLabels() {
  return (
    <g className="acs-house-labels" fill={PALETTE.steel} fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle" dominantBaseline="central">
      {HOUSE_LABELS.map((label, i) => {
        const angle = -90 + i * 30 + 15; // center of each house
        const x = polarX(angle, LABEL_R);
        const y = polarY(angle, LABEL_R);
        return (
          <text key={label} x={x} y={y} opacity={0.75}>
            {label}
          </text>
        );
      })}
    </g>
  );
}

function PlanetDots() {
  return (
    <g className="acs-planets">
      {PLANETS.map((p) => {
        const angle = houseAngleDeg(p.house, p.houseFraction);
        const orbitRange = OUTER_R - INNER_R;
        const r = INNER_R + p.orbitFraction * orbitRange;
        const cx = polarX(angle, r);
        const cy = polarY(angle, r);
        return (
          <g key={p.name}>
            {/* Glow halo */}
            <circle
              cx={cx}
              cy={cy}
              r={p.size + 3}
              fill={PALETTE.accent}
              opacity={0.12}
            />
            {/* Planet dot */}
            <circle
              cx={cx}
              cy={cy}
              r={p.size}
              fill={PALETTE.ink900}
              stroke={p.name === 'Su' || p.name === 'Mo' ? PALETTE.white : PALETTE.steel}
              strokeWidth={1.2}
            />
            {/* Planet label */}
            <text
              x={cx}
              y={cy - p.size - 5}
              fill={PALETTE.steel}
              fontSize="7.5"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              opacity={0.8}
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ChartRings() {
  return (
    <g className="acs-rings" fill="none">
      {/* Outer border ring */}
      <circle cx={CENTER} cy={CENTER} r={OUTER_R} stroke={PALETTE.steel} strokeWidth={1.5} strokeOpacity={0.4} />
      {/* Mid ring */}
      <circle cx={CENTER} cy={CENTER} r={MID_R} stroke={PALETTE.steel} strokeWidth={0.8} strokeOpacity={0.2} strokeDasharray="4 4" />
      {/* Inner ring */}
      <circle cx={CENTER} cy={CENTER} r={INNER_R} stroke={PALETTE.steel} strokeWidth={1.2} strokeOpacity={0.35} />
      {/* Bindu (central point) */}
      <circle cx={CENTER} cy={CENTER} r={3.5} fill={PALETTE.accent} opacity={0.5} />
    </g>
  );
}

// ── Main component ──

export default React.memo(function AstroChartSphere({ className = '', project }: { className?: string; project?: string }) {
  const prefersReducedMotion = useReducedMotionSafe();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

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

  const animate = inView && !prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      data-testid="astro-chart-sphere" data-project={project}
      className={`astro-chart-sphere ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        className="acs-svg"
        role="img"
        aria-label="Vedic astrology chart with 12 houses and planets"
      >
        {/* Static chart elements */}
        <ChartRings />
        <HouseLines />
        <HouseLabels />
        <PlanetDots />

        {/* Rotating overlay — decorative tick marks */}
        <motion.g
          className="acs-rotate-group"
          initial={prefersReducedMotion ? false : { rotate: 0 }}
          animate={animate ? { rotate: 360 } : { rotate: 0 }}
          transition={
            animate
              ? { repeat: Infinity, duration: 120, ease: 'linear' }
              : { duration: 0 }
          }
        >
          {/* Tick marks on the outer ring */}
          {Array.from({ length: 72 }).map((_, i) => {
            const angle = -90 + i * 5;
            const inner = OUTER_R - 8;
            const outer = OUTER_R - 2;
            const x1 = polarX(angle, inner);
            const y1 = polarY(angle, inner);
            const x2 = polarX(angle, outer);
            const y2 = polarY(angle, outer);
            return (
              <line
                key={`tick-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 6 === 0 ? PALETTE.accent : PALETTE.steel}
                strokeOpacity={i % 6 === 0 ? 0.5 : 0.2}
                strokeWidth={i % 6 === 0 ? 1.2 : 0.5}
              />
            );
          })}
        </motion.g>
      </svg>

      <div className="acs-label">jyotish-shastra · 12 houses</div>

      <style jsx>{`
        .astro-chart-sphere {
          width: 100%;
          max-width: 360px;
          aspect-ratio: 1 / 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        .acs-svg {
          width: 100%;
          height: auto;
        }
        .acs-label {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: ${PALETTE.steel};
        }
        @media (prefers-reduced-motion: reduce) {
          .acs-rotate-group {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
