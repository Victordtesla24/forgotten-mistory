'use client';

import { useCallback, useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

/**
 * CatalogueScroll — T5 GSAP+ScrollTrigger vertical→horizontal for #work catalogue (FR-SCROLL).
 *
 * Maps vertical scroll progress to horizontal translateX on `.projects-row` inside
 * the `#work` #projects-carousel. Uses scrub:true, pin:true — Disney+ inspired
 * horizontal poster-row that the user "scrolls through" as they move down the page.
 *
 * Under prefers-reduced-motion: vertical static card grid (no GSAP timeline).
 * Cleaned up via gsap.context().revert() on unmount.
 *
 * Narrative-gated: timeline only activates when WorkScroll (T4) fires the
 * 'gsap:work:enter' custom event, preventing premature horizontal scroll.
 */
export default function CatalogueScroll() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  const buildTimeline = useCallback(() => {
    const section = document.getElementById('work');
    if (!section) return;

    const carousel = section.querySelector('#projects-carousel') as HTMLElement | null;
    if (!carousel) return;

    const row = carousel.querySelector('.projects-row') as HTMLElement | null;
    if (!row) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const scrollWidth = row.scrollWidth - carousel.offsetWidth;

        if (scrollWidth > 0) {
          gsap.fromTo(
            row,
            { x: 0 },
            {
              x: -scrollWidth,
              ease: 'none',
              scrollTrigger: {
                trigger: carousel,
                start: 'top 60%',
                end: `+=${scrollWidth}`,
                scrub: 0.6,
                // T4 (WorkScroll) pins the #work section — T5 does NOT pin;
                // it only translates the row within the pinned narrative space.
                invalidateOnRefresh: true,
              },
            },
          );
        }
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(row, { x: 0, clearProps: 'transform' });
      });
    }, rootRef);

    ctxRef.current = ctx;
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // Narrative gate: wait for WorkScroll (T4) to signal the section is active,
    // then build the T5 horizontal-scroll timeline. If the section is already
    // visible on mount, build immediately.
    const section = document.getElementById('work');
    if (!section) return;

    const row = section.querySelector('.projects-row');
    if (!row) return;

    // Check if already in view
    const rect = section.getBoundingClientRect();
    const alreadyInView = rect.top < window.innerHeight && rect.bottom > 0;

    if (alreadyInView) {
      const cleanup = buildTimeline();
      return cleanup;
    }

    // Otherwise gate on the T4 work:enter event
    const handleEnter = () => {
      const cleanup = buildTimeline();
      if (cleanup) {
        // Store cleanup — when component unmounts, clean up
        section.removeEventListener('gsap:work:enter', handleEnter);
      }
    };

    section.addEventListener('gsap:work:enter', handleEnter, { once: true });

    return () => {
      section.removeEventListener('gsap:work:enter', handleEnter);
      if (ctxRef.current) {
        ctxRef.current.revert();
        ctxRef.current = null;
      }
    };
  }, [buildTimeline]);

  return <div ref={rootRef} aria-hidden="true" style={{ display: 'none' }} />;
}
