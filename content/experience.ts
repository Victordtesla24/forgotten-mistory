/**
 * The career: eight roles, kept in strict parity with the CV, each with a
 * month-precision span for the timelines, a short title for the card, a one-line summary,
 * the figure it is best known for where the CV states one, and its achievement lines, one
 * achievement to a line.
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
  /** The title as the CV prints it. */
  title: string;
  /** A second CV title held at the same employer, with its dates. */
  additionalTitle?: string;
  /** The title in four words or fewer, for the card that is always on screen. */
  shortTitle: string;
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
  /** Where there is no figure: the one result the CV states for the role, in at most ten words, which the card leads with. */
  outcome: string | null;
  /** One achievement to a line: an action, its scope and its result, in at most 35 words. */
  achievements: readonly string[];
}

/**
 * The right-hand edge of every timeline: the month the site was built in, so the current
 * role always runs to the present. The site is a static export, so the month is read once,
 * when `next.config.js` is loaded, and inlined as `NEXT_PUBLIC_BUILD_MONTH` ("2026-11");
 * the server render and the browser bundle then always agree. Without it (a script that
 * imports this file directly) it is the current month.
 */
function buildMonth(): number {
  const stamp = /^(\d{4})-(\d{2})$/.exec(process.env.NEXT_PUBLIC_BUILD_MONTH ?? '');
  const today = new Date();
  return stamp
    ? ym(Number(stamp[1]), Number(stamp[2]))
    : ym(today.getUTCFullYear(), today.getUTCMonth() + 1);
}

export const NOW = buildMonth();

export const TIMELINE_START = 2010;

/** The calendar years a role spans, for a label that has no room for months: "2017–2025". */
export function yearsOf(span: RoleSpan): string {
  const first = Math.floor(span.start);
  return span.end === null ? `${first}–present` : `${first}–${Math.floor(span.end)}`;
}

export const roles: readonly ExperienceRole[] = [
  {
    id: 'ato',
    title: 'Scrum Master / Project Manager, Payday Super program (NTP and Distribution UI)',
    shortTitle: 'Scrum Master / PM',
    employer: 'Australian Taxation Office (ATO)',
    short: 'ATO',
    location: 'Melbourne, VIC',
    dates: 'March 2026 – present',
    span: { start: ym(2026, 3), end: null },
    summary: 'Leads one of eight Payday Super squads; architected the program’s test automation.',
    headline: { value: '≈92%', label: 'less evidence effort across 200+ SIT scenarios' },
    outcome: null,
    achievements: [
      'Leads the Kookaburras squad, one of eight squads on the Payday Super program: sprint cadence, PI planning (PI 47–48), capacity management and executive status reporting.',
      'Architected COBOL/mainframe test-evidence automation for 200+ SIT/E2E scenarios across all eight squads: ~3 hours to ~15 minutes per scenario, a ≈92% reduction, on a zero-new-approvals toolchain (REXX, SMF, SDSF, PCOMM, PowerShell, VBA).',
      'Turned an infeasible SIT window (75+ hours of manual evidence per team against 64 available) into an achievable plan: a six-day tiered harness build, a formal go/no-go gate and a four-level contingency ladder.',
      'Authored the executive change request re-baselining Payday Super test capacity from 30 to up to 90 person-days: options analysis, costed recommendation and risk assessment.',
      'The request carried full Azure DevOps traceability across 40 scenarios and 11 data tables (AC6–AC19), with STT regression scope.',
      'Convened a cross-discipline war room that produced a binding automation recommendation in under three hours.',
      'Unblocked stalled NTP function testing through L2 environment escalation and targeted SME enablement, and steered Distribution UI delivery to 95%+ completion.',
    ],
  },
  {
    id: 'independent',
    title: 'AI Solutions Consultant, Applied LLM Engineering and Delivery Tooling',
    shortTitle: 'AI consultant',
    employer: 'Independent AI Consulting and Upskilling',
    short: 'Independent',
    location: 'Melbourne, VIC',
    dates: 'June 2025 – February 2026',
    span: { start: ym(2025, 6), end: ym(2026, 2) },
    summary: 'Applied LLM engineering: evaluation tooling, delivery analytics and autonomous agents.',
    headline: { value: '−38%', label: 'error-budget breaches (in simulation)' },
    outcome: null,
    achievements: [
      'Architected a Next.js and Supabase analytics dashboard for JIRA that exposes sprint velocity metrics and generates LLM-powered retrospective insights and sprint plans.',
      'Developed a React/TypeScript visualisation tool with D3 event arcs that showcases customer-journey interactions.',
      'Stood up a Langfuse and Phoenix evaluation stack that scores hallucination, latency and cost across high-volume daily LLM generations: −38% error-budget breaches (in simulation).',
      'Built a production-grade Node.js/Express service that distributes PEM keys for fleet API signing, with 100% test coverage (Mocha/Chai).',
      'Built AI Resume Tailor, an NLP system that uses web scraping and prompt engineering to match CVs to job descriptions.',
      'Created AI Gmail Manager, an autonomous TypeScript agent for inbox triage, sentiment analysis and draft generation.',
      'Developed Jyotish Shastra, a Vedic astrology API with an ephemeris accuracy gate, and BTR-Demo, which explores Vedic algorithms with AI/ML.',
      'Started the @vicd0ct YouTube channel: technical deep-dives on live coding, algorithm archaeology and telemetry breakdowns.',
    ],
  },
  {
    id: 'anz',
    title: 'Senior Delivery Lead / Technical Product Owner',
    additionalTitle: 'AI/ML Strategy & Solutions Architect, 2017 – 2022',
    shortTitle: 'Senior Delivery Lead',
    employer: 'ANZ',
    short: 'ANZ',
    location: 'Melbourne, VIC',
    dates: 'September 2017 – June 2025',
    span: { start: ym(2017, 9), end: ym(2025, 6) },
    summary: 'Delivery lead and AI/ML architect for core banking modernisation and real-time telemetry.',
    headline: { value: '10,000+', label: 'concurrent devices at P95 under 200 ms' },
    outcome: null,
    achievements: [
      'Led the technical delivery of AI solutions from 2022 to 2025, including real-time WebSocket telemetry servers for 10,000+ concurrent devices that cut P95 latency to under 200 ms and improved user response time.',
      'Moved core banking platforms from monolith to cloud-native (.NET/Azure) between 2017 and 2022: end-to-end delivery time down by more than 30%, infrastructure cost down by more than 15%.',
      'Directed a program portfolio valued at over $5M across 5+ cross-functional squads and up to 40 practitioners, onshore and offshore, to on-time, high-quality releases.',
      'Owned the technical vision and product backlog for major platform modernisations at 100% compliance with enterprise architectural standards and risk models.',
      'Facilitated workshops for 40+ GMs and executives to align on strategy, lifting decision-making efficiency and project clarity by more than 55%.',
    ],
  },
  {
    id: 'nab',
    title: 'Senior Project Manager and Business Analyst',
    shortTitle: 'Senior PM',
    employer: 'National Australia Bank (NAB)',
    short: 'NAB',
    location: 'Melbourne, VIC',
    dates: 'November 2016 – September 2017',
    span: { start: ym(2016, 11), end: ym(2017, 9) },
    summary: 'Delivery stream for a critical risk and compliance program.',
    headline: null,
    outcome: '100% regulatory adherence across major data initiatives',
    achievements: [
      'Managed the delivery stream of a critical risk and compliance program, ensuring 100% regulatory adherence for major data initiatives.',
      'Conducted deep-dive business analysis, translating complex regulatory requirements into actionable technical specifications for development teams.',
    ],
  },
  {
    id: 'microsoft',
    title: 'Lead Business Analyst',
    shortTitle: 'Lead BA',
    employer: 'Microsoft',
    short: 'Microsoft',
    location: 'Sydney, NSW',
    dates: 'October 2015 – October 2016',
    span: { start: ym(2015, 10), end: ym(2016, 10) },
    summary: 'Azure ML telemetry gap analysis and DevOps alignment with enterprise architecture.',
    headline: null,
    outcome: 'Raised reliability 15% and cut incident MTTR 10%',
    achievements: [
      'Executed a gap analysis for Azure ML telemetry that delivered 10 key insights, raised system reliability by 15% and cut incident MTTR by 10%.',
      'Aligned DevOps strategies with overall IT objectives, reaching 95% alignment with enterprise architecture standards.',
    ],
  },
  {
    id: 'telstra',
    title: 'Business Analyst / Project Coordinator',
    shortTitle: 'BA',
    employer: 'Telstra',
    short: 'Telstra',
    location: 'Melbourne, VIC',
    dates: 'November 2014 – October 2015',
    span: { start: ym(2014, 11), end: ym(2015, 10) },
    summary: 'Customer-journey scorecards and JIRA requirements for core delivery teams.',
    headline: null,
    outcome: 'Delivery efficiency up 20%, operational clarity up 15%',
    achievements: [
      'Developed customer-journey scorecards and streamlined JIRA requirements for core delivery teams, improving delivery efficiency by 20% and operational clarity by 15%.',
    ],
  },
  {
    id: 'infocentric',
    title: 'Senior Business Analyst',
    shortTitle: 'Senior BA',
    employer: 'InfoCentric',
    short: 'InfoCentric',
    location: 'Melbourne, VIC',
    dates: 'August 2011 – November 2014',
    span: { start: ym(2011, 8), end: ym(2014, 11) },
    summary: 'Analytics and business intelligence delivery with automated regulatory reporting.',
    headline: null,
    outcome: 'Engagement up 20%; regulatory reporting automated to 100% accuracy',
    achievements: [
      'Delivered analytics and business intelligence projects that lifted client engagement by 20%, and automated regulatory reporting workflows to 100% accuracy.',
    ],
  },
  {
    id: 'myob',
    title: 'Developer Support / Software Testing / Analyst',
    shortTitle: 'Developer support',
    employer: 'MYOB',
    short: 'MYOB',
    location: 'Melbourne, VIC',
    dates: 'May 2010 – August 2011',
    span: { start: ym(2010, 5), end: ym(2011, 8) },
    summary: 'Developer support, software testing and data-processing optimisation.',
    headline: null,
    outcome: 'Reporting time cut 90% on financial data sets',
    achievements: [
      'Optimised data-processing workflows through ePAL implementation, improving efficiency by 30% and cutting reporting time by 90% for financial data sets.',
    ],
  },
];
