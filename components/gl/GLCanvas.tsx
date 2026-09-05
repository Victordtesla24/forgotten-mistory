'use client';

import { Canvas } from '@react-three/fiber';
import type { ReactNode } from 'react';

export interface GLCanvasProps {
  camera?: { position?: [number, number, number]; fov?: number };
  children: ReactNode;
}

/**
 * The R3F canvas, isolated behind a dynamic import.
 *
 * This file exists purely so `three` and `@react-three/fiber` land in a chunk
 * that is fetched when a scene actually mounts, rather than in the page's own
 * module graph. Importing `Canvas` from `Scene.tsx` — which every section
 * imports statically — put 132 kB of WebGL runtime on the critical path, where
 * it competed with the hero's own display face for a mobile connection's
 * bandwidth and pushed LCP from ~1.6 s to 2.7 s. The scene is never the
 * content; it should never be in the way of the content either.
 */
export default function GLCanvas({ camera, children }: GLCanvasProps) {
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      // Retina is capped at 1.75: past that the fill cost doubles for a
      // difference no one can see on these low-contrast monochrome scenes.
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        // These scenes composite over near-black ink and never depth-sort
        // against a cleared background, so a stencil buffer is dead weight.
        stencil: false,
      }}
      camera={{
        position: camera?.position ?? [0, 0, 5],
        fov: camera?.fov ?? 45,
      }}
    >
      {children}
    </Canvas>
  );
}
