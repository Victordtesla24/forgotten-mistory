/**
 * The stage: one WebGL renderer on one canvas for the whole page. The canvas is attached to
 * the page and moved with the scroll position each frame, so it stays registered with the DOM
 * however fast the page moves. Each visual is a view: a DOM placeholder whose rectangle becomes
 * a viewport and scissor. One frame loop draws on demand, only while a visible view is
 * animating or one of its inputs changed, and an idle or hidden page draws nothing.
 */

import { NoToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';

import { reducedMotion, subscribeToMotion } from '../motion';
import type { StageEngine, StageInfo } from './hook';
import { syncPalette, watchTheme } from './palette';
import { createPointerBus } from './pointer';
import { forcedTier, resolveTier, STEP_DOWN, type GpuProbe, type LiveTier } from './tier';
import { viewLoaders } from './views';
import type { View } from './views/types';

/** The drawing buffer may hold at most this many pixels, whatever the screen. */
const MAX_PIXELS = 2_300_000;

/** The pixel ratio each tier may reach. */
const DPR_CAP: Readonly<Record<LiveTier, number>> = { high: 1.5, low: 1, still: 1.5 };

/** The canvas extends this far above and below the viewport, so a late frame never shows its edge. */
const OVERSCAN = 96;

/** A view starts loading, and is drawn, this far before it scrolls into the viewport. */
const NEAR = '200px 0px';

/** The stage clock never advances more than this per frame, so a returning tab does not jump. */
const MAX_DT = 50;

/** A view's clock reads this when the tier shows only the settled state. */
const SETTLED_MS = 60_000;

/** The governor looks at this many consecutive animated frames before judging the tier. */
const GOVERNOR_FRAMES = 45;

/** Median frame time above which the governor lowers the tier, in milliseconds. */
const SLOW_FRAME = 24;

/** The canvas data attributes are refreshed at most this often, in milliseconds. */
const PUBLISH_EVERY = 1000;

/** Context losses tolerated before the stage gives up for the session. */
const MAX_LOSSES = 2;

interface Entry {
  id: string;
  element: HTMLElement;
  near: boolean;
  view: View | null;
  /** Stage clock when the view first drew. */
  started: number | null;
}

export interface StageOptions {
  /** The element the canvas is placed in: absolute, covering the page, clipping its overflow. */
  host: HTMLElement;
  tier: LiveTier;
  probe: GpuProbe;
  /** Called once, after the first view has drawn its first frame. */
  onReady(): void;
  /** Called when the stage gives up and the page falls back to its semantic layer. */
  onGiveUp(): void;
}

export interface Stage extends StageEngine {
  /** Starts tracking the placeholders. */
  observe(elements: Iterable<HTMLElement>): void;
  dispose(): void;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/** Creates the renderer and starts listening. Returns null when the browser refuses a context. */
export function createStage(options: StageOptions): Stage | null {
  const { host, probe } = options;
  let tier: LiveTier = options.tier;
  const forced = forcedTier() !== null;

  const canvas = document.createElement('canvas');
  canvas.dataset.stage = '';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none' });

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
    });
  } catch {
    return null;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.autoClear = false;
  renderer.info.autoReset = false;
  renderer.setClearAlpha(0);
  host.append(canvas);
  syncPalette();

  const entries = new Map<HTMLElement, Entry>();
  const pointer = createPointerBus(() => {
    if (tier === 'still') return;
    for (const entry of entries.values()) {
      if (entry.near && entry.view?.pointer) {
        wake();
        return;
      }
    }
  });

  let clock = 0;
  let last = 0;
  let frozen = false;
  let raf = 0;
  let dpr = 1;
  let cssWidth = 0;
  let cssHeight = 0;
  let animating = false;
  let consecutive = 0;
  let intervals: number[] = [];
  let frames = 0;
  let counts = { calls: 0, points: 0, lines: 0, triangles: 0 };
  let losses = 0;
  let lost = false;
  let announced = false;
  let disposed = false;
  let publishedAt = 0;
  let publishTimer = 0;

  function info(): StageInfo {
    return {
      tier,
      dpr,
      views: [...entries.values()].filter((entry) => entry.near && entry.view).length,
      ...counts,
      frames,
    };
  }

  function publish(): void {
    publishTimer = 0;
    publishedAt = performance.now();
    const state = info();
    canvas.dataset.tier = state.tier;
    canvas.dataset.dpr = state.dpr.toFixed(2);
    canvas.dataset.views = String(state.views);
    canvas.dataset.calls = String(state.calls);
    canvas.dataset.points = String(state.points);
    canvas.dataset.lines = String(state.lines);
    canvas.dataset.triangles = String(state.triangles);
    canvas.dataset.frames = String(state.frames);
  }

  /** Writes the data attributes now, or shortly, so they never refresh more than once a second. */
  function schedulePublish(): void {
    if (publishTimer) return;
    const wait = Math.max(0, PUBLISH_EVERY - (performance.now() - publishedAt));
    publishTimer = window.setTimeout(publish, wait);
  }

  function resize(): void {
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight + OVERSCAN * 2;
    const fit = Math.sqrt(MAX_PIXELS / (width * height));
    dpr = Math.max(0.75, Math.min(window.devicePixelRatio, DPR_CAP[tier], fit));
    cssWidth = width;
    cssHeight = height;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  function resolveLiveTier(): LiveTier {
    const next = resolveTier(probe);
    return next === 'off' ? tier : next;
  }

  function nearEntries(): Entry[] {
    return [...entries.values()].filter((entry) => entry.near && entry.view);
  }

  function canDraw(): boolean {
    return !disposed && !lost && !document.hidden;
  }

  function wake(): void {
    if (raf || !canDraw()) return;
    raf = requestAnimationFrame(frame);
  }

  function setTier(next: LiveTier): void {
    if (next === tier) return;
    tier = next;
    for (const entry of entries.values()) entry.view?.setTier(next);
    resize();
    intervals = [];
    consecutive = 0;
    wake();
  }

  function governor(now: number): void {
    if (forced || tier === 'still') return;
    if (consecutive > 0) intervals.push(now - last);
    if (intervals.length < GOVERNOR_FRAMES) return;
    if (median(intervals) > SLOW_FRAME) setTier(STEP_DOWN[tier]);
    intervals = [];
  }

  function frame(now: number): void {
    raf = 0;
    if (!canDraw()) return;
    const dt = last === 0 ? 0 : Math.min(now - last, MAX_DT);
    if (animating) governor(now);
    last = now;
    if (!frozen) clock += dt;

    const hostTop = host.getBoundingClientRect().top;
    canvas.style.transform = `translate3d(0, ${-hostTop - OVERSCAN}px, 0)`;

    renderer.info.reset();
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);

    animating = false;
    let drawn = 0;
    for (const entry of nearEntries()) {
      const view = entry.view;
      if (!view) continue;
      const rect = entry.element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      if (rect.bottom < -OVERSCAN || rect.top > window.innerHeight + OVERSCAN) continue;
      if (entry.started === null) entry.started = clock;

      const viewport = {
        x: rect.left,
        y: cssHeight - (rect.top + OVERSCAN + rect.height),
        width: rect.width,
        height: rect.height,
      };
      const time = tier === 'still' && !frozen ? SETTLED_MS : clock - entry.started;
      const needsMore = view.update({
        time,
        dt: frozen || tier === 'still' ? 0 : dt,
        viewport,
        client: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        pixelRatio: dpr,
        pointer: pointer.state,
      });
      animating ||= needsMore;

      const left = Math.max(viewport.x, 0);
      const bottom = Math.max(viewport.y, 0);
      renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
      renderer.setScissor(left, bottom, Math.min(viewport.x + viewport.width, cssWidth) - left, Math.min(viewport.y + viewport.height, cssHeight) - bottom);
      view.render(renderer);
      drawn += 1;
      if (entry.element.dataset.ready !== 'true') entry.element.dataset.ready = 'true';
    }

    const render = renderer.info.render;
    counts = { calls: render.calls, points: render.points, lines: render.lines, triangles: render.triangles };
    frames += 1;
    consecutive = animating ? consecutive + 1 : 0;
    schedulePublish();

    if (drawn > 0 && !announced) {
      announced = true;
      options.onReady();
    }
    if (animating && tier !== 'still' && !frozen) wake();
  }

  async function load(entry: Entry): Promise<void> {
    const loader = viewLoaders[entry.id];
    if (!loader || entry.view || disposed) return;
    const factory = await loader();
    if (disposed || entry.view) return;
    entry.view = factory({ tier, element: entry.element });
    wake();
  }

  const intersection = new IntersectionObserver(
    (changes) => {
      for (const change of changes) {
        const entry = entries.get(change.target as HTMLElement);
        if (!entry) continue;
        entry.near = change.isIntersecting;
        if (entry.near) void load(entry);
      }
      wake();
    },
    { rootMargin: NEAR },
  );

  const resizeObserver = new ResizeObserver(() => wake());
  resizeObserver.observe(document.body);

  const onScroll = () => wake();
  const onResize = () => {
    // A phone's toolbar changes the height while scrolling; a canvas that is already tall enough stays.
    const tallEnough = window.innerHeight + OVERSCAN * 2 <= cssHeight;
    if (document.documentElement.clientWidth !== cssWidth || !tallEnough) resize();
    wake();
  };
  const onVisibility = () => {
    if (document.hidden) return;
    last = 0;
    wake();
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    losses += 1;
    for (const entry of entries.values()) delete entry.element.dataset.ready;
    if (losses >= MAX_LOSSES) {
      dispose();
      options.onGiveUp();
    }
  };
  const onRestored = () => {
    lost = false;
    last = 0;
    wake();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  const stopTheme = watchTheme(() => {
    if (syncPalette()) wake();
  });
  const stopMotion = subscribeToMotion(() => {
    setTier(reducedMotion() ? 'still' : resolveLiveTier());
  });
  void document.fonts.ready.then(() => wake());

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(publishTimer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    stopTheme();
    stopMotion();
    pointer.dispose();
    intersection.disconnect();
    resizeObserver.disconnect();
    for (const entry of entries.values()) {
      entry.view?.dispose();
      delete entry.element.dataset.ready;
    }
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  resize();

  return {
    observe(elements) {
      for (const element of elements) {
        const id = element.dataset.stageView;
        if (!id || entries.has(element)) continue;
        entries.set(element, { id, element, near: false, view: null, started: null });
        intersection.observe(element);
        resizeObserver.observe(element);
      }
    },
    info,
    seek(ms) {
      frozen = true;
      clock = ms;
      for (const entry of entries.values()) entry.started = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      frame(performance.now());
    },
    dispose,
  };
}
