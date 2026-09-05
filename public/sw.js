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

const CACHE_PREFIX = 'fm-static-';
// Rewritten at build time with the short commit SHA. See stamp_service_worker.mjs.
const CACHE_VERSION = '__BUILD_STAMP__';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// Stable, non-hashed entry points only. Hashed assets are captured at runtime (below).
const PRECACHE_URLS = ['/', '/docs/Vik_Resume_Final.pdf'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

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

      try {
        const response = await fetch(request);
        // Cache successful, fully-formed same-origin responses for offline replay.
        if (response && response.status === 200 && response.type === 'basic') {
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        // Offline. Navigations never reach here — they are handled above — so this is a
        // sub-resource: try once more ignoring the query string, which rescues an asset
        // cached under a cache-busting parameter the caller has since changed.
        const fallback = await cache.match(request, { ignoreSearch: true });
        if (fallback) return fallback;
        throw error;
      }
    })(),
  );
});
