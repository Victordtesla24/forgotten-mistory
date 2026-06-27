'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * ScrollRail — the orchestral scroll-scrubbed timeline for a section (FR-SCROLL).
 * A monochrome rail fill scrubs 0→1 across the section as the visitor scrolls over
 * a dim two-tone track; a glow pulse "head" rides the leading edge and fixed tick
 * marks index the track. The vertical label is pinned in view while the section is
 * on screen. Under prefers-reduced-motion the rail is shown filled with the head at
 * rest and no scrub/pin. Decorative (aria-hidden); cleaned up via
 * gsap.context().revert() on unmount.
 */
const TICKS = [0.12, 0.31, 0.5, 0.69, 0.88];

export default function ScrollRail({ targetId, label }: { targetId: string; label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = document.getElementById(targetId);
    const fill = fillRef.current;
    const head = headRef.current;
    const label = labelRef.current;
    if (!section || !fill || !head || !label) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const scrollTrigger = { trigger: section, start: 'top 72%', end: 'bottom 28%', scrub: 0.4 } as const;
        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            transformOrigin: 'top center',
            scrollTrigger: {
              trigger: section,
              start: 'top 72%',
              end: 'bottom 28%',
              scrub: 0.4,
              onEnter: () => {
                section.dispatchEvent(new CustomEvent('gsap:experience:enter', { bubbles: true }));
              },
            },
          },
        );
        // The glow head rides the fill's leading edge (0%→100% of the track) so the
        // pulse marks "where you are" in the section as you scrub.
        gsap.fromTo(head, { top: '0%' }, { top: '100%', ease: 'none', scrollTrigger });
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          pin: label,
          pinSpacing: false,
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(fill, { scaleY: 1, transformOrigin: 'top center' });
        gsap.set(head, { top: '100%' });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [targetId]);

  return (
    <div ref={rootRef} className="scroll-rail" aria-hidden="true" data-testid="scroll-rail">
      <span className="scroll-rail-track">
        <span ref={fillRef} className="scroll-rail-fill" data-testid="scroll-rail-fill" />
      </span>
      {TICKS.map((t) => (
        <span key={t} className="scroll-rail-tick" style={{ top: `${t * 100}%` }} />
      ))}
      <span ref={headRef} className="scroll-rail-head" />
      <span ref={labelRef} className="scroll-rail-label">
        {label}
      </span>
    </div>
  );
}