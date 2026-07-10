'use client';

import { useCallback, useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * CatalogueScroll — T5 GSAP+ScrollTrigger vertical→horizontal for #work catalogue (FR-SCROLL).
 *
 * Maps vertical scroll progress to horizontal translateX on `.projects-row` inside
 * the `#work` #projects-carousel. Uses scrub:true — Disney+ inspired horizontal
 * poster-row that the user "scrolls through" as they move down the page.
 *
 * Under prefers-reduced-motion: vertical static card grid (no GSAP timeline).
 * Cleaned up via gsap.context().revert() on unmount.
 *
 * Narrative-gated: timeline only activates when WorkScroll (T4) fires the
 * 'gsap:work:enter' custom event, preventing premature horizontal scroll.
 * Rebuilds on resize so card-row width stays accurate after pin/layout.
 */
export default function CatalogueScroll() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  const teardown = useCallback(() => {
    if (ctxRef.current) {
      ctxRef.current.revert();
      ctxRef.current = null;
    }
  }, []);

  const buildTimeline = useCallback(() => {
    const section = document.getElementById('work');
    if (!section) return;

    const carousel = section.querySelector('#projects-carousel') as HTMLElement | null;
    if (!carousel) return;

    const row = carousel.querySelector('.projects-row') as HTMLElement | null;
    if (!row) return;

    teardown();

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const measure = () => Math.max(0, row.scrollWidth - carousel.offsetWidth);
        const scrollWidth = measure();

        if (scrollWidth <= 0) return;

        gsap.fromTo(
          row,
          { x: 0 },
          {
            x: () => -measure(),
            ease: 'none',
            scrollTrigger: {
              trigger: carousel,
              start: 'top 55%',
              end: () => `+=${Math.max(measure(), carousel.offsetWidth * 0.85)}`,
              scrub: 0.55,
              // T4 (WorkScroll) pins the #work section — T5 does NOT pin;
              // it only translates the row within the pinned narrative space.
              invalidateOnRefresh: true,
            },
          },
        );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(row, { x: 0, clearProps: 'transform' });
      });
    }, rootRef);

    ctxRef.current = ctx;
  }, [teardown]);

  useEffect(() => {
    const section = document.getElementById('work');
    if (!section) return;

    let activated = false;
    let resizeTimer = 0;

    const activate = () => {
      activated = true;
      buildTimeline();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const rect = section.getBoundingClientRect();
    const alreadyInView = rect.top < window.innerHeight && rect.bottom > 0;

    if (alreadyInView) {
      activate();
    } else {
      const handleEnter = () => activate();
      section.addEventListener('gsap:work:enter', handleEnter, { once: true });
      // Failsafe: if T4 never fires (pin skipped / reduced motion), still bind T5.
      const failsafe = window.setTimeout(() => {
        if (!activated) activate();
      }, 2400);

      const onResize = () => {
        if (!activated) return;
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          buildTimeline();
          ScrollTrigger.refresh();
        }, 160);
      };
      window.addEventListener('resize', onResize);

      return () => {
        section.removeEventListener('gsap:work:enter', handleEnter);
        window.clearTimeout(failsafe);
        window.clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        teardown();
      };
    }

    const onResize = () => {
      if (!activated) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        buildTimeline();
        ScrollTrigger.refresh();
      }, 160);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      teardown();
    };
  }, [buildTimeline, teardown]);

  return <div ref={rootRef} aria-hidden="true" style={{ display: 'none' }} />;
}
