/**
 * experience.ts — the career, with its dates made machine-readable.
 *
 * The roles themselves stay in `app/data/siteContent.ts`, which is the single
 * source of truth kept in parity with the CV. This module adds only what the
 * timeline needs and cannot infer from prose: a start and end month per role,
 * and the one figure from each role that a hiring executive would actually ask
 * about. Nothing here restates a fact; if a bullet changes, it changes there.
 */

import { experience, type ExperienceRole } from '../siteContent';

export interface RoleSpan {
  id: string;
  /** Decimal year, e.g. 2017.67 for September 2017. Month precision is all the CV gives. */
  start: number;
  /** Decimal year, or `null` for the current role. */
  end: number | null;
  /** The single figure this role is best evidenced by, or null where the CV states none. */
  headline: { value: string; label: string } | null;
}

/** Month-precision spans, read off the `dates` string of each role in siteContent. */
const SPANS: Record<string, RoleSpan> = {
  ato: {
    id: 'ato',
    start: 2026 + 2 / 12, // March 2026
    end: null,
    headline: { value: '≈92%', label: 'evidence effort removed across 200+ SIT scenarios' },
  },
  independent: {
    id: 'independent',
    start: 2025 + 5 / 12, // June 2025
    end: 2026 + 1 / 12, // February 2026
    headline: {
      value: '−38%',
      label: 'error-budget breaches — measured against a simulated budget, not live traffic',
    },
  },
  anz: {
    id: 'anz',
    start: 2017 + 8 / 12, // September 2017
    end: 2025 + 5 / 12, // June 2025
    headline: { value: '10k+', label: 'concurrent devices at P95 under 200 ms' },
  },
  nab: {
    id: 'nab',
    start: 2016 + 10 / 12, // November 2016
    end: 2017 + 8 / 12,
    headline: null,
  },
  microsoft: {
    id: 'microsoft',
    start: 2015 + 9 / 12, // October 2015
    end: 2016 + 9 / 12,
    headline: null,
  },
  telstra: {
    id: 'telstra',
    start: 2014 + 10 / 12, // November 2014
    end: 2015 + 9 / 12,
    headline: null,
  },
  infocentric: {
    id: 'infocentric',
    start: 2011 + 7 / 12, // August 2011
    end: 2014 + 10 / 12,
    headline: null,
  },
  myob: {
    id: 'myob',
    start: 2010 + 4 / 12, // May 2010
    end: 2011 + 7 / 12,
    headline: null,
  },
};

export interface TimelineRole extends ExperienceRole {
  span: RoleSpan;
  /** Length in years, with the current role measured to `NOW`. */
  years: number;
}

/**
 * The timeline's right-hand edge. Fixed rather than computed from the clock:
 * a static export is built once, so `new Date()` would silently freeze at build
 * time anyway, and a hard-coded, commented constant is the honest version of
 * that. Update it when the CV is updated.
 */
export const NOW = 2026 + 8 / 12; // September 2026

export const TIMELINE_START = 2010;

export const roles: TimelineRole[] = experience.map((role) => {
  const span = SPANS[role.id];
  if (!span) {
    throw new Error(
      `experience.ts: no date span for role "${role.id}". Every role in siteContent needs one.`,
    );
  }
  return { ...role, span, years: (span.end ?? NOW) - span.start };
});

export const experienceContent = {
  kicker: 'Experience',
  title: 'Sixteen years, to scale',
  /**
   * The heading's own arithmetic, printed beside it.
   *
   * The CV's headline says "15+ year"; the roles on it run from May 2010 to the
   * current engagement, which is 16.3 years elapsed and 16.2 years of role
   * spans summed (SPANS above). Both figures are true, so rather than round the
   * page down to a number its own dates contradict, the claim shows its working
   * where a reader can check the subtraction (R-c8 ADV-F-4, R-c13 ADV-6).
   */
  derivation: 'May 2010 → September 2026',
  lede: 'Every bar below is drawn to its real duration — the same dates as the CV, on one axis. The long one in the middle is eight years at ANZ, and it is the reason the rest of this reads the way it does.',
};
