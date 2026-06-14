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
