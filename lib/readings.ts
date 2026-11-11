/**
 * What each of the three live readings draws, written once for both layers: the stage's
 * views and the SVG/HTML fallback read the same counts, the same layout and the same
 * timing. The counts are the figures' own in `content/proof.ts` (`tests/hero-craft.spec.ts`
 * holds them equal, so this module, which the page loads, never carries a figure's story); nothing
 * here is a figure of its own except the 200 ms of the telemetry figure's scope line and the 15
 * minutes of about 180 that its story gives for one scenario.
 */

import { headlineFigures, type HeadlineFigure } from '@/content/proof';

import { entrance, READING_LEAD, READING_VISUAL, readingDelay } from './entrance';
import { duration } from './motion';

export type ReadingId = HeadlineFigure['id'];

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
 * count can be read, each block 10 points square. A card draws the 100 blocks themselves, 25
 * across and 4 down, one mark for each block, at every screen; the enlarged reading in a panel
 * draws all 10,000 points, with one pitch of space between blocks. A line crosses it in 200 ms,
 * the P95 latency the figure's scope states.
 */
export const points = {
  count: 10_000,
  side: 10,
  blockColumns: 25,
  blockRows: 4,
  /** Devices one block stands for: 10 by 10 points. */
  perBlock: 100,
  sweepMs: 200,
  countMs: duration.hover,
} as const;

/** What a block stands for, where 100 blocks are drawn in place of the 10,000 points. */
export const blockKey = `1 block = ${points.perBlock} devices`;

/** The key under a reading's drawing: what one mark stands for. Telemetry's depends on whether blocks or points are drawn. */
export function keyOf(id: ReadingId, mode: 'points' | 'blocks' = 'blocks'): string {
  const figure = headlineFigures.find((entry) => entry.id === id);
  if (id === 'telemetry' && mode === 'blocks') return blockKey;
  return figure?.key ?? '';
}

/**
 * Evidence: one cell for each of the 200 SIT scenarios, and all 200 stay. Each cell is filled
 * to the effort one scenario took, about three hours, and the fill falls to about fifteen
 * minutes, left to right: the effort per scenario falls ≈92% while the count stays 200.
 */
export const cells = {
  count: 200,
  columns: 40,
  rows: 5,
  /** The share of a cell still filled after the fall: about 15 minutes of about 180. */
  rest: 15 / 180,
  /** Cells appear, full, over this long. */
  appearMs: duration.press,
  /** Cells start to fall across this spread, left to right, each taking `fallMs`. */
  spreadMs: 80,
  fallMs: 200,
} as const;

/**
 * Portfolio: one mark for each of up to 40 practitioners across 5+ squads, in one run of two
 * rows of 20 on a single baseline. The CV states no squad sizes, so no squad is drawn.
 */
export const cohort = {
  count: 40,
  across: 20,
  down: 2,
  countMs: duration.hover,
} as const;

/*
 * The layout of a reading, written once for both layers. The stage's views and the DOM drawing
 * (the SVG and HTML fallback, and the drawing a card shows while it morphs into its panel) take
 * the tile's CSS box and the screen's pixel ratio through `readingLayout` and draw exactly what
 * it returns, so the two coincide to the pixel. Every number here is a whole number of device
 * pixels, so no mark is resampled, and a mark is countable: at least one device pixel, with at
 * least one device pixel of space on every side between it and its neighbours.
 */

/** The ratio both layers draw at: the screen's own, at most the stage's cap of 2. */
const MAX_RATIO = 2;

export interface Tile {
  /** The tile's CSS box. */
  width: number;
  height: number;
  /** `window.devicePixelRatio`. */
  ratio: number;
}

/** A rectangle in device pixels, from the tile's top left. */
interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where a reading stands: a card of the first screen, or the enlarged reading that leads its panel. */
export type ReadingPlace = 'card' | 'panel';

/** The room a card's tile keeps free at its sides and top, in CSS pixels, so no mark meets the card's rounded corners. */
const CARD_PAD = { x: 10, y: 6 };

/**
 * The line of key under every drawing, in CSS pixels: the 13 px text of a key has 6 clear above
 * it and 6 below, so it never touches the drawing or the divider under it.
 */
export const KEY_STRIP = 22;

/**
 * The enlarged telemetry reading in a panel: the room round it, and the ways its 100 blocks can be set
 * out, widest first, each with the tallest the drawing may grow to, in CSS pixels. A narrow screen takes
 * the first that gives a pitch of two device pixels, so all 10,000 points are drawn at every width.
 */
const PANEL_PAD = 8;
const PANEL_MIN_HEIGHT = 176;
const PANEL_ARRANGEMENTS = [
  { across: 20, down: 5, tallest: 176 },
  { across: 10, down: 10, tallest: 240 },
  { across: 5, down: 20, tallest: 400 },
] as const;

interface TelemetryLayout {
  id: 'telemetry';
  /** Every one of the 10,000 points (the enlarged reading), or 100 blocks of 100 (a card). */
  mode: 'points' | 'blocks';
  /** The device ratio the numbers below are measured in. */
  ratio: number;
  /** Marks across and down the lattice, gutters between blocks included in points mode. */
  columns: number;
  rows: number;
  /** Points to a block's side, with a gutter of one pitch between blocks: 10 in points mode, 0 when a mark is itself a block. */
  side: number;
  /** Marks drawn, and devices each one stands for. */
  drawn: number;
  unit: number;
  /** Device pixels between neighbouring marks, and the edge of a mark. */
  pitch: number;
  mark: number;
  /** The lattice's extent, from the first mark's top left to the last mark's bottom right. */
  frame: Frame;
  /** The height of the tile the layout needs: a panel's tile grows to it; a card's is what its CSS gives. */
  height: number;
  /** What one mark stands for, drawn under the lattice. */
  key: string;
}

interface EvidenceLayout {
  id: 'evidence';
  ratio: number;
  columns: number;
  rows: number;
  /** Device pixels from one cell's origin to the next, across and down. */
  pitchX: number;
  pitchY: number;
  /** A cell's box, the outer edge of its outline. */
  boxX: number;
  boxY: number;
  /** The outline, the space between it and a fill's sides, and the least a fill is ever tall. */
  outline: number;
  inset: number;
  floor: number;
  /** The fill's width, and the height inside the outline that a full fill stands in. */
  fillWidth: number;
  room: number;
  frame: Frame;
  height: number;
  key: string;
}

interface PortfolioLayout {
  id: 'portfolio';
  ratio: number;
  across: number;
  down: number;
  /** Device pixels between neighbouring marks, and the edge of a mark. */
  pitch: number;
  mark: number;
  /** The marks' extent, and the baseline under them: a row of device pixels from `baseline.x` for `baseline.width`. */
  frame: Frame;
  baseline: { x: number; y: number; width: number };
  height: number;
  key: string;
}

export type ReadingLayout = TelemetryLayout | EvidenceLayout | PortfolioLayout;

/** The ratio a tile is drawn at. */
const ratioOf = (tile: Tile): number => Math.min(Math.max(tile.ratio, 1), MAX_RATIO);

/** A mark that is `pitch` apart from its neighbours: over half a pitch, so it reads as a mark, and never so wide that no pixel is left between. */
const markOf = (pitch: number): number => Math.max(1, Math.min(pitch - 1, Math.round(pitch * 0.55)));

/** The whole device pixels of room left over on each side of something `size` wide in a space `space` wide. */
const centred = (space: number, size: number): number => Math.max(0, Math.floor((space - size) / 2));

/** The lattice's marks in a row of `blocks` blocks of `side` points, a gutter of one pitch between blocks. */
const marksAcross = (blocks: number, side: number): number => blocks * (side + 1) - 1;

/** The room a card's drawing has, in device pixels from the tile's top left: inside the pad, above the key. */
function drawingArea(tile: Tile, ratio: number): Frame {
  const width = Math.floor(tile.width * ratio);
  const tall = Math.floor(tile.height * ratio);
  const x = Math.round(CARD_PAD.x * ratio);
  const y = Math.round(CARD_PAD.y * ratio);
  return { x, y, width: Math.max(width - 2 * x, 1), height: Math.max(tall - y - Math.round(KEY_STRIP * ratio), 1) };
}

/** `frame` of the given size, centred in `area`. */
const centredIn = (area: Frame, size: { width: number; height: number }): Frame => ({
  x: area.x + centred(area.width, size.width),
  y: area.y + centred(area.height, size.height),
  ...size,
});

/** A block: a mark a little smaller than its pitch, a few device pixels apart from the next. */
const blockOf = (pitch: number): number => pitch - Math.max(1, Math.round(pitch * 0.3));

function telemetryLayout(tile: Tile, place: ReadingPlace): TelemetryLayout {
  const ratio = ratioOf(tile);
  const { side, perBlock } = points;

  if (place === 'panel') {
    const width = Math.floor(tile.width * ratio);
    const pad = PANEL_PAD * ratio;
    const strip = KEY_STRIP * ratio;
    const [widest] = PANEL_ARRANGEMENTS;
    let chosen: (typeof PANEL_ARRANGEMENTS)[number] = widest;
    let pitch = 2;
    for (const arrangement of PANEL_ARRANGEMENTS) {
      const columns = marksAcross(arrangement.across, side);
      const rows = marksAcross(arrangement.down, side);
      const fitted = Math.floor(Math.min((width - 2 * pad) / columns, (Math.floor(arrangement.tallest * ratio) - 2 * pad) / rows));
      chosen = arrangement;
      pitch = Math.max(fitted, 2);
      if (fitted >= 2) break;
    }
    const columns = marksAcross(chosen.across, side);
    const rows = marksAcross(chosen.down, side);
    const mark = markOf(pitch);
    const size = { width: (columns - 1) * pitch + mark, height: (rows - 1) * pitch + mark };
    const height = Math.max(size.height + 2 * pad + strip, PANEL_MIN_HEIGHT * ratio);
    const area: Frame = { x: 0, y: 0, width, height: height - strip };
    return {
      id: 'telemetry',
      mode: 'points',
      ratio,
      columns,
      rows,
      side,
      drawn: points.count,
      unit: 1,
      pitch,
      mark,
      frame: centredIn(area, size),
      height: height / ratio,
      key: keyOf('telemetry', 'points'),
    };
  }

  // The points cannot be told apart at a card's size: one block for each hundred devices.
  const area = drawingArea(tile, ratio);
  const across = points.blockColumns;
  const down = points.blockRows;
  let pitch = Math.max(2, Math.floor(Math.min(area.width / (across - 1), area.height / (down - 1))));
  while (pitch > 2 && ((across - 1) * pitch + blockOf(pitch) > area.width || (down - 1) * pitch + blockOf(pitch) > area.height)) pitch -= 1;
  const mark = blockOf(pitch);
  return {
    id: 'telemetry',
    mode: 'blocks',
    ratio,
    columns: across,
    rows: down,
    side: 0,
    drawn: across * down,
    unit: perBlock,
    pitch,
    mark,
    frame: centredIn(area, { width: (across - 1) * pitch + mark, height: (down - 1) * pitch + mark }),
    height: tile.height,
    key: keyOf('telemetry', 'blocks'),
  };
}

function evidenceLayout(tile: Tile): EvidenceLayout {
  const ratio = ratioOf(tile);
  const area = drawingArea(tile, ratio);
  const { columns, rows } = cells;
  const outline = 1;
  const inset = 1;
  const pitchX = Math.max(2 * (outline + inset) + 1, Math.floor(area.width / columns));
  const pitchY = Math.max(2 * outline + 1, Math.floor(area.height / rows));
  // Neighbouring cells touch while a cell is narrow; from eight device pixels there is a pixel between their outlines.
  const boxX = pitchX - (pitchX >= 8 ? 1 : 0);
  const boxY = pitchY - (pitchY >= 8 ? 1 : 0);
  return {
    id: 'evidence',
    ratio,
    columns,
    rows,
    pitchX,
    pitchY,
    boxX,
    boxY,
    outline,
    inset,
    floor: 2,
    fillWidth: Math.max(1, boxX - 2 * (outline + inset)),
    room: boxY - 2 * outline,
    frame: centredIn(area, { width: (columns - 1) * pitchX + boxX, height: (rows - 1) * pitchY + boxY }),
    height: tile.height,
    key: keyOf('evidence'),
  };
}

function portfolioLayout(tile: Tile): PortfolioLayout {
  const ratio = ratioOf(tile);
  const area = drawingArea(tile, ratio);
  const { across, down } = cohort;
  // The widest pitch at which the run, the space under it and its baseline all fit.
  const below = (pitch: number, mark: number): number => pitch - mark + Math.round(pitch * 0.3);
  const total = (pitch: number, mark: number): number => (down - 1) * pitch + mark + below(pitch, mark) + 1;
  let pitch = Math.max(2, Math.min(Math.floor(area.width / across), Math.floor(22 * ratio)));
  while (pitch > 2 && ((across - 1) * pitch + markOf(pitch) > area.width || total(pitch, markOf(pitch)) > area.height)) pitch -= 1;
  const mark = markOf(pitch);
  const size = { width: (across - 1) * pitch + mark, height: (down - 1) * pitch + mark };
  const frame = centredIn(area, { width: size.width, height: total(pitch, mark) });
  const marks: Frame = { ...frame, height: size.height };
  const overhang = Math.round(pitch * 0.2);
  return {
    id: 'portfolio',
    ratio,
    across,
    down,
    pitch,
    mark,
    frame: marks,
    baseline: { x: marks.x - overhang, y: marks.y + marks.height + below(pitch, mark), width: marks.width + 2 * overhang },
    height: tile.height,
    key: keyOf('portfolio'),
  };
}

/** What a reading draws in a tile of this CSS box at this pixel ratio. The one function both layers take their layout from. */
export function readingLayout(id: 'telemetry', tile: Tile, place?: ReadingPlace): TelemetryLayout;
export function readingLayout(id: 'evidence', tile: Tile): EvidenceLayout;
export function readingLayout(id: 'portfolio', tile: Tile): PortfolioLayout;
export function readingLayout(id: ReadingId, tile: Tile, place?: ReadingPlace): ReadingLayout;
export function readingLayout(id: ReadingId, tile: Tile, place: ReadingPlace = 'card'): ReadingLayout {
  if (id === 'telemetry') return telemetryLayout(tile, place);
  return id === 'evidence' ? evidenceLayout(tile) : portfolioLayout(tile);
}

/** How long the light that answers a pointer or the keyboard takes to cross a reading. */
export const flashMs = (id: ReadingId): number => (id === 'telemetry' ? points.sweepMs : duration.state);
