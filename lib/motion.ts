/**
 * The motion system, written once. Durations, easings, springs and the stagger rule are
 * mirrored as CSS custom properties in `app/globals.css` (`tests/stage.spec.ts` keeps the
 * two in step). This module also owns the reader's choice to turn motion off: a flag on the
 * root element that the stylesheet, the stage and the DOM animation library all follow.
 */

/** Durations in milliseconds. A section's whole entrance never runs past `section`. */
export const duration = {
  press: 120,
  hover: 200,
  state: 320,
  panel: 520,
  entrance: 800,
  section: 1200,
} as const;

/** Cubic-bezier control points: `out` for things that arrive, `inOut` for things that travel. */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

/** Spring constants for mass 1: stiffness in N/m, damping in N·s/m. */
export const spring = {
  snappy: { stiffness: 420, damping: 34 },
  settle: { stiffness: 220, damping: 28 },
  drift: { stiffness: 60, damping: 20 },
} as const;

export type Spring = (typeof spring)[keyof typeof spring];

/** Neighbouring items start 40 to 70 ms apart, and no more than eight of them are staggered. */
export const stagger = { min: 40, max: 70, steps: 8 } as const;

/** The delay of the item at `index` in a staggered group, in milliseconds. */
export function staggerDelay(index: number, step: number = stagger.max): number {
  const clamped = Math.min(Math.max(step, stagger.min), stagger.max);
  return Math.min(Math.max(index, 0), stagger.steps - 1) * clamped;
}

/** One value being pulled towards a target by a spring. */
export interface SpringState {
  value: number;
  velocity: number;
}

/** Below this distance and speed a spring counts as at rest. */
const REST = 0.0005;

/**
 * Advances `state` by `seconds` towards `target`. Semi-implicit Euler in sub-steps of at
 * most 8 ms, which stays stable at every constant in `spring`. Returns true while moving.
 */
export function stepSpring(state: SpringState, target: number, tuning: Spring, seconds: number): boolean {
  const steps = Math.max(1, Math.ceil(seconds / 0.008));
  const h = seconds / steps;
  for (let i = 0; i < steps; i += 1) {
    const force = tuning.stiffness * (target - state.value) - tuning.damping * state.velocity;
    state.velocity += force * h;
    state.value += state.velocity * h;
  }
  if (Math.abs(target - state.value) < REST && Math.abs(state.velocity) < REST) {
    state.value = target;
    state.velocity = 0;
    return false;
  }
  return true;
}

/** localStorage key holding the reader's choice: 'off'. Absent means motion is welcome. */
export const MOTION_KEY = 'motion';

/**
 * Runs in <head> before first paint, like the theme script. It sets `data-motion="off"` on
 * the root from the stored choice or from `?motion=off`, which is for review and is never
 * stored. Storage can throw, in which case motion stays as the system asks.
 */
export const motionInitScript = `(function(){try{var d=document.documentElement;if(/[?&]motion=off(&|$)/.test(location.search)||localStorage.getItem('${MOTION_KEY}')==='off'){d.dataset.motion='off';}}catch(e){}})();`;

/** True when the reader has turned motion off with the footer control or `?motion=off`. */
export function motionOff(): boolean {
  return document.documentElement.dataset.motion === 'off';
}

/** True when anything asks for less motion: the system preference or the site's own control. */
export function reducedMotion(): boolean {
  return motionOff() || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Remembers the choice for this browser and applies it now. Storage failures only cost the memory. */
export function setMotionOff(off: boolean): void {
  if (off) document.documentElement.dataset.motion = 'off';
  else delete document.documentElement.dataset.motion;
  try {
    if (off) window.localStorage.setItem(MOTION_KEY, 'off');
    else window.localStorage.removeItem(MOTION_KEY);
  } catch {
    // Storage is unavailable: the choice applies to this visit only.
  }
}

/** Calls `onChange` when the control or the system preference changes. Returns an unsubscribe. */
export function subscribeToMotion(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  const system = window.matchMedia('(prefers-reduced-motion: reduce)');
  system.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    system.removeEventListener('change', onChange);
  };
}
