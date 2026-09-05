'use client';

import { Canvas } from '@react-three/fiber';
import { useState, type ReactNode } from 'react';

export interface GLCanvasProps {
  camera?: { position?: [number, number, number]; fov?: number };
  /** The scene's `sceneId`, so a contained failure can say which scene it was. */
  sceneName?: string;
  children: ReactNode;
}

/**
 * The attributes this canvas asks for, in one place.
 *
 * They are declared here rather than inline on `<Canvas>` because the pre-flight
 * below has to ask the driver for a context on exactly the same terms the renderer
 * will — a probe that asks for something easier is not a probe, it is a guess.
 */
const GL_ATTRIBUTES = {
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance' as const,
  // These scenes composite over near-black ink and never depth-sort against a
  // cleared background, so a stencil buffer is dead weight.
  stencil: false,
};

/** One report per scene per page load. Three scenes must not print the same line thrice. */
const reported = new Set<string>();

/**
 * Can this driver actually give us a context on these terms?
 *
 * TC-SKEW-02 (tests/overhaul/scene-error-boundary.spec.ts:131) forces the failure this
 * guards: `HTMLCanvasElement.prototype.getContext` throws for any `webgl*` request that
 * carries an attributes object — a driver that refuses the renderer while still
 * answering `useGLCapability`'s bare `getContext('webgl2')` probe, which is precisely the
 * shape of a real blocklisted or out-of-memory GPU.
 *
 * That throw could not be contained after the fact. three's `WebGLRenderer` re-throws it,
 * R3F builds the renderer from its own resize callback rather than from a React commit,
 * and an exception raised there is not on any React stack: `SceneErrorBoundary` never
 * sees it and it surfaces as an uncaught `pageerror` — the whole page's error signal
 * tripped by a decorative shader. The boundary is still the right net for a fault inside
 * a scene's own render; it is the wrong tool for a context that was never created.
 *
 * So the question is asked before the renderer exists, on a detached canvas that is never
 * appended to the document (the failed slot must fall back to *empty*, so `#hero canvas`
 * stays at zero). A `false` here is reported once, loudly, and the scene renders nothing —
 * the same no-WebGL path every section is already built and tested against.
 */
function canCreateContext(sceneName: string): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const probe = document.createElement('canvas');
    const gl = (probe.getContext('webgl2', GL_ATTRIBUTES) ??
      probe.getContext('webgl', GL_ATTRIBUTES)) as WebGLRenderingContext | null;
    if (!gl) {
      report(sceneName, new Error('the driver returned no WebGL context for the renderer'));
      return false;
    }
    // The probe context counts against the browser's live-context cap, so it is handed
    // straight back — the renderer is about to ask for one of its own.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch (error) {
    report(sceneName, error);
    return false;
  }
}

/**
 * Say what happened, once, naming the scene.
 *
 * A caught failure that prints nothing is a swallowed failure: the reader gets the
 * fallback either way, but nobody reading a console — or a monitor scraping one — can
 * tell a driver that refused a context from a scene that simply chose not to mount.
 */
function report(sceneName: string, error: unknown) {
  if (reported.has(sceneName)) return;
  reported.add(sceneName);
  console.error(
    `[Scene:${sceneName}] WebGL context creation failed; the section renders without its scene`,
    error,
  );
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
export default function GLCanvas({ camera, sceneName = 'unnamed', children }: GLCanvasProps) {
  // Lazy `useState` initialiser: asked once, during the first render, before the
  // renderer is constructed — and never again on a re-render.
  const [usable] = useState(() => canCreateContext(sceneName));
  if (!usable) return null;

  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      // Retina is capped at 1.75: past that the fill cost doubles for a
      // difference no one can see on these low-contrast monochrome scenes.
      dpr={[1, 1.75]}
      gl={GL_ATTRIBUTES}
      camera={{
        position: camera?.position ?? [0, 0, 5],
        fov: camera?.fov ?? 45,
      }}
    >
      {children}
    </Canvas>
  );
}
