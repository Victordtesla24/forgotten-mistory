'use client';

import type { ReactNode } from 'react';
import { useInViewMount } from '@/lib/useInViewMount';

/**
 * InViewGate — defers mounting its children until the gate scrolls within
 * `rootMargin` of the viewport (IntersectionObserver, fire-once). Used to
 * keep heavy showreel content (incl. WebGL R3F scenes) off the GPU/JS
 * budget on initial page load (NFR-FPS / QT-10 perf gate).
 *
 * SSR-safe: `useInViewMount` reports `inView === false` on the server and
 * the client's first paint, so this renders the placeholder identically on
 * both sides (no hydration mismatch), then reveals the real content once
 * observed. Falls back to mounting eagerly wherever IntersectionObserver is
 * unavailable, so content never silently fails to appear.
 */
export default function InViewGate({
  children,
  rootMargin = '600px',
  minHeight = '1px',
  className = '',
}: {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: string | number;
  className?: string;
}) {
  const { ref, inView } = useInViewMount<HTMLDivElement>(rootMargin);

  return (
    <div ref={ref} className={className}>
      {inView ? children : <div aria-hidden="true" style={{ minHeight }} />}
    </div>
  );
}
