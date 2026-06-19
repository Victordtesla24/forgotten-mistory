'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * useInViewMount — mounts heavy content (e.g. a WebGL scene) only once its host
 * element first scrolls into view, then keeps it mounted (mount-once).
 *
 * Used to keep the work-section HUD's WebGL context OFF the GPU until the visitor
 * reaches it (QT-10 / NFR-FPS): the home view then boots with a single live
 * context (the SpaceScene backdrop) and the second (the JARVIS HUD) only spins up
 * when #work is approached. `inView` is `false` on the server and the client's
 * first paint, so a lazily-gated subtree renders identically on both sides — no
 * hydration mismatch — and the observer reveals it post-mount.
 *
 * Falls back to mounting eagerly where IntersectionObserver is unavailable
 * (correctness over optimisation — the content must never silently fail to appear).
 */
export function useInViewMount<T extends HTMLElement = HTMLDivElement>(
  rootMargin = '200px',
): { ref: RefObject<T>; inView: boolean } {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return; // mount-once: nothing left to observe after the first reveal
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setInView(true);
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
