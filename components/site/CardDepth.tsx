'use client';

import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * CardDepth — subtle 3D depth-parallax driver that lifts hero outcome cards
 * on hover. Works in concert with CursorGlow's --rx/--ry/--tx/--ty custom
 * properties but applies an additional per-card perspective push (CSS var
 * --card-depth) so each outcome tile feels like a physical layer.
 *
 * Gated on (prefers-reduced-motion: reduce) and (pointer: fine); inactive
 * otherwise.
 */
export default function CardDepth() {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    if (prefersReducedMotion || reduceMQ.matches || !finePointer.matches) return;

    const cardsArr = Array.from(
      document.querySelectorAll<HTMLElement>('[data-outcome-card]'),
    );
    const resetCard = (el: HTMLElement) => {
      el.style.setProperty('--card-depth', '0');
    };

    const onMove = (e: PointerEvent) => {
      for (const card of cardsArr) {
        const rect = card.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        // Only affect cards the pointer is currently over
        if (nx < -0.1 || nx > 1.1 || ny < -0.1 || ny > 1.1) {
          resetCard(card);
          continue;
        }
        const depth = ((nx - 0.5) * (ny - 0.5) * 0.3).toFixed(3);
        card.style.setProperty('--card-depth', depth);
      }
    };

    const onLeave = () => {
      for (const card of cardsArr) resetCard(card);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      for (const card of cardsArr) resetCard(card);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;
  return null;
}
