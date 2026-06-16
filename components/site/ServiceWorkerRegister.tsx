'use client';

import { useEffect } from 'react';

/**
 * Registers the offline-durability service worker (public/sw.js) once the page has loaded
 * (SPEC NFR-DURABLE / §10 TC-NFR-DURABLE; prompt §2 NN-2). Registration is deferred to the
 * `load` event so it never competes with first-view rendering, and is feature-gated on
 * `'serviceWorker' in navigator` so unsupported browsers are a no-op. Renders nothing.
 */
export default function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    // The worker is a PRODUCTION-only durability feature. In development it must never
    // run: its cache-first strategy replays the precached navigation shell and the
    // build-hashed `_next/static` chunks it captured on a prior visit, so after each
    // `next dev` rebuild (which re-wipes `.next` and re-stamps every chunk's `?v=`
    // timestamp) the cached HTML points at chunk URLs the fresh server no longer has —
    // surfacing as the `GET /_next/static/...?v=… 404` storm in the dev console.
    // So in dev we actively tear down any worker + cache a previous visit left behind
    // and skip registration entirely.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {
          /* teardown is best-effort; the page works without it */
        });
      if (typeof caches !== 'undefined') {
        caches
          .keys()
          .then((keys) =>
            Promise.all(keys.filter((k) => k.startsWith('fm-static-')).map((k) => caches.delete(k))),
          )
          .catch(() => {
            /* best-effort cache eviction */
          });
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failure must never break the page; the site works without the
        // worker (it only adds offline durability), so this is intentionally silent.
      });
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
