#!/usr/bin/env node
/**
 * Deploy — from a commit, never from a desk.
 *
 * `firebase.json` declares `"predeploy": ["npm run build:static"]`, and that
 * builds the WORKING TREE. On 2026-09-03 a deploy run while another change was
 * mid-edit carried uncommitted source into production and stamped it with a
 * commit that did not contain it, so the live page pointed readers at a commit
 * whose bytes differed from what they were reading
 * (`docs/delivery/evidence/v6-20260903T195241Z/INCIDENT-01-untracked-production.md`).
 *
 * The lesson was not "remember to commit first". It was that the pipeline made
 * forgetting silent. This script makes it loud:
 *
 *   1. Say plainly when tracked files differ from HEAD, so nobody wonders why
 *      production did not change.
 *   2. Refuse if HEAD is not pushed — a deployed commit nobody can fetch is a
 *      commit nobody can check, which defeats the point of stamping it.
 *   3. Build and deploy from a DETACHED WORKTREE at HEAD, so what ships is what
 *      is committed, whatever anyone happens to be editing at the time.
 *   4. Verify after: the live page must carry the commit that was just deployed.
 *
 * Usage:  node scripts/deploy.mjs [--allow-dirty]
 *
 * `--allow-dirty` exists for one case — deploying from a machine that cannot
 * reach the remote — and it relaxes only rule 2. Rules 1, 3 and 4 always hold,
 * and the build stamp independently refuses to name a commit it was not built
 * from, so nothing here can quietly ship an unverifiable page.
 */

import { execFileSync, execSync } from 'node:child_process';
import { existsSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const WORKTREE = '/var/tmp/forgotten-mistory-deploy';
const SITE = 'https://forgotten-mistory.web.app/';
const allowDirty = process.argv.includes('--allow-dirty');

const git = (...args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const die = (message, detail) => {
  console.error(`\nREFUSING TO DEPLOY — ${message}\n`);
  if (detail) console.error(detail + '\n');
  process.exit(1);
};

// ── 1 · The tree must be the commit ────────────────────────────────────────
// `app/data/generated/` and `reports/` are exempt because build:static derives
// both from the commit itself; everything else is hand-edited source.
const BUILD_WRITES = /^app\/data\/generated\/|^reports\//;
const dirty = git('diff', '--name-only', 'HEAD')
  .split('\n')
  .map((p) => p.trim())
  .filter((p) => p && !BUILD_WRITES.test(p));

if (dirty.length > 0) {
  const list = dirty.map((p) => `    ${p}`).join('\n');
  // A warning, not a refusal — and the distinction is the whole design. Step 3
  // builds from a detached worktree at HEAD, so these edits CANNOT reach
  // production no matter what state this tree is in; the hazard is already
  // engineered out. What remains is an expectation gap: someone with local edits
  // probably meant to ship them, and will otherwise wonder why production did
  // not change. Refusing here would block every legitimate deploy made while a
  // colleague has a file open, and a deploy script people route around protects
  // nothing at all.
  console.warn(
    `\nNOTE: ${dirty.length} tracked file(s) differ from HEAD and will NOT be deployed.\n` +
      `Shipping ${shortHeadPreview()} exactly as committed.\n${list}\n`,
  );
}

function shortHeadPreview() {
  return git('rev-parse', '--short=8', 'HEAD');
}

// ── 2 · The commit must be fetchable ───────────────────────────────────────
const head = git('rev-parse', 'HEAD');
const shortHead = git('rev-parse', '--short=8', 'HEAD');
if (!allowDirty) {
  git('fetch', 'origin', '--quiet');
  const remote = git('rev-parse', 'origin/main');
  if (remote !== head) {
    die(
      'HEAD is not what origin/main points at.\n' +
        'The footer stamps every page with its commit and invites a reader to open it. Deploying a\n' +
        'commit nobody can fetch turns that invitation into a dead end.',
      `    HEAD        ${shortHead}\n    origin/main ${remote.slice(0, 8)}`,
    );
  }
}

// ── 3 · Build and ship from a detached worktree at HEAD ────────────────────
console.log(`Deploying ${shortHead} from a clean worktree.`);
if (existsSync(WORKTREE)) {
  execSync(`git worktree remove --force ${WORKTREE}`, { cwd: ROOT, stdio: 'ignore' });
}
git('worktree', 'add', '--detach', '--quiet', WORKTREE, head);
// Symlinked rather than installed: a fresh npm install per deploy costs minutes
// and can resolve different transitive versions than the tree that was tested.
symlinkSync(resolve(ROOT, 'node_modules'), resolve(WORKTREE, 'node_modules'));

try {
  execSync('/usr/bin/firebase deploy --only hosting --project forgotten-mistory', {
    cwd: WORKTREE,
    stdio: 'inherit',
  });
} finally {
  execSync(`git worktree remove --force ${WORKTREE}`, { cwd: ROOT, stdio: 'ignore' });
}

// ── 4 · Verify the live page carries what was just deployed ────────────────
// The deploy command reporting success is testimony; the served bytes are evidence.
await new Promise((r) => setTimeout(r, 5000));
const live = await fetch(SITE).then((r) => r.text());
const stamped = live.match(/commit\/([0-9a-f]{7,40})/)?.[1];

if (!stamped) {
  die(
    'The live page carries no build stamp.\n' +
      'The stamp suppresses itself when the tree it was built from was dirty, so this means the\n' +
      'deployed bytes came from source that no commit contains.',
  );
}
if (!head.startsWith(stamped)) {
  die('The live page names a different commit than the one just deployed.',
    `    deployed ${shortHead}\n    live     ${stamped}`);
}

console.log(`\nVerified: ${SITE} is serving ${stamped}, which is HEAD.`);
