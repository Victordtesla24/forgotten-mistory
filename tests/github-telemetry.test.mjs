/**
 * Unit tests for lib/githubTelemetry.ts — the shared GitHub store.
 *
 * Run: node --test tests/github-telemetry.test.mjs   (no browser, no dev server)
 *
 * Guards the 2026-08-09 production defect: two unauthenticated api.github.com
 * repository requests per page load, both answering 403 "API rate limit
 * exceeded" (the limit is per IP, so it is shared with every other visitor
 * behind it). A browser-side token is not an option — it would be readable by
 * every visitor — so the store must instead never spend a request it knows will
 * be rejected, and must degrade to real committed data rather than to an error
 * or to invented numbers.
 *
 * The module is transpiled with the repo's own TypeScript into the OS temp dir
 * and driven with stubbed `react`, `fetch` and `localStorage`. Nothing is
 * written inside the repository.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ts = createRequire(join(REPO_ROOT, 'package.json'))('typescript');

const workDir = mkdtempSync(join(tmpdir(), 'github-telemetry-'));
writeFileSync(
  join(workDir, 'react.mjs'),
  'export function useSyncExternalStore(subscribe, getSnapshot) {\n' +
    '  subscribe(() => {});\n' +
    '  return getSnapshot();\n' +
    '}\n',
);

const modulePath = join(workDir, 'githubTelemetry.mjs');
writeFileSync(
  modulePath,
  ts
    .transpileModule(readFileSync(join(REPO_ROOT, 'lib', 'githubTelemetry.ts'), 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
    })
    .outputText.replace("from 'react'", `from ${JSON.stringify(pathToFileURL(join(workDir, 'react.mjs')).href)}`),
);

// --- stubs -----------------------------------------------------------------

const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  },
};

let calls = [];
function stubFetch(handler) {
  calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    return handler(url);
  };
}
const repoCalls = () => calls.filter((u) => u.includes('/repos'));

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});
const rateLimit = (remaining) =>
  response(200, {
    resources: { core: { limit: 60, remaining, reset: Math.floor(Date.now() / 1000) + 3600 } },
  });
const forbidden = () => response(403, { message: 'API rate limit exceeded for 203.0.113.9.' });

const LIVE_REPO = {
  name: 'live-alpha',
  html_url: 'https://github.com/Victordtesla24/live-alpha',
  description: 'alpha',
  language: 'Go',
  stargazers_count: 7,
  open_issues_count: 2,
  forks_count: 1,
  pushed_at: '2026-08-01T00:00:00Z',
};

// A fresh module instance per scenario: the store resolves exactly once per load.
let instance = 0;
async function resolveStore() {
  const mod = await import(`${pathToFileURL(modulePath).href}?i=${instance++}`);
  mod.useGithubStats(); // subscribes, which starts the resolve
  await new Promise((done) => setTimeout(done, 20));
  return { mod, stats: mod.useGithubStats() };
}

// --- tests -----------------------------------------------------------------

test('spent budget: no repository request is issued, so nothing 4xx-es', async () => {
  storage.clear();
  stubFetch((url) => (url.includes('/rate_limit') ? rateLimit(0) : forbidden()));

  const { mod, stats } = await resolveStore();

  assert.deepEqual(repoCalls(), [], 'must not call the repository endpoint');
  assert.equal(stats.source, 'snapshot');
  assert.equal(stats.loading, false);
  assert.match(mod.githubSourceLabel(stats), /^Snapshot · GitHub public repos, as of /);
  assert.doesNotMatch(mod.githubSourceLabel(stats), /live/i, 'dated data must not claim to be live');
  assert.ok(
    Number(storage.get('github-telemetry-retry-after')) > Date.now(),
    'the refill time must be remembered',
  );
});

test('fallback numbers are the committed snapshot, not fabricated', async () => {
  storage.clear();
  stubFetch((url) => (url.includes('/rate_limit') ? rateLimit(0) : forbidden()));

  const { stats } = await resolveStore();

  // Every aggregate is the sum of the committed rows — never an estimate.
  const sum = (pick) => stats.repos.reduce((total, repo) => total + pick(repo), 0);
  assert.equal(stats.repoCount, stats.repos.length);
  assert.equal(stats.totalStars, sum((r) => r.stars));
  assert.equal(stats.totalOpenIssues, sum((r) => r.openIssues));
  assert.equal(stats.totalForks, sum((r) => r.forks));
  assert.ok(stats.repos.length > 0, 'snapshot must hold real repositories');
  for (const repo of stats.repos) {
    assert.equal(repo.htmlUrl, `https://github.com/Victordtesla24/${repo.name}`);
    assert.ok(Number.isInteger(repo.stars) && repo.stars >= 0);
    assert.match(repo.pushedAt, /^\d{4}-\d{2}-\d{2}T/);
  }
  // Newest push first, so the feed's slice is genuinely "most recently pushed".
  const pushed = stats.repos.map((r) => r.pushedAt);
  assert.deepEqual(pushed, [...pushed].sort().reverse());
});

test('a 403 on every endpoint degrades without rejecting', async () => {
  storage.clear();
  stubFetch(forbidden);

  const { stats } = await resolveStore();

  assert.equal(stats.source, 'snapshot');
  assert.equal(calls.length, 1, 'only the free rate-limit probe is attempted');
  assert.ok(stats.repos.length > 0);
});

test('a transport failure degrades without rejecting', async () => {
  storage.clear();
  stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));

  const { stats } = await resolveStore();

  assert.equal(stats.source, 'snapshot');
  assert.ok(stats.repos.length > 0);
});

test('a malformed response is rejected rather than rendered', async () => {
  storage.clear();
  stubFetch((url) => (url.includes('/rate_limit') ? rateLimit(58) : response(200, [{ name: 'x' }])));

  const { stats } = await resolveStore();

  assert.equal(stats.source, 'snapshot');
});

test('available budget: exactly one repository request, values verbatim', async () => {
  storage.clear();
  stubFetch((url) => (url.includes('/rate_limit') ? rateLimit(58) : response(200, [LIVE_REPO])));

  const { stats } = await resolveStore();

  assert.equal(repoCalls().length, 1);
  assert.equal(stats.source, 'live');
  assert.equal(stats.fromCache, false);
  assert.equal(stats.error, null);
  assert.deepEqual(
    [stats.repoCount, stats.totalStars, stats.totalOpenIssues, stats.totalForks],
    [1, 7, 2, 1],
  );
  assert.ok(storage.has('github-telemetry-cache'), 'a good response must be cached');
});

test('a warm cache is served with zero GitHub traffic', async () => {
  // Continues from the previous test's cache.
  stubFetch(() => response(500, {}));

  const { stats } = await resolveStore();

  assert.deepEqual(calls, []);
  assert.equal(stats.source, 'cache');
  assert.equal(stats.fromCache, true);
  assert.equal(stats.error, null);
  assert.equal(stats.repos[0].name, 'live-alpha');
});

test('a stale cache beats the snapshot when the refresh cannot run', async () => {
  const cached = JSON.parse(storage.get('github-telemetry-cache'));
  cached.fetchedAt = Date.now() - 60 * 60 * 1000;
  storage.set('github-telemetry-cache', JSON.stringify(cached));
  storage.delete('github-telemetry-retry-after');
  stubFetch((url) => (url.includes('/rate_limit') ? rateLimit(0) : forbidden()));

  const { stats } = await resolveStore();

  assert.deepEqual(repoCalls(), []);
  assert.equal(stats.source, 'cache', 'the last good response wins over the snapshot');
  assert.equal(stats.repos[0].name, 'live-alpha');
  assert.equal(stats.error, null, 'real data must not be reported as an error');
});

test('a known-spent budget suppresses even the free probe on later navigations', async () => {
  storage.clear();
  stubFetch((url) => (url.includes('/rate_limit') ? rateLimit(0) : forbidden()));
  await resolveStore(); // records the refill time

  stubFetch(() => response(500, {}));
  const { stats } = await resolveStore();

  assert.deepEqual(calls, [], 'no GitHub traffic at all until the budget refills');
  assert.equal(stats.source, 'snapshot');
});
