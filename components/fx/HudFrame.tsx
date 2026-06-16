'use client';

import TelemetryHud from './TelemetryHud';

/**
 * HudFrame — the recurring monochrome HUD bezel (NN-2 signature motif). Wraps the
 * TelemetryHud scene (custom GLSL radar ring + volumetric light shaft) in a framed
 * panel with corner ticks and a label, so the same motif reads consistently across
 * sections. Decorative (aria-hidden). `variant='backdrop'` drops the chrome for a
 * quiet behind-content placement. `scene={false}` renders the bezel + corner ticks
 * only (no WebGL canvas) — a lightweight echo of the motif where a third live R3F
 * scene would be wasteful (keeps the home-page GPU/perf budget intact).
 */
export default function HudFrame({
  label,
  className = '',
  variant = 'panel',
  scene = true,
}: {
  label: string;
  className?: string;
  variant?: 'panel' | 'backdrop';
  scene?: boolean;
}) {
  return (
    <div className={`hud-frame hud-frame--${variant} ${className}`.trim()} aria-hidden="true">
      <span className="hud-frame__corner hud-frame__corner--tl" />
      <span className="hud-frame__corner hud-frame__corner--tr" />
      <span className="hud-frame__corner hud-frame__corner--bl" />
      <span className="hud-frame__corner hud-frame__corner--br" />
      {scene ? <TelemetryHud className="hud-frame__scene" /> : null}
      {variant === 'panel' ? <span className="hud-frame__label">{label}</span> : null}
    </div>
  );
}
