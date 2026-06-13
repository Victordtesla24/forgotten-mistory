'use client';

import TelemetryHud from './TelemetryHud';

/**
 * HudFrame — the recurring monochrome HUD bezel (NN-2 signature motif). Wraps the
 * TelemetryHud scene (custom GLSL radar ring + volumetric light shaft) in a framed
 * panel with corner ticks and a label, so the same motif reads consistently across
 * sections. Decorative (aria-hidden). `variant='backdrop'` drops the chrome for a
 * quiet behind-content placement.
 */
export default function HudFrame({
  label,
  className = '',
  variant = 'panel',
}: {
  label: string;
  className?: string;
  variant?: 'panel' | 'backdrop';
}) {
  return (
    <div className={`hud-frame hud-frame--${variant} ${className}`.trim()} aria-hidden="true">
      <span className="hud-frame__corner hud-frame__corner--tl" />
      <span className="hud-frame__corner hud-frame__corner--tr" />
      <span className="hud-frame__corner hud-frame__corner--bl" />
      <span className="hud-frame__corner hud-frame__corner--br" />
      <TelemetryHud className="hud-frame__scene" />
      {variant === 'panel' ? <span className="hud-frame__label">{label}</span> : null}
    </div>
  );
}
