/**
 * The three headline figures. Each carries its label and scope in the same breath, and
 * the story that opens behind it.
 */

export interface HeadlineFigure {
  id: 'evidence' | 'portfolio' | 'telemetry';
  /** Printed before the number, for example "≈" or "$". */
  prefix: string;
  value: number;
  /** Printed after the number, for example "%" or "M+". */
  suffix: string;
  /** What the number measures, in at most five words. */
  label: string;
  /** Where and over what it was measured, in at most six words. */
  scope: string;
  /** Two or three sentences on what was done and where. */
  story: string;
  /** The role in `experience.ts` the figure was earned in. */
  roleId: string;
}

export const headlineFigures: readonly HeadlineFigure[] = [
  {
    id: 'evidence',
    prefix: '≈',
    value: 92,
    suffix: '%',
    label: 'less evidence effort per scenario',
    scope: 'ATO Payday Super · 200+ SIT scenarios',
    story:
      'Architected COBOL/mainframe test-evidence automation for the Payday Super program, covering 200+ SIT/E2E scenarios across all eight squads: ~3 hours to ~15 minutes of evidence effort per scenario. The toolchain (REXX, SMF, SDSF, PCOMM, PowerShell, VBA) needed no new approvals, and a cross-discipline war room agreed the approach in under three hours. It turned an infeasible SIT window, 75+ hours of manual evidence per team against 64 available, into an achievable plan with a six-day tiered harness build, a go/no-go gate and a four-level contingency ladder.',
    roleId: 'ato',
  },
  {
    id: 'portfolio',
    prefix: '$',
    value: 5,
    suffix: 'M+',
    label: 'portfolio across 5+ squads',
    scope: 'ANZ · up to 40 practitioners',
    story:
      'Directed a program portfolio valued at over $5M at ANZ, leading 5+ cross-functional squads and up to 40 practitioners across onshore and offshore teams to on-time, high-quality releases. Defined the technical vision and owned the product backlog for major platform modernisations, at 100% compliance with enterprise architectural standards and risk models.',
    roleId: 'anz',
  },
  {
    id: 'telemetry',
    prefix: '',
    value: 10000,
    suffix: '+',
    label: 'concurrent devices',
    scope: 'P95 under 200 ms · ANZ',
    story:
      'Led AI/ML delivery for critical banking services at ANZ, including real-time WebSocket telemetry servers for 10,000+ concurrent devices. P95 latency came down to under 200 ms, improving user response time.',
    roleId: 'anz',
  },
];
