/**
 * The hero's entrance, written down once. Six things arrive in this order, each starting a
 * motion token after the one before it so they overlap and the whole lasts under 1.6 s:
 * the field leads, then the headline, the positioning line, the actions, the three readings
 * (a stagger apart) and last the career scale, which draws left to right in time order.
 *
 * Times are milliseconds on the page's entrance clock. The CSS animations of the DOM take
 * their delays and durations from here, and the stage's views read the same table, so the
 * two layers move together; `window.__stage.seek(ms)` and `Animation.currentTime = ms`
 * reproduce any instant of it.
 */

import { duration, stagger } from './motion';

interface Step {
  /** When the step starts. */
  at: number;
  /** How long it takes. */
  for: number;
}

const headlineAt = duration.press;
const lineAt = headlineAt + duration.hover;
const actionsAt = lineAt + duration.press;
const readingsAt = actionsAt + duration.press;
const scaleAt = readingsAt + duration.hover;

export const entrance = {
  field: { at: 0, for: duration.entrance },
  headline: { at: headlineAt, for: duration.entrance },
  line: { at: lineAt, for: duration.panel },
  actions: { at: actionsAt, for: duration.panel },
  readings: { at: readingsAt, for: duration.panel },
  scale: { at: scaleAt, for: duration.entrance },
} as const satisfies Record<string, Step>;

/** The reading at `index` starts this long after the first one. */
export function readingDelay(index: number): number {
  return index * stagger.max;
}

/** The actions, then the links, follow each other this closely. */
const ACTION_STEP = stagger.min;

/** The count-up and sweep of a reading's own visual start this long after its card begins. */
export const READING_LEAD = duration.hover - duration.press;

/** The visual of a reading takes this long, from its first mark to its last. */
export const READING_VISUAL = duration.state + duration.hover;

/** The three readings, a stagger apart, and the time the last one has finished. */
const READING_COUNT = 3;

/** The moment the last thing has landed. Under 1.6 s by construction; `tests/hero.spec.ts` holds the line. */
export const ENTRANCE_END = Math.max(
  entrance.field.at + entrance.field.for,
  entrance.headline.at + entrance.headline.for,
  entrance.actions.at + 2 * ACTION_STEP + entrance.actions.for,
  entrance.readings.at + readingDelay(READING_COUNT - 1) + READING_LEAD + READING_VISUAL,
  entrance.scale.at + entrance.scale.for,
);

/** The same table as CSS custom properties on the hero, so a stylesheet never repeats a time. */
export const entranceVars = {
  '--e-headline': `${entrance.headline.at}ms`,
  '--e-line': `${entrance.line.at}ms`,
  '--e-actions': `${entrance.actions.at}ms`,
  '--e-readings': `${entrance.readings.at}ms`,
  '--e-scale': `${entrance.scale.at}ms`,
  '--e-field-for': `${entrance.field.for}ms`,
  '--e-headline-for': `${entrance.headline.for}ms`,
  '--e-line-for': `${entrance.line.for}ms`,
  '--e-actions-for': `${entrance.actions.for}ms`,
  '--e-readings-for': `${entrance.readings.for}ms`,
  '--e-scale-for': `${entrance.scale.for}ms`,
  '--e-step': `${stagger.max}ms`,
  '--e-action-step': `${ACTION_STEP}ms`,
} as const;
