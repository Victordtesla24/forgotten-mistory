'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

/**
 * Custom cursor (dot + trailing outline) driven by framer-motion springs.
 * Only activates on fine-pointer devices when the user has not requested
 * reduced motion; otherwise renders nothing and the native cursor is used.
 */
export default function CursorGlow() {
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const outlineX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const outlineY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const finePointer = window.matchMedia('(pointer: fine)');
    if (!finePointer.matches) return;

    document.body.classList.add('cursor-enhanced');
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);

      // Drive the card spotlight (--mouse-x/--mouse-y) for the hovered card.
      const card = (e.target as Element | null)?.closest?.(
        '.meta-card, .skill-card, .project-card, .repo-card',
      ) as HTMLElement | null;
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.body.classList.remove('cursor-enhanced');
    };
  }, [prefersReducedMotion, x, y]);

  if (prefersReducedMotion) return null;

  return (
    <>
      <motion.div
        className="cursor-dot"
        aria-hidden="true"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        className="cursor-outline"
        aria-hidden="true"
        style={{ x: outlineX, y: outlineY, translateX: '-50%', translateY: '-50%' }}
      />
    </>
  );
}
