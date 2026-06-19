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
export default function HudFrame({
  label,
  className = '',
  variant = 'panel',
  scene = true,
  lazy = false,
}: {
  label: string;
  className?: string;
  variant?: 'panel' | 'backdrop';
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
      <span className="hud-frame__corner hud-frame__corner--tl" />
      <span className="hud-frame__corner hud-frame__corner--tr" />
      <span className="hud-frame__corner hud-frame__corner--bl" />
      <span className="hud-frame__corner hud-frame__corner--br" />
      {showScene ? <TelemetryHud className="hud-frame__scene" /> : null}
      {variant === 'panel' ? <span className="hud-frame__label">{label}</span> : null}
    </div>
  );
}
