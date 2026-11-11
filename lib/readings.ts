/**
 * What each of the three live readings draws, written once for both layers: the stage's
 * views and the SVG/HTML fallback read the same counts, the same layout and the same
 * timing. The counts come from `content/proof.ts`; nothing here is a figure of its own
 * except the 200 ms of the telemetry figure's scope line and the 15 minutes of about 180
 * that its story gives for one scenario.
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
 * Telemetry: one point for each of the 10,000 concurrent devices, in 100 blocks of 100 so the
 * count can be read: 20 blocks across, 5 down, each block 10 points square, one pitch of space
 * between blocks. A line crosses it in 200 ms, the P95 latency the figure's scope states.
 * The pitch is a whole number of device pixels, so every point lands on a pixel and the
 * lattice never moires.
 */
export const points = (() => {
  const count = figureOf('telemetry').marks.count;
  const side = 10;
  const blockColumns = 20;
  const blockRows = 5;
  const perBlock = side * side;
  if (blockColumns * blockRows * perBlock !== count) throw new Error('the telemetry blocks do not add up to the figure');
  return {
    count,
    side,
    blockColumns,
    blockRows,
    /** Points across and down the whole lattice, a gutter of one pitch between blocks included. */
    columns: blockColumns * side + (blockColumns - 1),
    rows: blockRows * side + (blockRows - 1),
    sweepMs: 200,
    countMs: duration.state,
  };
})();

/** The whole-pixel pitch, at least 1, at which the lattice fits a tile this big, in the pixels it is drawn in. */
export function pointPitch(width: number, height: number): number {
  return Math.max(1, Math.min(Math.floor(width / points.columns), Math.floor(height / points.rows)));
}

/** The dot is half the pitch, rounded down, and never under a pixel: a crisp mark with room round it. */
export const pointSize = (pitch: number): number => Math.max(1, Math.floor(pitch / 2));

/**
 * Evidence: one cell for each of the 200 SIT scenarios, and all 200 stay. Each cell is filled
 * to the effort one scenario took, about three hours, and the fill falls to about fifteen
 * minutes, left to right: the effort per scenario falls ≈92% while the count stays 200.
 */
export const cells = (() => {
  const figure = figureOf('evidence');
  const count = figure.marks.count;
  const columns = 40;
  return {
    count,
    columns,
    rows: count / columns,
    /** The share of a cell still filled after the fall: about 15 minutes of about 180. */
    rest: 15 / 180,
    /** Cells appear, full, over this long. */
    appearMs: 200,
    /** Cells start to fall across this spread, left to right, each taking `fallMs`. */
    spreadMs: 120,
    fallMs: 200,
  };
})();

/**
 * Portfolio: one mark for each of up to 40 practitioners, as one cohort on one baseline. The
 * CV gives the number of squads (5+) and the largest team (up to 40) but not how the people
 * divide among squads, so no squad is drawn.
 */
export const cohort = (() => {
  const { count } = figureOf('portfolio').marks;
  const columns = 20;
  return { count, columns, rows: count / columns, countMs: duration.state };
})();

/** How long the light that answers a pointer or the keyboard takes to cross a reading. */
export const flashMs = (id: ReadingId): number => (id === 'telemetry' ? points.sweepMs : duration.state);
