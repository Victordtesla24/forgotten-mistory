"use client";

import { MotionConfig, type Transition } from "framer-motion";

/**
 * Global motion shell (UI/UX upgrade §3, #3).
 *
 * `MotionConfig` carries the studio-wide transition default — a 0.6s cinematic
 * ease-out (the `[0.16, 1, 0.3, 1]` "expo-out" curve) — and honours the user's
 * reduced-motion setting (`reducedMotion="user"`), so every `motion` element that
 * doesn't set its own transition inherits the house feel and a safe a11y fallback.
 *
 * NOTE — LazyMotion deferred (reality-forced deviation, SPEC §0.1): the brief asks
 * for `LazyMotion` here, but this codebase is built entirely on eager `motion.*`
 * components (the accordions, FloatingDetailBox, the fx/* signatures, Reveal, the
 * whileInView staggers). `LazyMotion` is all-or-nothing — once it is an ancestor,
 * every descendant must render the lazy `m.*` primitives or it fails to acquire its
 * feature bundle and breaks (verified: it regressed TC-FR-ACCORDION + TC-FR-PANELFX).
 * Adopting it safely requires migrating ~10 out-of-scope files to `m.*`, which this
 * pass does not own. The transition default + reduced-motion integration deliver the
 * substance of the upgrade without that migration; LazyMotion is left for a
 * dedicated, fully-tested motion-migration wave.
 */
const HOUSE_TRANSITION: Transition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] };

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={HOUSE_TRANSITION}>
      {children}
    </MotionConfig>
  );
}
