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

export interface Capability {
  capability: string;
  /** What was actually measured. Never an adjective. */
  evidence: string;
  /** Where it was measured — an employer, a program, or a named repository. */
  where: string;
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
    evidence: '200+ SIT/E2E scenarios · ~3 h to ~15 min per scenario',
    where: 'ATO · Payday Super',
    status: 'production',
  },
  {
    capability: 'Agile delivery at programme scale',
    evidence: '8 squads · PI 47–48 · test capacity re-baselined 30 → 90 person-days',
    where: 'ATO · Payday Super',
    status: 'production',
  },
  {
    capability: 'Real-time telemetry platforms',
    evidence: '10,000+ concurrent devices held at P95 under 200 ms',
    where: 'ANZ',
    status: 'production',
  },
  {
    capability: 'Cloud-native migration — .NET, Azure',
    evidence: '>30% delivery efficiency · >15% infrastructure cost reduction',
    where: 'ANZ',
    status: 'production',
  },
  {
    capability: 'Programme and portfolio management',
    evidence: '$5M+ portfolio · 5+ squads · 40+ practitioners onshore and offshore',
    where: 'ANZ',
    status: 'production',
  },
  {
    capability: 'Multi-agent system design — Python, FastAPI, Postgres, Redis',
    evidence: '20 agent engines · 23 routers · 4,272 backend tests · live on a VPS',
    where: 'aether-job-career-agent',
    status: 'production',
  },
  {
    capability: 'LLM evaluation and guardrails — Langfuse, Phoenix',
    evidence: '−38% error-budget breaches; entailment guard reverts unsupported claims',
    where: 'Independent · aether-job-career-agent',
    status: 'non-production',
    caveat: 'the −38% was measured against a simulated error budget, not live traffic',
  },
  {
    capability: 'Next.js and TypeScript at production scale',
    evidence: '39 routes · 151 components · 2,326 unit cases · 26 Playwright specs',
    where: 'aether-job-career-agent',
    status: 'production',
  },
  {
    capability: 'Node.js / Express services',
    evidence: 'PEM key-distribution service · full Mocha/Chai coverage',
    where: 'public-key-server',
    status: 'production',
  },
  {
    capability: 'Containerised delivery — Docker, systemd, self-hosted CI',
    evidence: 'build → gate → deploy → smoke test → automatic rollback on failure',
    where: 'aether-job-career-agent · abentertainment',
    status: 'production',
  },
  {
    capability: 'Kubernetes and Terraform',
    evidence: 'gateway, AI service and Redis manifests authored',
    where: 'containerised-birth-time-rectifier',
    status: 'non-production',
    caveat: 'manifests exist and are reviewed; no cluster of his is running them today',
  },
  {
    capability: 'WebGL and GLSL — three.js, React Three Fiber',
    evidence: 'bespoke shaders and scenes, one context per section, no context loss',
    where: 'this site · abentertainment',
    status: 'production',
  },
  {
    capability: 'Data visualisation — D3, React',
    evidence: 'customer-journey timeline; sprint velocity and LLM retrospectives',
    where: 'relationship-timeline-feature · EFDDH-Jira-Analytics-Dashboard',
    status: 'production',
  },
  {
    capability: 'Certified Scrum Master (CSM)',
    evidence: 'Scrum Alliance credential, held',
    where: 'Scrum Alliance',
    status: 'production',
  },
  {
    capability: 'Master of Computer Science (Honours)',
    evidence: 'conferred',
    where: 'Monash University',
    status: 'production',
  },
  {
    capability: 'Bachelor of Engineering, Computer Science',
    evidence: 'conferred',
    where: 'University of Melbourne',
    status: 'production',
  },
  {
    capability: 'AWS and GCP certification',
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
