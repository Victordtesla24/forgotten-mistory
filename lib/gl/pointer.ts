/**
 * The one pointer bus. A single passive listener records where a fine pointer is and tells
 * the stage, which wakes only if a visible view cares. A touch or a pen on the screen is
 * recorded too, while it lasts: it has no hover, so a view answers it once, at the contact,
 * and lets go a moment after the finger does.
 */

export interface PointerState {
  /** Client coordinates in CSS pixels. */
  x: number;
  y: number;
  /** True while a fine pointer is over the page, or a finger or pen is on it. */
  present: boolean;
  /** True when `present` is a contact on a touch screen rather than a mouse hovering. */
  touch: boolean;
}

const FINE = '(hover: hover) and (pointer: fine)';

/** A contact is held at least this long, so a tap is as long as the answer to it needs to be seen. */
const MIN_CONTACT_MS = 120;

export interface PointerBus {
  readonly state: PointerState;
  dispose(): void;
}

/** Starts listening. `onChange` runs on every move, enter and leave. */
export function createPointerBus(onChange: () => void): PointerBus {
  const state: PointerState = { x: 0, y: 0, present: false, touch: false };
  const fine = window.matchMedia(FINE);
  let contactAt = 0;
  let letGo: number | undefined;

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !fine.matches) return;
    state.x = event.clientX;
    state.y = event.clientY;
    state.present = true;
    state.touch = false;
    onChange();
  };
  /** A finger or pen touching down, and dragging while it stays down. */
  const onContact = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' || event.pointerType === '') return;
    if (event.type === 'pointermove' && event.buttons === 0) return;
    window.clearTimeout(letGo);
    letGo = undefined;
    if (!state.present || !state.touch) contactAt = performance.now();
    state.x = event.clientX;
    state.y = event.clientY;
    state.present = true;
    state.touch = true;
    onChange();
  };
  const onLeave = () => {
    if (!state.present) return;
    state.present = false;
    onChange();
  };
  /** The contact ends: it lets go once it has lasted long enough to be seen. */
  const onRelease = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' || !state.touch) return;
    window.clearTimeout(letGo);
    letGo = window.setTimeout(onLeave, Math.max(0, MIN_CONTACT_MS - (performance.now() - contactAt)));
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onContact, { passive: true });
  window.addEventListener('pointermove', onContact, { passive: true });
  window.addEventListener('pointerup', onRelease, { passive: true });
  window.addEventListener('pointercancel', onRelease, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave, { passive: true });
  window.addEventListener('blur', onLeave);

  return {
    state,
    dispose() {
      window.clearTimeout(letGo);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onContact);
      window.removeEventListener('pointermove', onContact);
      window.removeEventListener('pointerup', onRelease);
      window.removeEventListener('pointercancel', onRelease);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    },
  };
}
