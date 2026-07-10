'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * WorkScroll — T4 GSAP+ScrollTrigger per-scene pin sequential for #work (FR-SCROLL).
 *
 * scrub:1 catch-up — each flagship scene pinned in sequence.
 * Under prefers-reduced-motion: static poster per scene.
 * Cleaned up via gsap.context().revert() on unmount.
 *
 * Defers timeline build until HUD + carousel exist (lazy HudFrame / Reveal),
 * then refreshes ScrollTrigger so CatalogueScroll (T5) stays in sync.
 */
export default function WorkScroll() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.getElementById('work');
    if (!section) return;

    let cancelled = false;
    let ctx: gsap.Context | null = null;
    let observer: MutationObserver | null = null;
    let raf = 0;
    let built = false;

    const build = () => {
      if (cancelled || built) return;

      const hudPanel = section.querySelector('.work-hud') as HTMLElement | null;
      const carousel = section.querySelector('.projects-carousel') as HTMLElement | null;
      const vfxItems = section.querySelectorAll('.vfx-gallery > *');

      // Wait until the primary catalogue targets are in the DOM (lazy HUD is optional).
      if (!carousel) return;
      built = true;
      observer?.disconnect();
      observer = null;

      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();

        mm.add('(prefers-reduced-motion: no-preference)', () => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: '+=280%',
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
              { opacity: 0.12, scale: 0.9, filter: 'blur(6px)', y: 24 },
              {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                y: 0,
                duration: 1,
                ease: 'power2.out',
              },
              0,
            );
          }

          if (carousel) {
            if (hudPanel) {
              tl.to(
                hudPanel,
                { opacity: 0.42, scale: 0.94, y: -12, duration: 0.55, ease: 'power1.in' },
                '>',
              );
            }
            tl.fromTo(
              carousel,
              { opacity: 0, y: 48 },
              { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
              hudPanel ? '<0.12' : 0,
            );
          }

          if (vfxItems.length > 0) {
            if (carousel) {
              tl.to(carousel, { opacity: 0.38, y: -16, duration: 0.45, ease: 'power1.in' });
            }
            tl.fromTo(
              vfxItems,
              { opacity: 0, y: 48, scale: 0.94 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.75,
                stagger: 0.18,
                ease: 'power2.out',
              },
              '<0.08',
            );
          }
        });

        mm.add('(prefers-reduced-motion: reduce)', () => {
          if (hudPanel) {
            gsap.set(hudPanel, {
              opacity: 1,
              scale: 1,
              y: 0,
              filter: 'blur(0px)',
              clearProps: 'filter',
            });
          }
          if (carousel) gsap.set(carousel, { opacity: 1, y: 0, clearProps: 'transform' });
          gsap.set(vfxItems, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' });
        });
      }, rootRef);

      // One deferred refresh so pin + catalogue row widths settle together.
      raf = requestAnimationFrame(() => {
        if (!cancelled) ScrollTrigger.refresh();
      });
    };

    build();
    if (!built) {
      observer = new MutationObserver(() => build());
      observer.observe(section, { childList: true, subtree: true });
      // Failsafe: build with whatever is present after first paint cycle.
      raf = requestAnimationFrame(() => {
        if (!built) build();
      });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      ctx?.revert();
    };
  }, []);

  return <div ref={rootRef} aria-hidden="true" style={{ display: 'none' }} />;
}
