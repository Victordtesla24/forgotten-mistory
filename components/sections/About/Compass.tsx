'use client';

import { useMemo } from 'react';

import styles from './Compass.module.css';

const SPOKES = 10;
/** Bezel, sector band and hub, in viewBox units. */
const BEZEL_OUTER = 47;
const BEZEL_INNER = 43.2;
const SECTOR_OUTER = 41;
const SECTOR_INNER = 22;
const NUMERAL_RADIUS = 36.2;
const HUB = 18;

interface CompassProps {
  /** Index of the dimension the reader is on, or -1 for none. */
  active: number;
  /** The dimension names, used for the accessible description. */
  labels: readonly string[];
  /**
   * Which side of the match each dimension is computed from. The three the
   * engine takes from the role are drawn open, because there is nothing about
   * a candidate to measure there.
   */
  sides: readonly ('candidate' | 'role')[];
}

const SECTOR_SWEEP = 360 / SPOKES;

/** Angle of the centre of sector `i`, from twelve o'clock, clockwise. */
function sectorAngle(index: number): number {
  return index * SECTOR_SWEEP;
}

function polar(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [50 + Math.cos(rad) * radius, 50 + Math.sin(rad) * radius];
}

/** An annular sector, drawn as a closed path between two radii. */
function annulus(from: number, to: number, rInner: number, rOuter: number): string {
  const [ox1, oy1] = polar(from, rOuter);
  const [ox2, oy2] = polar(to, rOuter);
  const [ix2, iy2] = polar(to, rInner);
  const [ix1, iy1] = polar(from, rInner);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return [
    `M ${ox1} ${oy1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${ix1} ${iy1}`,
    'Z',
  ].join(' ');
}

/**
 * The engine's face — ten dimensions, and no scores anywhere on it.
 *
 * This is the section's argument built as an instrument. The engine it is
 * named after scores a candidate against a role on exactly these ten axes, and
 * this section refuses to print a score against any of them, because a number
 * a person gives themselves has no source. So the face deliberately has no
 * needle and no magnitude: a radar chart would need ten self-assigned numbers
 * to have a shape at all, and drawing one here would give away the whole
 * argument in the first second.
 *
 * What it does show is the one distinction that is real. Seven of the ten are
 * computed from the candidate and are answered on the page; three are computed
 * from the role, and there is nothing about a person to measure in them. Those
 * three are drawn open, over the same 45° hatch the open caliper uses
 * everywhere else on the site — a positive mark for "sought, and honestly not
 * measurable", not a gap.
 *
 * The bezel turns to bring whichever dimension is being read to the index at
 * twelve o'clock, and the numerals counter-rotate so they stay upright as it
 * goes — an instrument's ring moves, its reading position does not. The index
 * is the one gold mark: it is where a claim is being read.
 *
 * Inline SVG, not WebGL. The first version of this was a shader, which meant
 * it existed for readers on a discrete GPU and left everyone else four hundred
 * pixels of empty column. It costs no context, compiles nothing, and stays
 * sharp at any zoom.
 */
export default function Compass({ active, labels, sides }: CompassProps) {
  const geometry = useMemo(() => {
    const sectors = Array.from({ length: SPOKES }, (_, i) => {
      const centre = sectorAngle(i);
      // A hairline of air between neighbours, so ten sectors read as ten.
      const from = centre - SECTOR_SWEEP / 2 + 1.1;
      const to = centre + SECTOR_SWEEP / 2 - 1.1;
      const [nx, ny] = polar(centre, NUMERAL_RADIUS);
      // Three engraved arcs inside each sector: the graduations that make a
      // face read as measured rather than drawn.
      const rules = [0.28, 0.52, 0.76].map((t) => {
        const r = SECTOR_INNER + (SECTOR_OUTER - SECTOR_INNER) * t;
        const [ax, ay] = polar(from + 1.4, r);
        const [bx, by] = polar(to - 1.4, r);
        return `M ${ax} ${ay} A ${r} ${r} 0 0 1 ${bx} ${by}`;
      });
      return {
        i,
        d: annulus(from, to, SECTOR_INNER, SECTOR_OUTER),
        rules,
        numeral: { x: nx, y: ny, angle: centre },
        side: sides[i] ?? 'candidate',
      };
    });

    // 100 graduations on the bezel, every tenth long — one major per dimension.
    const ticks = Array.from({ length: 100 }, (_, i) => {
      const angle = (i / 100) * 360;
      const major = i % 10 === 0;
      const [x1, y1] = polar(angle, BEZEL_INNER);
      const [x2, y2] = polar(angle, BEZEL_INNER + (major ? 3.8 : 1.9));
      return { i, x1, y1, x2, y2, major };
    });

    return { sectors, ticks };
  }, [sides]);

  const rotation = active >= 0 ? -sectorAngle(active) : 0;
  const activeLabel = active >= 0 ? labels[active] : undefined;
  const activeSide = active >= 0 ? sides[active] : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      className={styles.compass}
      role="img"
      aria-label={
        activeLabel
          ? `Instrument face of ten dimensions, indexed to ${activeLabel}${
              activeSide === 'role' ? ', which the engine computes from the role' : ''
            }`
          : 'Instrument face of ten dimensions. No scores: three of the ten are computed from the role and are drawn open.'
      }
    >
      <defs>
        {/* The same 45° hatch the open caliper uses, so a reader who has met
            that mark once already knows what an open sector here means. */}
        <pattern
          id="compass-open"
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="3" className={styles.hatch} />
        </pattern>
        <radialGradient id="compass-hub" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="var(--white)" stopOpacity="0.055" />
          <stop offset="100%" stopColor="var(--white)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The hub glow sits under everything and does not turn. */}
      <circle cx="50" cy="50" r={HUB + 8} fill="url(#compass-hub)" />

      <g
        className={styles.rose}
        style={{ transform: `rotate(${rotation}deg)` }}
        data-pointing={active >= 0 || undefined}
      >
        <circle cx="50" cy="50" r={BEZEL_OUTER} className={styles.bezel} />
        <circle cx="50" cy="50" r={BEZEL_INNER} className={styles.bezelInner} />

        {geometry.ticks.map((tick) => (
          <line
            key={`t${tick.i}`}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            className={tick.major ? styles.tickMajor : styles.tick}
          />
        ))}

        {geometry.sectors.map((sector) => (
          <g key={`s${sector.i}`} data-side={sector.side}>
            <path
              d={sector.d}
              className={styles.sector}
              data-active={sector.i === active || undefined}
            />
            {sector.side === 'candidate'
              ? sector.rules.map((d, r) => (
                  <path key={`r${sector.i}-${r}`} d={d} className={styles.rule} />
                ))
              : null}
            {/* The numeral counter-rotates by the rose's own angle, so it is
                upright wherever its sector has been carried to. */}
            <text
              x={sector.numeral.x}
              y={sector.numeral.y}
              className={styles.numeral}
              data-active={sector.i === active || undefined}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${-rotation} ${sector.numeral.x} ${sector.numeral.y})`}
            >
              {String(sector.i + 1).padStart(2, '0')}
            </text>
          </g>
        ))}

        <circle cx="50" cy="50" r={SECTOR_INNER} className={styles.hubRing} />
      </g>

      {/* The reading position. Fixed at twelve o'clock while the face turns
          beneath it, and the one gold mark on the instrument. */}
      <g className={styles.index} data-pointing={active >= 0 || undefined}>
        <path d="M 50 3.2 L 52.5 8.4 L 47.5 8.4 Z" className={styles.indexCaret} />
        <line x1="50" y1="9.6" x2="50" y2="14.4" className={styles.indexStem} />
      </g>

      {/* The readout, in the hub. Never a score — the number of the axis being
          read, and which side of the match it is computed from. */}
      <text x="50" y="47.5" className={styles.readNumber} textAnchor="middle">
        {active >= 0 ? String(active + 1).padStart(2, '0') : '—'}
      </text>
      <text x="50" y="56.5" className={styles.readState} textAnchor="middle">
        {active < 0 ? 'NO SCORES' : activeSide === 'role' ? 'FROM THE ROLE' : 'ANSWERED'}
      </text>
    </svg>
  );
}
