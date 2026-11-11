/**
 * The one time scale of the site. Every timeline, the hero's career scale today and the
 * Experience track after it, takes its positions from here, so they can never disagree: a UTC
 * time scale from January 2010 to the current month, mapped onto 0 to 1 of the track's width.
 * It knows nothing of pixels, React or three.js; a consumer multiplies by its own width.
 */

import { scaleUtc } from 'd3-scale';

import { NOW, roles, TIMELINE_START } from '@/content/experience';

/** The first instant of the month a decimal year (`ym(2017, 9)`) falls in. The CV gives month precision. */
function monthStart(decimalYear: number): Date {
  const year = Math.floor(decimalYear + 1e-6);
  return new Date(Date.UTC(year, Math.round((decimalYear - year) * 12), 1));
}

/** The axis: 2010-01 to the current month, as a fraction of the track. */
export const timeline = scaleUtc()
  .domain([monthStart(TIMELINE_START), monthStart(NOW)])
  .range([0, 1]);

/** Where a decimal year sits on the track, 0 at the left edge and 1 at the right. */
function position(decimalYear: number): number {
  return timeline(monthStart(decimalYear));
}

/** The calendar month a decimal year falls in, counted from the first month of the axis. */
function monthIndex(decimalYear: number): number {
  const date = monthStart(decimalYear);
  const first = monthStart(TIMELINE_START);
  return (date.getUTCFullYear() - first.getUTCFullYear()) * 12 + date.getUTCMonth() - first.getUTCMonth();
}

interface CareerBar {
  id: string;
  /** The employer as a short label. */
  label: string;
  employer: string;
  /** The title in four words or fewer. */
  shortTitle: string;
  /** The span in months and years, written out in full. */
  dates: string;
  /** Employer, role and dates: what a reader of the bar is told. */
  name: string;
  /** Left and right edges on the track, 0 to 1. */
  start: number;
  end: number;
  /** `end - start`: the bar's share of the track. Proportional to `months`. */
  width: number;
  /** The role's length in whole months, to the current month for the current role. */
  months: number;
  current: boolean;
}

/** The roles of `content/experience` on the track, oldest first, which is the order of the axis. */
export const careerBars: readonly CareerBar[] = [...roles]
  .sort((a, b) => a.span.start - b.span.start)
  .map((role) => {
    const to = role.span.end ?? NOW;
    const start = position(role.span.start);
    const end = position(to);
    const current = role.span.end === null;
    return {
      id: role.id,
      label: role.short,
      employer: role.employer,
      shortTitle: role.shortTitle,
      dates: role.dates,
      name: `${role.employer}, ${role.title}, ${role.dates}${current ? ', current role' : ''}`,
      start,
      end,
      width: end - start,
      months: monthIndex(to) - monthIndex(role.span.start),
      current,
    };
  });

interface Tick {
  /** 0 to 1 along the track. */
  at: number;
  /** The year of a January tick; absent on the ticks of other months. */
  year?: number;
  /** A January that carries a numeral. */
  major: boolean;
}

/** Every year from the axis's first to the last numeral is a multiple of this many years apart. */
const NUMERAL_EVERY = 4;

/** One tick for every month of the axis; Januaries carry the year, every fourth one a numeral. */
export const ticks: readonly Tick[] = (() => {
  const [first, last] = timeline.domain();
  const result: Tick[] = [];
  for (
    let date = new Date(first);
    date.getTime() <= (last?.getTime() ?? 0);
    date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  ) {
    const january = date.getUTCMonth() === 0;
    const year = date.getUTCFullYear();
    result.push({
      at: timeline(date),
      year: january ? year : undefined,
      major: january && (year - TIMELINE_START) % NUMERAL_EVERY === 0,
    });
  }
  return result;
})();

/** The Januaries that carry a numeral. */
export const numerals: readonly Tick[] = ticks.filter((tick) => tick.major);

/** The calendar years the axis opens and closes in, for a caption. */
export const FIRST_YEAR = TIMELINE_START;
export const LAST_YEAR = Math.floor(NOW);
