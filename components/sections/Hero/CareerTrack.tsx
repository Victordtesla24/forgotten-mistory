import type { CSSProperties } from 'react';

import { StageView } from '@/components/visuals/StageView';
import { ViewTrigger } from '@/components/visuals/ViewTrigger';
import { CAREER_VIEW } from '@/lib/gl/ids';
import { careerBars, FIRST_YEAR, LAST_YEAR, numerals, ticks } from '@/lib/timeline';

import { BarList } from './BarList';
import styles from './CareerTrack.module.css';

/** The SVG draws on a 1000-unit-wide box that stretches to the track, so positions stay exact at every width. */
const UNITS = 1000;
const x = (at: number): string => (at * UNITS).toFixed(2);

/** One tick path per length: months, Januaries and the Januaries that carry a numeral. */
const paths = {
  month: ticks.filter((tick) => tick.year === undefined).map((tick) => `M${x(tick.at)} 0v5`).join(''),
  year: ticks.filter((tick) => tick.year !== undefined && !tick.major).map((tick) => `M${x(tick.at)} 0v9`).join(''),
  major: ticks.filter((tick) => tick.major).map((tick) => `M${x(tick.at)} 0v15`).join(''),
};

const percent = (at: number): string => `${(at * 100).toFixed(4)}%`;

/** A label is drawn only where its bar is wide enough: the size class picks the container query that allows it. */
function fitClass(label: string): '3' | '4' | '7' | '9' | '11' {
  if (label.length <= 3) return '3';
  if (label.length <= 4) return '4';
  if (label.length <= 7) return '7';
  return label.length <= 9 ? '9' : '11';
}

/**
 * The career, drawn to scale and edge to edge: one axis from 2010 to now, the eight roles as
 * bars whose widths are their lengths in months, the current role lit. It is a plain block,
 * never `100vw`, so it is exactly the width of the page's content box. Each bar is a link
 * that opens its role in the panel set around it, and Left, Right, Home and End move between
 * them. The light layer behind it is the stage's; everything here stands without it.
 */
export function CareerTrack() {
  return (
    <div data-career-scale="" className={styles.scale}>
      <StageView view={CAREER_VIEW} />
      <BarList label={`Career, ${FIRST_YEAR} to ${LAST_YEAR}, oldest role first`} className={styles.bars}>
        {careerBars.map((bar) => (
          <li
            key={bar.id}
            className={styles.item}
            data-side={bar.start > 0.5 ? 'end' : 'start'}
            style={{ left: percent(bar.start), width: percent(bar.width), '--at': bar.start.toFixed(4) } as CSSProperties}
          >
            <ViewTrigger
              view={CAREER_VIEW}
              value={bar.id}
              panel={`career-${bar.id}`}
              aria-label={bar.name}
              data-role={bar.id}
              data-months={bar.months}
              data-current={bar.current ? 'true' : undefined}
              className={styles.bar}
            >
              <span className={styles.fill}>
                <span className={styles.label} data-fit={fitClass(bar.label)}>
                  {bar.label}
                </span>
              </span>
            </ViewTrigger>
            <span aria-hidden="true" className={styles.tip}>
              <span className="text-muted">{bar.employer}</span>
              <span className="font-medium text-text">{bar.shortTitle}</span>
              <span className={bar.current ? 'text-accent' : 'text-muted'}>{bar.dates}</span>
            </span>
          </li>
        ))}
      </BarList>

      <div aria-hidden="true" data-ruler="" className={styles.ruler}>
        <svg
          viewBox={`0 0 ${UNITS} 16`}
          preserveAspectRatio="none"
          focusable="false"
          className={styles.ticks}
        >
          <line x1="0" x2={UNITS} y1="0.5" y2="0.5" className={styles.baseline} />
          <path d={paths.month} className={styles.month} />
          <path d={paths.year} className={styles.year} />
          <path d={paths.major} className={styles.year} />
        </svg>
        {numerals.map((tick) => (
          <span key={tick.year} className={styles.numeral} style={{ left: `clamp(1rem, ${percent(tick.at)}, calc(100% - 1rem))` }}>
            {tick.year}
          </span>
        ))}
        <span className={styles.now} />
      </div>
    </div>
  );
}
