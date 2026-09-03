'use client';

import { View } from '@react-three/drei';
import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';

import { useGLCapability } from './useGLCapability';

interface SceneProps {
  /** The DOM element the scene is scissored onto. */
  track: RefObject<HTMLElement>;
  /**
   * Mount the scene only once its element has been near the viewport. Scenes
   * far below the fold cost nothing until the reader approaches them.
   */
  lazy?: boolean;
  children: ReactNode;
}

/**
 * Scene — the ONLY way a section may put something on screen in 3D.
 *
 * No component outside `components/gl/` may create an R3F `<Canvas>`. A Scene
 * renders into the single shared context owned by `GLStage`, scissored to the
 * rectangle of `track`. That keeps the page at exactly one WebGL context
 * regardless of how many sections have a visual (see GLStage for why).
 *
 * A Scene renders nothing at all when WebGL is unavailable or the reader has
 * asked for reduced motion — so every section must be complete and legible with
 * its scene absent. That is the contract: scenes are evidence rendered, never
 * the evidence itself.
 */
export default function Scene({ track, lazy = true, children }: SceneProps) {
  const capability = useGLCapability();
  const [near, setNear] = useState(!lazy);
  const [allowMotion, setAllowMotion] = useState(false);
  const observedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setAllowMotion(!query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!lazy) return undefined;
    const element = track.current;
    if (!element || observedRef.current === element) return undefined;
    observedRef.current = element;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      // One viewport of lead-in: the scene is warm by the time it is read.
      { rootMargin: '100% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [lazy, track]);

  if (capability !== 'supported' || !allowMotion || !near || !track.current) return null;

  // drei types `track` as a non-nullable MutableRefObject, but every React DOM
  // ref is nullable until mount. The `!track.current` guard above is the real
  // proof the element exists; this cast just reconciles the signature.
  return (
    <View track={track as MutableRefObject<HTMLElement>}>{children}</View>
  );
}
