/*
 * Service worker — offline-after-visit durability (SPEC NFR-DURABLE / §10 TC-NFR-DURABLE;
 * prompt §2 NN-2: the takeaway must survive disconnecting from the internet).
 *
 * This site is a Firebase static export (no app/api/*), so the worker is a plain static
 * file served from /sw.js with root scope. Strategy:
 *   • install  — precache the navigation shell ('/') and the CV dossier so the core
 *                takeaway is guaranteed offline on the very next load.
 *   • fetch    — NETWORK-FIRST for navigations, cache-first for everything else. Hashed
 *                sub-resources are cached on first visit, which replays the Next.js
 *                chunks/CSS/fonts offline WITHOUT hard-coding any hashed filename (which
 *                changes every build).
 *   • activate — drop superseded versioned caches, then claim open clients.
 * skipWaiting + clients.claim let a freshly-registered worker control the current page so
 * the immediate next reload is served by the new worker.
 *
 * WHY NAVIGATIONS ARE NOT CACHE-FIRST
 * -----------------------------------
 * They were, and it made every deploy invisible. The document is the only file that names
 * this build's hashed chunks, so a cached document is a cached *site*: it asks for the
 * previous build's chunk URLs, which are immutable and correctly answered from cache,
 * forever. The Owner reloaded production after a deploy and saw the old page — not because
 * the deploy failed, but because the worker never let the request reach it. Serving the
 * document from cache buys a few hundred milliseconds and costs correctness, so the
 * document goes to the network and the cache becomes what this file's header always said
 * it was: an offline fallback. Sub-resources stay cache-first — they are content-hashed,
 * so a hit is by definition the right bytes and a revalidation would be a round trip for
 * nothing.
 *
 * WHY THE CACHE VERSION IS A BUILD STAMP
 * --------------------------------------
 * It used to be the literal 'v1', with a comment asking a human to bump it. Nobody ever
 * did, so `activate`'s "delete every cache that is not mine" step had nothing to delete
 * and a precached shell survived every deploy indefinitely. `__BUILD_STAMP__` is rewritten
 * in out/sw.js with the commit the build came from (scripts/build/stamp_service_worker.mjs,
 * called from the static export's post-processing step). A new commit is a new cache name,
 * so the previous precache is deleted the first time the new worker activates.
 */

/*
 * WHY THE WHOLE BUILD IS PRECACHED, AND WHY TWO GENERATIONS SURVIVE
 * -----------------------------------------------------------------
 * P95, monitor 10:09Z on build c5d808c3 (evidence
 * docs/delivery/evidence/v10-20260905T0515Z/P95-deploy-skew/01-incident.md):
 *
 *     "Loading chunk 427.8222755a6b18eedc.js failed."
 *     "Loading chunk 743.9672a1f959c17edf.js failed."   canvasesAfterExperience: 0
 *
 * Firebase Hosting serves exactly one version of a site. The document is the only file
 * that names this build's hashed chunks, so a page held open across a deploy asks for
 * filenames the next version has deleted. Deploys run every ten minutes, so any reader
 * who scrolls to #experience after one cadence window hits it — and the WebGL bundle is
 * lazily imported precisely on that scroll.
 *
 * The worker could not help, for two reasons, both fixed here:
 *   • It precached two stable URLs and captured hashed assets only as they were REQUESTED.
 *     A chunk fetched on scroll was therefore never in the cache at the moment the deploy
 *     removed it. So `install` now precaches PRECACHE_ASSETS — every .js/.css/.woff2 of
 *     THIS build, injected into out/sw.js by scripts/build/stamp_service_worker.mjs — in
 *     batches under Promise.allSettled, so one missing file cannot abort the install the
 *     way a single addAll() would.
 *   • `activate` deleted every cache that was not its own, which destroyed build N's
 *     chunks under the page still running build N — the worker itself completing the
 *     outage. It now keeps KEEP_GENERATIONS caches: the current one and the one
 *     immediately before it. The generation before THAT goes on the next activation, so
 *     the store never grows without bound.
 *
 * "Immediately previous" cannot be read off the cache names — the stamp is a commit SHA,
 * which has no order — so the order is recorded: LEDGER_CACHE holds a JSON array of cache
 * names, newest first, rewritten on every activation.
 */

const CACHE_PREFIX = 'fm-static-';
// Rewritten at build time with the short commit SHA. See stamp_service_worker.mjs.
const CACHE_VERSION = '__BUILD_STAMP__';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// Rewritten at build time with every file under out/_next/static (js, css, woff2) as
// absolute paths. Unreplaced, the identifier below does not exist and the worker dies at
// once with a ReferenceError — loud, which is the point: a silent empty manifest would be
// the deploy-skew outage shipped again.
const PRECACHE_ASSETS = __PRECACHE_ASSETS__;

// Stable, non-hashed entry points only. Hashed assets come from PRECACHE_ASSETS.
const PRECACHE_URLS = ['/', '/docs/Vik_Resume_Final.pdf'];

// Small enough that a slow connection makes progress between batches, large enough that
// ~66 files cost a handful of round-trip groups rather than sixty-six.
const PRECACHE_BATCH = 20;

// The current generation plus the one before it. A page still running build N must find
// build N's chunks after build N+1 activates.
const KEEP_GENERATIONS = 2;

// Not prefixed with CACHE_PREFIX, so the generation cleanup never eats its own ledger.
const LEDGER_CACHE = 'fm-generations';
const LEDGER_URL = '/__fm-generations__';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // The shell is all-or-nothing: without it there is no offline page at all.
      await cache.addAll(PRECACHE_URLS);

      if (!Array.isArray(PRECACHE_ASSETS)) {
        throw new Error('[sw] PRECACHE_ASSETS is not an array — the build did not inject the manifest');
      }

      // The manifest is best-effort. One 404 — a file pruned after the manifest was
      // written, a request that raced the deploy — must not abort the install and leave
      // the visitor with no precache at all, which is what a single addAll() would do.
      const failed = [];
      for (let i = 0; i < PRECACHE_ASSETS.length; i += PRECACHE_BATCH) {
        const batch = PRECACHE_ASSETS.slice(i, i + PRECACHE_BATCH);
        const results = await Promise.allSettled(batch.map((asset) => cache.add(asset)));
        results.forEach((result, index) => {
          if (result.status === 'rejected') failed.push(batch[index]);
        });
      }
      if (failed.length) {
        console.warn(`[sw] ${failed.length}/${PRECACHE_ASSETS.length} precache entries failed`, failed);
      }

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const ledger = await caches.open(LEDGER_CACHE);
      let recorded = [];
      try {
        const stored = await ledger.match(LEDGER_URL);
        if (stored) recorded = await stored.json();
      } catch {
        recorded = [];
      }
      if (!Array.isArray(recorded)) recorded = [];

      const generations = [CACHE_NAME, ...recorded.filter((name) => name !== CACHE_NAME)];
      const keep = generations.slice(0, KEEP_GENERATIONS);
      await ledger.put(
        LEDGER_URL,
        new Response(JSON.stringify(keep), { headers: { 'content-type': 'application/json' } }),
      );

      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !keep.includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/**
 * Look a hashed sub-resource up in every surviving generation, not just this worker's own.
 * This is the last line before a `Loading chunk … failed`: the page asking is running an
 * older document, and the bytes it wants are in the older generation's cache.
 *
 * @param {Request} request
 * @returns {Promise<Response|null>}
 */
async function matchAcrossGenerations(request) {
  const keys = await caches.keys();
  for (const key of keys) {
    if (!key.startsWith(CACHE_PREFIX)) continue;
    const generation = await caches.open(key);
    const hit = await generation.match(request, { ignoreSearch: true });
    if (hit) return hit;
  }
  return null;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only same-origin GETs are cacheable. Let the browser handle the rest natively.
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Range requests (media streaming) must reach the network for 206 responses; caching a
  // partial response would corrupt playback. The hero/MiniVic video relies on this.
  if (request.headers.has('range')) return;

  // Next.js dev HMR is never cached (keeps `npm run dev` reloads live).
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Navigations: network-first. The freshly fetched document also refreshes the
      // offline shell, so going offline right after a deploy strands nobody on the
      // build before last. Only a network failure reaches the cache.
      if (request.mode === 'navigate') {
        try {
          const fresh = await fetch(request);
          if (fresh && fresh.status === 200 && fresh.type === 'basic') {
            cache.put('/', fresh.clone());
          }
          return fresh;
        } catch (error) {
          const shell = (await cache.match(request)) || (await cache.match('/'));
          if (shell) return shell;
          // Offline with nothing precached: the failure is the honest answer.
          throw error;
        }
      }

      // Everything else: cache-first. These URLs are content-hashed, so a hit is the
      // right bytes by construction.
      const cached = await cache.match(request);
      if (cached) return cached;

      // A hashed build asset. If the network says it is gone, the page asking is running a
      // document from a build Firebase no longer serves — the deploy-skew case.
      const isBuildAsset = url.pathname.startsWith('/_next/static/');

      try {
        const response = await fetch(request);
        // Cache successful, fully-formed same-origin responses for offline replay.
        if (response && response.status === 200 && response.type === 'basic') {
          cache.put(request, response.clone());
          return response;
        }
        if (isBuildAsset && response && response.status === 404) {
          const rescued = await matchAcrossGenerations(request);
          if (rescued) return rescued;
        }
        return response;
      } catch (error) {
        // Offline. Navigations never reach here — they are handled above — so this is a
        // sub-resource: try once more ignoring the query string, which rescues an asset
        // cached under a cache-busting parameter the caller has since changed.
        const fallback = await cache.match(request, { ignoreSearch: true });
        if (fallback) return fallback;
        if (isBuildAsset) {
          const rescued = await matchAcrossGenerations(request);
          if (rescued) return rescued;
        }
        throw error;
      }
    })(),
  );
});
