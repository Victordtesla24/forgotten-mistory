'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * CatalogueScroll — T5 GSAP+ScrollTrigger vertical→horizontal for #work catalogue (FR-SCROLL).
 *
 * scrub:true, pin:true — horizontal card-row translateX mapped to vertical scroll.
 * Under prefers-reduced-motion: vertical static grid.
 * Cleaned up via gsap.context().revert() on unmount.
 */
export default function CatalogueScroll() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.getElementById('work');
    if (!section) return;

    const carouselRow = section.querySelector('.projects-carousel .projects-row') as HTMLElement | null;
    if (!carouselRow) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const scrollWidth = carouselRow.scrollWidth - carouselRow.offsetWidth;

        if (scrollWidth > 0) {
          gsap.fromTo(
            carouselRow,
            { x: 0 },
            {
              x: -scrollWidth,
              ease: 'none',
              scrollTrigger: {
                trigger: carouselRow,
                start: 'top 75%',
                end: '+=' + scrollWidth,
                scrub: 0.6,
                pin: carouselRow.parentElement,
                pinSpacing: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(carouselRow, { x: 0, clearProps: 'transform' });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return <div ref={rootRef} aria-hidden="true" style={{ display: 'none' }} />;
}
