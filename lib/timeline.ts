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
  /** What a bar wide enough adds after the label: the title in four words or fewer, behind a dot. */
  more: string;
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
      more: ` · ${role.shortTitle}`,
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

/**
 * Where a role's name goes. A name that fits inside its bar sits there; one that does not
 * moves to a lane above the bars with a hairline leader down to its bar. The lanes are worked
 * out here, once, for the narrowest width that has lanes at all (`LANE_FROM`): a bar grows with
 * the width and a label does not, so a layout with no collisions at that width has none at any
 * wider one. Labels are set in the mono face at 13 px, 0.6 em to a character, with 6 px of
 * padding each side; below `LANE_FROM` the roles are named by chips instead.
 */
const LANE_FROM = 640;

/** The smallest width, in px, a bar needs to carry its own name: the text, its padding and a pixel of slack. */
export function labelWidth(label: string): number {
  return Math.ceil(label.length * 7.8 + 12 + 1.5);
}

/**
 * The label lengths, in characters, the stylesheet has a width rule for. A label asks for the
 * first one at least as long as itself, so every label's rule is one of these, and `labelWidth`
 * of each is the width the stylesheet names for it, in rem.
 */
const FIT_STEPS = [3, 4, 7, 9, 11, 13, 16, 20, 24, 28] as const;
type FitStep = (typeof FIT_STEPS)[number];

/** The width rule a label of this length uses. */
export function fitStep(label: string): FitStep {
  return FIT_STEPS.find((step) => step >= label.length) ?? 28;
}

/** Space the glyphs of two labels in one lane keep apart, the room a leader keeps from a label it passes, and a label's padding, in px. */
export const LABEL_GAP = 8;
export const LEADER_CLEARANCE = 2;
export const LABEL_PADDING = 6;

interface OutsideLabel {
  id: string;
  /** 0 is the lane next to the bars; each lane above it is one step further. */
  lane: number;
  /** How the label sits against its bar: centred on it, or flush with its left or right edge where centring would leave the track. */
  align: 'start' | 'center' | 'end';
}

interface Placement {
  id: string;
  /** Where the bar's middle, and so the leader, falls at `LANE_FROM`. */
  centre: number;
  /** The label's own extent, padding included, and where its text starts and ends. */
  from: number;
  to: number;
  align: OutsideLabel['align'];
}

/** The labels that cannot sit inside their bars at `LANE_FROM`, with where each would stand at that width. */
function candidates(): Placement[] {
  return careerBars.flatMap((bar) => {
    const need = labelWidth(bar.label);
    if (bar.width * LANE_FROM >= need) return [];
    const centre = ((bar.start + bar.end) / 2) * LANE_FROM;
    const align = centre - need / 2 < 0 ? 'start' : centre + need / 2 > LANE_FROM ? 'end' : 'center';
    const from = align === 'start' ? bar.start * LANE_FROM : align === 'end' ? bar.end * LANE_FROM - need : centre - need / 2;
    return [{ id: bar.id, centre, from, to: from + need, align }];
  });
}

/** Whether two labels in the lanes they were given collide: text on text in one lane, or a leader through the text of a label nearer the bars. */
function collide(a: Placement, laneA: number, b: Placement, laneB: number): boolean {
  if (laneA === laneB) {
    return a.from + LABEL_PADDING < b.to - LABEL_PADDING + LABEL_GAP && b.from + LABEL_PADDING < a.to - LABEL_PADDING + LABEL_GAP;
  }
  const [near, far] = laneA < laneB ? [a, b] : [b, a];
  return far.centre > near.from + LABEL_PADDING - LEADER_CLEARANCE && far.centre < near.to - LABEL_PADDING + LEADER_CLEARANCE;
}

/**
 * Every assignment of the labels to three lanes is tried (there are never more than a few
 * labels): the one with the fewest collisions wins, then the one that uses the fewest lanes,
 * then the one that keeps the labels nearest the bars.
 */
function layoutLabels(): { labels: readonly OutsideLabel[]; lanes: number; conflicts: number } {
  const placed = candidates();
  let best: { lanes: readonly number[]; conflicts: number; top: number; sum: number } | null = null;
  const attempt = (lanes: readonly number[]): void => {
    if (lanes.length === placed.length) {
      let conflicts = 0;
      lanes.forEach((lane, index) => {
        for (let other = index + 1; other < lanes.length; other += 1) {
          const first = placed[index];
          const second = placed[other];
          if (first && second && collide(first, lane, second, lanes[other] ?? 0)) conflicts += 1;
        }
      });
      const top = Math.max(...lanes, 0);
      const sum = lanes.reduce((total, lane) => total + lane, 0);
      const better =
        !best ||
        conflicts < best.conflicts ||
        (conflicts === best.conflicts && (top < best.top || (top === best.top && sum < best.sum)));
      if (better) best = { lanes, conflicts, top, sum };
      return;
    }
    for (let lane = 0; lane < 3; lane += 1) attempt([...lanes, lane]);
  };
  attempt([]);
  const chosen: { lanes: readonly number[]; conflicts: number; top: number } = best ?? { lanes: [], conflicts: 0, top: 0 };
  return {
    labels: placed.map((entry, index) => ({ id: entry.id, lane: chosen.lanes[index] ?? 0, align: entry.align })),
    lanes: placed.length === 0 ? 0 : chosen.top + 1,
    conflicts: chosen.conflicts,
  };
}

const layout = layoutLabels();

/** The roles whose names are set in a lane when their bar is too narrow, and how many lanes there are. */
export const outsideLabels: readonly OutsideLabel[] = layout.labels;
export const LABEL_LANES = layout.lanes;

/** Labels that still collide in the best layout. Zero today; `tests/hero.spec.ts` holds the line as the months pass. */
export const LABEL_CONFLICTS = layout.conflicts;

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
