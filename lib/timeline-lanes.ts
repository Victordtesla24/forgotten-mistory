/**
 * Where the names of the Experience axis stand. A name that fits inside its bar sits there; one
 * that does not is set in a lane above the bars with a hairline down to its bar. Phones have to
 * name the same eight roles on a track a half to a fifth as wide as a desktop's, so the lanes are
 * worked out once for each of four width classes, at the narrowest width of the class: a bar grows
 * with the width and a name does not, so a layout with no collisions at the start of a class has
 * none anywhere in it. Each name may be centred on its bar or flush with its left or right edge,
 * and the search takes the layout with the fewest lanes, then the fewest flush names. Server
 * only: it is worked out at build time and the stylesheet answers the rest by container width.
 */

import { careerBars, labelWidth, LABEL_GAP, LABEL_PADDING, LEADER_CLEARANCE } from './timeline';

/**
 * The viewport width, in px, at which each class of layout begins. 640 is the first width with a
 * fine pointer and room for the bars to be the controls; from 1280 the names of the short bars
 * stand on one baseline, each centred on the middle of its own bar.
 */
export const LANE_STARTS = [320, 360, 390, 640, 1280] as const;

/** Where the text stands against its bar: -1 flush with the bar's left edge, 0 centred, 1 flush with its right edge. */
type Align = -1 | 0 | 1;

const ALIGNS: readonly Align[] = [0, -1, 1];
const MAX_LANES = 4;

/** A bar's fill sits inside its own edge and border, so a name needs this much more room than its text and padding. */
export const FIT_INSET = 4;

interface LaneLabel {
  id: string;
  /** 0 is the lane next to the bars; each lane above it is one step further. */
  lane: number;
  align: Align;
}

interface LaneLayout {
  /** The viewport width the class starts at. */
  from: number;
  /** How many lanes the class needs; the bars' stylesheet reserves this much height. */
  lanes: number;
  /** The names that do not fit their bars at `from`. At wider widths some of them fit and are drawn inside. */
  labels: readonly LaneLabel[];
}

interface Stand {
  id: string;
  /** Where the leader falls. */
  centre: number;
  /** The label's own extent, padding included. */
  from: number;
  to: number;
}

function standing(id: string, centre: number, start: number, end: number, need: number, align: Align): Stand {
  const from = align === -1 ? start : align === 1 ? end - need : centre - need / 2;
  return { id, centre, from, to: from + need };
}

/** Whether two names in the lanes they were given collide: text on text in one lane, or a leader through the text of a name nearer the bars. */
function collide(a: Stand, laneA: number, b: Stand, laneB: number): boolean {
  if (laneA === laneB) {
    return a.from + LABEL_PADDING < b.to - LABEL_PADDING + LABEL_GAP && b.from + LABEL_PADDING < a.to - LABEL_PADDING + LABEL_GAP;
  }
  const [near, far] = laneA < laneB ? [a, b] : [b, a];
  return far.centre > near.from + LABEL_PADDING - LEADER_CLEARANCE && far.centre < near.to - LABEL_PADDING + LEADER_CLEARANCE;
}

interface Choice {
  stand: Stand;
  lane: number;
  align: Align;
}

/** Fewest lanes, then fewest flush names, then the names nearest the bars. Lower is better. */
function score(choices: readonly Choice[]): [number, number, number] {
  return [
    Math.max(...choices.map((choice) => choice.lane), 0),
    choices.filter((choice) => choice.align !== 0).length,
    choices.reduce((sum, choice) => sum + choice.lane, 0),
  ];
}

function better(a: readonly number[], b: readonly number[]): boolean {
  for (let index = 0; index < a.length; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) < (b[index] ?? 0);
  }
  return false;
}

function layoutAt(width: number): LaneLayout {
  const outside = careerBars.filter((bar) => bar.width * width < labelWidth(bar.label) + FIT_INSET);
  let best: { choices: Choice[]; score: number[] } | null = null;

  const search = (index: number, chosen: Choice[]): void => {
    const bar = outside[index];
    if (!bar) {
      const next = score(chosen);
      if (!best || better(next, best.score)) best = { choices: [...chosen], score: next };
      return;
    }
    const need = labelWidth(bar.label);
    const centre = ((bar.start + bar.end) / 2) * width;
    for (const align of ALIGNS) {
      const stand = standing(bar.id, centre, bar.start * width, bar.end * width, need, align);
      if (stand.from < 0 || stand.to > width) continue;
      for (let lane = 0; lane < MAX_LANES; lane += 1) {
        if (chosen.some((other) => collide(other.stand, other.lane, stand, lane))) continue;
        chosen.push({ stand, lane, align });
        search(index + 1, chosen);
        chosen.pop();
      }
    }
  };
  search(0, []);

  const found = best as { choices: Choice[] } | null;
  if (!found) throw new Error(`The names of the roles cannot be set without a collision on a ${width} px track`);
  return {
    from: width,
    lanes: outside.length === 0 ? 0 : Math.max(...found.choices.map((choice) => choice.lane)) + 1,
    labels: found.choices.map((choice) => ({ id: choice.stand.id, lane: choice.lane, align: choice.align })),
  };
}

/** One layout for each class of width, narrowest first. */
export const laneLayouts: readonly LaneLayout[] = LANE_STARTS.map(layoutAt);
