/**
 * harvest_repos.mjs — reads the real numbers off the vitrine's repositories.
 *
 * Run by hand, not by the build. The metrics printed in "What is keeping me
 * busy" are dated rather than live, for two reasons: a static site cannot query
 * the GitHub API at request time anyway, and a build that depends on a network
 * call is a build that fails for reasons that have nothing to do with the code.
 * So the numbers are harvested once, stamped with the date they were taken, and
 * the page says so on its face.
 *
 * Anything the API declines to give is written as `null` and rendered on the
 * page as an open caliper reading "not harvested" — never quietly omitted, and
 * never guessed.
 *
 * Usage:  node scripts/build/harvest_repos.mjs          (needs an authenticated `gh`)
 * Writes: app/data/generated/repo-harvest.json
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const OWNER = 'Victordtesla24';
const REPOS = [
  'aether-job-career-agent',
  'abentertainment',
  'ralph-loop-infinite',
  'prompt-reconstruction-engine',
  'jyotish-shastra',
  'forgotten-mistory',
];

const OUT = join(process.cwd(), 'app', 'data', 'generated', 'repo-harvest.json');

/** One `gh api` call. Returns null rather than throwing: a missing metric is a fact. */
function gh(path, jq) {
  try {
    const args = ['api', path];
    if (jq) args.push('--jq', jq);
    return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    console.warn(`  ! ${path} → ${String(error.stderr || error.message).split('\n')[0]}`);
    return null;
  }
}

/** Total commits, read from the last page of the paginated commit list. */
function commitCount(repo) {
  try {
    const headers = execFileSync(
      'gh',
      ['api', '-i', `repos/${OWNER}/${repo}/commits?per_page=1`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const link = headers.split('\n').find((l) => l.toLowerCase().startsWith('link:'));
    const last = link?.match(/[?&]page=(\d+)>; rel="last"/);
    return last ? Number(last[1]) : null;
  } catch {
    return null;
  }
}

const harvestedAt = new Date().toISOString().slice(0, 10);
const repos = {};

for (const repo of REPOS) {
  process.stdout.write(`harvesting ${repo}\n`);
  const meta = gh(
    `repos/${OWNER}/${repo}`,
    '{pushed:.pushed_at, created:.created_at, size:.size, lang:.language, stars:.stargazers_count, issues:.open_issues_count, homepage:.homepage}',
  );
  const languages = gh(`repos/${OWNER}/${repo}/languages`);
  const parsed = meta ? JSON.parse(meta) : {};

  repos[repo] = {
    commits: commitCount(repo),
    firstCommit: parsed.created ? parsed.created.slice(0, 10) : null,
    lastPush: parsed.pushed ? parsed.pushed.slice(0, 10) : null,
    primaryLanguage: parsed.lang ?? null,
    languages: languages ? Object.keys(JSON.parse(languages)).slice(0, 4) : null,
    sizeKb: parsed.size ?? null,
    openIssues: parsed.issues ?? null,
    homepage: parsed.homepage || null,
  };
}

const total = gh(`users/${OWNER}/repos?per_page=100&type=owner`, 'length');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  `${JSON.stringify({ harvestedAt, publicRepoCount: total ? Number(total) : null, repos }, null, 2)}\n`,
  'utf8',
);
console.log(`\nwrote ${OUT} — harvested ${harvestedAt}, ${Object.keys(repos).length} repositories`);
