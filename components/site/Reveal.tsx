'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Seconds to delay the entrance once in view. */
  delay?: number;
  /** Initial vertical offset in pixels. */
  y?: number;
  className?: string;
  /** Render once (default) or every time the element re-enters the viewport. */
  once?: boolean;
}

/**
 * Scroll-linked entrance wrapper. Fades + lifts content into place the first
 * time it enters the viewport. Collapses to a no-op transition for users who
 * prefer reduced motion.
 */
export default function Reveal({ children, delay = 0, y = 28, className, once = true }: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
