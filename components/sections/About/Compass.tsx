'use client';

import { useMemo } from 'react';

import styles from './Compass.module.css';

const SPOKES = 10;
const OUTER = 44;
const INNER = 12;

interface CompassProps {
  /** Index of the dimension the reader is on, or -1 for none. */
  active: number;
  /** The dimension names, used for the accessible description. */
  labels: readonly string[];
}

/** Angle of spoke `i` in degrees, measured from twelve o'clock, clockwise. */
function spokeAngle(index: number): number {
  return (index / SPOKES) * 360;
}

function polar(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [50 + Math.cos(rad) * radius, 50 + Math.sin(rad) * radius];
}

/**
 * The compass — ten spokes, one per fit dimension, drawn as a navigational
 * instrument rather than a scorecard.
 *
 * Every spoke is exactly the same length, and that is the argument. A radar
 * chart needs ten self-assigned scores to have a shape, and this section's
 * whole point is that a number you give yourself is not evidence. So the
 * instrument shows bearing, not magnitude: the rose turns to bring the
 * dimension you are reading to top-centre and lights that spoke.
 *
 * This was first built as a WebGL scene, which meant it existed only for
 * readers on a discrete GPU — everyone else got four hundred pixels of empty
 * column beside the list. It is now inline SVG with a CSS rotation, so every
 * reader gets the same instrument, it costs no context and no shader compile,
 * and it stays sharp at any zoom. Under reduced motion the rose still points,
 * it simply stops gliding there.
 */
export default function Compass({ active, labels }: CompassProps) {
  const geometry = useMemo(() => {
    const spokes = Array.from({ length: SPOKES }, (_, i) => {
      const angle = spokeAngle(i);
      const [x1, y1] = polar(angle, INNER);
      const [x2, y2] = polar(angle, OUTER);
      return { i, x1, y1, x2, y2 };
    });
    // Minor graduations: the marks that make an instrument read as measured
    // rather than drawn.
    const ticks = Array.from({ length: SPOKES * 5 }, (_, i) => {
      const angle = (i / (SPOKES * 5)) * 360;
      const major = i % 5 === 0;
      const [x1, y1] = polar(angle, OUTER + 1.5);
      const [x2, y2] = polar(angle, OUTER + (major ? 4.5 : 2.5));
      return { i, x1, y1, x2, y2, major };
    });
    return { spokes, ticks };
  }, []);

  const rotation = active >= 0 ? -spokeAngle(active) : 0;
  const activeLabel = active >= 0 ? labels[active] : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      className={styles.compass}
      role="img"
      aria-label={
        activeLabel
          ? `Compass of ten dimensions, pointing at ${activeLabel}`
          : 'Compass of ten dimensions, all axes equal, no scores'
      }
    >
      <g
        className={styles.rose}
        style={{ transform: `rotate(${rotation}deg)` }}
        data-pointing={active >= 0 || undefined}
      >
        <circle cx="50" cy="50" r={OUTER} className={styles.ring} />
        <circle cx="50" cy="50" r={INNER} className={styles.ringInner} />

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

        {geometry.spokes.map((spoke) => (
          <line
            key={`s${spoke.i}`}
            x1={spoke.x1}
            y1={spoke.y1}
            x2={spoke.x2}
            y2={spoke.y2}
            className={styles.spoke}
            data-active={spoke.i === active || undefined}
          />
        ))}
      </g>

      {/* The bearing mark stays at twelve o'clock while the rose turns beneath
          it — the instrument moves, the reading position does not. */}
      <line x1="50" y1="2" x2="50" y2="9" className={styles.bearing} />
    </svg>
  );
}
