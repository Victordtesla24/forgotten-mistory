/**
 * Seventeen entries in five domains: sixteen held, and one certification in progress that
 * its label says is in progress. Each has a label of at most five words and a detail line
 * saying where it was applied and with what outcome, linked by id to the program,
 * repository or credential behind it. A result obtained in simulation, and work done
 * outside production, say so inside their own sentences.
 *
 * Facts trace to public/docs/Vik_Resume_Final.pdf and to the named repositories.
 */

/**
 * A place a capability was applied. A program is verified by asking the employer, a
 * repository by opening it, a credential by its issuing body.
 */
type SourceKind = 'program' | 'repository' | 'credential';

export interface Source {
  id: string;
  label: string;
  kind: SourceKind;
  /** The role or project that tells the full story, where the site has one. */
  link?: { type: 'role'; id: string } | { type: 'project'; id: string };
}

/** The sources, in drawing order. */
export const sources: readonly Source[] = [
  { id: 'ato', label: 'ATO Payday Super', kind: 'program', link: { type: 'role', id: 'ato' } },
  { id: 'anz', label: 'ANZ', kind: 'program', link: { type: 'role', id: 'anz' } },
  {
    id: 'independent',
    label: 'Independent consulting',
    kind: 'program',
    link: { type: 'role', id: 'independent' },
  },
  {
    id: 'aether',
    label: 'aether-job-career-agent',
    kind: 'repository',
    link: { type: 'project', id: 'aether-job-career-agent' },
  },
  {
    id: 'abentertainment',
    label: 'abentertainment',
    kind: 'repository',
    link: { type: 'project', id: 'abentertainment' },
  },
  { id: 'public-key-server', label: 'public-key-server', kind: 'repository' },
  { id: 'rectifier', label: 'containerised-birth-time-rectifier', kind: 'repository' },
  { id: 'timeline', label: 'relationship-timeline-feature', kind: 'repository' },
  { id: 'jira-dashboard', label: 'EFDDH-Jira-Analytics-Dashboard', kind: 'repository' },
  { id: 'scrum-alliance', label: 'Scrum Alliance', kind: 'credential' },
  { id: 'monash', label: 'Monash University', kind: 'credential' },
  { id: 'unimelb', label: 'University of Melbourne', kind: 'credential' },
];

export interface Domain {
  id: string;
  name: string;
}

export const domains: readonly Domain[] = [
  { id: 'delivery', name: 'Delivery leadership' },
  { id: 'ai', name: 'AI systems' },
  { id: 'platform', name: 'Cloud and platform' },
  { id: 'product', name: 'Product engineering' },
  { id: 'qualifications', name: 'Qualifications' },
];

export interface Capability {
  id: string;
  /** A noun phrase of at most five words. */
  label: string;
  domain: Domain['id'];
  /** Where it was applied and the outcome. */
  detail: string;
  /** Ids into `sources`. */
  sources: readonly string[];
}

export const capabilities: readonly Capability[] = [
  {
    id: 'agile-delivery',
    label: 'Agile delivery at scale',
    domain: 'delivery',
    detail:
      'At the ATO, leads the Agile Kookaburras, one of eight Payday Super squads, and owns its PI planning (PI 47–48). Authored the change request that re-baselined test capacity from 30 to up to 90 person-days.',
    sources: ['ato'],
  },
  {
    id: 'portfolio',
    label: 'Program and portfolio management',
    domain: 'delivery',
    detail:
      'At ANZ, a $5M+ portfolio across 5+ squads and up to 40 practitioners, onshore and offshore.',
    sources: ['anz'],
  },
  {
    id: 'mainframe-automation',
    label: 'Mainframe test automation',
    domain: 'delivery',
    detail:
      'At the ATO, REXX, SMF, SDSF and PCOMM automation took evidence effort from ~3 hours to ~15 minutes per scenario across 200+ SIT/E2E scenarios.',
    sources: ['ato'],
  },
  {
    id: 'csm',
    label: 'Certified Scrum Master',
    domain: 'delivery',
    detail: 'Certified Scrum Master (CSM), Scrum Alliance.',
    sources: ['scrum-alliance'],
  },
  {
    id: 'multi-agent',
    label: 'Multi-agent systems',
    domain: 'ai',
    detail:
      'aether-job-career-agent: 20 agent engines and 22 routers on Python, FastAPI, Postgres and Redis, with 4,272 backend tests, live on a VPS.',
    sources: ['aether'],
  },
  {
    id: 'llm-evaluation',
    label: 'LLM evaluation and guardrails',
    domain: 'ai',
    detail:
      'A Langfuse and Phoenix evaluation stack cut error-budget breaches by 38% in simulation; in Aether, an entailment guard reverts unsupported claims.',
    sources: ['independent', 'aether'],
  },
  {
    id: 'telemetry',
    label: 'Real-time telemetry',
    domain: 'ai',
    detail: 'At ANZ, WebSocket telemetry cut P95 latency to under 200 ms across 10,000+ concurrent devices.',
    sources: ['anz'],
  },
  {
    id: 'cloud-migration',
    label: 'Cloud-native migration',
    domain: 'platform',
    detail:
      'At ANZ, core banking platforms moved from monolith to .NET/Azure: end-to-end delivery time down by more than 30%, infrastructure cost down by more than 15%.',
    sources: ['anz'],
  },
  {
    id: 'containerised-delivery',
    label: 'Containerised delivery',
    domain: 'platform',
    detail:
      'aether-job-career-agent and abentertainment: Docker, systemd and self-hosted CI run build, gate, deploy and smoke test, with automatic rollback on failure.',
    sources: ['aether', 'abentertainment'],
  },
  {
    id: 'orchestration',
    label: 'Service orchestration',
    domain: 'platform',
    detail:
      'containerised-birth-time-rectifier: a gateway, an AI service and Redis composed with Docker Compose across separate stacks (non-production).',
    sources: ['rectifier'],
  },
  {
    id: 'node-services',
    label: 'Node.js services',
    domain: 'platform',
    detail:
      'public-key-server: a Node.js/Express service that distributes PEM keys for fleet API signing, with 100% test coverage (Mocha/Chai).',
    sources: ['public-key-server'],
  },
  {
    id: 'cloud-certification',
    label: 'AWS and GCP (in progress)',
    domain: 'platform',
    detail: 'Cloud and data certifications with AWS and GCP are in progress.',
    sources: [],
  },
  {
    id: 'nextjs',
    label: 'Next.js and TypeScript',
    domain: 'product',
    detail: 'aether-job-career-agent: 39 page routes, 2,326 unit cases and 26 Playwright specs.',
    sources: ['aether'],
  },
  {
    id: 'webgl',
    label: 'WebGL and GLSL',
    domain: 'product',
    detail: 'abentertainment: bespoke shaders and scenes.',
    sources: ['abentertainment'],
  },
  {
    id: 'data-visualisation',
    label: 'Data visualisation',
    domain: 'product',
    detail:
      'relationship-timeline-feature: a customer-journey timeline in React/TypeScript with D3 event arcs. EFDDH-Jira-Analytics-Dashboard: a sprint-velocity dashboard in Python.',
    sources: ['timeline', 'jira-dashboard'],
  },
  {
    id: 'msc',
    label: 'Master of Computer Science (Honours)',
    domain: 'qualifications',
    detail: 'Monash University.',
    sources: ['monash'],
  },
  {
    id: 'be',
    label: 'Bachelor of Engineering, Computer Science',
    domain: 'qualifications',
    detail: 'University of Melbourne.',
    sources: ['unimelb'],
  },
];
