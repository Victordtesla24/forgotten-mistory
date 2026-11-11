import { NOW, TIMELINE_START } from '@/content/experience';
import { CARD_PAD, KEY_STRIP, readingLayout, type ReadingId, type Tile } from '@/lib/readings';

import styles from './RoleVisual.module.css';
import type { RoleView } from './roles';

/** The roles whose figure is one of the hero's three readings, and which: the Experience card draws it with that reading's own layout and key. */
const READING_OF: Readonly<Record<string, ReadingId>> = { ato: 'evidence', anz: 'telemetry' };

/**
 * The tile each place draws in: the card's is the box the stylesheet gives it from 640 px (the
 * card is 34rem across, less its padding and border), a panel's is the width it opens at.
 * A tile of another width scales the drawing, whole; the key stands under it, in its own line.
 */
const TILES = { card: { width: 502, height: 118, ratio: 1 }, panel: { width: 640, height: 140, ratio: 1 } } as const satisfies Record<string, Tile>;

/** The months of the career as a calendar: a column for every year of the axis, a row for every month. */
const YEARS = Math.floor(NOW) - TIMELINE_START + 1;
const MONTHS = 12;

/** A share drawn as a hundred cells, 25 across and 4 down, counted down the columns. */
const SHARE = { columns: 25, rows: 4 } as const;

/** One kind of mark laid out as a lattice of equal cells, so that a pattern can draw the lot. */
interface Lattice {
  /** Where the first cell's top left is, and the distance from one cell's origin to the next. */
  x: number;
  y: number;
  pitchX: number;
  pitchY: number;
  /** A cell's box. */
  width: number;
  height: number;
  columns: number;
  rows: number;
  /** The width of a cell's outline: whole device pixels, in CSS px. 0 where the cells have none. */
  line: number;
  /** What stands in a cell that is full: the whole of its box, or a fill of this height standing on the floor inside the outline, the whole width of it. */
  fill: 'cell' | { height: number; inset: number };
}

/** A run of the lattice's cells, counted down the columns, that is solid: columns `from` to `to` (exclusive) and rows `top` to `bottom`. */
interface Run {
  from: number;
  to: number;
  top: number;
  bottom: number;
}

interface Drawing {
  kind: 'evidence' | 'telemetry' | 'share' | 'months';
  lattice: Lattice;
  /** The cells that are full, as runs; every cell has an outline when the lattice has a line. */
  runs: readonly Run[];
  /** What one mark stands for, under the drawing. */
  key: string;
}

const num = (value: number): string => String(Math.round(value * 1000) / 1000);

/** The cells `from` to `to` (exclusive), counted down the columns of a lattice `rows` tall, as at most three runs. */
function runsOf(from: number, to: number, rows: number): Run[] {
  if (to <= from) return [];
  const firstColumn = Math.floor(from / rows);
  const lastColumn = Math.floor((to - 1) / rows);
  const head = from % rows;
  const tail = ((to - 1) % rows) + 1;
  if (firstColumn === lastColumn) return [{ from: firstColumn, to: firstColumn + 1, top: head, bottom: tail }];
  const runs: Run[] = [];
  let first = firstColumn;
  let last = lastColumn;
  if (head > 0) {
    runs.push({ from: firstColumn, to: firstColumn + 1, top: head, bottom: rows });
    first += 1;
  }
  if (tail < rows) last -= 1;
  if (last >= first) runs.push({ from: first, to: last + 1, top: 0, bottom: rows });
  if (tail < rows) runs.push({ from: lastColumn, to: lastColumn + 1, top: 0, bottom: tail });
  return runs;
}

/** The hero's own reading of the figure, laid out by the layout function the hero's views take and keyed with its key. */
function reading(id: ReadingId, tile: Tile): Drawing | null {
  if (id === 'evidence') {
    const layout = readingLayout('evidence', tile);
    return {
      kind: 'evidence',
      lattice: {
        x: layout.frame.x,
        y: layout.frame.y,
        pitchX: layout.pitchX,
        pitchY: layout.pitchY,
        width: layout.boxX,
        height: layout.boxY,
        columns: layout.columns,
        rows: layout.rows,
        line: layout.outline,
        fill: { height: layout.rested, inset: layout.outline },
      },
      runs: [{ from: 0, to: layout.columns, top: 0, bottom: layout.rows }],
      key: layout.key,
    };
  }
  if (id === 'telemetry') {
    const layout = readingLayout('telemetry', tile, 'card');
    return {
      kind: 'telemetry',
      lattice: { x: layout.frame.x, y: layout.frame.y, pitchX: layout.pitch, pitchY: layout.pitch, width: layout.mark, height: layout.mark, columns: layout.columns, rows: layout.rows, line: 0, fill: 'cell' },
      runs: [{ from: 0, to: layout.columns, top: 0, bottom: layout.rows }],
      key: layout.key,
    };
  }
  return null;
}

/** A lattice of whole pixels that fills the tile's drawing area, `columns` by `rows`, with the cells `solid[0]` to `solid[1]` (down the columns) full. */
function grid(tile: Tile, columns: number, rows: number, solid: readonly [number, number], kind: 'share' | 'months', key: string): Drawing {
  const width = Math.floor(tile.width - 2 * CARD_PAD.x);
  const height = Math.floor(tile.height - CARD_PAD.y - KEY_STRIP);
  const pitchX = Math.max(3, Math.floor(width / columns));
  const pitchY = Math.max(3, Math.floor(height / rows));
  const gap = Math.max(1, Math.round(Math.min(pitchX, pitchY) * 0.18));
  const boxX = pitchX - gap;
  const boxY = pitchY - gap;
  return {
    kind,
    lattice: {
      x: CARD_PAD.x + Math.max(0, Math.floor((width - ((columns - 1) * pitchX + boxX)) / 2)),
      y: CARD_PAD.y + Math.max(0, Math.floor((height - ((rows - 1) * pitchY + boxY)) / 2)),
      pitchX,
      pitchY,
      width: boxX,
      height: boxY,
      columns,
      rows,
      line: 1,
      fill: 'cell',
    },
    runs: runsOf(solid[0], solid[1], rows),
    key,
  };
}

/** What the share of the figure states: "−38%" is 38 of 100 cells fallen away, 62 still standing. */
function shareOf(value: string): number | null {
  const found = /^[≈−-]?(\d+(?:\.\d+)?)%$/.exec(value);
  return found?.[1] ? Number(found[1]) : null;
}

/** The drawing of a role's figure: the hero's reading where the figure is one of the three, the share as cells where it is a share, the months of the role in the career otherwise. */
function drawingOf(role: RoleView, tile: Tile): Drawing {
  const id = READING_OF[role.id];
  const drawn = id ? reading(id, tile) : null;
  if (drawn) return drawn;
  const share = role.headline ? shareOf(role.headline.value) : null;
  if (share !== null) {
    return grid(tile, SHARE.columns, SHARE.rows, [0, Math.round(SHARE.columns * SHARE.rows - share)], 'share', '1 cell = 1% of breaches');
  }
  return grid(tile, YEARS, MONTHS, [role.from, role.from + role.months], 'months', '1 cell = 1 month');
}

/**
 * A role's drawn figure, at the size of its card or of its panel. A figure that is one of the
 * hero's three readings (the evidence effort, the concurrent devices) is that reading, laid out by
 * the very function the hero's views take (`readingLayout` in lib/readings.ts) and keyed with its
 * key, so the two cannot disagree. A figure that is a share is drawn as that many of a hundred
 * cells. A role with no figure draws its own months in the calendar of the career, a column for
 * each year and a row for each month, so every role has a drawing from what the content states
 * and nothing else. Drawn on the server from patterns (a cell, repeated), so the page's script
 * carries none of it and it is whole without script.
 */
export function RoleVisual({ role, place }: { role: RoleView; place: 'card' | 'panel' }) {
  const tile = TILES[place];
  const { kind, lattice, runs, key } = drawingOf(role, tile);
  const { x, y, pitchX, pitchY, width, height, columns, rows, line, fill } = lattice;
  const id = `visual-${place}-${role.id}`;
  const solid = fill === 'cell' ? { x: 0, y: 0, width, height } : { x: fill.inset, y: height - line - fill.height, width: width - 2 * fill.inset, height: fill.height };
  return (
    <div className={styles.tile} data-place={place} data-figure={kind}>
      <svg aria-hidden="true" focusable="false" width={tile.width} viewBox={`0 0 ${tile.width} ${tile.height - KEY_STRIP}`} className={styles.drawing}>
        <defs>
          {line > 0 ? (
            <pattern id={`${id}-outline`} patternUnits="userSpaceOnUse" x={x} y={y} width={pitchX} height={pitchY}>
              <path d={`M0 0h${num(width)}v${num(height)}h${num(-width)}zM${num(line)} ${num(line)}h${num(width - 2 * line)}v${num(height - 2 * line)}h${num(-(width - 2 * line))}z`} className={styles.outline} />
            </pattern>
          ) : null}
          <pattern id={`${id}-solid`} patternUnits="userSpaceOnUse" x={x} y={y} width={pitchX} height={pitchY}>
            <rect x={solid.x} y={solid.y} width={solid.width} height={solid.height} className={styles.solid} />
          </pattern>
        </defs>
        {line > 0 ? <rect x={x} y={y} width={(columns - 1) * pitchX + width} height={(rows - 1) * pitchY + height} fill={`url(#${id}-outline)`} /> : null}
        {runs.map((run) => (
          <rect
            key={`${run.from}-${run.top}`}
            x={x + run.from * pitchX}
            y={y + run.top * pitchY}
            width={(run.to - run.from - 1) * pitchX + width}
            height={(run.bottom - run.top - 1) * pitchY + height}
            fill={`url(#${id}-solid)`}
          />
        ))}
      </svg>
      <p className={styles.key}>{key}</p>
    </div>
  );
}
