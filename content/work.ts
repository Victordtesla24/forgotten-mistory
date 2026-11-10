/**
 * Six public repositories, chosen from the full set. Every project carries what
 * it does not do next to what it does. Repository statistics were read from the
 * GitHub API on 2026-09-03.
 */

export const PUBLIC_REPO_COUNT = 38;

export type SchematicId =
  | 'pipeline-gate'
  | 'rebuild-loop'
  | 'verifier-loop'
  | 'reconstruction-bands'
  | 'diamond-chart'
  | 'static-export';

export interface SchematicStage {
  id: string;
  label: string;
  note: string;
}

export interface Schematic {
  id: SchematicId;
  /** What the drawing shows, in a few words. */
  label: string;
  /** Text alternative for the drawing. It also states that the drawing is not live activity. */
  caption: string;
  stages: readonly SchematicStage[];
}

export interface RepoStats {
  commits: number;
  /** First commit, ISO date. */
  firstCommit: string;
  /** Last push, ISO date. */
  lastPush: string;
  languages: readonly string[];
}

export interface Project {
  /** Repository name on GitHub. */
  repo: string;
  title: string;
  description: string;
  /** What it does NOT do. Never softened, never omitted. */
  limits: string;
  repoHref: string;
  /** A live URL, where one exists and resolves. */
  live?: { label: string; href: string };
  schematic: Schematic;
  stats: RepoStats;
}

export const projects: readonly Project[] = [
  {
    repo: 'aether-job-career-agent',
    title: 'Aether',
    description:
      'A job-application platform whose guard reverts any claim your own résumé cannot support.',
    limits:
      'The public CI workflow is red on main; production deploys through a separate gated pipeline.',
    repoHref: 'https://github.com/Victordtesla24/aether-job-career-agent',
    live: { label: 'aether.srv1356245.hstgr.cloud', href: 'https://aether.srv1356245.hstgr.cloud' },
    schematic: {
      id: 'pipeline-gate',
      label: 'Claim guard and revert gate',
      caption:
        'Schematic · not live activity. Claim text passes through a résumé support guard; unsupported output returns to a revert path.',
      stages: [
        { id: 'claim', label: 'claim', note: 'A candidate claim enters the support check.' },
        {
          id: 'resume-guard',
          label: 'résumé guard',
          note: 'The guard only allows claims supported by the résumé.',
        },
        {
          id: 'revert',
          label: 'revert',
          note: 'Unsupported claims are returned, not published as evidence.',
        },
      ],
    },
    stats: {
      commits: 1664,
      firstCommit: '2026-07-01',
      lastPush: '2026-09-02',
      languages: ['Python', 'TypeScript', 'HTML', 'JavaScript'],
    },
  },
  {
    repo: 'abentertainment',
    title: 'AB Entertainment',
    description:
      'A live event company’s site and admin portal, containerised and deployed from a push.',
    limits: 'Content persists as flat JSON files, not a database — sized for one editor, not many.',
    repoHref: 'https://github.com/Victordtesla24/abentertainment',
    live: { label: 'abentertainment.com.au', href: 'https://abentertainment.com.au' },
    schematic: {
      id: 'rebuild-loop',
      label: 'Push to container to site rebuild',
      caption:
        'Schematic · not live activity. A push rebuilds the containerised site/admin path and returns to the published site.',
      stages: [
        { id: 'push', label: 'push', note: 'A repository push begins the rebuild path.' },
        {
          id: 'container',
          label: 'container',
          note: 'The site and admin portal are packaged as containers.',
        },
        { id: 'site', label: 'site', note: 'The public event-company site is the endpoint.' },
      ],
    },
    stats: {
      commits: 243,
      firstCommit: '2026-03-13',
      lastPush: '2026-08-06',
      languages: ['HTML', 'TypeScript', 'JavaScript', 'Shell'],
    },
  },
  {
    repo: 'ralph-loop-infinite',
    title: 'Ralph Loop',
    description:
      'An agent loop whose only exit is a signed verifier saying the work actually passed.',
    limits:
      'A harness for his own machine, not a product; it assumes a trusted local environment.',
    repoHref: 'https://github.com/Victordtesla24/ralph-loop-infinite',
    schematic: {
      id: 'verifier-loop',
      label: 'Work loop with signed verifier exit',
      caption:
        'Schematic · not live activity. Work loops until the verifier signs an exit condition.',
      stages: [
        { id: 'work', label: 'work', note: 'The local harness performs another work pass.' },
        {
          id: 'verifier',
          label: 'verifier',
          note: 'The verifier checks whether the pass actually passed.',
        },
        { id: 'exit', label: 'exit', note: 'Only a signed verifier result leaves the loop.' },
      ],
    },
    stats: {
      commits: 31,
      firstCommit: '2026-05-19',
      lastPush: '2026-05-20',
      languages: ['Shell', 'Python', 'HTML'],
    },
  },
  {
    repo: 'prompt-reconstruction-engine',
    title: 'Prompt Reconstruction',
    description:
      'Rebuilds a raw prompt into a specification, with provider failover when a model declines.',
    limits:
      'Reconstruction quality is judged by the operator; there is no automated benchmark yet.',
    repoHref: 'https://github.com/Victordtesla24/prompt-reconstruction-engine',
    schematic: {
      id: 'reconstruction-bands',
      label: 'Prompt reconstruction bands',
      caption:
        'Schematic · not live activity. A raw prompt is reconstructed into a specification, with provider failover when a model declines.',
      stages: [
        {
          id: 'raw-prompt',
          label: 'raw prompt',
          note: 'The operator’s original prompt starts the reconstruction.',
        },
        {
          id: 'spec',
          label: 'specification',
          note: 'The engine reshapes the prompt into a specification.',
        },
        {
          id: 'provider-failover',
          label: 'provider failover',
          note: 'A model decline routes to provider failover.',
        },
      ],
    },
    stats: {
      commits: 34,
      firstCommit: '2026-06-16',
      lastPush: '2026-06-26',
      languages: ['HTML', 'JavaScript'],
    },
  },
  {
    repo: 'jyotish-shastra',
    title: 'Jyotish Shastra',
    description:
      'A Vedic astrology API with an ephemeris accuracy gate that fails the build on drift.',
    limits:
      'An engine, not an interpretation: it computes positions and declines to tell fortunes.',
    repoHref: 'https://github.com/Victordtesla24/jyotish-shastra',
    schematic: {
      id: 'diamond-chart',
      label: 'Ephemeris accuracy gate',
      caption:
        'Schematic · not live activity. The API computes positions and applies an ephemeris accuracy gate; this is not an astrological reading.',
      stages: [
        { id: 'ephemeris', label: 'ephemeris', note: 'Ephemeris data is the accuracy reference.' },
        { id: 'gate', label: 'accuracy gate', note: 'The build fails on drift beyond the gate.' },
        {
          id: 'positions',
          label: 'positions',
          note: 'The output is computed positions, not fortune-telling.',
        },
      ],
    },
    stats: {
      commits: 214,
      firstCommit: '2025-06-24',
      lastPush: '2025-11-10',
      languages: ['JavaScript', 'CSS', 'Shell', 'TypeScript'],
    },
  },
  {
    repo: 'forgotten-mistory',
    title: 'This site',
    description: 'The page you are reading: static export, no analytics.',
    limits: 'Every figure on it is quoted from a CV or a repository — none is computed live.',
    repoHref: 'https://github.com/Victordtesla24/forgotten-mistory',
    live: { label: 'forgotten-mistory.web.app', href: 'https://forgotten-mistory.web.app' },
    schematic: {
      id: 'static-export',
      label: 'Static export with quoted figures',
      caption:
        'Schematic · not live activity. The page is shipped as a static export and its figures are quoted from source records; nothing is computed live for the reader.',
      stages: [
        { id: 'static', label: 'static export', note: 'The page is shipped as a static export.' },
        {
          id: 'quoted',
          label: 'quoted figures',
          note: 'The figures are quoted from source records, not live telemetry.',
        },
      ],
    },
    stats: {
      commits: 205,
      firstCommit: '2025-11-25',
      lastPush: '2026-09-03',
      languages: ['TypeScript', 'JavaScript', 'CSS', 'Python'],
    },
  },
];
