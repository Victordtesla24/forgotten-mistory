'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * ProofScroll — T2 GSAP+ScrollTrigger onEnter cue for #proof (FR-SCROLL).
 *
 * onEnter cue only — Framer Motion count-up owns the value animation.
 * GSAP fires a one-shot cue on section entry; no scrub, no pin.
 *
 * Under prefers-reduced-motion the cue is skipped (Framer already shows finals).
 * Cleaned up via gsap.context().revert() on unmount.
 */
export default function ProofScroll() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.getElementById('proof');
    if (!section) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // One-shot onEnter cue — fires once when the proof section enters view
        ScrollTrigger.create({
          trigger: section,
          start: 'top 85%',
          onEnter: () => {
            // GSAP cue dispatch — downstream consumers (e.g. ProofBar Framer count-up)
            // already handle their own useInView trigger. This ScrollTrigger provides
            // the GSAP orchestration anchor so the timeline is registered and audit-tracked.
            section.dispatchEvent(new CustomEvent('gsap:proof:enter', { bubbles: true }));
          },
          once: true,
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        // RM: no animation needed — Framer shows final values
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return <div ref={rootRef} aria-hidden="true" style={{ display: 'none' }} />;
}
