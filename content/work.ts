/**
 * Six public repositories, chosen from the full set. Each has a one-line value
 * statement and a detail level: what it does, how it works in three stages, its
 * stack, the engineering decisions behind it and its links. Commit counts and first-commit
 * dates were read from each repository's default branch on the date below.
 */

export const PUBLIC_REPO_COUNT = 38;

/** The day the repository statistics were read. */
export const STATS_AS_OF = '2026-11-10';

type SchematicId =
  | 'pipeline-gate'
  | 'rebuild-loop'
  | 'verifier-loop'
  | 'reconstruction-bands'
  | 'diamond-chart'
  | 'static-export';

export interface ProjectStage {
  id: string;
  /** A short noun phrase. */
  label: string;
  /** One sentence. */
  note: string;
}

export interface Schematic {
  id: SchematicId;
  /** What the drawing shows, in a few words. Also its accessible name. */
  label: string;
  /** Always three stages, in the order the work flows. */
  stages: readonly [ProjectStage, ProjectStage, ProjectStage];
}

/** A count the repository states about itself. */
export interface ProjectFigure {
  value: string;
  label: string;
}

export interface RepoStats {
  commits: number;
  /** First commit, ISO date, UTC. */
  firstCommit: string;
}

export interface Project {
  /** Repository name on GitHub. */
  repo: string;
  name: string;
  /** One line of at most 14 words: what it is, then its mechanism. */
  value: string;
  /** One to three words. */
  status: string;
  /** Two sentences. */
  does: readonly [string, string];
  schematic: Schematic;
  /** Languages first, as the repository reports them, then the tools it is built with. */
  stack: readonly string[];
  /** Counts for a small infographic. Empty where the repository states none. */
  figures: readonly ProjectFigure[];
  /** Deliberate design choices, each stated as what the project does. */
  decisions: readonly string[];
  repoHref: string;
  /** A live URL, where one exists and resolves. */
  live?: { label: string; href: string };
  stats: RepoStats;
}

export const projects: readonly Project[] = [
  {
    repo: 'aether-job-career-agent',
    name: 'Aether',
    value: 'Job-application platform; an entailment guard reverts unsupported claims.',
    status: 'Live',
    does: [
      'A multi-agent job-application platform: 20 agent engines behind 22 routers, with a Next.js front end of 39 page routes.',
      'An entailment guard reverts any claim the résumé cannot support.',
    ],
    schematic: {
      id: 'pipeline-gate',
      label: 'Claim guard and revert gate',
      stages: [
        { id: 'claim', label: 'Claim', note: 'A candidate claim enters the support check.' },
        {
          id: 'resume-guard',
          label: 'Résumé guard',
          note: 'An entailment check admits the claims the résumé supports.',
        },
        {
          id: 'revert',
          label: 'Revert',
          note: 'Unsupported output returns to the revert path instead of publishing.',
        },
      ],
    },
    stack: [
      'Python',
      'TypeScript',
      'JavaScript',
      'HTML',
      'FastAPI',
      'Postgres',
      'Redis',
      'Next.js',
      'Docker',
      'systemd',
      'Self-hosted CI',
    ],
    figures: [
      { value: '20', label: 'agent engines' },
      { value: '22', label: 'routers' },
      { value: '39', label: 'page routes' },
      { value: '4,272', label: 'backend tests' },
      { value: '2,326', label: 'unit cases' },
      { value: '26', label: 'Playwright specs' },
    ],
    decisions: [
      'An entailment guard sits between generation and output, so a claim the résumé cannot support reverts.',
      'An unmeasured signal reads “not measured”, never zero.',
      'Releases run build, gate, deploy and smoke test, with automatic rollback on failure.',
      'Production deploys through a separate gated pipeline.',
    ],
    repoHref: 'https://github.com/Victordtesla24/aether-job-career-agent',
    live: { label: 'aether.srv1356245.hstgr.cloud', href: 'https://aether.srv1356245.hstgr.cloud' },
    stats: { commits: 1666, firstCommit: '2026-07-01' },
  },
  {
    repo: 'abentertainment',
    name: 'AB Entertainment',
    value: 'Event-company site and admin portal, deployed on push.',
    status: 'Live',
    does: [
      'The site and admin portal of a live event company, packaged as containers and rebuilt from a repository push.',
      'The repository carries bespoke WebGL shaders and scenes.',
    ],
    schematic: {
      id: 'rebuild-loop',
      label: 'Push to container to site rebuild',
      stages: [
        { id: 'push', label: 'Push', note: 'A repository push starts the rebuild.' },
        {
          id: 'container',
          label: 'Container',
          note: 'The site and admin portal build as containers.',
        },
        { id: 'site', label: 'Site', note: 'The public event-company site is the result.' },
      ],
    },
    stack: [
      'HTML',
      'TypeScript',
      'JavaScript',
      'Shell',
      'WebGL',
      'GLSL',
      'Docker',
      'systemd',
      'Self-hosted CI',
    ],
    figures: [],
    decisions: [
      'Content persists as flat JSON files, sized for a single editor.',
      'Releases run build, gate, deploy and smoke test, with automatic rollback on failure.',
    ],
    repoHref: 'https://github.com/Victordtesla24/abentertainment',
    live: { label: 'abentertainment.com.au', href: 'https://abentertainment.com.au' },
    stats: { commits: 499, firstCommit: '2026-03-28' },
  },
  {
    repo: 'ralph-loop-infinite',
    name: 'Ralph Loop',
    value: 'Agent loop that exits on a signed result.',
    status: 'Verifier-gated',
    does: [
      'An agent loop that repeats a work pass until a verifier confirms that the work passed.',
      'A signed verifier result is the sole exit condition.',
    ],
    schematic: {
      id: 'verifier-loop',
      label: 'Work loop with signed verifier exit',
      stages: [
        { id: 'work', label: 'Work', note: 'The local harness performs a work pass.' },
        { id: 'verifier', label: 'Verifier', note: 'A verifier checks whether the pass passed.' },
        { id: 'exit', label: 'Exit', note: 'A signed verifier result leaves the loop.' },
      ],
    },
    stack: ['Shell', 'Python', 'HTML'],
    figures: [],
    decisions: [
      'A signed verifier result is the sole exit from the loop.',
      'The harness runs in a trusted local environment.',
    ],
    repoHref: 'https://github.com/Victordtesla24/ralph-loop-infinite',
    stats: { commits: 31, firstCommit: '2026-05-19' },
  },
  {
    repo: 'prompt-reconstruction-engine',
    name: 'Prompt Reconstruction',
    value: 'Raw prompts rebuilt into specifications.',
    status: 'Provider failover',
    does: [
      'Rebuilds an operator’s raw prompt into a specification.',
      'When a model declines, provider failover takes over.',
    ],
    schematic: {
      id: 'reconstruction-bands',
      label: 'Prompt reconstruction bands',
      stages: [
        {
          id: 'raw-prompt',
          label: 'Raw prompt',
          note: 'The operator’s original prompt starts the reconstruction.',
        },
        {
          id: 'spec',
          label: 'Specification',
          note: 'The engine reshapes the prompt into a specification.',
        },
        {
          id: 'provider-failover',
          label: 'Provider failover',
          note: 'A model decline hands the request to failover.',
        },
      ],
    },
    stack: ['HTML', 'JavaScript'],
    figures: [],
    decisions: [
      'Provider failover keeps reconstruction running when a model declines.',
      'The operator judges reconstruction quality.',
    ],
    repoHref: 'https://github.com/Victordtesla24/prompt-reconstruction-engine',
    stats: { commits: 34, firstCommit: '2026-06-16' },
  },
  {
    repo: 'jyotish-shastra',
    name: 'Jyotish Shastra',
    value: 'Vedic astrology API that computes positions from ephemeris data.',
    status: 'Accuracy-gated',
    does: [
      'A Vedic astrology API that computes positions from ephemeris data.',
      'An accuracy gate fails the build on drift.',
    ],
    schematic: {
      id: 'diamond-chart',
      label: 'Ephemeris accuracy gate',
      stages: [
        { id: 'ephemeris', label: 'Ephemeris', note: 'Ephemeris data is the accuracy reference.' },
        {
          id: 'gate',
          label: 'Accuracy gate',
          note: 'The build fails on drift beyond the gate.',
        },
        { id: 'positions', label: 'Positions', note: 'The API returns computed positions.' },
      ],
    },
    stack: ['JavaScript', 'CSS', 'Shell', 'TypeScript'],
    figures: [],
    decisions: [
      'An ephemeris accuracy gate fails the build on drift.',
      'Positions are computed; interpretation is out of scope.',
    ],
    repoHref: 'https://github.com/Victordtesla24/jyotish-shastra',
    stats: { commits: 214, firstCommit: '2025-06-24' },
  },
  {
    repo: 'forgotten-mistory',
    name: 'Forgotten Mistory',
    value: 'Static export; one script checks, builds, tests and deploys.',
    status: 'Live',
    does: [
      'A portfolio built as a static export on Firebase Hosting.',
      'Typed content files feed every page, and one release script checks, builds, tests and deploys.',
    ],
    schematic: {
      id: 'static-export',
      label: 'Typed content to static export to gated release',
      stages: [
        {
          id: 'content',
          label: 'Typed content',
          note: 'Content lives in typed TypeScript files.',
        },
        {
          id: 'static',
          label: 'Static export',
          note: 'Next.js exports the pages as static files for Firebase Hosting.',
        },
        {
          id: 'release',
          label: 'Gated release',
          note: 'One script checks, builds, tests, pushes, deploys and verifies the live build.',
        },
      ],
    },
    stack: [
      'TypeScript',
      'JavaScript',
      'CSS',
      'Python',
      'Next.js 15',
      'React 19',
      'Tailwind CSS 4',
      'Firebase Hosting',
    ],
    figures: [],
    decisions: [
      'No analytics and no cookies; a page load writes nothing to storage and contacts one host.',
      'A strict Content-Security-Policy is enforced by an automated test.',
      'Content is typed, and the test suite checks its shape and wording before every release.',
    ],
    repoHref: 'https://github.com/Victordtesla24/forgotten-mistory',
    live: { label: 'forgotten-mistory.web.app', href: 'https://forgotten-mistory.web.app' },
    stats: { commits: 874, firstCommit: '2025-11-25' },
  },
];
