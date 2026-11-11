import type { CSSProperties } from 'react';

import { StageView } from '@/components/visuals/StageView';
import { cn } from '@/lib/cn';
import { CAREER_VIEW } from '@/lib/gl/ids';
import { careerBars, fitStep, FIRST_YEAR, LAST_YEAR, outsideLabels } from '@/lib/timeline';

import { numerals, percent, tickPaths, UNITS } from './axis';
import { SnapRow } from '@/components/ui/SnapRow';

import { BarKeys } from './BarKeys';
import { RoleLink } from './RoleLink';
import styles from './CareerTrack.module.css';

/**
 * The career, drawn to scale and edge to edge: one axis from 2010 to now, the eight roles as
 * bars whose widths are their lengths in months, the current role lit. It is a plain block,
 * never `100vw`, so it is exactly the width of the page's content box.
 *
 * The drawing is one layer at every width and for every kind of screen. Every role is named: a
 * name that fits sits inside its bar, longer where the bar is wide enough to add the title; one
 * that does not stands in a lane above the bars with a hairline to its bar (`lib/timeline.ts`
 * lays the lanes out). The controls are a second layer that depends on the screen. Where there
 * is a fine pointer and room (640 px and up) each bar is a link that opens its role in the
 * panel set around it, and Left, Right, Home and End move between them. On a phone, and on a
 * touch screen of any width, a bar is too narrow to touch, so the links give way to a row of
 * 44 px chips, one for each role, which opens the same panels and lights the same bars, under a
 * caption naming the role the reader is on (the current one until then). Only one of the two
 * sets of controls is ever in the page's tree. The light layer behind it is the stage's;
 * everything here stands without it.
 */
export function CareerTrack() {
  const lanes = new Map(outsideLabels.map((label) => [label.id, label]));
  return (
    <div data-career-scale="" data-marks="" className={styles.scale}>
      <p className={styles.caption}>
        {careerBars.map((bar) => (
          <span key={bar.id} data-mark={bar.id} data-current={bar.current ? 'true' : undefined}>
            <span className="text-text">{bar.label}</span>
            <span> · </span>
            <span className={styles.role}>{bar.shortTitle}</span>
            <span className={cn(styles.dates, bar.current ? 'text-accent' : undefined)}>{bar.dates}</span>
          </span>
        ))}
      </p>

      <div className={styles.track}>
        <StageView view={CAREER_VIEW} className={styles.light} />
        <ol aria-hidden="true" data-drawn="" className={styles.drawn}>
          {careerBars.map((bar) => {
            const outside = lanes.get(bar.id);
            return (
              <li
                key={bar.id}
                className={styles.sliver}
                data-bar={bar.id}
                data-mark={bar.id}
                data-current={bar.current ? 'true' : undefined}
                style={{ left: percent(bar.start), width: percent(bar.width), '--at': bar.start.toFixed(4) } as CSSProperties}
              >
                <span className={styles.fill}>
                  <span className={styles.label} data-fit={fitStep(bar.label)}>
                    {bar.label}
                    <span className={styles.more} data-fit={fitStep(bar.label + bar.more)}>
                      {bar.more}
                    </span>
                  </span>
                </span>
                {outside ? (
                  <span className={styles.out} data-fit={fitStep(bar.label)} data-lane={outside.lane}>
                    <span className={styles.text} data-align={outside.align}>
                      {bar.label}
                    </span>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
        <BarKeys>
          <ol
            aria-label={`Career, ${FIRST_YEAR} to ${LAST_YEAR}, oldest role first`}
            className={styles.bars}
            data-bars=""
          >
            {careerBars.map((bar) => (
              <li
                key={bar.id}
                className={styles.item}
                data-bar={bar.id}
                data-side={bar.start > 0.5 ? 'end' : 'start'}
                style={{ left: percent(bar.start), width: percent(bar.width) } as CSSProperties}
              >
                <RoleLink
                  role={bar.id}
                  aria-label={bar.name}
                  data-role={bar.id}
                  data-months={bar.months}
                  data-current={bar.current ? 'true' : undefined}
                  className={styles.bar}
                />
                <span aria-hidden="true" className={styles.tip}>
                  <span className="text-muted">{bar.employer}</span>
                  <span className="font-medium text-text">{bar.shortTitle}</span>
                  <span className={bar.current ? 'text-accent' : 'text-muted'}>{bar.dates}</span>
                </span>
              </li>
            ))}
          </ol>
        </BarKeys>

        <div aria-hidden="true" data-ruler="" className={styles.ruler}>
          <svg viewBox={`0 0 ${UNITS} 16`} preserveAspectRatio="none" focusable="false" className={styles.ticks}>
            <line x1="0" x2={UNITS} y1="0.5" y2="0.5" className={styles.baseline} />
            <path d={tickPaths.month} className={styles.month} />
            <path d={tickPaths.year} className={styles.year} />
            <path d={tickPaths.major} className={styles.year} />
          </svg>
          {numerals.map((tick) => (
            <span key={tick.year} className={styles.numeral} style={{ left: `clamp(1.55rem, ${percent(tick.at)}, calc(100% - 1.55rem))` }}>
              {tick.year}
            </span>
          ))}
          <span className={styles.now} />
        </div>
      </div>

      <BarKeys>
        <SnapRow as="ol" strip aria-label="Career roles" className={styles.chips} data-chips="">
          {careerBars.map((bar) => (
            <li key={bar.id}>
              <RoleLink
                role={bar.id}
                aria-label={bar.name}
                data-role={bar.id}
                data-mark={bar.id}
                data-current={bar.current ? 'true' : undefined}
                className={styles.chip}
              >
                {bar.label}
              </RoleLink>
            </li>
          ))}
        </SnapRow>
      </BarKeys>
    </div>
  );
}
