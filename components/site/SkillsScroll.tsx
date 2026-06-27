'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * SkillsScroll — T6 GSAP+ScrollTrigger enter stagger for #skills (FR-SCROLL).
 *
 * Framer group reveal handles per-card stagger; GSAP ScrollTrigger fires onEnter
 * cue to mount per-skill micro-viz.
 * Under prefers-reduced-motion: static expanded.
 * Cleaned up via gsap.context().revert() on unmount.
 */
export default function SkillsScroll() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.getElementById('skills');
    if (!section) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 78%',
          onEnter: () => {
            section.dispatchEvent(new CustomEvent('gsap:skills:enter', { bubbles: true }));
            const cards = section.querySelectorAll('.skill-card');
            gsap.fromTo(
              cards,
              { opacity: 0, y: 30, scale: 0.95 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.55,
                stagger: 0.08,
                ease: 'power2.out',
              },
            );
          },
          once: true,
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        const cards = section.querySelectorAll('.skill-card');
        gsap.set(cards, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return <div ref={rootRef} aria-hidden="true" style={{ display: 'none' }} />;
}
