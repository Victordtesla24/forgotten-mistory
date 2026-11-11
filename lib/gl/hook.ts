/**
 * `window.__stage`, the review hook. It exists from the first paint, before three.js has
 * loaded, so a test can wait on `ready` whatever tier the page ends up in. Like the rest of
 * the review hooks it costs nothing and stays in production.
 */

import type { Tier } from './tier';

/** A snapshot of the stage, the same numbers the canvas carries as `data-*` attributes. */
export interface StageInfo {
  tier: Tier;
  dpr: number;
  views: number;
  calls: number;
  points: number;
  lines: number;
  triangles: number;
  frames: number;
}

/** What the running engine offers the hook. */
export interface StageEngine {
  info(): StageInfo;
  /** Freezes the stage clock at `ms` and draws that moment once. */
  seek(ms: number): void;
}

export interface StageHook {
  /** Settles once the first frame is drawn, or once it is clear that none will be. */
  ready: Promise<void>;
  info(): StageInfo;
  seek(ms: number): void;
}

declare global {
  interface Window {
    __stage?: StageHook;
  }
}

const IDLE: StageInfo = {
  tier: 'off',
  dpr: 0,
  views: 0,
  calls: 0,
  points: 0,
  lines: 0,
  triangles: 0,
  frames: 0,
};

export interface HookControl {
  /** Connects the running engine. */
  attach(engine: StageEngine): void;
  /** Resolves `ready`: a frame has been drawn, or none will be. */
  settle(tier: Tier): void;
}

/** Installs `window.__stage` and returns what the loader needs to drive it. */
export function installHook(): HookControl {
  let engine: StageEngine | null = null;
  let finalTier: Tier = 'off';
  let release: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });

  window.__stage = {
    ready,
    info: () => engine?.info() ?? { ...IDLE, tier: finalTier },
    seek: (ms) => engine?.seek(ms),
  };

  return {
    attach(next) {
      engine = next;
    },
    settle(tier) {
      finalTier = tier;
      release();
    },
  };
}
