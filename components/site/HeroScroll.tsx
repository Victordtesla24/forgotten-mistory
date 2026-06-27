'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * HeroScroll — T1 GSAP+ScrollTrigger scrub timeline for #hero (FR-SCROLL).
 *
 * scrub:true, no pin. On scroll through the hero section:
 *  - HUD backdrop fades/scales in (HUD telemetry "uLoad 0→1" equivalent)
 *  - Headline clip-reveal progresses (mask/clip-path scrub)
 *  - Avatar still→video crossfade (image opacity 1→0, video-ready state)
 *
 * Under prefers-reduced-motion the hero settles to final static state.
 * Cleaned up via gsap.context().revert() on unmount.
 */
export default function HeroScroll() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.getElementById('hero');
    if (!section) return;

    // Target elements within the hero
    const backdrop = section.querySelector('.hero-hud-backdrop') as HTMLElement | null;
    const titleReveal = section.querySelector('.reveal-text') as HTMLElement | null;
    const avatarImg = section.querySelector('.avatar-img[style]') as HTMLElement | null; // static pic
    const avatarContainer = section.querySelector('#avatar-container') as HTMLElement | null;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // HUD backdrop — fade + scale in as hero scrolls (uLoad 0→1)
        if (backdrop) {
          gsap.fromTo(
            backdrop,
            { opacity: 0.12, scale: 0.92 },
            {
              opacity: 0.38,
              scale: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: 'bottom 40%',
                scrub: 0.6,
                invalidateOnRefresh: true,
                onEnter: () => {
                  section.dispatchEvent(new CustomEvent('gsap:hero:enter', { bubbles: true }));
                },
              },
            },
          );
        }

        // Headline clip-reveal — scrub mask/clip-path
        if (titleReveal) {
          // Set up initial clip-path for reveal animation
          gsap.set(titleReveal, { clipPath: 'inset(0 100% 0 0)' });
          gsap.to(titleReveal, {
            clipPath: 'inset(0 0% 0 0)',
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 8%',
              end: 'top -12%',
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          });
        }

        // Avatar still→video crossfade — image fades out as hero scrolls past
        if (avatarImg && avatarContainer) {
          gsap.fromTo(
            avatarImg,
            { opacity: 1 },
            {
              opacity: 0.15,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top 15%',
                end: 'bottom 35%',
                scrub: 0.5,
                invalidateOnRefresh: true,
              },
            },
          );
        }
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        // Final static state — backdrop at full, title revealed, avatar dimmed
        if (backdrop) gsap.set(backdrop, { opacity: 0.38, scale: 1 });
        if (titleReveal) gsap.set(titleReveal, { clipPath: 'inset(0 0% 0 0)' });
        if (avatarImg) gsap.set(avatarImg, { opacity: 0.15 });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // Invisible wrapper — purely for gsap.context() scoping
  return <div ref={rootRef} aria-hidden="true" style={{ display: 'none' }} />;
}
