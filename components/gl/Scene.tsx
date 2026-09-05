'use client';

import dynamic from 'next/dynamic';
import { Component, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';

import type { GLCanvasProps } from './GLCanvas';
import { useGLCapability } from './useGLCapability';

/**
 * One reload per session, and only ever one — a deterministic chunk failure that reloaded
 * on every attempt would be a loop, not a recovery.
 */
const CHUNK_RELOAD_KEY = 'fm-chunk-reload';

/** How long to wait before the single retry. Long enough for a CDN edge to settle. */
const CHUNK_RETRY_MS = 800;

/** The report is per page, not per scene: three scenes share one failed import. */
let chunkFallbackReported = false;

/**
 * Is this the deploy-skew failure — the requested chunk no longer exists on the origin?
 *
 * webpack raises `ChunkLoadError` with the message `Loading chunk <id> failed.`; the CSS
 * loader raises `Loading CSS chunk <id> failed`. Anything else is a real fault in the
 * module and must keep propagating to the scene's error boundary.
 */
function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { name, message } = error as { name?: string; message?: string };
  if (name === 'ChunkLoadError') return true;
  return typeof message === 'string' && /Loading (CSS )?chunk .+ failed/i.test(message);
}

/**
 * Fetch the WebGL bundle, surviving a deploy that has already replaced it.
 *
 * P95, monitor 10:09Z on build c5d808c3 (evidence
 * docs/delivery/evidence/v10-20260905T0515Z/P95-deploy-skew/01-incident.md):
 *
 *     "Loading chunk 427.8222755a6b18eedc.js failed."   canvasesAfterExperience: 0
 *
 * Firebase Hosting serves one version of a site at a time, deploys run every ten minutes,
 * and this bundle is imported when the reader scrolls to a scene — so a page open for
 * longer than one cadence window asks for a filename that no longer exists. Left alone,
 * next/dynamic re-throws the rejection through React and `app/error.tsx` replaces the
 * whole document: a recruiter mid-read is shown "Something went wrong" because a
 * decorative shader could not be fetched.
 *
 * So: retry once (the request may simply have raced the deploy), then reload once per
 * session — a reload is the only way to obtain the current document, which is the only
 * file that names the chunks that do exist. If it has already reloaded and the chunk is
 * still missing, the scene resolves to nothing and the section renders exactly as it does
 * for a reader with no WebGL at all. It never rejects, so it can never reach the error
 * shell.
 */
async function loadGLCanvas(): Promise<{ default: ComponentType<GLCanvasProps> }> {
  try {
    return await import('./GLCanvas');
  } catch (first) {
    if (!isChunkLoadError(first)) throw first;
    await new Promise((settle) => setTimeout(settle, CHUNK_RETRY_MS));
    try {
      return await import('./GLCanvas');
    } catch (second) {
      if (!isChunkLoadError(second)) throw second;

      let alreadyReloaded = true;
      try {
        alreadyReloaded = window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
        if (!alreadyReloaded) window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      } catch {
        // sessionStorage blocked (private mode, third-party context): treat it as already
        // reloaded. An unguarded reload with no way to remember it is an infinite loop.
        alreadyReloaded = true;
      }

      if (!alreadyReloaded) {
        window.location.reload();
      } else if (!chunkFallbackReported) {
        chunkFallbackReported = true;
        console.error(
          '[Scene] the WebGL bundle could not be loaded (chunk missing after a deploy); ' +
            'rendering the sections without their scenes',
          second,
        );
      }
      // Resolve to an empty component: the slot stays, the page stays, nothing throws.
      return { default: function GLCanvasUnavailable() { return null; } };
    }
  }
}

// `three` and `@react-three/fiber` are fetched only once a scene has cleared
// every gate below — not as part of the page, which is where a static import
// of `Canvas` from this file put them.
const GLCanvas = dynamic(loadGLCanvas, { ssr: false });

interface SceneBoundaryProps {
  sceneName: string;
  children: ReactNode;
}

/**
 * SceneErrorBoundary — a fault inside one scene never replaces the document.
 *
 * `app/error.tsx` is the route-segment boundary: the nearest one to a throwing GL canvas,
 * and it renders a full-page "System interrupt". That made the site's own rule — *the
 * scene is never the content* — true of the layout and false of the code: a driver that
 * fails to give three a context, a shader that fails to compile, a lost context the
 * renderer cannot restore, any of them took the whole page down.
 *
 * This boundary sits between the two. It renders the slot empty — the same state a reader
 * with no WebGL, or with reduced motion, already gets, which is the path every section is
 * built and tested against — and reports once, naming the scene. It does not re-throw, and
 * it does not reset: a renderer that has failed once will fail again, and re-mounting it
 * would loop. `app/error.tsx` stays for genuine page-level faults.
 */
class SceneErrorBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[Scene:${this.props.sceneName}] scene failed and was removed; the section renders without it`, error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface SceneProps {
  /** Class applied to the slot element, which is present whether or not the scene renders. */
  className?: string;
  /**
   * Stable identifier stamped on the slot as `data-scene`.
   *
   * The slot's class name is a hashed CSS-module token in a production export,
   * so nothing outside the component can address it. The flagship-visibility
   * gate (`tests/overhaul/flagship-visibility.spec.ts`) has to find each
   * scene's slot to isolate and photograph it, and every later lane that wants
   * to measure a scene needs the same handle — so the handle is part of the
   * contract here rather than re-derived per section.
   */
  sceneId?: string;
  /** Camera for this scene. Defaults to a 45° perspective five units back. */
  camera?: { position?: [number, number, number]; fov?: number };
  /**
   * Mount this scene as soon as it is on screen, without waiting for the page
   * to settle. Opt-in, default `false`: every scene but one is unchanged.
   *
   * The idle gate below is not overhead, it is a measured protection —
   * `GLCanvas.tsx:14` records that an eager R3F canvas took LCP from ~1.6 s to
   * 2.7 s — so it stays in force for S2…S7, which are all below the fold and
   * lose nothing by arriving a second late.
   *
   * The hero is the one scene the gate actually costs something. It is the
   * flagship and it is *above* the fold, so "a second late" means the first
   * screen a reader sees has no atmosphere in it at all; the independent
   * production review measured exactly that — zero canvases on a normal load,
   * the hero shader visible only under `?gl=force`. Waiting for `window.load`
   * plus an idle callback to draw the thing the page opens on is not a
   * performance win, it is the defect (docs/architecture/SIGNATURE-SCENES-v1.md
   * §4.1(a), decision D3).
   *
   * This is safe for LCP only because the hero's slot is already painted before
   * any of this runs: `.stage` carries a still of the same light as its own CSS
   * background, out of the static HTML, so the LCP candidate is settled by the
   * document and the canvas composites over a frame that is already there. A
   * `priority` scene on a slot with no still would be the 2.7 s regression
   * again. `tests/overhaul/hero-first-paint.spec.ts` holds both halves.
   */
  priority?: boolean;
  /**
   * Fraction of the display's own resolution this scene's fragments are computed
   * at. Default 1; 0.5 is a quarter of the fragments, upscaled into the slot by
   * the browser.
   *
   * Every scene here is a single full-screen fragment program, so a frame costs
   * what it fills: measured on `tests/perf/scene-framerate.spec.ts` the hero and
   * the About field sat within a factor of two of each other at 1440x900 —
   * 366.6 ms and 333.3 ms on a median frame — although the hero's shader does
   * roughly three times the per-pixel arithmetic. Scenes that are fill-bound buy
   * a frame back by filling less of it, and these are soft-edged by
   * construction: fog, a ring of light, drifting sediment. The bench in
   * `#skills` is not, and does not ask for this — its graticule is a hairline,
   * and a hairline does not survive an upscale.
   *
   * `components/gl/GLCanvas.tsx` holds the floor and the ceiling this is applied
   * within, and the reasoning in full.
   */
  resolutionScale?: number;
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
export default function Scene({
  className,
  camera,
  sceneId,
  priority = false,
  resolutionScale = 1,
  children,
}: SceneProps) {
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
  // thread has gone idle once — unless this scene asked for `priority`. A scene
  // arriving *early* costs the hero's own display face its place in the download
  // queue, which is what took LCP over the 2.5 s budget on a throttled phone, so
  // every below-the-fold scene still waits: a second late is free when the
  // reader has not scrolled that far yet. It is not free for the scene the page
  // opens on, which is the one exception `priority` names.
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

  // Capability, reduced motion and proximity are non-negotiable for every scene:
  // `priority` buys a place in the first paint, never an exemption from the
  // reader's hardware or their stated preference. It relaxes exactly one term.
  const show = capability === 'supported' && allowMotion && near && (priority || pageSettled);

  return (
    <div ref={slotRef} className={className} data-scene={sceneId} aria-hidden="true">
      {show && (
        <SceneErrorBoundary sceneName={sceneId ?? 'unnamed'}>
          <GLCanvas
            camera={camera}
            sceneName={sceneId ?? 'unnamed'}
            resolutionScale={resolutionScale}
          >
            {children}
          </GLCanvas>
        </SceneErrorBoundary>
      )}
    </div>
  );
}
