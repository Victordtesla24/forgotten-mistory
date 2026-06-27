'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * ContactScroll — T7 GSAP+ScrollTrigger enter reveals + magnetic CTA for #contact (FR-SCROLL).
 *
 * GSAP ScrollTrigger onEnter cues contact section staging.
 * Subtle magnetic hover on the primary CTA button (cursor-following translation).
 * Under prefers-reduced-motion: no magnet, static reveals.
 * Cleaned up via gsap.context().revert() on unmount.
 */
export default function ContactScroll() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.getElementById('contact');
    if (!section) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 82%',
          onEnter: () => {
            section.dispatchEvent(new CustomEvent('gsap:contact:enter', { bubbles: true }));
          },
          once: true,
        });

        const cta = section.querySelector('.contact-cta.btn-primary') as HTMLElement | null;
        if (cta) {
          let magnetTween: gsap.core.Tween | null = null;

          const onMove = (e: MouseEvent) => {
            const rect = cta.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            if (magnetTween) magnetTween.kill();
            magnetTween = gsap.to(cta, {
              x: x * 0.18,
              y: y * 0.18,
              duration: 0.35,
              ease: 'power2.out',
            });
          };

          const onLeave = () => {
            if (magnetTween) magnetTween.kill();
            magnetTween = gsap.to(cta, {
              x: 0, y: 0,
              duration: 0.45,
              ease: 'power3.out',
            });
          };

          cta.addEventListener('mousemove', onMove);
          cta.addEventListener('mouseleave', onLeave);

          (cta as any).__gsapMagnetCleanup = () => {
            cta.removeEventListener('mousemove', onMove);
            cta.removeEventListener('mouseleave', onLeave);
            if (magnetTween) magnetTween.kill();
          };
        }
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        // No magnet, static reveals handled by Framer
      });
    }, rootRef);

    return () => {
      const cta = section.querySelector('.contact-cta.btn-primary') as HTMLElement | null;
      if (cta && (cta as any).__gsapMagnetCleanup) {
        (cta as any).__gsapMagnetCleanup();
      }
      ctx.revert();
    };
  }, []);

  return <div ref={rootRef} aria-hidden="true" style={{ display: 'none' }} />;
}
