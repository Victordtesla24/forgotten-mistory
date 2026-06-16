'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const LOADER_DURATION_MS = 1100;
const REVEAL_HOLD_MS = 260;

function ProgressArc({ progress }: { progress: number }) {
  const radius = 50;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <svg
      className="preloader-arc"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="rgba(201, 205, 214, 0.15)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="var(--accent-color, #E8EBF0)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 50ms linear' }}
      />
      <circle
        cx="60"
        cy="10"
        r="4"
        fill="none"
        stroke="rgba(201, 205, 214, 0.3)"
        strokeWidth="1"
        strokeDasharray="2 4"
        className="preloader-motif-ghost"
      />
    </svg>
  );
}

export default function Preloader() {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const [complete, setComplete] = useState(false);
  const [done, setDone] = useState(false);
  const frameRef = useRef<number | null>(null);

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
          initial={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
          exit={{
            clipPath: 'inset(0 100% 0 0)',
            transition: { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] },
          }}
        >
          <div className="preloader-inner">
            <ProgressArc progress={count} />
            <div className="counter">{count}</div>
            <div className="loader-copy">Calibrating stars &amp; telemetry</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
