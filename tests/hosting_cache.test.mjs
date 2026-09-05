/**
 * hosting_cache.test.mjs — contract tests for Firebase Hosting cache freshness.
 *
 * INCIDENT: the Owner reloaded https://forgotten-mistory.web.app after a deploy and
 * saw the old site for up to an hour. Measured on 2026-09-05 (evidence
 * docs/delivery/evidence/v10-20260905T0515Z/P100-cache-freshness/01-headers-before.txt):
 *
 *   $ curl -sI https://forgotten-mistory.web.app/   → cache-control: max-age=3600
 *
 * That is Firebase's DEFAULT one-hour browser cache for content it does not
 * consider "dynamic": firebase.json set Cache-Control for /_next/static/**,
 * /assets/**, /docs/** and /sw.js, but never for the HTML document itself. The
 * document is the one file that must never be cached without revalidation,
 * because it is the only thing that names the new immutable chunk hashes. A
 * visitor holding an hour-old index.html loads an hour-old site by definition.
 *
 * The fix is a Cache-Control on the HTML documents that permits caching but
 * forces a conditional request every load. `no-store` would be wrong here: it
 * forbids the CDN and the browser from holding the bytes at all, throwing away
 * the ETag revalidation Firebase already serves (see the `etag:` line in the
 * evidence above) and paying a full 120 kB transfer on every navigation.
 * `public, max-age=0, must-revalidate` keeps the copy, and revalidates it — a
 * 304 when the deploy has not changed, the new document the moment it has.
 *
 * Header-source precedence: Firebase's published priority order (redirects →
 * static content → rewrites) documents rule ordering for redirects and
 * rewrites, not for overlapping `headers` sources. Rather than depend on an
 * undocumented precedence, the HTML rules below use sources that do not overlap
 * any existing Cache-Control rule at all. That the headers of several matching
 * blocks are applied together is measured, not assumed: the live chunk carries
 * both the CSP from the "**" block and the immutable Cache-Control from the
 * "/_next/static/**" block in the same response.
 *
 * Usage:  node --test tests/hosting_cache.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const config = JSON.parse(readFileSync(join(ROOT, 'firebase.json'), 'utf8'));
const headerRules = config.hosting.headers;

/** Every Cache-Control value declared for a given source, in declaration order. */
const cacheControlFor = (source) =>
  headerRules
    .filter((rule) => rule.source === source)
    .flatMap((rule) => rule.headers)
    .filter((h) => h.key.toLowerCase() === 'cache-control')
    .map((h) => h.value);

/** The single Cache-Control declared for a source (asserts there is exactly one). */
const oneCacheControlFor = (source) => {
  const values = cacheControlFor(source);
  assert.equal(values.length, 1, `expected exactly one Cache-Control for source "${source}", got ${values.length}`);
  return values[0];
};

// Firebase matches the extensionless document URL "/" against the source "/", and the
// emitted file against "/index.html" / "**/*.html". A deploy that fixed only one of
// them would still serve a stale document down the other path, so all four are required.
const HTML_SOURCES = ['/', '/index.html', '**/*.html', '/404.html'];
const HTML_CACHE_CONTROL = 'public, max-age=0, must-revalidate';

describe('the HTML document revalidates on every load', () => {
  for (const source of HTML_SOURCES) {
    it(`declares a Cache-Control for "${source}"`, () => {
      const rule = headerRules.find((r) => r.source === source);
      assert.ok(rule, `firebase.json has no headers entry with source "${source}"`);
      assert.equal(oneCacheControlFor(source), HTML_CACHE_CONTROL);
    });
  }

  it('revalidates rather than forbidding storage, so the ETag still saves the transfer', () => {
    for (const source of HTML_SOURCES) {
      const value = oneCacheControlFor(source);
      assert.match(value, /must-revalidate/, `"${source}" must force revalidation`);
      assert.match(value, /max-age=0/, `"${source}" must not hold a document past this load`);
      assert.ok(
        !/no-store/.test(value),
        `"${source}" must not use no-store — it discards the CDN copy and the 304, for no freshness gain`,
      );
      assert.ok(!/\bmax-age=(?!0\b)\d+/.test(value), `"${source}" must not carry a non-zero max-age`);
    }
  });

  it('never leaves an HTML source on Firebase\'s default one-hour browser cache', () => {
    // The regression this file exists to prevent: the measured `max-age=3600`.
    for (const source of HTML_SOURCES) {
      assert.ok(!/max-age=3600/.test(oneCacheControlFor(source)), `"${source}" is back on the Firebase default`);
    }
  });
});

describe('the rules that were already right stay right', () => {
  it('keeps /_next/static/** immutable — the hashed chunks are safe to hold forever', () => {
    assert.equal(oneCacheControlFor('/_next/static/**'), 'public, max-age=31536000, immutable');
  });

  it('keeps /sw.js on no-cache — a cached worker can never announce its own replacement', () => {
    assert.equal(oneCacheControlFor('/sw.js'), 'no-cache');
  });

  it('does not make an asset or a chunk revalidate — only the document does', () => {
    assert.ok(!cacheControlFor('/_next/static/**').includes(HTML_CACHE_CONTROL));
    assert.ok(!cacheControlFor('/assets/**').includes(HTML_CACHE_CONTROL));
  });

  it('leaves the "**" security block free of Cache-Control, so nothing is overridden by accident', () => {
    assert.deepEqual(cacheControlFor('**'), []);
  });
});
