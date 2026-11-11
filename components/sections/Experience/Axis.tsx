import type { CSSProperties } from 'react';

import { careerBars, fitStep } from '@/lib/timeline';
import { laneLayouts } from '@/lib/timeline-lanes';

import { gridPaths, numerals, percent, tickPaths, UNITS } from './axis';
import styles from './Experience.module.css';

/** The custom properties that say, for each class of width, which lane a name stands in and how it sits against its bar. */
function laneStyle(id: string): CSSProperties {
  const vars: Record<string, number> = {};
  laneLayouts.forEach((layout, index) => {
    const label = layout.labels.find((entry) => entry.id === id);
    if (label) {
      vars[`--lane-${index}`] = label.lane;
      vars[`--align-${index}`] = label.align;
    }
  });
  return vars as CSSProperties;
}

/**
 * The axis as the server draws it: the eight bars to scale, each named, and the ruler under
 * them. A name that fits inside its bar is drawn there; one that does not stands in a lane above
 * with a hairline down to its bar (`lib/timeline-lanes.ts` places the lanes, the stylesheet
 * chooses by the bar's own width); the bar's tint is its share of the longest span, so the eight
 * years at ANZ read as the dominant one. It is complete without script and without the stage; the
 * client component adds the controls, the playhead and the card around it.
 */
export function Axis() {
  const longest = Math.max(...careerBars.map((bar) => bar.months));
  const outside = new Set(laneLayouts.flatMap((layout) => layout.labels.map((label) => label.id)));
  return (
    <>
      <ol aria-hidden="true" data-bars="" className={styles.bars}>
        {careerBars.map((bar) => (
          <li
            key={bar.id}
            className={styles.bar}
            data-bar={bar.id}
            data-current={bar.current ? 'true' : undefined}
            data-selected={bar.current ? 'true' : undefined}
            style={{ left: percent(bar.start), width: percent(bar.width), '--at': bar.start.toFixed(4), '--w': (bar.months / longest).toFixed(3) } as CSSProperties}
          >
            <span className={styles.fill}>
              <span className={styles.label} data-fit={fitStep(bar.label)}>
                {bar.label}
              </span>
            </span>
            {outside.has(bar.id) ? (
              <span className={styles.out} data-fit={fitStep(bar.label)} style={laneStyle(bar.id)}>
                <span className={styles.text}>{bar.label}</span>
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <svg aria-hidden="true" data-grid="" viewBox={`0 0 ${UNITS} 100`} preserveAspectRatio="none" focusable="false" className={styles.grid}>
        <path d={gridPaths.year} className={styles.gridYear} />
        <path d={gridPaths.numeral} className={styles.gridNumeral} />
      </svg>

      <div aria-hidden="true" data-ruler="" className={styles.ruler}>
        <svg viewBox={`0 0 ${UNITS} 16`} preserveAspectRatio="none" focusable="false" className={styles.ticks}>
          <line x1="0" x2={UNITS} y1="0.5" y2="0.5" className={styles.baseline} />
          <path d={tickPaths.quarter} className={styles.quarter} />
          <path d={tickPaths.year} className={styles.year} />
          <path d={tickPaths.numeral} className={styles.year} />
        </svg>
        {numerals.map((tick) => (
          <span
            key={tick.year}
            className={styles.numeral}
            data-year={tick.year}
            data-narrow={tick.narrow ? '' : undefined}
            style={{ left: `clamp(1rem, ${percent(tick.at)}, calc(100% - 1rem))` }}
          >
            {tick.year}
          </span>
        ))}
        <span data-now="" className={styles.now} />
      </div>
    </>
  );
}
