'use client';

import TelemetryHud from './TelemetryHud';
import { useInViewMount } from '@/lib/useInViewMount';

/**
 * HudFrame — the recurring monochrome HUD bezel (NN-2 signature motif). Wraps the
 * TelemetryHud scene (custom GLSL radar ring + volumetric light shaft) in a framed
 * panel with corner ticks and a label, so the same motif reads consistently across
 * sections. Decorative (aria-hidden). `variant='backdrop'` drops the chrome for a
 * quiet behind-content placement. `scene={false}` renders the bezel + corner ticks
 * only (no WebGL canvas) — a lightweight echo of the motif where a third live R3F
 * scene would be wasteful (keeps the home-page GPU/perf budget intact). `lazy`
 * defers mounting the WebGL scene until the frame first scrolls into view
 * (IntersectionObserver gate, QT-10 / NFR-FPS) so the home view boots with one
 * live context (SpaceScene) and the HUD context only spins up when reached.
 */
// Per-corner L-bracket geometry inside a 22×22 box; each draws in via stroke-dashoffset.
const BRACKETS = {
  tl: 'M1 11 L1 1 L11 1',
  tr: 'M11 1 L21 1 L21 11',
  bl: 'M1 11 L1 21 L11 21',
  br: 'M11 21 L21 21 L21 11',
} as const;

export default function HudFrame({
  label,
  className = '',
  variant = 'panel',
  scene = true,
  lazy = false,
}: {
  label: string;
  className?: string;
  variant?: 'panel' | 'backdrop' | 'floating';
  scene?: boolean;
  lazy?: boolean;
}) {
  const { ref, inView } = useInViewMount<HTMLDivElement>();
  const showScene = scene && (!lazy || inView);

  return (
    <div
      ref={lazy ? ref : undefined}
      className={`hud-frame hud-frame--${variant} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="hud-frame__glow" data-hud-glow />
      {(Object.keys(BRACKETS) as Array<keyof typeof BRACKETS>).map((corner) => (
        <svg
          key={corner}
          className={`hud-frame__bracket hud-frame__bracket--${corner}`}
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          aria-hidden="true"
        >
          <path
            data-hud-bracket
            d={BRACKETS[corner]}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ))}
      {showScene ? <TelemetryHud className="hud-frame__scene" /> : null}
      {variant === 'panel' ? <span className="hud-frame__label">{label}</span> : null}
    </div>
  );
}
