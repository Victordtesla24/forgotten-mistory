'use client';

import { Canvas } from '@react-three/fiber';
import { Preload, View } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';

import { useGLCapability } from './useGLCapability';

/**
 * GLStage — the page's ONLY WebGL context.
 *
 * The previous architecture gave each visual its own R3F `<Canvas>`: seventeen
 * components could mount one, held back only by a five-ticket semaphore
 * (`lib/webglContextGuard.ts`). Browsers cap simultaneous contexts, so scrolling
 * churned them — production logged `THREE.WebGLRenderer: Context Lost` on every
 * single page load, twice, and each canvas paid its own renderer, compositor
 * layer and rAF loop.
 *
 * One canvas is mounted here, fixed behind the document and never unmounted.
 * Sections render their scenes through `<Scene track={ref}>` (drei's `View`),
 * which scissors a region of this shared context onto the tracked DOM element.
 * The context count is therefore exactly one, permanently — context loss from
 * over-allocation is structurally impossible, not merely rationed.
 *
 * `frameloop="demand"` keeps the renderer idle unless a scene asks for a frame
 * via `invalidate()`, so a page sitting still costs nothing.
 */
export default function GLStage() {
  const capability = useGLCapability();
  const eventSourceRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // drei's View tracks DOM rects, so the canvas must share the document's
    // event/scroll source. document.body is only available on the client.
    eventSourceRef.current = document.body;
    setReady(true);
  }, []);

  // No WebGL (old device, blocked context, headless crawler): render nothing.
  // Every section's markup is complete and legible without its scene — the
  // scenes are enhancement, never the content itself.
  if (capability === 'unsupported' || !ready) return null;

  return (
    <Canvas
      className="gl-stage"
      // The stage sits behind all content and never intercepts input; each
      // section's own DOM keeps hover, focus and click semantics.
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      eventSource={eventSourceRef.current ?? undefined}
      // Retina is capped at 1.75: beyond that the fill cost doubles for a
      // difference no one can see on these low-contrast monochrome scenes.
      dpr={[1, 1.75]}
      frameloop="demand"
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        // The scenes composite over near-black page ink; a stencil buffer and
        // depth-sorting against a cleared background are wasted bandwidth.
        stencil: false,
      }}
      // Views own their cameras; this is only the fallback for a stray scene.
      camera={{ position: [0, 0, 5], fov: 45 }}
    >
      <View.Port />
      <Preload all />
    </Canvas>
  );
}
