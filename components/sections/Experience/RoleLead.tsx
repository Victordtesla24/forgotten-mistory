import type { ExperienceRole } from '@/content/experience';
import { careerBars, FIRST_YEAR, LAST_YEAR } from '@/lib/timeline';

import { numerals, tickPaths, UNITS } from './axis';
import { percent } from './percent';
import { RoleFigure } from './RoleFigure';
import styles from './RoleLead.module.css';

/**
 * What leads a role's panel: the whole career on a small 2010-to-now axis, the same one the
 * Experience timeline draws, with this role's bar lit, and the role's headline figure under it.
 */
export function RoleLead({ role }: { role: ExperienceRole }) {
  const bar = careerBars.find((entry) => entry.id === role.id);
  return (
    <div className={styles.lead}>
      {bar ? (
        <div aria-hidden="true" className={styles.axis}>
          <div className={styles.track}>
            <span className={styles.span} style={{ left: percent(bar.start), width: percent(bar.width) }} />
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
                data-narrow={tick.narrow ? '' : undefined}
                style={{ left: `clamp(1rem, ${percent(tick.at)}, calc(100% - 1rem))` }}
              >
                {tick.year}
              </span>
            ))}
          </div>
          <span className="sr-only">
            {FIRST_YEAR} to {LAST_YEAR}
          </span>
        </div>
      ) : null}

      {role.headline ? <RoleFigure headline={role.headline} place="panel" /> : null}
    </div>
  );
}
