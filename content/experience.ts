/**
 * The career: eight roles, kept in strict parity with the CV, each with a
 * month-precision span for the timelines, a one-line summary, the figure it is best
 * known for where the CV states one, and at most four achievement lines.
 */

/** Decimal year for a calendar month: `ym(2017, 9)` is September 2017. Month precision is all the CV gives. */
export function ym(year: number, month: number): number {
  return year + (month - 1) / 12;
}

interface RoleSpan {
  /** Decimal year. */
  start: number;
  /** Decimal year, or `null` for the current role. */
  end: number | null;
}

export interface RoleHeadline {
  value: string;
  /** What the value measures, with its scope inside the same clause. */
  label: string;
}

export interface ExperienceRole {
  id: string;
  title: string;
  employer: string;
  /** The employer as a timeline label. */
  short: string;
  location: string;
  /** The span in months and years, written out in full. */
  dates: string;
  span: RoleSpan;
  /** One line of at most 14 words. */
  summary: string;
  /** The single figure this role is best known for. Absent where the CV states none. */
  headline: RoleHeadline | null;
  /** At most four lines, each an action, its scope and its result. */
  achievements: readonly string[];
}

/**
 * The right-hand edge of every timeline. Fixed rather than read from the clock:
 * the site is a static export, so `new Date()` would freeze at build time
 * anyway. Update it when the CV is updated.
 */
export const NOW = ym(2026, 9); // September 2026

export const TIMELINE_START = 2010;

/** The calendar years a role spans, for a label that has no room for months: "2017–2025". */
export function yearsOf(span: RoleSpan): string {
  const first = Math.floor(span.start);
  return span.end === null ? `${first}–present` : `${first}–${Math.floor(span.end)}`;
}

export const roles: readonly ExperienceRole[] = [
  {
    id: 'ato',
    title: 'Scrum Master / Project Manager, Payday Super (NTP and Distribution UI)',
    employer: 'Australian Taxation Office (ATO)',
    short: 'ATO',
    location: 'Melbourne, VIC',
    dates: 'March 2026 – present',
    span: { start: ym(2026, 3), end: null },
    summary: 'Leads one of eight Payday Super squads and architects program-wide test automation.',
    headline: { value: '≈92%', label: 'less evidence effort across 200+ SIT scenarios' },
    achievements: [
      'Lead the Agile Kookaburras squad, one of eight on the Payday Super reform: sprint cadence, PI planning (PI 47–48), capacity and executive reporting. Unblocked stalled NTP testing through L2 environment escalation and SME enablement; steered Distribution UI delivery to 95%+ completion.',
      'Architected COBOL/mainframe test-evidence automation for 200+ SIT/E2E scenarios across all eight squads: ~3 hours to ~15 minutes per scenario, a ≈92% reduction, on a zero-new-approvals toolchain (REXX, SMF, SDSF, PCOMM, PowerShell, VBA).',
      'Turned an infeasible SIT window (75+ hours of manual evidence per team against 64 available) into an achievable plan: a six-day tiered harness build, a formal go/no-go gate and a four-level contingency ladder, agreed by a cross-discipline war room in under three hours.',
      'Authored the executive change request re-baselining test capacity from 30 to up to 90 person-days, with options analysis, costed recommendation, risk assessment and Azure DevOps traceability across 40 scenarios and 11 data tables (AC6–AC19) with STT regression scope.',
    ],
  },
  {
    id: 'independent',
    title: 'AI Solutions Consultant, Applied LLM Engineering and Delivery Tooling',
    employer: 'Independent AI Consulting and Upskilling',
    short: 'Independent',
    location: 'Melbourne, VIC',
    dates: 'June 2025 – February 2026',
    span: { start: ym(2025, 6), end: ym(2026, 2) },
    summary: 'Applied LLM engineering: evaluation tooling, delivery analytics and autonomous agents.',
    headline: { value: '−38%', label: 'error-budget breaches (simulated budget)' },
    achievements: [
      'Architected a Next.js and Supabase analytics dashboard for JIRA that exposes sprint velocity metrics and generates LLM-powered retrospective insights and sprint plans, and a React/TypeScript visualisation tool with D3 event arcs for customer journeys.',
      'Stood up a Langfuse and Phoenix evaluation stack that scores hallucination, latency and cost across high-volume daily LLM generations: −38% error-budget breaches (simulated budget).',
      'Built a production-grade Node.js/Express service that distributes PEM keys for fleet API signing, with 100% test coverage (Mocha/Chai), and AI Resume Tailor, an NLP system that uses web scraping and prompt engineering to match CVs to job descriptions.',
      'Created AI Gmail Manager, an autonomous TypeScript agent for inbox triage, sentiment analysis and draft generation; developed Jyotish Shastra and BTR-Demo, enterprise-grade platforms joining Vedic algorithms with AI/ML; started the @vicd0ct YouTube channel on live coding, algorithm archaeology and telemetry breakdowns.',
    ],
  },
  {
    id: 'anz',
    title: 'Senior Delivery Lead / AI-ML Solutions Architect',
    employer: 'ANZ Banking Group',
    short: 'ANZ',
    location: 'Melbourne, VIC',
    dates: 'September 2017 – June 2025',
    span: { start: ym(2017, 9), end: ym(2025, 6) },
    summary: 'Delivery lead and AI/ML architect for core banking modernisation and real-time telemetry.',
    headline: { value: '10,000+', label: 'concurrent devices at P95 under 200 ms' },
    achievements: [
      'Led AI/ML delivery for critical banking services from 2022 to 2025, including WebSocket telemetry that held P95 latency under 200 ms across 10,000+ concurrent devices and improved user response time.',
      'Moved core banking platforms from monolith to cloud-native (.NET/Azure) between 2017 and 2022: end-to-end delivery time down by more than 30%, infrastructure cost down by more than 15%.',
      'Directed a program portfolio valued at over $5M across 5+ cross-functional squads and up to 40 practitioners, onshore and offshore, to on-time, high-quality releases.',
      'Owned the technical vision and product backlog for major platform modernisations at 100% compliance with enterprise architectural standards and risk models; workshops for 40+ GMs and executives lifted decision-making efficiency and project clarity by more than 55%.',
    ],
  },
  {
    id: 'nab',
    title: 'Senior Project Manager and Business Analyst',
    employer: 'National Australia Bank (NAB)',
    short: 'NAB',
    location: 'Melbourne, VIC',
    dates: 'November 2016 – September 2017',
    span: { start: ym(2016, 11), end: ym(2017, 9) },
    summary: 'Delivery stream for a critical risk and compliance program.',
    headline: null,
    achievements: [
      'Managed the delivery stream of a critical risk and compliance program at 100% regulatory adherence for major data initiatives, translating complex regulatory requirements into actionable technical specifications for development teams.',
    ],
  },
  {
    id: 'microsoft',
    title: 'Lead Business Analyst',
    employer: 'Microsoft',
    short: 'Microsoft',
    location: 'Sydney, NSW',
    dates: 'October 2015 – October 2016',
    span: { start: ym(2015, 10), end: ym(2016, 10) },
    summary: 'Azure ML telemetry gap analysis and DevOps alignment with enterprise architecture.',
    headline: null,
    achievements: [
      'Executed a gap analysis for Azure ML telemetry that delivered 10 key insights, raised system reliability by 15% and cut incident MTTR by 10%.',
      'Aligned DevOps strategies with overall IT objectives, reaching 95% alignment with enterprise architecture standards.',
    ],
  },
  {
    id: 'telstra',
    title: 'Business Analyst / Project Coordinator',
    employer: 'Telstra',
    short: 'Telstra',
    location: 'Melbourne, VIC',
    dates: 'November 2014 – October 2015',
    span: { start: ym(2014, 11), end: ym(2015, 10) },
    summary: 'Customer-journey scorecards and JIRA requirements for core delivery teams.',
    headline: null,
    achievements: [
      'Developed customer-journey scorecards and streamlined JIRA requirements for core delivery teams, improving delivery efficiency by 20% and operational clarity by 15%.',
    ],
  },
  {
    id: 'infocentric',
    title: 'Senior Business Analyst',
    employer: 'InfoCentric',
    short: 'InfoCentric',
    location: 'Melbourne, VIC',
    dates: 'August 2011 – November 2014',
    span: { start: ym(2011, 8), end: ym(2014, 11) },
    summary: 'Analytics and business intelligence delivery with automated regulatory reporting.',
    headline: null,
    achievements: [
      'Delivered analytics and business intelligence projects that lifted client engagement by 20%, and automated regulatory reporting workflows to 100% accuracy.',
    ],
  },
  {
    id: 'myob',
    title: 'Developer Support / Software Testing / Analyst',
    employer: 'MYOB',
    short: 'MYOB',
    location: 'Melbourne, VIC',
    dates: 'May 2010 – August 2011',
    span: { start: ym(2010, 5), end: ym(2011, 8) },
    summary: 'Developer support, software testing and data-processing optimisation.',
    headline: null,
    achievements: [
      'Optimised data-processing workflows through ePAL implementation, improving efficiency by 30% and cutting reporting time by 90% for financial data sets.',
    ],
  },
];
