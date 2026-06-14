'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const LOADER_DURATION_MS = 1100;
// Hold the completed 100 frame on screen before revealing, so the counter
// visibly settles on 100 (FR-BOOT). Total boot ≈ duration + hold + exit fade,
// kept under the 2.5 s TC-FR-BOOT budget.
const REVEAL_HOLD_MS = 260;

/**
 * Deterministic preloader. Counts 0 → 100 over a fixed duration, holds the
 * completed 100 briefly, then adds the `page-ready` class to <body> (which
 * releases the CSS-gated hero elements) and unmounts itself. Skips instantly
 * for users who prefer reduced motion.
 */
export default function Preloader() {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const [complete, setComplete] = useState(false);
  const [done, setDone] = useState(false);
  const frameRef = useRef<number | null>(null);

  // Drive the counter 0 → 100, then flag completion. `floor` (not `round`) means
  // 100 is shown ONLY at progress === 1 — the counter never reads 100 before the
  // loader has actually finished (round would flip to 100 at 99.5%). `setCount(100)`
  // and `setComplete(true)` batch into one render, so 100 is committed (and painted)
  // while the loader is still mounted.
  useEffect(() => {
    if (prefersReducedMotion) {
      document.body.classList.add('page-ready');
      setDone(true);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / LOADER_DURATION_MS, 1);
      setCount(Math.floor(progress * 100));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setComplete(true);
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [prefersReducedMotion]);

  // Reveal only AFTER the count===100 render has committed (this effect runs
  // post-commit). The counter therefore always paints 100 before the loader
  // reveals, regardless of main-thread contention — it can never be batched
  // away with `done`. The exit fade keeps 100 visible while the loader leaves.
  useEffect(() => {
    if (!complete) return undefined;
    document.body.classList.add('page-ready');
    const id = window.setTimeout(() => setDone(true), REVEAL_HOLD_MS);
    return () => clearTimeout(id);
  }, [complete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="preloader"
          role="status"
          aria-live="polite"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
        >
          <div className="preloader-inner">
            <div className="loader-ring" />
            <div className="counter">{count}</div>
            <div className="loader-copy">Calibrating stars &amp; telemetry</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
