'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * SSR-safe wrapper around framer-motion's `useReducedMotion`.
 *
 * framer-motion's hook returns `false` on the server (no media query) but the
 * real value on the client. A component that branches its RENDERED output on the
 * raw hook therefore renders one tree on the server and a different one on a
 * reduced-motion client's first paint — a hard React hydration mismatch (#418),
 * which forces React to throw away the server HTML and client-render the whole
 * root (#423).
 *
 * This wrapper returns `false` during SSR AND the client's first paint (so
 * hydration matches the server exactly), then the user's real preference after
 * mount. Reduced-motion behaviour that swaps rendered structure (e.g. a static
 * fallback layout) thus applies post-hydration without a mismatch. For pure
 * entrance animations prefer keeping `initial` identical on both sides and
 * gating only the `transition` to instant, which suppresses motion with no
 * first-paint divergence at all.
 */
export function useReducedMotionSafe(): boolean {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? !!reduced : false;
}
