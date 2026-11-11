/**
 * How a project card answers a mouse (`behaviour.ts`). The card leans a few degrees so that the part
 * under the pointer sinks, driven by the `settle` spring of the motion system, and a light runs along its
 * border where the pointer is (`Work.module.css` draws it from `data-light` and `--light-x`, `--light-y`).
 * When the pointer leaves, the card springs back flat and the light fades. Pressing flattens the card at
 * once, so that the panel opens from a card at rest.
 *
 * Only a fine pointer that can hover brings any of this, and only while motion is welcome: a touch screen,
 * reduced motion and Motion off leave the card with no transform at all and no light. The events are heard
 * on the card's slot in the rail, which the lean does not move, so a pointer at the edge of a leaning card
 * cannot flicker in and out of it. Nothing runs while the card is at rest.
 *
 * The card's light layer follows the lean rather than hiding while it lasts: the view of a card that moves
 * is told so (`poke`) on every step, draws one frame into the card's box as the page now lays it out, and the
 * stage stays idle again once the card has stopped. The lean is small enough that the view's plates, which stay
 * flat, lie within a pixel of the drawing that leans.
 */

import { poke } from '@/lib/gl/signal';
import { reducedMotion, spring, stepSpring, subscribeToMotion, type SpringState } from '@/lib/motion';

/** How far a card leans with the pointer at its edge, in degrees. Small enough that its drawing stays registered with the light layer's. */
const MAX_LEAN = 4;

/** The distance of the viewer from the card, in pixels: a gentle perspective rather than a visible one. */
const PERSPECTIVE = 1000;

/** A mouse that can hover: the pointer of a laptop or desktop, never a touch screen. */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

interface Lean {
  card: HTMLElement;
  /** The id of the card's view on the stage, which draws the light the card carries. */
  view: string;
  /** Turn about the horizontal axis (the pointer's height) and about the vertical axis (its width), each from -1 to 1. */
  pitch: SpringState;
  yaw: SpringState;
  aim: { pitch: number; yaw: number };
}

const clamp = (value: number): number => Math.min(1, Math.max(-1, value));

/** Sets up the lean and the light on every card of `section` until `signal` aborts. */
export function attachTilt(section: HTMLElement, signal: AbortSignal): void {
  const fine = window.matchMedia(FINE_POINTER);
  const moving = new Set<Lean>();
  const leans: Lean[] = [];
  let frame = 0;
  let before = 0;

  const paint = (lean: Lean): void => {
    lean.card.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${(lean.pitch.value * MAX_LEAN).toFixed(3)}deg) rotateY(${(lean.yaw.value * MAX_LEAN).toFixed(3)}deg)`;
    poke(lean.view);
  };

  /** Back to no transform at all, with the light out. */
  const flatten = (lean: Lean): void => {
    lean.pitch = { value: 0, velocity: 0 };
    lean.yaw = { value: 0, velocity: 0 };
    lean.aim = { pitch: 0, yaw: 0 };
    moving.delete(lean);
    lean.card.style.transform = '';
    lean.card.style.willChange = '';
    delete lean.card.dataset.light;
    poke(lean.view);
  };

  const tick = (now: number): void => {
    const seconds = Math.min((now - before) / 1000, 0.05);
    before = now;
    moving.forEach((lean) => {
      const pitching = stepSpring(lean.pitch, lean.aim.pitch, spring.settle, seconds);
      const turning = stepSpring(lean.yaw, lean.aim.yaw, spring.settle, seconds);
      if (pitching || turning) {
        paint(lean);
        return;
      }
      moving.delete(lean);
      if (lean.aim.pitch === 0 && lean.aim.yaw === 0) {
        lean.card.style.transform = '';
        lean.card.style.willChange = '';
        poke(lean.view);
      } else {
        paint(lean);
      }
    });
    frame = moving.size > 0 ? requestAnimationFrame(tick) : 0;
  };

  const aimAt = (lean: Lean, pitch: number, yaw: number): void => {
    lean.aim = { pitch, yaw };
    lean.card.style.willChange = 'transform';
    moving.add(lean);
    if (frame === 0) {
      before = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  const welcome = (event: PointerEvent): boolean => event.pointerType === 'mouse' && fine.matches && !reducedMotion();

  section.querySelectorAll<HTMLElement>('article[data-project]').forEach((card) => {
    const slot = card.parentElement;
    if (!slot) return;
    const view = card.querySelector<HTMLElement>('[data-stage-view]')?.dataset.stageView ?? '';
    const lean: Lean = { card, view, pitch: { value: 0, velocity: 0 }, yaw: { value: 0, velocity: 0 }, aim: { pitch: 0, yaw: 0 } };
    leans.push(lean);
    let pressed = false;

    slot.addEventListener(
      'pointermove',
      (event) => {
        if (!welcome(event)) return;
        const box = slot.getBoundingClientRect();
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        card.style.setProperty('--light-x', `${x.toFixed(1)}px`);
        card.style.setProperty('--light-y', `${y.toFixed(1)}px`);
        card.dataset.light = 'on';
        if (!pressed) aimAt(lean, clamp((box.height / 2 - y) / (box.height / 2)), clamp((x - box.width / 2) / (box.width / 2)));
      },
      { signal },
    );
    slot.addEventListener(
      'pointerdown',
      (event) => {
        if (!welcome(event)) return;
        pressed = true;
        aimAt(lean, 0, 0);
      },
      { signal },
    );
    const release = (): void => {
      pressed = false;
    };
    slot.addEventListener('pointerup', release, { signal });
    const leave = (event: PointerEvent): void => {
      if (event.pointerType !== 'mouse') return;
      pressed = false;
      delete card.dataset.light;
      if (moving.has(lean) || lean.aim.pitch !== 0 || lean.aim.yaw !== 0) aimAt(lean, 0, 0);
    };
    slot.addEventListener('pointerleave', leave, { signal });
    slot.addEventListener('pointercancel', leave, { signal });
  });

  // Motion switched off, or a system preference changed, while a card leans: it is flat at once.
  const unsubscribe = subscribeToMotion(() => {
    if (reducedMotion()) leans.forEach(flatten);
  });

  signal.addEventListener('abort', () => {
    unsubscribe();
    cancelAnimationFrame(frame);
    frame = 0;
    leans.forEach(flatten);
  });
}
