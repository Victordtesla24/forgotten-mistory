import { FIRST_YEAR, ticks } from '@/lib/timeline';

/** The SVG draws on a 1000-unit-wide box that stretches to its track, so positions stay exact at every width. */
export const UNITS = 1000;

const x = (at: number): string => (at * UNITS).toFixed(2);

/**
 * Which tracks carry a January's numeral. A track narrower than 640 px keeps every fourth (five
 * numerals), one from 640 px every second (nine), and from 1024 px every one: seventeen, from
 * 2010 to 2026, on a ruler that is at least 61 px to the year.
 */
export type NumeralTier = 'narrow' | 'mid' | 'wide';

const tierOf = (year: number): NumeralTier => ((year - FIRST_YEAR) % 4 === 0 ? 'narrow' : (year - FIRST_YEAR) % 2 === 0 ? 'mid' : 'wide');

/** Every January with its numeral and the tier of track that shows it. */
export const numerals = ticks.flatMap((tick) => (tick.year === undefined ? [] : [{ at: tick.at, year: tick.year, tier: tierOf(tick.year) }]));

/** The Januaries whose ticks are tall on every track: those with a numeral on a track from 640 px. */
const tall = numerals.filter((numeral) => numeral.tier !== 'wide');

/** The Januaries that gain a numeral from 1024 px, and a longer tick with it. */
const wide = numerals.filter((numeral) => numeral.tier === 'wide');

/** The ticks of the ruler by length: every quarter, the short January ticks, the tall ones, and the length the wide tier's ticks gain. */
export const tickPaths = {
  quarter: ticks
    .filter((tick, month) => month % 3 === 0 && tick.year === undefined)
    .map((tick) => `M${x(tick.at)} 0v5`)
    .join(''),
  year: wide.map((numeral) => `M${x(numeral.at)} 0v9`).join(''),
  numeral: tall.map((numeral) => `M${x(numeral.at)} 0v15`).join(''),
  extension: wide.map((numeral) => `M${x(numeral.at)} 9v6`).join(''),
};

/** How far the lines of the graticule lean in at the top: a line stands over its January at the bars and has come this far in by the top. */
const RECEDE = 0.8;

/** A line up from a January at the bottom of the field, leaning toward the middle as it rises, so the field recedes. */
const line = (at: number): string => `M${x(at)} 100L${((0.5 + (at - 0.5) * RECEDE) * UNITS).toFixed(2)} 0`;

/**
 * The graticule: a line up from every January, leaning in as it rises (the hero's receding
 * lanes), the labelled Januaries carrying more weight. It is the ruler's own ticks carried up
 * through the field, so the field reads as a plot and not as space. The first January is the
 * track's own edge and is not drawn twice.
 */
export const gridPaths = {
  year: wide
    .filter((numeral) => numeral.at > 0)
    .map((numeral) => line(numeral.at))
    .join(''),
  numeral: tall
    .filter((numeral) => numeral.at > 0)
    .map((numeral) => line(numeral.at))
    .join(''),
};
