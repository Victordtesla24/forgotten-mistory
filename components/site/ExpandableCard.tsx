'use client';

import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface ExpandableCardProps {
  /** Base class for the card shell, e.g. "snap-card" or "skill-card". */
  baseClass: string;
  /** Class for the toggle button, e.g. "snap-header" or "skill-header". */
  headerClass: string;
  /** Class for the collapsible body, e.g. "snap-body" or "skill-body". */
  bodyClass: string;
  header: ReactNode;
  children: ReactNode;
  role?: string;
}

/**
 * Generic expandable card used by the About snap-cards and Skills cards.
 * Spring-physics height (0→auto) opens the body; an inner content layer fades up
 * just behind the height so the text settles into place rather than popping. The
 * card reflects its state on `data-open` (drives the rotating header chevron). The
 * body lives in the DOM only while open (AnimatePresence) so collapse cleanly
 * unmounts it. Under reduced motion the body snaps open instantly (IV-1/2 fix).
 */
export default function ExpandableCard({
  baseClass,
  headerClass,
  bodyClass,
  header,
  children,
  role,
}: ExpandableCardProps) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`${baseClass}${open ? ' open' : ''}`} role={role} data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className={headerClass}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        {header}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            className={`${bodyClass} expanded`}
            style={{ overflow: 'hidden' }}
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 180, damping: 25, mass: 0.8 }
            }
          >
            <motion.div
              data-expand-content=""
              initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }
              }
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
