/**
 * What the DOM tells a view: which of its controls a reader is on. Interaction always lives
 * on real elements; they write here, the stage wakes, and the view reads the answer on its
 * next frame. It is plain data and a list of listeners, so React never re-renders for it and
 * the module is small enough to sit in the page's own JavaScript.
 */

export interface Signal {
  /** What is hovered or focused: a role id, a figure id, or any non-null value for a single control. */
  active: string | null;
  /** Counts up on every new activation, so a view can replay its answer. */
  epoch: number;
}

const IDLE: Signal = { active: null, epoch: 0 };

const signals = new Map<string, Signal>();
const listeners = new Set<() => void>();

/** Sets what a view's reader is on, or null when they leave. Idempotent. */
export function setActive(view: string, active: string | null): void {
  const current = signals.get(view) ?? IDLE;
  if (current.active === active) return;
  signals.set(view, { active, epoch: active === null ? current.epoch : current.epoch + 1 });
  for (const listener of listeners) listener();
}

/** What a view's reader is on right now. */
export function readSignal(view: string): Signal {
  return signals.get(view) ?? IDLE;
}

/** Calls `listener` whenever any signal changes. Returns an unsubscribe. */
export function subscribeSignals(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
