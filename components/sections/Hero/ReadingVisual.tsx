import type { CSSProperties } from 'react';

import { cells, cohort, points, type ReadingId } from '@/lib/readings';

import styles from './Readings.module.css';

const vars = (values: Record<string, string | number>): CSSProperties => values as CSSProperties;

/**
 * Telemetry, wiped in as the stage fills it, and the 200 ms line that crosses it. One element
 * draws the lattice: a mask of marks laid on whole device pixels (and, in points mode, of the
 * gutters between blocks of 100), so it is crisp and never moires. `ReadingTile` hands it the
 * layout the stage draws; its defaults stand until then and without script.
 */
function Telemetry() {
  const { countMs, sweepMs } = points;
  return (
    <div className={styles.points} data-carry="" style={vars({ '--count-ms': `${countMs}ms`, '--sweep-ms': `${sweepMs}ms` })}>
      <div className={styles.wipe}>
        <div className={styles.lattice} />
      </div>
      <span className={styles.sweep} />
    </div>
  );
}

/** 200 separate cells, all of them staying, each full at first and then falling to about 15 minutes' worth. */
function Evidence() {
  const { count, rest, appearMs, spreadMs, fallMs } = cells;
  return (
    <div
      className={styles.cells}
      data-carry=""
      style={vars({
        '--count': count,
        '--rest': rest.toFixed(4),
        '--appear': `${appearMs}ms`,
        '--spread': `${spreadMs}ms`,
        '--fall': `${fallMs}ms`,
      })}
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={styles.cell} style={vars({ '--i': index })} />
      ))}
    </div>
  );
}

/** 40 marks, one for each practitioner: one run of two rows of 20 on one baseline, no squad drawn. */
function Portfolio() {
  const { count, across, down, countMs } = cohort;
  return (
    <div className={styles.cohort} data-carry="" style={vars({ '--count': count, '--count-ms': `${countMs}ms`, '--across': across, '--down': down })}>
      {Array.from({ length: count }, (_, mark) => (
        <span key={mark} className={styles.mark} style={vars({ '--n': mark, '--c': Math.floor(mark / down), '--r': mark % down })} />
      ))}
    </div>
  );
}

/** The drawing of a reading in the DOM: what shows until the stage has drawn it, and when it cannot. */
export function ReadingVisual({ id }: { id: ReadingId }) {
  if (id === 'telemetry') return <Telemetry />;
  return id === 'evidence' ? <Evidence /> : <Portfolio />;
}
