'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from 'react';

import { cn } from '@/lib/cn';

import styles from './VisualStage.module.css';

/** Upper bound on canvas pixels, about 0.9 megapixels, whatever the screen size or density. */
const MAX_PIXEL_COUNT = 1280 * 720;

/** The canvas is allowed to start loading this far before the stage scrolls into view. */
const NEAR_VIEWPORT = '200px';

/** What the stage tells the visual it hosts. */
export interface StageVisualProps {
  /** False while the stage is off-screen, the tab is hidden or the reader prefers reduced motion. */
  playing: boolean;
  /** The most pixels the canvas may draw. */
  maxPixelCount: number;
  /** Call once the visual has mounted, so the stage can fade it in over the poster. */
  onReady: () => void;
}

interface VisualStageProps {
  /** The canvas visual. It is not rendered, and so not downloaded, until the stage allows it. */
  visual: ComponentType<StageVisualProps>;
  /** Draws the CSS-gradient poster: what first paint, no-WebGL and lost-context readers see. */
  posterClassName: string;
  className?: string;
}

function subscribeToMedia(query: string, onChange: () => void): () => void {
  const list = window.matchMedia(query);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  return useSyncExternalStore(
    (onChange) => subscribeToMedia(query, onChange),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function useTabHidden(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener('visibilitychange', onChange);
      return () => document.removeEventListener('visibilitychange', onChange);
    },
    () => document.hidden,
    () => false,
  );
}

/** The Network Information API is not in the DOM typings yet. */
type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

function webgl2Available(): boolean {
  const probe = document.createElement('canvas').getContext('webgl2');
  if (!probe) return false;
  probe.getExtension('WEBGL_lose_context')?.loseContext();
  return true;
}

function canMountCanvas(): boolean {
  const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
  return !saveData && webgl2Available();
}

/** Runs `task` once the page has loaded and the browser is idle. Returns a canceller. */
function afterLoadWhenIdle(task: () => void): () => void {
  let cancelTask: () => void = () => undefined;
  const schedule = () => {
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(task, { timeout: 2000 });
      cancelTask = () => window.cancelIdleCallback(handle);
    } else {
      const handle = window.setTimeout(task, 200);
      cancelTask = () => window.clearTimeout(handle);
    }
  };

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });

  return () => {
    window.removeEventListener('load', schedule);
    cancelTask();
  };
}

/**
 * The one wrapper every canvas visual lives in, so none can bypass the rules:
 * the CSS poster is the first paint and the fallback; the canvas is loaded only
 * after the page has loaded and gone idle, when it is near the viewport, WebGL2
 * exists and the reader has not asked to save data; it pauses off-screen and in
 * hidden tabs, stops under reduced motion, is capped in pixels, and gives way
 * to the poster if the GPU context is lost. Always `aria-hidden`.
 */
export function VisualStage({ visual: Visual, posterClassName, className }: VisualStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const [capable, setCapable] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reached, setReached] = useState(false);
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const tabHidden = useTabHidden();

  useEffect(
    () =>
      afterLoadWhenIdle(() => {
        if (canMountCanvas()) setCapable(true);
      }),
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setReached(true);
      },
      { rootMargin: NEAR_VIEWPORT },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Context events do not bubble, but a capturing listener above the canvas still hears them.
    const onLost = (event: Event) => {
      event.preventDefault();
      setLost(true);
    };
    const onRestored = () => {
      setReady(false);
      setLost(false);
      setEpoch((current) => current + 1);
    };
    root.addEventListener('webglcontextlost', onLost, true);
    root.addEventListener('webglcontextrestored', onRestored, true);
    return () => {
      root.removeEventListener('webglcontextlost', onLost, true);
      root.removeEventListener('webglcontextrestored', onRestored, true);
    };
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  // Two frames after mount the first image is on screen; only then does the canvas fade in.
  const handleReady = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => setReady(true));
    });
  }, []);

  const mounted = capable && reached;
  const playing = visible && !tabHidden && !reducedMotion && !lost;

  return (
    <div ref={rootRef} aria-hidden="true" className={cn(styles.stage, className)}>
      <div className={cn(styles.poster, posterClassName)} />
      {mounted ? (
        <div key={epoch} className={styles.canvas} data-shown={ready && !lost}>
          <Visual playing={playing} maxPixelCount={MAX_PIXEL_COUNT} onReady={handleReady} />
        </div>
      ) : null}
      <div className={styles.scrim} />
    </div>
  );
}
