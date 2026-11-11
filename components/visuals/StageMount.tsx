'use client';

import { useEffect, useRef } from 'react';

import { installHook } from '@/lib/gl/hook';
import { probeGpu, resolveTier } from '@/lib/gl/tier';

import styles from './StageMount.module.css';

/** The engine starts when the page has loaded and gone idle, and a view is near. */
function afterLoadWhenIdle(): Promise<void> {
  return new Promise((resolve) => {
    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout: 2000 });
      else window.setTimeout(resolve, 200);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
  });
}

/** Resolves when the first placeholder comes within reach of the viewport. */
function firstViewNear(views: readonly HTMLElement[], stop: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const observer = new IntersectionObserver(
      (changes) => {
        if (changes.some((change) => change.isIntersecting)) {
          observer.disconnect();
          resolve();
        }
      },
      { rootMargin: '200px 0px' },
    );
    for (const view of views) observer.observe(view);
    stop.addEventListener('abort', () => observer.disconnect(), { once: true });
  });
}

/**
 * Hosts the page's one canvas and loads the engine behind it. Nothing of three.js is in
 * the initial JavaScript: this component decides whether the engine is wanted (WebGL2
 * present, the tier is not `off`), waits for the page to be idle and a view to be near,
 * then imports it. It renders only the empty element the canvas is placed in.
 */
export function StageMount() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const hook = installHook();
    const views = Array.from(document.querySelectorAll<HTMLElement>('[data-stage-view]'));
    const abort = new AbortController();
    let engine: { dispose(): void } | null = null;

    const start = async () => {
      const gpu = probeGpu();
      const tier = resolveTier(gpu);
      if (tier === 'off') {
        hook.settle('off');
        return;
      }
      const { createStage } = await import('@/lib/gl/stage');
      if (abort.signal.aborted) return;
      const stage = createStage({
        host,
        tier,
        probe: gpu,
        onReady: () => hook.settle(tier),
        onGiveUp: () => hook.settle('off'),
      });
      if (!stage) {
        hook.settle('off');
        return;
      }
      engine = stage;
      hook.attach(stage);
      stage.observe(views);
    };

    if (views.length === 0) {
      hook.settle('off');
    } else {
      void Promise.all([afterLoadWhenIdle(), firstViewNear(views, abort.signal)]).then(() => {
        if (!abort.signal.aborted) void start();
      });
    }

    return () => {
      abort.abort();
      engine?.dispose();
      delete window.__stage;
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className={styles.host} />;
}
