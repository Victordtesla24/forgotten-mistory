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
  /** What the live reading draws: one mark for each of `count`, in `groups` groups. */
  marks: { count: number; groups: number };
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
      'Architected COBOL/mainframe test-evidence automation for 200+ SIT/E2E scenarios across all eight Payday Super squads: ~3 hours to ~15 minutes per scenario. The REXX, SMF, SDSF, PCOMM, PowerShell and VBA toolchain needed no new approvals. Convened a cross-discipline war room that produced a binding automation recommendation in under three hours.',
    roleId: 'ato',
    marks: { count: 200, groups: 1 },
  },
  {
    id: 'portfolio',
    prefix: '$',
    value: 5,
    suffix: 'M+',
    label: 'portfolio across 5+ squads',
    scope: 'ANZ · up to 40 practitioners',
    story:
      'Directed a program portfolio valued at over $5M at ANZ: 5+ cross-functional squads, up to 40 practitioners, onshore and offshore, delivering on-time, high-quality releases. Defined the technical vision and owned the product backlog for major platform modernisations, at 100% compliance with enterprise architectural standards and risk models.',
    roleId: 'anz',
    marks: { count: 40, groups: 5 },
  },
  {
    id: 'telemetry',
    prefix: '',
    value: 10000,
    suffix: '+',
    label: 'concurrent devices',
    scope: 'P95 under 200 ms · ANZ',
    story:
      'Led AI/ML delivery for critical banking services at ANZ, including real-time WebSocket telemetry servers for 10,000+ concurrent devices. The telemetry cut P95 latency to under 200 ms, improving user response time.',
    roleId: 'anz',
    marks: { count: 10000, groups: 1 },
  },
];
