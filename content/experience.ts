/**
 * The career: eight roles, kept in strict parity with the CV, each with a
 * month-precision span for the timeline and the one figure it is best
 * evidenced by (where the CV states one).
 */

/** Decimal year for a calendar month: `ym(2017, 9)` is September 2017. Month precision is all the CV gives. */
export function ym(year: number, month: number): number {
  return year + (month - 1) / 12;
}

export interface RoleSpan {
  /** Decimal year. */
  start: number;
  /** Decimal year, or `null` for the current role. */
  end: number | null;
}

export interface RoleHeadline {
  value: string;
  label: string;
}

export interface ExperienceRole {
  id: string;
  role: string;
  company: string;
  location: string;
  /** The span exactly as the CV prints it. */
  dates: string;
  span: RoleSpan;
  /** The single figure this role is best evidenced by. Absent where the CV states none. */
  headline: RoleHeadline | null;
  bullets: readonly string[];
}

/**
 * The right-hand edge of every timeline. Fixed rather than read from the clock:
 * the site is a static export, so `new Date()` would freeze at build time
 * anyway. Update it when the CV is updated.
 */
export const NOW = ym(2026, 9); // September 2026

export const TIMELINE_START = 2010;

export const roles: readonly ExperienceRole[] = [
  {
    id: 'ato',
    role: 'Scrum Master / Project Manager — Payday Super Program (NTP & Distribution UI)',
    company: 'Australian Taxation Office (ATO)',
    location: 'Melbourne, VIC',
    dates: 'March 2026 - Present',
    span: { start: ym(2026, 3), end: null },
    headline: { value: '≈92%', label: 'evidence effort removed across 200+ SIT scenarios' },
    bullets: [
      'Lead end-to-end agile delivery for the Agile Kookaburras squad — one of eight squads delivering NTP and Distribution UI capabilities for the ATO’s Payday Super reform — owning sprint cadence, PI planning (PI 47–48), capacity management, and executive status reporting.',
      'Architected the program’s COBOL/mainframe test-evidence automation strategy covering 200+ SIT/E2E scenarios across all eight squads, cutting evidence effort from ~3 hours to ~15 minutes per scenario (≈92% reduction) using a zero-new-approvals toolchain (REXX, SMF, SDSF, PCOMM, PowerShell, VBA).',
      'Converted a mathematically infeasible SIT window — 75+ hours of manual evidence per team against 64 available hours — into an achievable plan through a six-day tiered harness build with a formal go/no-go gate and a four-level contingency ladder.',
      'Convened and facilitated a cross-discipline technical war room that produced a binding automation recommendation in under three hours, securing endorsement without a single new InfoSec approval.',
      'Authored the executive change request re-baselining Payday Super test capacity from 30 to up to 90 person-days, including options analysis, costed recommendation, risk assessment, and full Azure DevOps traceability across 40 scenarios and 11 data tables (AC6–AC19) with STT regression scope.',
      'Unblocked stalled NTP function testing by escalating L2 environment instability and brokering targeted SME enablement, while steering Distribution UI feature delivery to 95%+ completion.',
    ],
  },
  {
    id: 'independent',
    role: 'AI Solutions Consultant — Applied LLM Engineering & Delivery Tooling',
    company: 'Independent AI Consulting & Upskilling',
    location: 'Melbourne, VIC',
    dates: 'Jun 2025 - Feb 2026',
    span: { start: ym(2025, 6), end: ym(2026, 2) },
    headline: {
      value: '−38%',
      label: 'error-budget breaches — measured against a simulated budget, not live traffic',
    },
    bullets: [
      'Architected and developed a Next.js and Supabase analytics dashboard for JIRA to expose sprint velocity metrics and generate LLM-powered retrospective insights.',
      'Built an LLM evaluation stack using Langfuse and Phoenix that reduced simulated error-budget breaches by 38%, alongside a production-grade Node.js/Express public-key server for API signing with full test coverage.',
      "Built 'AI Resume Tailor', an automated NLP system using web scraping and prompt engineering to match CVs to job descriptions instantly.",
      "Created 'AI Gmail Manager', an autonomous TypeScript agent for inbox triage, sentiment analysis, and draft generation using LLMs.",
      "Developed 'Jyotish Shastra' and 'BTR-Demo', enterprise-grade platforms exploring the intersection of ancient Vedic algorithms and modern AI/ML, and a React/TypeScript + D3 customer-journey visualiser.",
      'Creator of the @vicd0ct YouTube channel, producing technical deep-dives on live coding, algorithm archaeology, and telemetry breakdowns.',
    ],
  },
  {
    id: 'anz',
    role: 'Senior Delivery Lead / AI-ML Solutions Architect',
    company: 'ANZ Banking Group',
    location: 'Melbourne, VIC',
    dates: 'Sept 2017 - Jun 2025',
    span: { start: ym(2017, 9), end: ym(2025, 6) },
    headline: { value: '10k+', label: 'concurrent devices at P95 under 200 ms' },
    bullets: [
      'Led the delivery of AI/ML solutions, including real-time WebSocket telemetry sustaining P95 latency under 200 ms across 10,000+ concurrent devices for critical banking services.',
      'Guided the transition of core banking platforms to cloud-native architectures (.NET/Azure), improving delivery efficiency by more than 30% and reducing infrastructure costs by over 15%.',
      'Managed a program portfolio valued at over $5M across 5+ cross-functional squads (up to 40 onsite and offshore practitioners) with 100% compliance to enterprise standards and risk frameworks.',
      'Owned the technical vision and product backlog for platform modernisations; executive workshops for 40+ leaders improved strategic decision clarity by approximately 55%.',
    ],
  },
  {
    id: 'nab',
    role: 'Senior Project Manager & Business Analyst',
    company: 'National Australia Bank (NAB)',
    location: 'Melbourne, VIC',
    dates: 'Nov 2016 - Sept 2017',
    span: { start: ym(2016, 11), end: ym(2017, 9) },
    headline: null,
    bullets: [
      'Managed the delivery of a critical risk-and-compliance program, ensuring regulatory adherence for major enterprise data initiatives.',
    ],
  },
  {
    id: 'microsoft',
    role: 'Lead Business Analyst',
    company: 'Microsoft',
    location: 'Sydney, NSW',
    dates: 'Oct 2015 - Oct 2016',
    span: { start: ym(2015, 10), end: ym(2016, 10) },
    headline: null,
    bullets: [
      'Delivered a gap analysis for Azure ML telemetry that improved system reliability and reduced incident resolution time.',
      'Aligned DevOps strategies with enterprise standards to improve compliance.',
    ],
  },
  {
    id: 'telstra',
    role: 'Business Analyst / Project Coordinator',
    company: 'Telstra',
    location: 'Melbourne, VIC',
    dates: 'Nov 2014 - Oct 2015',
    span: { start: ym(2014, 11), end: ym(2015, 10) },
    headline: null,
    bullets: [
      'Developed customer journey scorecards and streamlined JIRA requirements to improve delivery efficiency and operational clarity.',
    ],
  },
  {
    id: 'infocentric',
    role: 'Senior Business Analyst',
    company: 'InfoCentric',
    location: 'Melbourne, VIC',
    dates: 'Aug 2011 - Nov 2014',
    span: { start: ym(2011, 8), end: ym(2014, 11) },
    headline: null,
    bullets: [
      'Delivered analytics and BI projects that boosted client engagement and automated regulatory reporting.',
    ],
  },
  {
    id: 'myob',
    role: 'Developer Support / Software Testing / Analyst',
    company: 'MYOB',
    location: 'Melbourne, VIC',
    dates: 'May 2010 - Aug 2011',
    span: { start: ym(2010, 5), end: ym(2011, 8) },
    headline: null,
    bullets: [
      'Optimised data processing workflows, improving efficiency and reducing reporting time for financial data sets.',
    ],
  },
];
