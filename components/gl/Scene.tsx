'use client';

import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { useGLCapability } from './useGLCapability';

interface SceneProps {
  /** Class applied to the slot element, which is present whether or not the scene renders. */
  className?: string;
  /** Camera for this scene. Defaults to a 45° perspective five units back. */
  camera?: { position?: [number, number, number]; fov?: number };
  children: ReactNode;
}

/**
 * Scene — the only way a section may render 3D.
 *
 * The problem this replaces: seventeen components could each mount their own
 * R3F `<Canvas>`, held back only by a five-ticket semaphore, and production
 * logged `THREE.WebGLRenderer: Context Lost` on every page load.
 *
 * The rule here is visibility, not rationing. A scene's canvas exists only
 * while its slot is within half a viewport of the screen and is torn down as
 * soon as it leaves, so the number of live contexts is bounded by how many
 * scenes can be on screen at once — one, in this layout, occasionally two
 * mid-scroll — rather than by how much 3D the page contains in total.
 *
 * A scene renders nothing at all when WebGL is unavailable or the reader has
 * asked for reduced motion. Every section must therefore be complete and
 * legible with its scene absent: the slot keeps its own CSS treatment, and the
 * scenes are evidence rendered, never the evidence itself.
 */
export default function Scene({ className, camera, children }: SceneProps) {
  const capability = useGLCapability();
  const slotRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [allowMotion, setAllowMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setAllowMotion(!query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const element = slotRef.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      (entries) => setNear(entries.some((entry) => entry.isIntersecting)),
      // Half a viewport of lead-in: warm by the time it is read, released soon
      // after it is passed.
      { rootMargin: '50% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const show = capability === 'supported' && allowMotion && near;

  return (
    <div ref={slotRef} className={className} aria-hidden="true">
      {show && (
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
      )}
    </div>
  );
}
