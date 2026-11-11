/**
 * Which quality tier the stage runs at, and the review switches that force one. This file
 * must stay free of three.js: the page loads it before deciding whether to download the
 * engine at all.
 */

import { reducedMotion } from '../motion';

/**
 * `high` and `low` animate (low has fewer marks and a pixel ratio of 1); `still` draws one
 * frame per state change; `off` draws nothing and leaves the semantic layer alone.
 */
export type Tier = 'high' | 'low' | 'still' | 'off';

/** The tiers a running stage can be in. */
export type LiveTier = Exclude<Tier, 'off'>;

const TIERS: readonly Tier[] = ['high', 'low', 'still', 'off'];

/** The order the frame-time governor steps down through. */
export const STEP_DOWN: Readonly<Record<LiveTier, LiveTier>> = {
  high: 'low',
  low: 'still',
  still: 'still',
};

export interface GpuProbe {
  /** A WebGL2 context could be created. */
  webgl2: boolean;
  /** The renderer is a software rasteriser (SwiftShader, llvmpipe and the like). */
  software: boolean;
}

/** The Network Information API and device memory are not in the DOM typings. */
type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

/** Creates and immediately loses a throw-away context, so the page never holds two. */
export function probeGpu(): GpuProbe {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return { webgl2: false, software: false };
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { webgl2: true, software: /swiftshader|llvmpipe|software/i.test(renderer) };
  } catch {
    return { webgl2: false, software: false };
  }
}

/** The tier `?gl=off|still|low|high` asks for, or null. */
export function forcedTier(): Tier | null {
  const value = new URLSearchParams(window.location.search).get('gl');
  return TIERS.find((tier) => tier === value) ?? null;
}

/**
 * The tier for this reader, from the first rule that applies: no WebGL2 is `off`; a
 * reader who wants less motion, a data saver or a software renderer gets `still`; a
 * touch device or a small machine gets `low`; everything else is `high`. A forced tier
 * (review only) replaces the capability rules but never lets motion past a request for
 * less of it.
 */
export function resolveTier(probe: GpuProbe): Tier {
  if (!probe.webgl2) return 'off';
  const forced = forcedTier();
  if (forced === 'off') return 'off';
  const calm = reducedMotion();
  if (forced) return calm && forced !== 'still' ? 'still' : forced;
  const hints = navigator as NavigatorHints;
  if (calm || probe.software || hints.connection?.saveData === true) return 'still';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = navigator.hardwareConcurrency <= 4 || (hints.deviceMemory ?? 8) <= 4;
  return coarse || small ? 'low' : 'high';
}
