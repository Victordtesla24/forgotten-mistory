/**
 * skills.ts — the calibration card's rows.
 *
 * Every real instrument ships with a calibration certificate: what was tested,
 * against what standard, on what date, and — the part that matters — what was
 * *not* tested. That is the correct form for a skills section, and the antidote
 * to the proficiency bar, which is the single least credible object a technical
 * portfolio can contain. Nobody can check a claim that leadership is at 90%.
 *
 * Two rules govern this file:
 *
 *   1. A capability without evidence does not get a row. Not a dimmed row, not
 *      an empty cell — no row.
 *   2. The status is about where the evidence was taken, never about how good
 *      he is at it. `production` means it ran for real users or a real program;
 *      `non-production` means it was measured somewhere that was not; `pending`
 *      means the credential is not yet held and the site says so.
 *
 * Facts trace to public/docs/Vik_Resume_Final.pdf and to the named repositories.
 */

export type EvidenceStatus = 'production' | 'non-production' | 'pending';

/**
 * A place evidence came from. Three kinds, because a reader checks each one
 * differently: a programme is verified by asking the employer, a repository by
 * opening it, a credential by its issuing body.
 */
export type SourceKind = 'programme' | 'repository' | 'credential';

export interface Source {
  id: string;
  label: string;
  kind: SourceKind;
}

/**
 * The sources, in the order they are drawn. This registry exists because the
 * `where` strings cannot be parsed into it — `ATO · Payday Super` contains the
 * same separator that joins two sources elsewhere, so splitting on it would
 * invent an employer called "Payday Super". The link between a capability and
 * its origin is data, and it is authored here rather than guessed at render.
 */
export const sources: Source[] = [
  { id: 'ato', label: 'ATO · Payday Super', kind: 'programme' },
  { id: 'anz', label: 'ANZ Banking Group', kind: 'programme' },
  { id: 'independent', label: 'Independent consulting', kind: 'programme' },
  { id: 'aether', label: 'aether-job-career-agent', kind: 'repository' },
  { id: 'abentertainment', label: 'abentertainment', kind: 'repository' },
  { id: 'this-site', label: 'this site', kind: 'repository' },
  { id: 'public-key-server', label: 'public-key-server', kind: 'repository' },
  { id: 'rectifier', label: 'containerised-birth-time-rectifier', kind: 'repository' },
  { id: 'timeline', label: 'relationship-timeline-feature', kind: 'repository' },
  { id: 'jira-dashboard', label: 'EFDDH-Jira-Analytics-Dashboard', kind: 'repository' },
  { id: 'scrum-alliance', label: 'Scrum Alliance', kind: 'credential' },
  { id: 'monash', label: 'Monash University', kind: 'credential' },
  { id: 'unimelb', label: 'University of Melbourne', kind: 'credential' },
];

export interface Capability {
  capability: string;
  /** The same capability, short enough to label a node. */
  short: string;
  /** What was actually measured. Never an adjective. */
  evidence: string;
  /** Where it was measured — an employer, a program, or a named repository. */
  where: string;
  /** The same, as ids into `sources`. Empty only where there is no evidence yet. */
  sources: string[];
  status: EvidenceStatus;
  /** Optional qualifier printed with the status, for anything that needs one. */
  caveat?: string;
}

export const statusLegend: Record<EvidenceStatus, { glyph: string; label: string }> = {
  production: { glyph: '●', label: 'measured in production' },
  'non-production': { glyph: '◐', label: 'measured outside production' },
  pending: { glyph: '○', label: 'in progress, not yet held' },
};

export const capabilities: Capability[] = [
  {
    capability: 'Mainframe test automation — REXX, SMF, SDSF, PCOMM',
    short: 'Mainframe test automation',
    sources: ['ato'],
    evidence: '200+ SIT/E2E scenarios · ~3 h to ~15 min per scenario',
    where: 'ATO · Payday Super',
    status: 'production',
  },
  {
    capability: 'Agile delivery at programme scale',
    short: 'Agile delivery at scale',
    sources: ['ato'],
    evidence: '8 squads · PI 47–48 · test capacity re-baselined 30 → 90 person-days',
    where: 'ATO · Payday Super',
    status: 'production',
  },
  {
    capability: 'Real-time telemetry platforms',
    short: 'Real-time telemetry',
    sources: ['anz'],
    evidence: '10,000+ concurrent devices held at P95 under 200 ms',
    where: 'ANZ',
    status: 'production',
  },
  {
    capability: 'Cloud-native migration — .NET, Azure',
    short: 'Cloud-native migration',
    sources: ['anz'],
    evidence: '>30% delivery efficiency · >15% infrastructure cost reduction',
    where: 'ANZ',
    status: 'production',
  },
  {
    capability: 'Programme and portfolio management',
    short: 'Programme & portfolio',
    sources: ['anz'],
    evidence: '$5M+ portfolio · 5+ squads · 40+ practitioners onshore and offshore',
    where: 'ANZ',
    status: 'production',
  },
  {
    capability: 'Multi-agent system design — Python, FastAPI, Postgres, Redis',
    short: 'Multi-agent systems',
    sources: ['aether'],
    evidence: '20 agent engines · 22 routers · 4,272 backend tests · live on a VPS',
    where: 'aether-job-career-agent',
    status: 'production',
  },
  {
    capability: 'LLM evaluation and guardrails — Langfuse, Phoenix',
    short: 'LLM eval & guardrails',
    sources: ['independent', 'aether'],
    evidence: '−38% error-budget breaches; entailment guard reverts unsupported claims',
    where: 'Independent · aether-job-career-agent',
    status: 'non-production',
    caveat: 'the −38% was measured against a simulated error budget, not live traffic',
  },
  {
    capability: 'Next.js and TypeScript at production scale',
    short: 'Next.js & TypeScript',
    sources: ['aether'],
    evidence: '39 page routes · 2,326 unit cases · 26 Playwright specs',
    where: 'aether-job-career-agent',
    status: 'production',
  },
  {
    capability: 'Node.js / Express services',
    short: 'Node.js services',
    sources: ['public-key-server'],
    evidence: 'PEM key-distribution service · full Mocha/Chai coverage',
    where: 'public-key-server',
    status: 'production',
  },
  {
    capability: 'Containerised delivery — Docker, systemd, self-hosted CI',
    short: 'Containerised delivery',
    sources: ['aether', 'abentertainment'],
    evidence: 'build → gate → deploy → smoke test → automatic rollback on failure',
    where: 'aether-job-career-agent · abentertainment',
    status: 'production',
  },
  {
    capability: 'Multi-service orchestration — Docker Compose',
    short: 'Service orchestration',
    sources: ['rectifier'],
    evidence: 'gateway, AI service and Redis composed across separate stacks',
    where: 'containerised-birth-time-rectifier',
    status: 'non-production',
    caveat: 'Compose, not Kubernetes — there are no cluster manifests in that repository',
  },
  {
    capability: 'WebGL and GLSL — three.js, React Three Fiber',
    short: 'WebGL & GLSL',
    sources: ['this-site', 'abentertainment'],
    evidence: 'bespoke shaders and scenes, one context per section, no context loss',
    where: 'this site · abentertainment',
    status: 'production',
  },
  {
    capability: 'Data visualisation',
    short: 'Data visualisation',
    sources: ['timeline', 'jira-dashboard'],
    evidence: 'customer-journey timeline in React/TypeScript; sprint-velocity dashboard in Python',
    where: 'relationship-timeline-feature · EFDDH-Jira-Analytics-Dashboard',
    status: 'production',
  },
  {
    capability: 'Certified Scrum Master (CSM)',
    short: 'Certified Scrum Master',
    sources: ['scrum-alliance'],
    evidence: 'Scrum Alliance credential, held',
    where: 'Scrum Alliance',
    status: 'production',
  },
  {
    capability: 'Master of Computer Science (Honours)',
    short: 'MSc Computer Science',
    sources: ['monash'],
    evidence: 'conferred',
    where: 'Monash University',
    status: 'production',
  },
  {
    capability: 'Bachelor of Engineering, Computer Science',
    short: 'BE Computer Science',
    sources: ['unimelb'],
    evidence: 'conferred',
    where: 'University of Melbourne',
    status: 'production',
  },
  {
    capability: 'AWS and GCP certification',
    short: 'AWS & GCP certification',
    sources: [],
    evidence: 'studying; no certificate issued',
    where: '—',
    status: 'pending',
    caveat: 'listed because the CV lists it — saying so is the point of the card',
  },
];

export const skillsContent = {
  kicker: 'Skills & Certifications',
  title: 'Calibration card',
  lede: 'Every instrument ships with a certificate saying what was tested, where, and what was not. This is that certificate. There are no proficiency bars on this page, because nobody can check one.',
  filters: [
    { id: 'all', label: 'Everything' },
    { id: 'production', label: 'Production only' },
    { id: 'pending', label: 'Not yet held' },
  ],
} as const;
