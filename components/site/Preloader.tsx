'use client';

import { useEffect, useRef, useState } from 'react';

const LOADER_DURATION_MS = 1100;
const REVEAL_HOLD_MS = 260;
// Matches the CSS clip-path/opacity reveal transition on `.preloader.is-revealing`.
const WIPE_MS = 420;

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

/**
 * Deterministic boot preloader (FR-BOOT / TC-FR-BOOT). Counts 0→100, then reveals
 * the page with a clip-path wipe.
 *
 * The overlay is intentionally plain DOM (no framer-motion) so the server-rendered
 * HTML and the client's first hydration pass are byte-identical: framer-motion's
 * `motion`/`AnimatePresence` serialise their inline transform/clip styles
 * differently between SSR and CSR, which produced a hard hydration mismatch on the
 * `<svg>` arc and forced React to client-render the whole root. The reveal wipe and
 * fade are now pure CSS (`.preloader.is-revealing`), which also honours
 * prefers-reduced-motion (fade only, no wipe).
 */
export default function Preloader() {
  const [count, setCount] = useState(0);
  const [complete, setComplete] = useState(false);
  const [done, setDone] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Reduced motion: show the finished state at once, then fade (no wipe, no count
      // animation). `complete` drives the reveal effect below.
      setCount(100);
      setComplete(true);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / LOADER_DURATION_MS, 1);
      setCount(Math.floor(progress * 100));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        // NOTE: setComplete (not setDone) so the 100 frame paints before unmount —
        // batching the unmount here would drop the final 100 (TC-FR-BOOT guard).
        setComplete(true);
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!complete) return undefined;
    document.body.classList.add('page-ready');
    const id = window.setTimeout(() => setDone(true), REVEAL_HOLD_MS + WIPE_MS);
    return () => clearTimeout(id);
  }, [complete]);

  if (done) return null;

  return (
    <div className={`preloader${complete ? ' is-revealing' : ''}`} role="status" aria-live="polite">
      <div className="preloader-inner">
        <ProgressArc progress={count} />
        <div className="counter">{count}</div>
        <div className="loader-copy">Calibrating stars &amp; telemetry</div>
      </div>
    </div>
  );
}
