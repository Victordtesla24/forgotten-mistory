'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * ScrollRail — the orchestral scroll-scrubbed timeline for a section (FR-SCROLL).
 * A monochrome rail fill scrubs 0→1 across the section as the visitor scrolls, and
 * the vertical label is pinned in view while the section is on screen. Under
 * prefers-reduced-motion the rail is shown filled with no scrub/pin. Decorative
 * (aria-hidden); cleaned up via gsap.context().revert() on unmount.
 */
export default function ScrollRail({ targetId, label }: { targetId: string; label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = document.getElementById(targetId);
    const fill = fillRef.current;
    const label = labelRef.current;
    if (!section || !fill || !label) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            transformOrigin: 'top center',
            scrollTrigger: { trigger: section, start: 'top 72%', end: 'bottom 28%', scrub: 0.4 },
          },
        );
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
      });
    }, rootRef);

    return () => ctx.revert();
  }, [targetId]);

  return (
    <div ref={rootRef} className="scroll-rail" aria-hidden="true" data-testid="scroll-rail">
      <span className="scroll-rail-track">
        <span ref={fillRef} className="scroll-rail-fill" data-testid="scroll-rail-fill" />
      </span>
      <span ref={labelRef} className="scroll-rail-label">
        {label}
      </span>
    </div>
  );
}
