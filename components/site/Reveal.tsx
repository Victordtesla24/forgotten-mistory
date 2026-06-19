'use client';

import { Children } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

/** Entrance language for a Reveal. */
type RevealVariant = 'fade' | 'clip' | 'depth';

interface RevealProps {
  children: ReactNode;
  /** Seconds to delay the entrance once in view. */
  delay?: number;
  /** Initial vertical offset in pixels. */
  y?: number;
  className?: string;
  /** Render once (default) or every time the element re-enters the viewport. */
  once?: boolean;
  /**
   * Entrance motion:
   *  - `fade`  — opacity + lift (default).
   *  - `clip`  — an inset-wipe: content is revealed by retracting a bottom clip.
   *  - `depth` — a perspective parallax: content rotates up out of the page plane.
   */
  variant?: RevealVariant;
  /**
   * When > 0, treat the DIRECT children as a staggered group: each child lifts in
   * sequence `stagger` seconds apart. The orchestrating wrapper is a real box (it
   * must be — framer's `whileInView` uses an IntersectionObserver, which cannot
   * observe a `display: contents` element, so the entrance would never fire). Pass
   * the layout (`grid`/`flex`/…) via `className` so the wrapper IS the layout
   * container and the per-child motion wrappers become its direct items.
   */
  stagger?: number;
}

// The Apple "emphasized decelerate" curve — a long, soft settle. Single source so
// every Wave-4 entrance shares one signature timing.
const APPLE_EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.6;

/** Hidden (pre-entrance) target for a variant. Must be static (never branch on
 *  reduced motion) so the server HTML and the client's first paint are identical. */
function hiddenState(variant: RevealVariant, y: number) {
  switch (variant) {
    case 'clip':
      return { opacity: 0, y: y * 0.5, clipPath: 'inset(0 0 100% 0)' };
    case 'depth':
      return { opacity: 0, y, rotateX: 10, transformPerspective: 900 };
    default:
      return { opacity: 0, y };
  }
}
/** Resting (in-view) target for a variant. */
function shownState(variant: RevealVariant) {
  switch (variant) {
    case 'clip':
      return { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' };
    case 'depth':
      return { opacity: 1, y: 0, rotateX: 0 };
    default:
      return { opacity: 1, y: 0 };
  }
}

/**
 * Scroll-linked entrance wrapper. Fades / wipes / lifts content into place the
 * first time it enters the viewport. Reduced motion collapses to an instant snap
 * (the element still mounts at its hidden target on both server and client — see
 * the note in {@link Reveal} — then resolves with a zero-duration transition, so
 * there is never a hydration mismatch nor permanently hidden content).
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  once = true,
  variant = 'fade',
  stagger = 0,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const viewport = { once, margin: '0px 0px -80px 0px' } as const;

  // `initial` cannot branch on useReducedMotion() (false during SSR, true for a
  // reduced-motion client → hydration mismatch). Reduced motion is expressed via a
  // zero-duration transition instead.
  if (stagger > 0) {
    const container: Variants = {
      hidden: {},
      shown: {
        transition: prefersReducedMotion
          ? { staggerChildren: 0, delayChildren: 0 }
          : { staggerChildren: stagger, delayChildren: delay },
      },
    };
    const item: Variants = {
      hidden: hiddenState(variant, y),
      shown: {
        ...shownState(variant),
        transition: prefersReducedMotion ? { duration: 0 } : { duration: DURATION, ease: APPLE_EASE },
      },
    };
    return (
      <motion.div
        className={className}
        data-reveal-variant={variant}
        data-reveal-stagger=""
        initial="hidden"
        whileInView="shown"
        viewport={viewport}
        variants={container}
      >
        {Children.map(children, (child, i) => (
          <motion.div key={i} variants={item} style={variant === 'depth' ? { transformStyle: 'preserve-3d' } : undefined}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      data-reveal-variant={variant}
      initial={hiddenState(variant, y)}
      whileInView={shownState(variant)}
      viewport={viewport}
      transition={
        prefersReducedMotion ? { duration: 0 } : { duration: DURATION, delay, ease: APPLE_EASE }
      }
    >
      {children}
    </motion.div>
  );
}
