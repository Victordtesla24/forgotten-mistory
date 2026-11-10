import type { CSSProperties } from 'react';

import { Ruler } from '@/components/ui/Ruler';
import { cn } from '@/lib/cn';

import {
  AXIS_MAX,
  AXIS_MIN,
  BAR_HEIGHT,
  BAR_TOP,
  LANE_HEIGHT,
  LAST_YEAR,
  NUMERAL_STEP,
  axisPosition,
  buildFacts,
  buildLanes,
  type Lane,
} from './careerScale';
import styles from './CareerScale.module.css';

/** Bars draw in oldest first, so the career builds up from the bottom of the panel. */
const DRAW_START_MS = 260;
const DRAW_STAGGER_MS = 55;
const LABEL_LAG_MS = 240;

/** Space between a bar and its label. */
const LABEL_GAP = 8;

/** The tooltip is at most this wide; it is held inside the panel at either edge. */
const TIP_WIDTH = 'min(19rem, 100%)';

const numberedYears = Array.from(
  { length: Math.floor((AXIS_MAX - AXIS_MIN) / NUMERAL_STEP) + 1 },
  (_, index) => AXIS_MIN + index * NUMERAL_STEP,
).filter((year) => year < AXIS_MAX);

function barDelay(index: number, count: number): number {
  return DRAW_START_MS + (count - 1 - index) * DRAW_STAGGER_MS;
}

function labelStyle(lane: Lane, delay: number): CSSProperties {
  const animationDelay = `${delay}ms`;
  if (lane.side === 'before') {
    return {
      right: `calc(${100 - lane.start}% + ${LABEL_GAP}px)`,
      maxWidth: `calc(${lane.start}% - ${LABEL_GAP}px)`,
      animationDelay,
    };
  }
  const end = lane.start + lane.width;
  return {
    left: `calc(${end}% + ${LABEL_GAP}px)`,
    maxWidth: `calc(${100 - end}% - ${LABEL_GAP}px)`,
    animationDelay,
  };
}

function LaneRow({ lane, index, count }: { lane: Lane; index: number; count: number }) {
  const delay = barDelay(index, count);
  return (
    <li className={styles.lane} style={{ height: LANE_HEIGHT }}>
      <a href="#experience" aria-label={lane.name} className={cn(styles.link, 'group')}>
        <svg
          width="100%"
          height={LANE_HEIGHT}
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 block overflow-visible"
        >
          <rect
            x={`${lane.start}%`}
            y={BAR_TOP}
            width={`${lane.width}%`}
            height={BAR_HEIGHT}
            rx="3"
            className={cn(
              styles.bar,
              lane.current
                ? 'fill-accent'
                : 'fill-muted/70 group-hover:fill-text group-focus-visible:fill-text',
            )}
            style={{ animationDelay: `${delay}ms` }}
          />
        </svg>
        <span
          className={cn(
            styles.label,
            'absolute top-1/2 -translate-y-1/2 truncate text-[0.8125rem] leading-none',
            lane.current ? 'text-text' : 'text-muted group-hover:text-text group-focus-visible:text-text',
          )}
          style={labelStyle(lane, delay + LABEL_LAG_MS)}
        >
          {lane.label}
          {lane.current ? (
            <span className="ml-2 font-mono text-[0.8125rem] tracking-[0.08em] text-accent uppercase">
              Current
            </span>
          ) : null}
        </span>
      </a>
      <span
        aria-hidden="true"
        className={styles.tip}
        style={{ left: `min(${lane.start}%, calc(100% - ${TIP_WIDTH}))` }}
      >
        <span className="text-muted">{lane.company}</span>
        <span className="font-medium text-text">{lane.role}</span>
        <span className={cn('font-mono', lane.current ? 'text-accent' : 'text-muted')}>
          {lane.dates}
          {lane.current ? ' · current' : ''}
        </span>
      </span>
    </li>
  );
}

/**
 * The career, drawn to scale: one lane per role on a single 2010 to 2026 axis,
 * built from the roles in `content/experience`. Bars are links to the experience
 * section; each has an accessible name, a tooltip on hover and focus, and a row in
 * a visually hidden list that is the graphic's text alternative.
 */
export function CareerScale() {
  const lanes = buildLanes();
  const facts = buildFacts();

  return (
    <figure
      aria-labelledby="career-scale-title"
      className="rounded-lg border border-line bg-surface/85 p-5 shadow-card supports-[backdrop-filter]:backdrop-blur-sm sm:p-6"
    >
      <figcaption
        id="career-scale-title"
        className="type-eyebrow flex items-baseline justify-between gap-4 text-muted"
      >
        <span>Career scale</span>
        <span>
          {AXIS_MIN}–{LAST_YEAR}
        </span>
      </figcaption>

      <div className="mt-5">
        <Ruler min={AXIS_MIN} max={AXIS_MAX} step={1} labelStep={NUMERAL_STEP} />
        <div className="relative">
          <svg
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute inset-0 block size-full"
          >
            {numberedYears.map((year) => (
              <line
                key={year}
                x1={`${axisPosition(year)}%`}
                x2={`${axisPosition(year)}%`}
                y1="0"
                y2="100%"
                className="stroke-line"
                strokeWidth="1"
                strokeDasharray="2 4"
                shapeRendering="crispEdges"
              />
            ))}
          </svg>
          <ol className="relative">
            {lanes.map((lane, index) => (
              <LaneRow key={lane.id} lane={lane} index={index} count={lanes.length} />
            ))}
          </ol>
        </div>
      </div>

      <div className="sr-only">
        <p>
          Career scale, {AXIS_MIN} to {LAST_YEAR}: the roles below, newest first, with their dates.
        </p>
        <ol>
          {lanes.map((lane) => (
            <li key={lane.id}>{lane.name}</li>
          ))}
        </ol>
      </div>

      <ul className="mt-5 grid grid-cols-[0.8fr_0.8fr_1.6fr] gap-4 border-t border-line pt-4">
        {facts.map((fact) => (
          <li key={fact.label} className="grid content-start gap-1">
            <span className="font-mono text-[1.5rem] leading-none tracking-tight text-text tabular-nums">
              {fact.value}
            </span>
            <span className="type-meta text-muted">{fact.label}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
