import type { CSSProperties } from 'react';

import { cells, keepsCell, points, squads, type ReadingId } from '@/lib/readings';

import styles from './Readings.module.css';

const vars = (values: Record<string, string | number>): CSSProperties => values as CSSProperties;

/** 10,000 points in a lattice, wiped in as the stage fills it, and the 200 ms line that crosses it. */
function Telemetry() {
  const { columns, rows, countMs, sweepMs } = points;
  return (
    <div className={styles.points} style={vars({ '--count-ms': `${countMs}ms`, '--sweep-ms': `${sweepMs}ms` })}>
      <div className={styles.wipe}>
        <svg
          viewBox={`0 0 ${columns} ${rows}`}
          preserveAspectRatio="none"
          focusable="false"
          className="absolute inset-0 size-full"
        >
          <defs>
            <pattern id="reading-lattice" width="1" height="1" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.36" className="fill-proof" />
            </pattern>
          </defs>
          <rect width={columns} height={rows} fill="url(#reading-lattice)" opacity="0.85" />
        </svg>
      </div>
      <span className={styles.sweep} />
    </div>
  );
}

/** 200 cells, full at first, then ≈92% of them fall away and the rest stay. */
function Evidence() {
  const { count, columns, rows, appearMs, spreadMs, fallMs } = cells;
  return (
    <div
      className={styles.cells}
      style={vars({
        '--columns': columns,
        '--rows': rows,
        '--count': count,
        '--last': columns - 1,
        '--appear': `${appearMs}ms`,
        '--spread': `${spreadMs}ms`,
        '--fall': `${fallMs}ms`,
      })}
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={styles.cell}
          data-keep={keepsCell(index) ? '' : undefined}
          style={vars({ '--i': index, '--c': Math.floor(index / rows) })}
        />
      ))}
    </div>
  );
}

/** 40 marks in five squads of two by four, each on its own baseline. */
function Portfolio() {
  const { count, groups, perGroup, columns, countMs } = squads;
  return (
    <div className={styles.squads} style={vars({ '--count': count, '--count-ms': `${countMs}ms`, '--columns': columns })}>
      {Array.from({ length: groups }, (_, group) => (
        <span key={group} className={styles.squad} style={vars({ '--g': group })}>
          {Array.from({ length: perGroup }, (_, mark) => (
            <span key={mark} className={styles.mark} style={vars({ '--n': group * perGroup + mark })} />
          ))}
        </span>
      ))}
    </div>
  );
}

/** The drawing of a reading in the DOM: what shows until the stage has drawn it, and when it cannot. */
export function ReadingVisual({ id }: { id: ReadingId }) {
  if (id === 'telemetry') return <Telemetry />;
  return id === 'evidence' ? <Evidence /> : <Portfolio />;
}
