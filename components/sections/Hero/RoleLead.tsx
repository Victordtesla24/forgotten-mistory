import type { CSSProperties } from 'react';

import type { ExperienceRole } from '@/content/experience';
import { careerBars, FIRST_YEAR, LAST_YEAR } from '@/lib/timeline';

import { numerals, percent, tickPaths, UNITS } from './axis';
import styles from './RoleLead.module.css';

/** The share a headline value states, when it is a percentage: "≈92%" is 92, "−38%" is 38. */
function share(value: string): number | null {
  const match = /^[≈−-]?(\d+(?:\.\d+)?)%$/.exec(value);
  return match?.[1] ? Number(match[1]) : null;
}

/**
 * What leads a role's panel: the whole career on a small 2010-to-now axis, the same one the
 * hero draws, with this role's bar lit, and the role's headline figure under it. A figure that
 * is a percentage is drawn as the share it names: the part that fell away is hatched and the
 * part that remains is solid.
 */
export function RoleLead({ role }: { role: ExperienceRole }) {
  const bar = careerBars.find((entry) => entry.id === role.id);
  const cut = role.headline ? share(role.headline.value) : null;
  return (
    <div className={styles.lead}>
      {bar ? (
        <div aria-hidden="true" className={styles.axis}>
          <div className={styles.track}>
            <span className={styles.span} style={{ left: percent(bar.start), width: percent(bar.width) }} />
            <svg viewBox={`0 0 ${UNITS} 16`} preserveAspectRatio="none" focusable="false" className={styles.ticks}>
              <line x1="0" x2={UNITS} y1="0.5" y2="0.5" className={styles.baseline} />
              <path d={tickPaths.month} className={styles.month} />
              <path d={tickPaths.year} className={styles.year} />
              <path d={tickPaths.major} className={styles.year} />
            </svg>
            {numerals.map((tick) => (
              <span key={tick.year} className={styles.numeral} style={{ left: `clamp(1rem, ${percent(tick.at)}, calc(100% - 1rem))` }}>
                {tick.year}
              </span>
            ))}
          </div>
          <span className="sr-only">
            {FIRST_YEAR} to {LAST_YEAR}
          </span>
        </div>
      ) : null}

      {role.headline ? (
        <div className={styles.figure}>
          <p className="flex items-baseline gap-3">
            <span className="type-figure text-[1.75rem] text-proof">{role.headline.value}</span>
            <span className="type-small text-muted">{role.headline.label}</span>
          </p>
          {cut === null ? null : (
            <span aria-hidden="true" className={styles.share} style={{ '--rest': `${100 - cut}%` } as CSSProperties}>
              <span className={styles.rest} />
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
