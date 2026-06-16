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
 * Uses Framer Motion for height:0→'auto' animation (IV-1/2 fix).
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
    <div className={`${baseClass}${open ? ' open' : ''}`} role={role}>
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
            transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
