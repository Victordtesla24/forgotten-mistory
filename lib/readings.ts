/**
 * What each of the three live readings draws, written once for both layers: the stage's
 * views and the SVG/HTML fallback read the same counts, the same layout and the same
 * timing. The counts come from `content/proof.ts`; nothing here is a figure of its own
 * except the 200 ms of the telemetry figure's scope line.
 */

import { headlineFigures, type HeadlineFigure } from '@/content/proof';

import { entrance, READING_LEAD, READING_VISUAL, readingDelay } from './entrance';
import { duration } from './motion';

export type ReadingId = HeadlineFigure['id'];

/** The reading of a figure, from the figure's own marks. */
function figureOf(id: ReadingId): HeadlineFigure {
  const figure = headlineFigures.find((entry) => entry.id === id);
  if (!figure) throw new Error(`no headline figure ${id}`);
  return figure;
}

/** The id of the view that draws a figure, as its placeholder carries it in `data-stage-view`. */
export const readingView = (id: ReadingId): string => `reading-${id}`;

/** When a reading's card starts to arrive, on the page's entrance clock. */
export function cardStart(id: ReadingId): number {
  const index = headlineFigures.findIndex((entry) => entry.id === id);
  return entrance.readings.at + readingDelay(index);
}

/** When a reading's own visual starts, a little after its card. */
export function visualStart(id: ReadingId): number {
  return cardStart(id) + READING_LEAD;
}

/** Every reading's visual runs this long, from its first mark to its last. */
export const VISUAL_MS = READING_VISUAL;

/**
 * Telemetry: one point for each of the 10,000 concurrent devices in a lattice, and a line
 * that crosses it in 200 ms, the P95 latency the figure's scope states.
 */
export const points = (() => {
  const count = figureOf('telemetry').marks.count;
  const columns = 250;
  return { count, columns, rows: count / columns, sweepMs: 200, countMs: duration.state };
})();

/**
 * Evidence: one cell for each of the 200 SIT scenarios. Every cell starts full, the roughly
 * three hours of evidence effort a scenario took, and then the effort falls away: about 92%
 * of the cells empty, left to right, and the rest, spread evenly, stay. All 200 stay drawn.
 */
export const cells = (() => {
  const figure = figureOf('evidence');
  const count = figure.marks.count;
  const columns = 40;
  return {
    count,
    columns,
    rows: count / columns,
    /** The cells that stay full: what is left once ≈92% have fallen away. */
    keep: Math.round(count * (1 - figure.value / 100)),
    /** Cells appear, full, over this long. */
    appearMs: 200,
    /** Cells start to fall away across this spread, left to right, each taking `fallMs`. */
    spreadMs: 120,
    fallMs: 200,
  };
})();

/** Whether the cell at `index`, counted down its column, is one of the evenly spread few that stay. */
export function keepsCell(index: number): boolean {
  return Math.floor(((index + 1) * cells.keep) / cells.count) > Math.floor((index * cells.keep) / cells.count);
}

/** Portfolio: one mark for each of up to 40 practitioners, in five squads, two marks wide and four tall. */
export const squads = (() => {
  const { count, groups } = figureOf('portfolio').marks;
  return { count, groups, perGroup: count / groups, columns: 2, rows: 4, countMs: duration.state };
})();

/** How long the light that answers a pointer or the keyboard takes to cross a reading. */
export const flashMs = (id: ReadingId): number => (id === 'telemetry' ? points.sweepMs : duration.state);
