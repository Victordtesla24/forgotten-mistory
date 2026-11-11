import { numerals, ticks } from '@/lib/timeline';

/** The SVG draws on a 1000-unit-wide box that stretches to its track, so positions stay exact at every width. */
export const UNITS = 1000;

const x = (at: number): string => (at * UNITS).toFixed(2);

/** One tick path per length: months, Januaries and the Januaries that carry a numeral. */
export const tickPaths = {
  month: ticks.filter((tick) => tick.year === undefined).map((tick) => `M${x(tick.at)} 0v5`).join(''),
  year: ticks.filter((tick) => tick.year !== undefined && !tick.major).map((tick) => `M${x(tick.at)} 0v9`).join(''),
  major: ticks.filter((tick) => tick.major).map((tick) => `M${x(tick.at)} 0v15`).join(''),
};

/** The Januaries that carry a numeral, for the axis's labels. */
export { numerals };

/** A position on the track, 0 to 1, as a CSS percentage. */
export const percent = (at: number): string => `${(at * 100).toFixed(4)}%`;
