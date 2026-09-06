/**
 * vitrine.ts — six repositories, curated.
 *
 * Thirty-eight public repositories exist. Six are shown. That ratio is the
 * point: a vitrine is an editorial act, and a portfolio that lists everything
 * is a directory listing, not a selection.
 *
 * Every metric here is read from app/data/generated/repo-harvest.json, which is
 * produced by scripts/build/harvest_repos.mjs against the real GitHub API and
 * stamped with the date it was taken. Nothing on the plate is typed by hand
 * except the description, the limits line, and the drawing — and the limits
 * line is not optional. A plate that cannot say what its repository does *not*
 * do has not been looked at closely enough to be worth showing.
 */

import { ENGAGEMENT } from '../siteContent';
import harvest from '../generated/repo-harvest.json';

export type DrawingId =
  | 'pipeline-gate'
  | 'rebuild-loop'
  | 'verifier-loop'
  | 'reconstruction-bands'
  | 'diamond-chart'
  | 'scroll-rail';

export interface Plate {
  accession: string;
  repo: string;
  title: string;
  /** At most fourteen words. */
  description: string;
  /** What it does NOT do. Never softened, never omitted. */
  limits: string;
  drawing: DrawingId;
  href: string;
  /** A live URL, where one exists and resolves. */
  live?: { label: string; href: string };
}

export const plates: Plate[] = [
  {
    accession: '01',
    repo: 'aether-job-career-agent',
    title: 'Aether',
    description: 'A job-application platform whose guard reverts any claim your own résumé cannot support.',
    limits: 'The public CI workflow is red on main; production deploys through a separate gated pipeline.',
    drawing: 'pipeline-gate',
    href: 'https://github.com/Victordtesla24/aether-job-career-agent',
    live: { label: 'aether.srv1356245.hstgr.cloud', href: 'https://aether.srv1356245.hstgr.cloud' },
  },
  {
    accession: '02',
    repo: 'abentertainment',
    title: 'AB Entertainment',
    description: 'A live event company’s site and admin portal, containerised and deployed from a push.',
    limits: 'Content persists as flat JSON files, not a database — sized for one editor, not many.',
    drawing: 'rebuild-loop',
    href: 'https://github.com/Victordtesla24/abentertainment',
    live: { label: 'abentertainment.com.au', href: 'https://abentertainment.com.au' },
  },
  {
    accession: '03',
    repo: 'ralph-loop-infinite',
    title: 'Ralph Loop',
    description: 'An agent loop whose only exit is a signed verifier saying the work actually passed.',
    limits: 'A harness for his own machine, not a product; it assumes a trusted local environment.',
    drawing: 'verifier-loop',
    href: 'https://github.com/Victordtesla24/ralph-loop-infinite',
  },
  {
    accession: '04',
    repo: 'prompt-reconstruction-engine',
    title: 'Prompt Reconstruction',
    description: 'Rebuilds a raw prompt into a specification, with provider failover when a model declines.',
    limits: 'Reconstruction quality is judged by the operator; there is no automated benchmark yet.',
    drawing: 'reconstruction-bands',
    href: 'https://github.com/Victordtesla24/prompt-reconstruction-engine',
  },
  {
    accession: '05',
    repo: 'jyotish-shastra',
    title: 'Jyotish Shastra',
    description: 'A Vedic astrology API with an ephemeris accuracy gate that fails the build on drift.',
    limits: 'An engine, not an interpretation: it computes positions and declines to tell fortunes.',
    drawing: 'diamond-chart',
    href: 'https://github.com/Victordtesla24/jyotish-shastra',
  },
  {
    accession: '06',
    repo: 'forgotten-mistory',
    title: 'This site',
    description: 'The page you are reading: static export, one WebGL context per section, no analytics.',
    limits: 'Every figure on it is quoted from a CV or a repository — none is computed live.',
    drawing: 'scroll-rail',
    href: 'https://github.com/Victordtesla24/forgotten-mistory',
    live: { label: 'forgotten-mistory.web.app', href: 'https://forgotten-mistory.web.app' },
  },
];

/**
 * The repositories deliberately left out, and why.
 *
 * This is the strongest content in the section. Naming a repository you
 * excluded — and saying it was for a leaked environment file you committed
 * yourself — is worth more than any repository included, because it proves the
 * six above were chosen rather than swept up.
 */
export const exclusions = [
  { repo: 'vik-legal-defence', reason: 'a personal legal matter; not a work sample' },
  { repo: 'AI-Gmail-Mailbox-Manager', reason: 'an environment file was committed early in its history' },
  { repo: 'Codex · claude-designs', reason: 'scratch workspaces — no reviewable architecture' },
];

export const vitrineContent = {
  kicker: 'What is keeping me busy',
  title: 'Six of thirty-eight',
  lede: 'Thirty-eight public repositories exist. These six are the ones worth your time, each with what it does not do printed beside what it does.',
  harvestedAt: harvest.harvestedAt,
  publicRepoCount: harvest.publicRepoCount,
} as const;

/**
 * The client's route out of the work (G-V2, R4).
 *
 * A business client who has just read six plates had nowhere to finish in this
 * section: the plates end in a source link and a live URL, both of which lead
 * off the site, and the only engagement action on the page sat two sections
 * further down in #listen. The route is the same one #listen offers — a
 * pre-addressed enquiry the visitor's own mail client sends — because there is
 * no booking tool on this account and a calendar link that 404s would be worse
 * than none. Same inbox, same subject line: an enquiry that starts at the work
 * arrives indistinguishable from one that starts at the closing section, which
 * is the point of using one address rather than inventing a second.
 *
 * That last sentence used to be aspirational. This plate carried its own label,
 * its own subject and no body at all, so the two doors promised two different
 * products over one inbox — G-C1. It now spreads the single definition in
 * `siteContent.ts`, byte for byte the plate #listen shows, and `note` is the
 * only thing this section adds (docs/architecture/G-C1-HONEST-CTA.md §7.4;
 * tests/engage_single_product.test.mjs ESP-08).
 */
export const engagement = {
  ...ENGAGEMENT,
  note: 'These six are shipped work. The inbox that answers a role enquiry answers a project brief.',
} as const;

export interface PlateMetric {
  label: string;
  value: string | null;
}

/** The three metrics printed on each plate, read from the harvest. */
export function metricsFor(repo: string): PlateMetric[] {
  const row = (harvest.repos as Record<string, Record<string, unknown>>)[repo];
  if (!row) {
    return [
      { label: 'commits', value: null },
      { label: 'active', value: null },
      { label: 'stack', value: null },
    ];
  }

  const commits = typeof row.commits === 'number' ? row.commits : null;
  const first = typeof row.firstCommit === 'string' ? row.firstCommit : null;
  const last = typeof row.lastPush === 'string' ? row.lastPush : null;
  const languages = Array.isArray(row.languages) ? (row.languages as string[]) : null;

  return [
    { label: 'commits', value: commits === null ? null : commits.toLocaleString() },
    {
      label: 'active',
      value: first && last ? `${first.slice(0, 7)} → ${last.slice(0, 7)}` : null,
    },
    { label: 'stack', value: languages?.length ? languages.slice(0, 3).join(' · ') : null },
  ];
}
