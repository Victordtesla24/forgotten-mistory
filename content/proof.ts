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
  /** What one mark of the reading stands for, in a few words: the key under the drawing, the same on the card and in the panel. */
  key: string;
  /** The count the figure states beyond what is drawn ("200+", "up to 40"), shown after the key where there is room. */
  bound: string;
  /** The encoding in a sentence, under the enlarged reading in the panel. */
  note: string;
  /** The role in `experience.ts` the figure was earned in. */
  roleId: string;
  /** What the live reading draws: one mark for each of `count`. */
  marks: { count: number };
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
    key: '1 cell = 1 scenario',
    bound: '200+',
    note: 'One cell for each of 200 scenarios. The fill is the effort for one: about 3 hours, falling to about 15 minutes.',
    roleId: 'ato',
    marks: { count: 200 },
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
    key: '1 mark = 1 practitioner',
    bound: 'up to 40',
    note: 'One mark for each practitioner, up to 40, in one run across the portfolio of 5+ squads.',
    roleId: 'anz',
    marks: { count: 40 },
  },
  {
    id: 'telemetry',
    prefix: '',
    value: 10000,
    suffix: '+',
    label: 'concurrent devices',
    scope: 'P95 under 200 ms · ANZ',
    story:
      'Led the technical delivery of AI solutions at ANZ, including real-time WebSocket telemetry servers for 10,000+ concurrent devices. The telemetry cut P95 latency to under 200 ms, improving user response time.',
    key: '1 point = 1 device',
    bound: '10,000+',
    note: 'One point for each of 10,000 concurrent devices, in blocks of 100. The line crosses them in 200 ms, the ceiling on P95 latency.',
    roleId: 'anz',
    marks: { count: 10000 },
  },
];
