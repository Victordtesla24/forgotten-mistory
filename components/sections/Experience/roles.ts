import { roles, TIMELINE_START, yearsOf, type RoleHeadline } from '@/content/experience';
import { careerBars } from '@/lib/timeline';

/** A role as the timeline's controls and card need it: plain data, so it can cross to the browser. */
export interface RoleView {
  id: string;
  /** The employer as a timeline label. */
  label: string;
  employer: string;
  shortTitle: string;
  /** The span in months and years, written out in full. */
  dates: string;
  /** The calendar years the span covers: "2017–2025". */
  years: string;
  /** The length of the role, worked out from its dates: "7 years 9 months". */
  duration: string;
  /** The one line a card shows when the role has no figure. */
  summary: string;
  headline: RoleHeadline | null;
  /** Where there is no figure: the one result the CV states, which the card leads with. */
  outcome: string | null;
  /** The role's first month and its length, counted in months from January of the axis's first year. */
  from: number;
  months: number;
  /** Left and right edges and middle on the track, 0 to 1. */
  start: number;
  end: number;
  centre: number;
  current: boolean;
  /** The id of the panel that opens this role. */
  panel: string;
}

/** "7 years 9 months", "1 year", "8 months". */
function durationOf(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [
    years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : '',
    rest > 0 ? `${rest} ${rest === 1 ? 'month' : 'months'}` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

/** The eight roles in date order, which is the order of the axis, the tabs and the row. */
export const roleViews: readonly RoleView[] = careerBars.flatMap((bar) => {
  const role = roles.find((entry) => entry.id === bar.id);
  if (!role) return [];
  return [
    {
      id: role.id,
      label: role.short,
      employer: role.employer,
      shortTitle: role.shortTitle,
      dates: role.dates,
      years: yearsOf(role.span),
      duration: durationOf(bar.months),
      summary: role.summary,
      headline: role.headline,
      outcome: role.outcome,
      from: Math.round((role.span.start - TIMELINE_START) * 12),
      months: bar.months,
      start: bar.start,
      end: bar.end,
      centre: (bar.start + bar.end) / 2,
      current: bar.current,
      panel: `role-${role.id}-detail`,
    },
  ];
});
