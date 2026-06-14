/*
 * Service worker — offline-after-visit durability (SPEC NFR-DURABLE / §10 TC-NFR-DURABLE;
 * prompt §2 NN-2: the takeaway must survive disconnecting from the internet).
 *
 * This site is a Firebase static export (no app/api/*), so the worker is a plain static
 * file served from /sw.js with root scope. Strategy:
 *   • install  — precache the navigation shell ('/') and the CV dossier so the core
 *                takeaway is guaranteed offline on the very next load.
 *   • fetch    — cache-first for same-origin GET, caching each first-visit response. This
 *                replays the build-hashed Next.js chunks/CSS/fonts offline WITHOUT
 *                hard-coding any hashed filename (which changes every build). Navigations
 *                fall back to the cached shell when the network is unavailable.
 *   • activate — drop superseded versioned caches, then claim open clients.
 * skipWaiting + clients.claim let a freshly-registered worker control the current page so
 * the immediate next reload is served from cache.
 *
 * Cache-version bump (e.g. v1 → v2) on any precache/strategy change invalidates the old
 * cache via the activate cleanup below — that is the deploy-time refresh mechanism.
 */

const CACHE_PREFIX = 'fm-static-';
const CACHE_VERSION = 'v1';
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
        // Offline: serve the cached navigation shell for navigations so the core
        // dossier still renders; otherwise surface the failure.
        if (request.mode === 'navigate') {
          const shell = await cache.match('/');
          if (shell) return shell;
        }
        const fallback = await cache.match(request, { ignoreSearch: true });
        if (fallback) return fallback;
        throw error;
      }
    })(),
  );
});
