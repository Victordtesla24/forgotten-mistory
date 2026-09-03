'use client';

import { useEffect, useState } from 'react';

type SwToast =
  | null
  | { kind: 'update'; reload: () => void }
  | { kind: 'dev'; version: string };

/**
 * Registers the offline-durability service worker (public/sw.js) once the page has loaded
 * (SPEC NFR-DURABLE / §10 TC-NFR-DURABLE; prompt §2 NN-2). Registration is deferred to the
 * `load` event so it never competes with first-view rendering, and is feature-gated on
 * `'serviceWorker' in navigator`. It also surfaces three quiet, polite-live notifications:
 * an "update available" prompt with a
 * Reload action when a fresh worker is waiting, and (development only) the precache version
 * it tears down. The toast region is always in the DOM (an empty aria-live status) so the
 * notifications are announced in place without layout shift.
 */
export default function ServiceWorkerRegister() {
  const [toast, setToast] = useState<SwToast>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    // The worker is a PRODUCTION-only durability feature. In development it must never run:
    // its cache-first strategy replays a stale precached shell against freshly re-hashed
    // `_next/static` chunks, surfacing as a 404 storm. So in dev we tear down any worker +
    // cache a previous visit left behind (and surface its version) and skip registration.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => undefined);
      if (typeof caches !== 'undefined') {
        caches
          .keys()
          .then((keys) => {
            const stale = keys.filter((k) => k.startsWith('fm-static-'));
            if (stale[0]) setToast({ kind: 'dev', version: stale[0] });
            return Promise.all(stale.map((k) => caches.delete(k)));
          })
          .catch(() => undefined);
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // A new worker installing while one already controls the page ⇒ an update is
          // available. A first install (no controller yet) is silent: the
          // visitor did not ask about the cache.
          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state !== 'installed') return;
              // Only the actionable case surfaces. A first install used to
              // announce "Ready to work offline." over the hero's primary
              // button on a 1280x720 screen — an implementation detail the
              // visitor never asked about, covering the one thing they might
              // click. An available update is different: it asks for a decision.
              if (navigator.serviceWorker.controller) {
                setToast({ kind: 'update', reload: () => window.location.reload() });
              }
            });
          });
        })
        .catch(() => {
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

  return (
    <div className="sw-toast-region" data-sw-toast role="status" aria-live="polite">
      {toast?.kind === 'update' && (
        <span className="sw-toast">
          A new version is available.
          <button type="button" className="sw-toast__reload" onClick={toast.reload}>
            Reload
          </button>
        </span>
      )}
      {toast?.kind === 'dev' && <span className="sw-toast sw-toast--dev">cache · {toast.version}</span>}
    </div>
  );
}
