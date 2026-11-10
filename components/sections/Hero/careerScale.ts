import { scaleLinear } from 'd3-scale';

import { NOW, roles, TIMELINE_START } from '@/content/experience';
import { PUBLIC_REPO_COUNT } from '@/content/work';

/** The axis opens on the first year of the career and closes on the last day of the year of `NOW`. */
export const AXIS_MIN = TIMELINE_START;
export const AXIS_MAX = Math.floor(NOW) + 1;

/** Decimal year to a percentage of the axis. Every x position in the panel comes from here. */
export const axisPosition = scaleLinear().domain([AXIS_MIN, AXIS_MAX]).range([0, 100]);

/** Distance between the numbered years. */
export const NUMERAL_STEP = 4;

/** The last year with a numeral on the axis. */
export const LAST_YEAR = Math.floor(NOW);

/** Height of one lane. It is also the touch target of the lane's link. */
export const LANE_HEIGHT = 44;

/** Height and vertical offset of a bar inside its lane. */
export const BAR_HEIGHT = 12;
export const BAR_TOP = (LANE_HEIGHT - BAR_HEIGHT) / 2;

export interface Lane {
  id: string;
  /** The employer as it is labelled beside the bar. */
  label: string;
  employer: string;
  title: string;
  /** The span in months and years, written out in full. */
  dates: string;
  current: boolean;
  /** Left edge and width of the bar, as percentages of the axis. */
  start: number;
  width: number;
  /** Which side of the bar the label sits on: the side with more room. */
  side: 'before' | 'after';
  /** Employer, role and dates: the link's accessible name. */
  name: string;
}

/** The roles of `content/experience`, newest first, positioned on the shared axis. */
export function buildLanes(): Lane[] {
  return roles.map((role) => {
    const from = role.span.start;
    const to = role.span.end ?? NOW;
    const start = axisPosition(from);
    const end = axisPosition(to);
    const current = role.span.end === null;
    return {
      id: role.id,
      label: role.short,
      employer: role.employer,
      title: role.title,
      dates: role.dates,
      current,
      start,
      width: end - start,
      side: start > 100 - end ? 'before' : 'after',
      name: `${role.employer}, ${role.title}, ${role.dates}${current ? ', current role' : ''}`,
    };
  });
}

interface CareerFact {
  value: number;
  label: string;
}

/** Three facts that content already holds: the span of the career, the roles in it and the public repositories. */
export function buildFacts(): CareerFact[] {
  const first = Math.min(...roles.map((role) => role.span.start));
  return [
    { value: Math.floor(NOW - first), label: 'years' },
    { value: roles.length, label: 'roles' },
    { value: PUBLIC_REPO_COUNT, label: 'public repositories' },
  ];
}
