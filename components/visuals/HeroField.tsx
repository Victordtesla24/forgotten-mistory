'use client';

import { MeshGradient } from '@paper-design/shaders-react';
import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { heroFieldColors, readThemeSnapshot, subscribeToTheme } from './palette';
import type { StageVisualProps } from './VisualStage';

/** Shader time advances at this fraction of real time: a field that drifts, never one that moves. */
const DRIFT_SPEED = 0.12;

/** The moment of the mesh's motion shown first, and held under reduced motion. */
const STILL_FRAME = 6000;

/**
 * The hero's mesh gradient, coloured from the active theme's tokens and recoloured
 * when the theme changes. It is mounted only by `VisualStage`, after first paint.
 */
export default function HeroField({ playing, maxPixelCount, onReady }: StageVisualProps) {
  const snapshot = useSyncExternalStore(subscribeToTheme, readThemeSnapshot, () => '');
  const colors = useMemo(() => heroFieldColors(snapshot), [snapshot]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  if (!colors) return null;

  return (
    <MeshGradient
      colors={colors}
      speed={playing ? DRIFT_SPEED : 0}
      frame={STILL_FRAME}
      distortion={0.85}
      swirl={0.18}
      grainMixer={0.12}
      grainOverlay={0.1}
      scale={1.25}
      minPixelRatio={1}
      maxPixelCount={maxPixelCount}
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}
