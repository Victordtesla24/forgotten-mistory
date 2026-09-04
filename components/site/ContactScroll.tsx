'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import ContactForm from './ContactForm';

/**
 * ContactScroll — T7 GSAP+ScrollTrigger enter reveals + magnetic CTAs for #contact (FR-SCROLL),
 * and the mount point for the section's message form (D-CONTACT-02).
 *
 * The form renders as the opening block of #contact — first in the DOM, first on
 * screen, first in the tab order. That keeps focus order identical to visual order
 * (WCAG 2.4.3) instead of using a CSS `order` swap, which would drop keyboard focus
 * at the bottom of the section and then jump it back to the top. It also puts the
 * one action that completes a contact above the links that merely start one.
 *
 * On section enter:
 *   1. Dispatches 'gsap:contact:enter' for downstream cues.
 *   2. Stagger-reveals individual contact cards (opacity + y), giving them their
 *      own entrance independent of the parent Reveal container.
 *   3. Magnetic hover on the primary CTA (magnitude 0.18) and on social buttons
 *      (magnitude 0.10) for premium interaction polish.
 *
 * Under prefers-reduced-motion: no magnet, no stagger, static reveals only.
 * Cleaned up via gsap.context().revert() on unmount.
 */
export default function ContactScroll() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.getElementById('contact');
    if (!section) return;

    /** Attaches a magnetic hover effect to a single element. Returns a cleanup fn. */
    const attachMagnet = (el: HTMLElement, magnitude: number): (() => void) => {
      let tween: gsap.core.Tween | null = null;

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * magnitude;
        const y = (e.clientY - rect.top - rect.height / 2) * magnitude;
        if (tween) tween.kill();
        tween = gsap.to(el, { x, y, duration: 0.35, ease: 'power2.out' });
      };

      const onLeave = () => {
        if (tween) tween.kill();
        tween = gsap.to(el, { x: 0, y: 0, duration: 0.45, ease: 'power3.out' });
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      return () => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
        if (tween) tween.kill();
      };
    };

    const magnetCleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 82%',
          onEnter: () => {
            section.dispatchEvent(new CustomEvent('gsap:contact:enter', { bubbles: true }));

            // Stagger-reveal individual contact cards (email, phone).
            // These live inside a Reveal container that animates as a whole unit;
            // this per-card stagger layers on top for a more refined entrance.
            const cards = section.querySelectorAll<HTMLElement>('.contact-card');
            if (cards.length) {
              gsap.fromTo(
                cards,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.13, delay: 0.1, ease: 'power2.out', clearProps: 'opacity,transform' },
              );
            }

            // Stagger-reveal social buttons (LinkedIn, GitHub, YouTube).
            const socialBtns = section.querySelectorAll<HTMLElement>('.social-btn');
            if (socialBtns.length) {
              gsap.fromTo(
                socialBtns,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, delay: 0.25, ease: 'power2.out', clearProps: 'opacity,transform' },
              );
            }
          },
          once: true,
        });

        // Magnetic on primary booking CTA (stronger pull).
        const cta = section.querySelector<HTMLElement>('.contact-cta.btn-primary');
        if (cta) magnetCleanups.push(attachMagnet(cta, 0.18));

        // Softer magnetic on social buttons.
        section.querySelectorAll<HTMLElement>('.social-btn').forEach((btn) => {
          magnetCleanups.push(attachMagnet(btn, 0.10));
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        // No magnet, no stagger — static reveals handled by Framer Motion.
      });
    }, rootRef);

    return () => {
      magnetCleanups.forEach((cleanup) => cleanup());
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="contact-console-mount">
      <ContactForm />
    </div>
  );
}
