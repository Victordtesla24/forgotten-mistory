import type { CSSProperties } from 'react';

import { cells, cohort, points, type ReadingId } from '@/lib/readings';

import styles from './Readings.module.css';

const vars = (values: Record<string, string | number>): CSSProperties => values as CSSProperties;

/**
 * 10,000 points in 100 blocks of 100, wiped in as the stage fills it, and the 200 ms line that
 * crosses it. One element draws the lattice: a mask of dots and gutters laid on a whole number
 * of CSS pixels, so it is crisp and never moires.
 */
function Telemetry() {
  const { columns, rows, side, countMs, sweepMs } = points;
  return (
    <div className={styles.points} style={vars({ '--count-ms': `${countMs}ms`, '--sweep-ms': `${sweepMs}ms` })}>
      <div className={styles.wipe}>
        <div className={styles.lattice} style={vars({ '--columns': columns, '--rows': rows, '--side': side })} />
      </div>
      <span className={styles.sweep} />
    </div>
  );
}

/** 200 cells, all of them staying, each full at first and then falling to about 15 minutes' worth. */
function Evidence() {
  const { count, columns, rows, rest, appearMs, spreadMs, fallMs } = cells;
  return (
    <div
      className={styles.cells}
      style={vars({
        '--columns': columns,
        '--rows': rows,
        '--count': count,
        '--last': columns - 1,
        '--rest': rest.toFixed(4),
        '--appear': `${appearMs}ms`,
        '--spread': `${spreadMs}ms`,
        '--fall': `${fallMs}ms`,
      })}
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={styles.cell} style={vars({ '--i': index, '--c': Math.floor(index / rows) })} />
      ))}
    </div>
  );
}

/** 40 marks, one for each practitioner, as one cohort on one baseline. */
function Portfolio() {
  const { count, columns, rows, countMs } = cohort;
  return (
    <div
      className={styles.cohort}
      style={vars({ '--count': count, '--count-ms': `${countMs}ms`, '--columns': columns, '--rows': rows })}
    >
      {Array.from({ length: count }, (_, mark) => (
        <span key={mark} className={styles.mark} style={vars({ '--n': mark })} />
      ))}
    </div>
  );
}

/** The drawing of a reading in the DOM: what shows until the stage has drawn it, and when it cannot. */
export function ReadingVisual({ id }: { id: ReadingId }) {
  if (id === 'telemetry') return <Telemetry />;
  return id === 'evidence' ? <Evidence /> : <Portfolio />;
}
