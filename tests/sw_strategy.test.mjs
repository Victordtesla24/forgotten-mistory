/**
 * sw_strategy.test.mjs — contract tests for the service worker's freshness strategy.
 *
 * INCIDENT, second half: even with the HTML revalidating (tests/hosting_cache.test.mjs),
 * a RETURNING visitor never reached the network at all. public/sw.js precached '/' at
 * install and served every request — navigations included — cache-first:
 *
 *     const cached = await cache.match(request);
 *     if (cached) return cached;
 *
 * so the browser replayed the precached shell from the visit before. That shell names
 * the previous build's immutable chunk hashes, which are themselves cached forever and
 * correctly so. And the cache it was served from was keyed `fm-static-v1` — a literal
 * that no deploy changed — so `activate`'s "delete every cache that is not mine" step
 * had nothing to delete and the stale shell survived every deploy indefinitely. The
 * worker only stopped serving it if a byte of sw.js itself changed.
 *
 * Two changes, both asserted here:
 *   1. Navigations are NETWORK-FIRST. The cache becomes what it was documented to be —
 *      an offline fallback — instead of the default source of the document. Sub-resources
 *      stay cache-first: they are content-hashed, so a cache hit is the right answer and
 *      going to the network for them would cost a round trip per asset for nothing.
 *   2. CACHE_VERSION is a build-time placeholder, rewritten in out/sw.js with the commit
 *      the bytes were built from. A new commit ⇒ a new cache name ⇒ activate() deletes
 *      the previous precache ⇒ the stale shell is gone on the first load after deploy.
 *
 * The third change is in the registrar: 'controllerchange' reloads once, so an update
 * that installs behind the visitor's back shows the new build immediately rather than
 * waiting for them to notice a toast.
 *
 * Usage:  node --test tests/sw_strategy.test.mjs
 *         (out/sw.js assertions require `npm run build:static` first)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const swSource = readFileSync(join(ROOT, 'public', 'sw.js'), 'utf8');
const registrar = readFileSync(join(ROOT, 'components', 'site', 'ServiceWorkerRegister.tsx'), 'utf8');

/** The body of the `fetch` listener — where the strategy lives. */
const fetchHandler = (() => {
  const start = swSource.indexOf("addEventListener('fetch'");
  assert.ok(start > -1, 'public/sw.js has no fetch listener');
  return swSource.slice(start);
})();

const BUILD_STAMP_PLACEHOLDER = '__BUILD_STAMP__';

describe('navigations are network-first', () => {
  it('branches on the navigation request before consulting the cache', () => {
    // A dedicated navigate branch must exist, and it must come before the generic
    // cache-first read — otherwise the shell is still served from cache first.
    const navigateBranch = fetchHandler.search(/request\.mode === 'navigate'/);
    const cacheFirstRead = fetchHandler.search(/const cached = await cache\.match\(request\)/);
    assert.ok(navigateBranch > -1, 'the fetch handler has no navigation branch');
    assert.ok(cacheFirstRead > -1, 'the fetch handler no longer has a cache-first read for sub-resources');
    assert.ok(
      navigateBranch < cacheFirstRead,
      'the navigation branch must be reached before the cache-first read, or navigations are still cache-first',
    );
  });

  it('fetches the document from the network and only falls back to the cache on failure', () => {
    const start = fetchHandler.search(/request\.mode === 'navigate'/);
    // The navigation branch runs until the generic cache-first read begins.
    const navigation = fetchHandler.slice(start, fetchHandler.search(/const cached = await cache\.match\(request\)/));
    assert.match(navigation, /await fetch\(request\)/, 'the navigation branch must hit the network');
    const networkAt = navigation.search(/await fetch\(request\)/);
    const fallbackAt = navigation.search(/cache\.match\(/);
    assert.ok(fallbackAt > -1, 'the navigation branch must keep an offline fallback to the cached shell');
    assert.ok(
      networkAt < fallbackAt,
      'the network attempt must precede the cache fallback — that is what "network-first" means',
    );
    assert.match(navigation, /catch/, 'the offline path must be reached by catching the failed fetch');
    assert.match(navigation, /cache\.put\(/, 'a fresh document must refresh the offline shell');
  });

  it('keeps hashed sub-resources cache-first — they cannot go stale', () => {
    const cacheFirst = fetchHandler.slice(fetchHandler.search(/const cached = await cache\.match\(request\)/));
    assert.match(cacheFirst, /if \(cached\) return cached;/, 'sub-resources must still answer from cache when present');
  });
});

describe('every deploy invalidates the precache', () => {
  it('carries a build-stamp placeholder in the source, not a hand-bumped literal', () => {
    assert.match(
      swSource,
      new RegExp(`const CACHE_VERSION = '${BUILD_STAMP_PLACEHOLDER}'`),
      `public/sw.js must declare CACHE_VERSION as the ${BUILD_STAMP_PLACEHOLDER} placeholder`,
    );
    assert.ok(
      !/const CACHE_VERSION = 'v\d+'/.test(swSource),
      "CACHE_VERSION must not be a literal like 'v1' — no deploy ever changed it, which is the bug",
    );
  });

  it('still deletes superseded caches on activate, and still claims open clients', () => {
    assert.match(swSource, /caches\.delete\(key\)/, 'activate must delete caches that are not the current version');
    assert.match(swSource, /self\.skipWaiting\(\)/);
    assert.match(swSource, /self\.clients\.claim\(\)/);
  });

  it('stamps out/sw.js with the build commit, so the deployed cache name is new', () => {
    const built = join(ROOT, 'out', 'sw.js');
    assert.ok(existsSync(built), 'out/sw.js is missing — run `npm run build:static` before this test');
    const deployed = readFileSync(built, 'utf8');
    const match = deployed.match(/const CACHE_VERSION = '([^']+)'/);
    assert.ok(match, 'out/sw.js declares no CACHE_VERSION');
    const version = match[1];
    assert.ok(
      !version.includes(BUILD_STAMP_PLACEHOLDER),
      'out/sw.js still carries the placeholder — the build step did not rewrite it',
    );
    assert.notEqual(version, 'v1', "out/sw.js still ships the hand-bumped 'v1' cache name");
    assert.match(
      version,
      /^[0-9a-f]{8}$/,
      `out/sw.js must be stamped with the 8-character build commit, got "${version}"`,
    );
  });

  it('stamps the deployed worker with the commit HEAD points at', () => {
    // Deliberately not read from app/data/generated/build-stamp.ts: that file withholds
    // its sha whenever the tree is dirty (INCIDENT-01 — the footer must never name a
    // commit the bytes did not come from). The cache name has no such honesty problem —
    // it only has to differ between deploys — so it is stamped from HEAD directly, and
    // this test checks against the same source of truth.
    const head = execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    const deployed = readFileSync(join(ROOT, 'out', 'sw.js'), 'utf8');
    assert.match(deployed, new RegExp(`const CACHE_VERSION = '${head}'`));
  });
});

describe('an updated worker shows the new build without being asked', () => {
  it('reloads the page once on controllerchange', () => {
    assert.match(registrar, /'controllerchange'/, 'the registrar must listen for controllerchange');
    assert.match(registrar, /window\.location\.reload\(\)/);
  });

  it('guards the reload with a sessionStorage flag, so a failing worker cannot loop', () => {
    assert.match(registrar, /sessionStorage/, 'an unguarded controllerchange reload can loop indefinitely');
  });

  it('still offers the explicit Reload action for a worker that is merely waiting', () => {
    assert.match(registrar, /kind: 'update'/);
  });
});

/**
 * DEPLOY SKEW (P95, monitor 10:09Z on build c5d808c3 — evidence
 * docs/delivery/evidence/v10-20260905T0515Z/P95-deploy-skew/01-incident.md).
 *
 *   pageerrors: "Loading chunk 427.8222755a6b18eedc.js failed."
 *               "Loading chunk 743.9672a1f959c17edf.js failed."
 *   canvasesAfterExperience: 0
 *
 * The document was the previous build's. Firebase Hosting serves exactly one version of a
 * site, so the next deploy 404s every hashed file of the version before it, and the HTML is
 * the only file that names them. Deploys run every ten minutes, so any reader who scrolls
 * to #experience after one cadence window asks for chunk filenames that no longer exist.
 *
 * The worker could not help: it precached two stable URLs and captured hashed assets only
 * as they were *requested*, so a chunk that is fetched on scroll was never in the cache
 * when the deploy removed it — and `activate` deleted every non-current cache, destroying
 * build N's chunks under the page still running build N.
 *
 * Two contract changes are asserted below:
 *   1. install precaches THIS build's whole static manifest, injected at build time.
 *   2. activate keeps two generations — current and immediately previous — so a page
 *      running build N still finds its chunks after N+1 activates.
 */
const PRECACHE_ASSETS_PLACEHOLDER = '__PRECACHE_ASSETS__';

/** Every file the worker is expected to precache, relative to out/, as absolute paths. */
function builtStaticAssets() {
  const staticRoot = join(ROOT, 'out', '_next', 'static');
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|css|woff2)$/.test(entry.name)) found.push(`/${relative(join(ROOT, 'out'), full).split(sep).join('/')}`);
    }
  };
  walk(staticRoot);
  return found.sort();
}

describe('the worker precaches the build it shipped with', () => {
  it('declares a build-time PRECACHE_ASSETS placeholder in the source', () => {
    assert.match(
      swSource,
      new RegExp(`const PRECACHE_ASSETS = ${PRECACHE_ASSETS_PLACEHOLDER}`),
      `public/sw.js must declare PRECACHE_ASSETS as the ${PRECACHE_ASSETS_PLACEHOLDER} placeholder — a hard-coded list would name last build's hashes`,
    );
  });

  it('caches the manifest in batches that survive an individual 404', () => {
    const install = swSource.slice(swSource.indexOf("addEventListener('install'"), swSource.indexOf("addEventListener('activate'"));
    assert.match(install, /cache\.addAll\(PRECACHE_URLS\)/, 'the stable shell must still be an all-or-nothing addAll');
    assert.match(install, /Promise\.allSettled/, 'one missing chunk must not abort the whole install');
    assert.match(install, /PRECACHE_BATCH|slice\(/, 'the manifest must be added in batches, not as one addAll');
  });

  it('stamps out/sw.js with a non-empty manifest of exactly this build\'s static files', () => {
    const built = join(ROOT, 'out', 'sw.js');
    assert.ok(existsSync(built), 'out/sw.js is missing — run `npm run build:static` before this test');
    const deployed = readFileSync(built, 'utf8');
    assert.ok(
      !deployed.includes(PRECACHE_ASSETS_PLACEHOLDER),
      'out/sw.js still carries the PRECACHE_ASSETS placeholder — the build step did not rewrite it',
    );
    const match = deployed.match(/const PRECACHE_ASSETS = (\[[^\n]*\]);/);
    assert.ok(match, 'out/sw.js declares no PRECACHE_ASSETS array');
    const assets = JSON.parse(match[1]);
    assert.ok(Array.isArray(assets) && assets.length > 0, 'the shipped precache manifest is empty');
    assert.ok(
      assets.every((entry) => typeof entry === 'string' && entry.startsWith('/_next/static/')),
      'every precache entry must be an absolute /_next/static path',
    );
    const expected = builtStaticAssets();
    assert.equal(
      assets.length,
      expected.length,
      `the manifest lists ${assets.length} files but out/_next/static holds ${expected.length}`,
    );
    assert.deepEqual(assets, expected, 'the manifest must be the sorted list of the build\'s static files');
  });
});

describe('activate keeps the previous generation alive', () => {
  const activate = swSource.slice(swSource.indexOf("addEventListener('activate'"), swSource.indexOf("addEventListener('fetch'"));

  it('keeps two cache generations, not one', () => {
    assert.match(
      swSource,
      /KEEP_GENERATIONS\s*=\s*2/,
      'the number of retained generations must be a named constant equal to 2',
    );
    assert.match(
      activate,
      /slice\(0,\s*KEEP_GENERATIONS\)/,
      'activate must truncate the generation ledger to the last KEEP_GENERATIONS entries',
    );
  });

  it('deletes only the generations outside the keep set', () => {
    assert.match(
      activate,
      /keep\.includes\(key\)/,
      'the delete filter must test membership of the keep set, not inequality with the current cache',
    );
    assert.match(activate, /caches\.delete\(key\)/);
  });

  it('records the generation order so "previous" is knowable, not guessed', () => {
    assert.match(swSource, /LEDGER_CACHE/, 'the worker needs a ledger cache to know which generation preceded it');
    assert.match(activate, /ledger\.put\(/, 'activate must write the new generation order back');
  });

  it('rescues a 404 for a hashed chunk from any surviving generation', () => {
    assert.match(fetchHandler, /matchAcrossGenerations/, 'a 404 on /_next/static must search the other generations');
    assert.match(fetchHandler, /status === 404/, 'the rescue must trigger on a 404, not only on a network failure');
    assert.match(
      swSource,
      /generation\.match\(request,\s*\{\s*ignoreSearch:\s*true\s*\}\)/,
      'the cross-generation lookup must ignore the query string',
    );
  });
});
