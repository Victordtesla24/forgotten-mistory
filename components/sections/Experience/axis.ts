import { FIRST_YEAR, ticks } from '@/lib/timeline';

/** The SVG draws on a 1000-unit-wide box that stretches to its track, so positions stay exact at every width. */
export const UNITS = 1000;

const x = (at: number): string => (at * UNITS).toFixed(2);

/** A numeral stands on every second January: nine on the axis, which a 640 px track holds with room between them. */
const NUMERAL_EVERY = 2;

/** On a narrower track only every fourth January keeps its numeral. */
const NUMERAL_EVERY_NARROW = 4;

/** The Januaries that carry a numeral, and whether a track narrower than 640 px keeps it. */
export const numerals = ticks
  .filter((tick) => tick.year !== undefined && (tick.year - FIRST_YEAR) % NUMERAL_EVERY === 0)
  .map((tick) => ({ at: tick.at, year: tick.year ?? FIRST_YEAR, narrow: ((tick.year ?? FIRST_YEAR) - FIRST_YEAR) % NUMERAL_EVERY_NARROW === 0 }));

/** The ticks of the ruler by length: every quarter, every January, and the Januaries that carry a numeral. */
export const tickPaths = {
  quarter: ticks
    .filter((tick, month) => month % 3 === 0 && tick.year === undefined)
    .map((tick) => `M${x(tick.at)} 0v5`)
    .join(''),
  year: ticks
    .filter((tick) => tick.year !== undefined && (tick.year - FIRST_YEAR) % NUMERAL_EVERY !== 0)
    .map((tick) => `M${x(tick.at)} 0v9`)
    .join(''),
  numeral: numerals.map((numeral) => `M${x(numeral.at)} 0v15`).join(''),
};

/**
 * The graticule: a hairline up from every January, the labelled Januaries carrying more weight. It
 * is the ruler's own ticks carried up through the empty field, so the field reads as a plot and
 * not as space. The first January is the track's own edge and is not drawn twice.
 */
export const gridPaths = {
  year: ticks
    .filter((tick) => tick.year !== undefined && tick.at > 0 && (tick.year - FIRST_YEAR) % NUMERAL_EVERY !== 0)
    .map((tick) => `M${x(tick.at)} 0v100`)
    .join(''),
  numeral: numerals
    .filter((numeral) => numeral.at > 0)
    .map((numeral) => `M${x(numeral.at)} 0v100`)
    .join(''),
};

/** A position on the track, 0 to 1, as a CSS percentage. */
export const percent = (at: number): string => `${(at * 100).toFixed(4)}%`;
