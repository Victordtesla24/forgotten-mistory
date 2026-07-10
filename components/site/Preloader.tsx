'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Boot budget (TC-FR-BOOT): count → 0.5s dramatic hold at 100 → clip-path wipe, all
// inside the 2.5s reveal budget. Core path ≈ 1000 + 500 + 420 = 1920 ms.
const LOADER_DURATION_MS = 1000;
const HOLD_AT_FULL_MS = 500;
// Matches the CSS clip-path/opacity reveal transition on `.preloader.is-revealing`.
const WIPE_MS = 420;

// Ease-out cubic so the count decelerates into 100 — feels deliberate, not linear.
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function ProgressArc({ progress, complete }: { progress: number; complete: boolean }) {
  const radius = 50;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <svg
      className={`preloader-arc${complete ? ' is-complete' : ''}`}
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
        strokeWidth={strokeWidth}
        className="preloader-track"
      />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 50ms linear' }}
        className="preloader-progress"
      />
      <circle
        cx="60"
        cy="10"
        r="4"
        fill="none"
        strokeWidth="1"
        strokeDasharray="2 4"
        className="preloader-motif-ghost"
      />
    </svg>
  );
}

/**
 * Deterministic boot preloader (FR-BOOT / TC-FR-BOOT). Counts 0→100 (ease-out cubic),
 * holds at 100 for a beat, then reveals the page with a clip-path wipe.
 *
 * The overlay is intentionally plain DOM (no framer-motion) so the server-rendered
 * HTML and the client's first hydration pass are byte-identical: framer-motion's
 * `motion`/`AnimatePresence` serialise their inline transform/clip styles
 * differently between SSR and CSR, which produced a hard hydration mismatch on the
 * `<svg>` arc and forced React to client-render the whole root. The reveal wipe and
 * fade are pure CSS (`.preloader.is-revealing`), which also honours
 * prefers-reduced-motion (fade only, no wipe).
 */
export default function Preloader() {
  const [count, setCount] = useState(0);
  const [full, setFull] = useState(false); // count has visibly settled on 100
  const [revealing, setRevealing] = useState(false); // wipe is playing
  const [done, setDone] = useState(false);
  const frameRef = useRef<number | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reducedRef.current = prefersReduced;
    if (prefersReduced) {
      // Reduced motion: show the finished state at once (no count animation, no
      // wipe). `full` drives the hold→reveal sequence below.
      setCount(100);
      setFull(true);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      // Math.min(...,1) guarantees 100 is reached ONLY at progress === 1 — the exact
      // tick the regression guard checks (a batched unmount here would drop the 100
      // paint). `setFull` is separate from `setDone` so the 100 frame paints first.
      const progress = Math.min((now - start) / LOADER_DURATION_MS, 1);
      setCount(Math.floor(easeOutCubic(progress) * 100));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setFull(true);
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Hold at 100 for a beat, then start the reveal wipe (reduced motion skips the hold).
  useEffect(() => {
    if (!full) return undefined;
    const hold = reducedRef.current ? 0 : HOLD_AT_FULL_MS;
    const id = window.setTimeout(() => setRevealing(true), hold);
    return () => clearTimeout(id);
  }, [full]);

  // Reveal: release the page (body.page-ready), run the wipe, then unmount.
  // The `fm:page-ready` event lets the hero choreograph its entrance to the exact
  // frame the wipe begins — including the Skip path — instead of a hardcoded delay.
  useEffect(() => {
    if (!revealing) return undefined;
    document.body.classList.add('page-ready');
    window.dispatchEvent(new Event('fm:page-ready'));
    const id = window.setTimeout(() => setDone(true), WIPE_MS);
    return () => clearTimeout(id);
  }, [revealing]);

  // D-BOOT-01 — keyboard-reachable Skip: cancel the count and jump straight to the
  // reveal wipe so a returning recruiter never waits out the ~1.9s intro.
  const handleSkip = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    setCount(100);
    setFull(true);
    setRevealing(true);
  }, []);

  if (done) return null;

  return (
    <div className={`preloader${revealing ? ' is-revealing' : ''}`} role="status" aria-live="polite">
      <div className="preloader-inner">
        <ProgressArc progress={count} complete={full} />
        <div className="counter">{count}</div>
        <div className="loader-copy">Calibrating stars &amp; telemetry</div>
      </div>
      {!revealing && (
        <button type="button" className="preloader-skip" onClick={handleSkip}>
          Skip intro
        </button>
      )}
    </div>
  );
}
