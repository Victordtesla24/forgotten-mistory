'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

/**
 * WorkScroll — T4 GSAP+ScrollTrigger per-scene pin sequential for #work (FR-SCROLL).
 *
 * scrub:1 catch-up — each flagship scene pinned in sequence.
 * Under prefers-reduced-motion: static poster per scene.
 * Cleaned up via gsap.context().revert() on unmount.
 */
export default function WorkScroll() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.getElementById('work');
    if (!section) return;

    const hudPanel = section.querySelector('.work-hud') as HTMLElement | null;
    const carousel = section.querySelector('.projects-carousel') as HTMLElement | null;
    const vfxItems = section.querySelectorAll('.vfx-gallery > *');

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=300%',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onEnter: () => {
              section.dispatchEvent(new CustomEvent('gsap:work:enter', { bubbles: true }));
            },
          },
        });

        if (hudPanel) {
          tl.fromTo(
            hudPanel,
            { opacity: 0.1, scale: 0.85, filter: 'blur(8px)' },
            { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' },
            0,
          );
        }

        if (carousel && hudPanel) {
          tl.to(hudPanel, { opacity: 0.35, scale: 0.92, duration: 0.6, ease: 'power1.in' }, '>');
          tl.fromTo(
            carousel,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
            '<0.1',
          );
        }

        if (vfxItems.length > 0) {
          if (carousel) {
            tl.to(carousel, { opacity: 0.3, y: -20, duration: 0.5, ease: 'power1.in' });
          }
          tl.fromTo(
            vfxItems,
            { opacity: 0, y: 60, scale: 0.9 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              stagger: 0.25,
              ease: 'power2.out',
            },
            '<0.1',
          );
        }
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        if (hudPanel) gsap.set(hudPanel, { opacity: 1, scale: 1, filter: 'blur(0px)', clearProps: 'filter' });
        if (carousel) gsap.set(carousel, { opacity: 1, y: 0, clearProps: 'transform' });
        gsap.set(vfxItems, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return <div ref={rootRef} aria-hidden="true" style={{ display: 'none' }} />;
}
