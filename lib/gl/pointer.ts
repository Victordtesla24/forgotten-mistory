/**
 * The one pointer bus. A single passive listener records where a fine pointer is and tells
 * the stage, which wakes only if a visible view cares. Touch and pen contacts are ignored:
 * on those the field has nothing to lean towards and stays still.
 */

export interface PointerState {
  /** Client coordinates in CSS pixels. */
  x: number;
  y: number;
  /** True while a fine pointer is over the page. */
  present: boolean;
}

const FINE = '(hover: hover) and (pointer: fine)';

export interface PointerBus {
  readonly state: PointerState;
  dispose(): void;
}

/** Starts listening. `onChange` runs on every move, enter and leave. */
export function createPointerBus(onChange: () => void): PointerBus {
  const state: PointerState = { x: 0, y: 0, present: false };
  const fine = window.matchMedia(FINE);

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !fine.matches) return;
    state.x = event.clientX;
    state.y = event.clientY;
    state.present = true;
    onChange();
  };
  const onLeave = () => {
    if (!state.present) return;
    state.present = false;
    onChange();
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave, { passive: true });
  window.addEventListener('blur', onLeave);

  return {
    state,
    dispose() {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    },
  };
}
