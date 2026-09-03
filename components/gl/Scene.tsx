'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { useGLCapability } from './useGLCapability';

// `three` and `@react-three/fiber` are fetched only once a scene has cleared
// every gate below — not as part of the page, which is where a static import
// of `Canvas` from this file put them.
const GLCanvas = dynamic(() => import('./GLCanvas'), { ssr: false });

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
  const [pageSettled, setPageSettled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setAllowMotion(!query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  // Nothing 3D is fetched until the page has finished loading and the main
  // thread has gone idle once. The hero's shader is pure enhancement over a CSS
  // gradient that is already painted, so a scene arriving a second late costs
  // nothing; a scene arriving *early* costs the hero's own display face its
  // place in the download queue, which is what took LCP over the 2.5 s budget
  // on a throttled phone.
  useEffect(() => {
    let cancelled = false;
    const settle = () => {
      const idle =
        window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(cb, 200));
      idle(() => {
        if (!cancelled) setPageSettled(true);
      });
    };
    if (document.readyState === 'complete') settle();
    else window.addEventListener('load', settle, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', settle);
    };
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

  const show = capability === 'supported' && allowMotion && near && pageSettled;

  return (
    <div ref={slotRef} className={className} aria-hidden="true">
      {show && (
        <GLCanvas camera={camera}>{children}</GLCanvas>
      )}
    </div>
  );
}
