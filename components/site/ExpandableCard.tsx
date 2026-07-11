'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

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
 * card reflects its state on `data-open` (drives the rotating header chevron).
 *
 * The body stays mounted in the DOM at ALL times — collapse/expand is purely
 * visual (height/opacity animate toward 0), never an AnimatePresence unmount —
 * so the body's text is always crawlable by search engines and assertable by
 * tests, even while visually collapsed. While collapsed, `inert` is toggled
 * imperatively on the body node so any interactive descendants are pulled out
 * of the tab order and accessibility tree without removing their text from the
 * DOM (`inert` isn't yet in the installed React DOM typings, hence the manual
 * setAttribute instead of a JSX prop). Under reduced motion the body snaps
 * open/closed instantly (IV-1/2 fix).
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
  const bodyRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (open) {
      el.removeAttribute('inert');
    } else {
      el.setAttribute('inert', '');
    }
  }, [open]);

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
      <motion.div
        ref={bodyRef}
        id={bodyId}
        className={`${bodyClass}${open ? ' expanded' : ''}`}
        style={{ overflow: 'hidden' }}
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 180, damping: 25, mass: 0.8 }
        }
      >
        <motion.div
          data-expand-content=""
          initial={false}
          animate={{ opacity: open ? 1 : 0, y: open ? 0 : 15 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: open ? 0.05 : 0 }
          }
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
